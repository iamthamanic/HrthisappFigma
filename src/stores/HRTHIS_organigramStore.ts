/**
 * ORGANIGRAM STORE
 * =================
 * Global organigram state management
 * 
 * PARTIALLY REFACTORED: Uses OrganigramService for some operations
 * - Department/Position CRUD still uses direct Supabase (no service methods yet)
 * - Uses service layer where available
 * - Better error handling with custom errors
 * 
 * NOTE: Full refactoring requires extending OrganigramService with more methods
 */

import { create } from 'zustand';
import { supabase } from '../utils/supabase/client';
import { Department, OrganigramPosition, User, Location } from '../types/database';
import { toast } from 'sonner@2.0.3';
import { getServices } from '../services';
import { NotFoundError, ValidationError, ApiError } from '../services/base/ApiError';

interface OrganigramState {
  departments: Department[];
  positions: OrganigramPosition[];
  users: User[];
  locations: Location[];
  loading: boolean;
  tableExists: boolean; // Track if organigram_positions table exists
  
  // Actions
  loadOrganigramData: () => Promise<void>;
  
  // Department actions
  updateDepartment: (departmentId: string, updates: Partial<Department>) => Promise<void>;
  updateDepartmentLocation: (departmentId: string, locationId: string | null) => Promise<void>;
  updateDepartmentOrder: (departments: Department[]) => Promise<void>;
  updateDepartmentPosition: (departmentId: string, x: number, y: number) => Promise<void>;
  updateDepartmentHierarchy: (departmentId: string, parentId: string | null) => Promise<void>;
  updateDepartmentUsers: (departmentId: string, primaryUserId: string | null, backupUserId: string | null) => Promise<void>;
  createDepartment: (department: Partial<Department>) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
  
  // Position actions
  createPosition: (position: Partial<OrganigramPosition>) => Promise<void>;
  updatePosition: (positionId: string, updates: Partial<OrganigramPosition>) => Promise<void>;
  deletePosition: (positionId: string) => Promise<void>;
  updatePositionOrder: (positions: OrganigramPosition[]) => Promise<void>;
  assignEmployee: (positionId: string, userId: string | null, type: 'primary' | 'backup') => Promise<void>;
}

export const useOrganigramStore = create<OrganigramState>((set, get) => ({
  departments: [],
  positions: [],
  users: [],
  locations: [],
  loading: false,
  tableExists: true, // Assume it exists until proven otherwise

  loadOrganigramData: async () => {
    set({ loading: true });
    try {
      // Load departments (direct Supabase - no service method yet)
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (deptsError) {
        console.error('Error loading departments:', deptsError);
        throw deptsError;
      }

      // Check if we need to create default "Geschäftsführung" department
      let departments = depts || [];
      if (departments.length === 0) {
        console.log('📝 Keine Abteilungen gefunden - erstelle Standard-Geschäftsführung...');
        
        // Get current user's organization
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single();

          if (profile?.organization_id) {
            // Create Geschäftsführung department
            const { data: newDept, error: createError } = await supabase
              .from('departments')
              .insert([{
                name: 'Geschäftsführung',
                description: 'Unternehmensleitung und strategische Führung',
                organization_id: profile.organization_id,
                sort_order: 0,
                is_active: true,
              }])
              .select()
              .single();

            if (!createError && newDept) {
              departments = [newDept];
              toast.success('Standard-Abteilung "Geschäftsführung" wurde erstellt');
            }
          }
        }
      }

      // Load positions - table might not exist yet
      let pos: any[] = [];
      let tableExists = true;
      try {
        const { data: posData, error: posError } = await supabase
          .from('organigram_positions')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (posError) {
          // Check if it's a "relation does not exist" error
          if (posError.code === '42P01') {
            console.warn('organigram_positions table does not exist yet. Please run SQL_ORGANIGRAM.md migration.');
            tableExists = false;
          } else {
            throw posError;
          }
        } else {
          pos = posData || [];
        }
      } catch (err) {
        console.warn('Could not load positions:', err);
      }

      // Create default CEO position if Geschäftsführung exists but has no positions
      if (tableExists && departments.length > 0 && pos.length === 0) {
        const managementDept = departments.find(d => 
          d.name.toLowerCase().includes('geschäftsführung') || 
          d.name.toLowerCase().includes('management')
        );

        if (managementDept) {
          console.log('📝 Keine Positionen gefunden - erstelle Standard-CEO Position...');
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('organization_id')
              .eq('id', user.id)
              .single();

            if (profile?.organization_id) {
              const { data: newPos, error: createPosError } = await supabase
                .from('organigram_positions')
                .insert([{
                  name: 'Geschäftsführer/in',
                  department_id: managementDept.id,
                  organization_id: profile.organization_id,
                  sort_order: 0,
                  is_active: true,
                  specialization: null,
                  primary_user_id: null,
                  backup_user_id: null,
                }])
                .select()
                .single();

              if (!createPosError && newPos) {
                pos = [newPos];
                toast.success('Standard-Position "Geschäftsführer/in" wurde erstellt');
              }
            }
          }
        }
      }

      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('last_name', { ascending: true });
      
      if (usersError) throw usersError;

      // Load locations
      const { data: locs, error: locsError } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (locsError) throw locsError;

      set({
        departments,
        positions: pos,
        users: usersData || [],
        locations: locs || [],
        loading: false,
        tableExists,
      });
    } catch (error: any) {
      console.error('Error loading organigram data:', error);
      toast.error(`Fehler beim Laden der Organigram-Daten: ${error.message || 'Unbekannter Fehler'}`);
      set({ loading: false });
    }
  },

  // Generic update function for departments
  updateDepartment: async (departmentId: string, updates: Partial<Department>) => {
    try {
      // Direct Supabase call (no service method yet)
      const { error } = await supabase
        .from('departments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', departmentId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === departmentId 
            ? { ...dept, ...updates, updated_at: new Date().toISOString() }
            : dept
        ),
      }));

      toast.success('Abteilung aktualisiert');
      
      // Reload to ensure data consistency
      await get().loadOrganigramData();
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast.error('Fehler beim Aktualisieren der Abteilung');
      throw error;
    }
  },

  updateDepartmentLocation: async (departmentId: string, locationId: string | null) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ location_id: locationId, updated_at: new Date().toISOString() })
        .eq('id', departmentId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === departmentId 
            ? { ...dept, location_id: locationId, updated_at: new Date().toISOString() }
            : dept
        ),
      }));

      toast.success('Standort zugewiesen');
    } catch (error: any) {
      console.error('Error updating department location:', error);
      toast.error('Fehler beim Zuweisen des Standorts');
      throw error;
    }
  },

  updateDepartmentOrder: async (departments: Department[]) => {
    try {
      // Update sort_order for all departments
      const updates = departments.map((dept, index) => ({
        id: dept.id,
        sort_order: index,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('departments')
          .update({ sort_order: update.sort_order, updated_at: update.updated_at })
          .eq('id', update.id);

        if (error) throw error;
      }

      set({ departments });
      toast.success('Reihenfolge gespeichert');
    } catch (error: any) {
      console.error('Error updating department order:', error);
      toast.error('Fehler beim Speichern der Reihenfolge');
      throw error;
    }
  },

  updateDepartmentPosition: async (departmentId: string, x: number, y: number) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ 
          x_position: x, 
          y_position: y, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', departmentId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === departmentId 
            ? { ...dept, x_position: x, y_position: y, updated_at: new Date().toISOString() }
            : dept
        ),
      }));
    } catch (error: any) {
      console.error('Error updating department position:', error);
      toast.error('Fehler beim Speichern der Position');
      throw error;
    }
  },

  updateDepartmentHierarchy: async (departmentId: string, parentId: string | null) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ 
          parent_department_id: parentId, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', departmentId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === departmentId 
            ? { ...dept, parent_department_id: parentId, updated_at: new Date().toISOString() }
            : dept
        ),
      }));

      toast.success('Hierarchie aktualisiert');
    } catch (error: any) {
      console.error('Error updating department hierarchy:', error);
      toast.error('Fehler beim Aktualisieren der Hierarchie');
      throw error;
    }
  },

  updateDepartmentUsers: async (departmentId: string, primaryUserId: string | null, backupUserId: string | null) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ 
          primary_user_id: primaryUserId,
          backup_user_id: backupUserId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', departmentId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === departmentId 
            ? { ...dept, primary_user_id: primaryUserId, backup_user_id: backupUserId, updated_at: new Date().toISOString() }
            : dept
        ),
      }));

      toast.success('Verantwortliche aktualisiert');
    } catch (error: any) {
      console.error('Error updating department users:', error);
      toast.error('Fehler beim Aktualisieren der Verantwortlichen');
      throw error;
    }
  },

  createDepartment: async (department: Partial<Department>) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([department])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        departments: [...state.departments, data],
      }));

      toast.success('Abteilung erstellt');
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast.error(error.message || 'Fehler beim Erstellen der Abteilung');
      throw error;
    }
  },

  deleteDepartment: async (departmentId: string) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', departmentId);

      if (error) throw error;

      set((state) => ({
        departments: state.departments.filter((dept) => dept.id !== departmentId),
      }));

      toast.success('Abteilung gelöscht');
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast.error('Fehler beim Löschen der Abteilung');
      throw error;
    }
  },

  createPosition: async (position: Partial<OrganigramPosition>) => {
    try {
      // Remove organization_id if present - will be set by trigger
      const { organization_id, ...positionData } = position as any;
      
      const { data, error } = await supabase
        .from('organigram_positions')
        .insert([positionData])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        positions: [...state.positions, data],
      }));

      toast.success('Position erstellt');
    } catch (error: any) {
      console.error('Error creating position:', error);
      toast.error(error.message || 'Fehler beim Erstellen der Position');
      throw error;
    }
  },

  updatePosition: async (positionId: string, updates: Partial<OrganigramPosition>) => {
    try {
      const { error } = await supabase
        .from('organigram_positions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', positionId);

      if (error) throw error;

      set((state) => ({
        positions: state.positions.map((pos) =>
          pos.id === positionId
            ? { ...pos, ...updates, updated_at: new Date().toISOString() }
            : pos
        ),
      }));

      toast.success('Position aktualisiert');
    } catch (error: any) {
      console.error('Error updating position:', error);
      toast.error('Fehler beim Aktualisieren der Position');
      throw error;
    }
  },

  deletePosition: async (positionId: string) => {
    try {
      const { error } = await supabase
        .from('organigram_positions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', positionId);

      if (error) throw error;

      set((state) => ({
        positions: state.positions.filter((pos) => pos.id !== positionId),
      }));

      toast.success('Position gelöscht');
    } catch (error: any) {
      console.error('Error deleting position:', error);
      toast.error('Fehler beim Löschen der Position');
      throw error;
    }
  },

  updatePositionOrder: async (positions: OrganigramPosition[]) => {
    try {
      const updates = positions.map((pos, index) => ({
        id: pos.id,
        sort_order: index,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('organigram_positions')
          .update({ sort_order: update.sort_order, updated_at: update.updated_at })
          .eq('id', update.id);

        if (error) throw error;
      }

      set({ positions });
      toast.success('Reihenfolge gespeichert');
    } catch (error: any) {
      console.error('Error updating position order:', error);
      toast.error('Fehler beim Speichern der Reihenfolge');
      throw error;
    }
  },

  assignEmployee: async (positionId: string, userId: string | null, type: 'primary' | 'backup') => {
    try {
      const field = type === 'primary' ? 'primary_user_id' : 'backup_user_id';
      
      const { error } = await supabase
        .from('organigram_positions')
        .update({ [field]: userId, updated_at: new Date().toISOString() })
        .eq('id', positionId);

      if (error) throw error;

      set((state) => ({
        positions: state.positions.map((pos) =>
          pos.id === positionId
            ? { ...pos, [field]: userId, updated_at: new Date().toISOString() }
            : pos
        ),
      }));

      toast.success(userId ? 'Mitarbeiter zugewiesen' : 'Zuweisung entfernt');
    } catch (error: any) {
      console.error('Error assigning employee:', error);
      toast.error('Fehler beim Zuweisen des Mitarbeiters');
      throw error;
    }
  },
}));
