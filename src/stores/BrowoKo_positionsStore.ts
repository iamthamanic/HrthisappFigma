/**
 * @file stores/BrowoKo_positionsStore.ts
 * @description Zustand store for Positions Management
 */

import { create } from 'zustand';
import { supabase } from '../utils/supabase/client';
import { 
  Position, 
  PositionWithRelations, 
  PositionFormData,
  PositionDepartment,
  PositionLocation,
} from '../types/positions';
import { toast } from 'sonner@2.0.3';

interface PositionsStore {
  positions: PositionWithRelations[];
  loading: boolean;
  hasLoaded: boolean; // Cache flag to prevent re-loading
  
  // Actions
  loadPositions: () => Promise<void>;
  createPosition: (formData: PositionFormData) => Promise<Position | null>;
  updatePosition: (id: string, formData: PositionFormData) => Promise<Position | null>;
  deletePosition: (id: string) => Promise<boolean>;
  getPositionById: (id: string) => PositionWithRelations | undefined;
  getPositionEmployees: (positionId: string) => Promise<any[]>;
}

export const usePositionsStore = create<PositionsStore>((set, get) => ({
  positions: [],
  loading: false,
  hasLoaded: false, // Cache flag to prevent re-loading
  
  /**
   * Load all positions with relations (departments, locations, employee count)
   */
  loadPositions: async () => {
    set({ loading: true });
    
    try {
      console.log('[PositionsStore] 🔄 Loading positions...');
      
      // 1. Load positions
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .order('name');
      
      console.log('[PositionsStore] Positions loaded:', positions?.length || 0);
      
      if (positionsError) {
        console.error('[PositionsStore] Error loading positions:', positionsError);
        throw positionsError;
      }
      
      if (!positions) {
        set({ positions: [], loading: false, hasLoaded: true });
        return;
      }
      
      console.log('[PositionsStore] 🔄 Loading position_departments...');
      
      // 2. Load position_departments
      const { data: positionDepartments, error: deptError } = await supabase
        .from('position_departments')
        .select(`
          position_id,
          department_id,
          departments (
            id,
            name
          )
        `);
      
      if (deptError) {
        console.error('[PositionsStore] Error loading departments:', deptError);
      } else {
        console.log('[PositionsStore] Position departments loaded:', positionDepartments?.length || 0);
      }
      
      console.log('[PositionsStore] 🔄 Loading position_locations...');
      
      // 3. Load position_locations
      const { data: positionLocations, error: locError } = await supabase
        .from('position_locations')
        .select(`
          position_id,
          location_id,
          locations (
            id,
            name
          )
        `);
      
      if (locError) {
        console.error('[PositionsStore] Error loading locations:', locError);
      } else {
        console.log('[PositionsStore] Position locations loaded:', positionLocations?.length || 0);
      }
      
      console.log('[PositionsStore] 🔄 Counting employees...');
      
      // 4. Count employees per position
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('position_id')
        .not('position_id', 'is', null);
      
      if (usersError) {
        console.error('[PositionsStore] Error counting employees:', usersError);
      } else {
        console.log('[PositionsStore] Users with positions:', users?.length || 0);
      }
      
      const employeeCountMap = new Map<string, number>();
      users?.forEach(user => {
        if (user.position_id) {
          employeeCountMap.set(
            user.position_id, 
            (employeeCountMap.get(user.position_id) || 0) + 1
          );
        }
      });
      
      console.log('[PositionsStore] 🔄 Combining data...');
      
      // 5. Combine data
      const positionsWithRelations: PositionWithRelations[] = positions.map(position => {
        // Departments
        const depts = positionDepartments
          ?.filter(pd => pd.position_id === position.id)
          .map(pd => ({
            id: pd.departments?.id || '',
            name: pd.departments?.name || '',
          }))
          .filter(d => d.id) || [];
        
        // Locations
        const locs = positionLocations
          ?.filter(pl => pl.position_id === position.id)
          .map(pl => ({
            id: pl.locations?.id || '',
            name: pl.locations?.name || '',
          }))
          .filter(l => l.id) || [];
        
        // Employee count
        const employee_count = employeeCountMap.get(position.id) || 0;
        
        // Reports to position name
        const reports_to_position_name = position.reports_to_position_id
          ? positions.find(p => p.id === position.reports_to_position_id)?.name || null
          : null;
        
        return {
          ...position,
          departments: depts,
          locations: locs,
          employee_count,
          reports_to_position_name,
        };
      });
      
      set({ positions: positionsWithRelations, loading: false, hasLoaded: true });
      
    } catch (error) {
      console.error('Failed to load positions:', error);
      toast.error('Fehler beim Laden der Positionen');
      set({ positions: [], loading: false, hasLoaded: true });
    }
  },
  
  /**
   * Create new position
   */
  createPosition: async (formData: PositionFormData) => {
    try {
      // 1. Create position
      const { data: position, error: positionError } = await supabase
        .from('positions')
        .insert({
          name: formData.name,
          level: formData.level,
          description: formData.description || null,
          responsibilities: formData.responsibilities || null,
          requirements: formData.requirements,
          salary_min: formData.salary_min,
          salary_max: formData.salary_max,
          salary_currency: formData.salary_currency,
          salary_period: formData.salary_period,
          reports_to_position_id: formData.reports_to_position_id,
          status: formData.status,
          open_positions: formData.open_positions,
        })
        .select()
        .single();
      
      if (positionError) throw positionError;
      if (!position) throw new Error('Position not created');
      
      // 2. Link departments
      if (formData.department_ids.length > 0) {
        const departmentLinks = formData.department_ids.map(dept_id => ({
          position_id: position.id,
          department_id: dept_id,
        }));
        
        const { error: deptError } = await supabase
          .from('position_departments')
          .insert(departmentLinks);
        
        if (deptError) console.warn('Failed to link departments:', deptError);
      }
      
      // 3. Link locations
      if (formData.location_ids.length > 0) {
        const locationLinks = formData.location_ids.map(loc_id => ({
          position_id: position.id,
          location_id: loc_id,
        }));
        
        const { error: locError } = await supabase
          .from('position_locations')
          .insert(locationLinks);
        
        if (locError) console.warn('Failed to link locations:', locError);
      }
      
      // 4. Reload positions
      await get().loadPositions();
      
      toast.success(`Position "${formData.name}" erfolgreich erstellt`);
      return position;
      
    } catch (error: any) {
      console.error('Failed to create position:', error);
      toast.error(error.message || 'Fehler beim Erstellen der Position');
      return null;
    }
  },
  
  /**
   * Update position
   */
  updatePosition: async (id: string, formData: PositionFormData) => {
    try {
      // 1. Update position
      const { data: position, error: positionError } = await supabase
        .from('positions')
        .update({
          name: formData.name,
          level: formData.level,
          description: formData.description || null,
          responsibilities: formData.responsibilities || null,
          requirements: formData.requirements,
          salary_min: formData.salary_min,
          salary_max: formData.salary_max,
          salary_currency: formData.salary_currency,
          salary_period: formData.salary_period,
          reports_to_position_id: formData.reports_to_position_id,
          status: formData.status,
          open_positions: formData.open_positions,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (positionError) throw positionError;
      if (!position) throw new Error('Position not updated');
      
      // 2. Update departments (delete all, re-insert)
      await supabase
        .from('position_departments')
        .delete()
        .eq('position_id', id);
      
      if (formData.department_ids.length > 0) {
        const departmentLinks = formData.department_ids.map(dept_id => ({
          position_id: id,
          department_id: dept_id,
        }));
        
        await supabase
          .from('position_departments')
          .insert(departmentLinks);
      }
      
      // 3. Update locations (delete all, re-insert)
      await supabase
        .from('position_locations')
        .delete()
        .eq('position_id', id);
      
      if (formData.location_ids.length > 0) {
        const locationLinks = formData.location_ids.map(loc_id => ({
          position_id: id,
          location_id: loc_id,
        }));
        
        await supabase
          .from('position_locations')
          .insert(locationLinks);
      }
      
      // 4. Reload positions
      await get().loadPositions();
      
      toast.success(`Position "${formData.name}" erfolgreich aktualisiert`);
      return position;
      
    } catch (error: any) {
      console.error('Failed to update position:', error);
      toast.error(error.message || 'Fehler beim Aktualisieren der Position');
      return null;
    }
  },
  
  /**
   * Delete position
   */
  deletePosition: async (id: string) => {
    try {
      const position = get().positions.find(p => p.id === id);
      if (!position) throw new Error('Position not found');
      
      // Check if employees are assigned
      const employeeCount = position.employee_count || 0;
      
      if (employeeCount > 0) {
        const confirmed = window.confirm(
          `Diese Position hat ${employeeCount} Mitarbeiter zugewiesen.\n\n` +
          `Beim Löschen wird die Position bei allen Mitarbeitern auf "Keine Position" gesetzt.\n\n` +
          `Fortfahren?`
        );
        
        if (!confirmed) return false;
        
        // Set position_id to NULL for all users with this position
        await supabase
          .from('users')
          .update({ position_id: null })
          .eq('position_id', id);
      }
      
      // Delete position (cascades to position_departments and position_locations)
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Reload positions
      await get().loadPositions();
      
      toast.success(`Position "${position.name}" erfolgreich gelöscht`);
      return true;
      
    } catch (error: any) {
      console.error('Failed to delete position:', error);
      toast.error(error.message || 'Fehler beim Löschen der Position');
      return false;
    }
  },
  
  /**
   * Get position by ID
   */
  getPositionById: (id: string) => {
    return get().positions.find(p => p.id === id);
  },
  
  /**
   * Get employees for a position
   */
  getPositionEmployees: async (positionId: string) => {
    try {
      const { data: employees, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, department, profile_picture')
        .eq('position_id', positionId)
        .order('last_name');
      
      if (error) throw error;
      return employees || [];
      
    } catch (error) {
      console.error('Failed to load position employees:', error);
      toast.error('Fehler beim Laden der Mitarbeiter');
      return [];
    }
  },
}));