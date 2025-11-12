/**
 * @file BrowoKo_useShiftPlanning.ts
 * @version 1.0.0
 * @description Hook for Shift Planning - Fetch real data from Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  location_id?: string;
  department?: string;
  specialization?: string;
  team_id?: string;
  profile_picture?: string;
}

interface Team {
  id: string;
  name: string;
  member_count: number;
  scheduled_count: number;
  members: User[];
}

interface Shift {
  id: string;
  user_id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  specialization?: string;
  location_id?: string;
  department_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function BrowoKo_useShiftPlanning(selectedWeek: Date) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel fetching for performance
      const [
        locationsResult,
        departmentsResult,
        teamsResult,
        shiftsResult,
        usersResult,
      ] = await Promise.all([
        supabase.from('locations').select('*').order('name'),
        supabase.from('departments').select('*').order('name'),
        supabase.from('teams').select('*').order('name'),
        supabase
          .from('shifts')
          .select('*')
          .gte('date', getWeekStart(selectedWeek))
          .lte('date', getWeekEnd(selectedWeek))
          .order('date')
          .order('start_time'),
        supabase
          .from('users')
          .select('id, first_name, last_name, email, location_id, department, specialization, profile_picture, role')
          .order('last_name'),
      ]);

      // Handle errors
      if (locationsResult.error) throw locationsResult.error;
      if (departmentsResult.error) throw departmentsResult.error;
      if (teamsResult.error) throw teamsResult.error;
      if (shiftsResult.error) throw shiftsResult.error;
      if (usersResult.error) throw usersResult.error;

      // Set data
      setLocations(locationsResult.data || []);
      setDepartments(departmentsResult.data || []);
      setShifts(shiftsResult.data || []);
      setUsers(usersResult.data || []);

      // Process teams with member counts
      const processedTeams = await processTeamsWithMembers(teamsResult.data || []);
      setTeams(processedTeams);

    } catch (err: any) {
      console.error('Error fetching shift planning data:', err);
      setError(err.message || 'Fehler beim Laden der Daten');
      toast.error('Fehler beim Laden der Schichtplanung');
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  // Process teams with members
  const processTeamsWithMembers = async (teamsData: any[]): Promise<Team[]> => {
    const processedTeams: Team[] = [];

    for (const team of teamsData) {
      // Get team members
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          users (
            id,
            first_name,
            last_name,
            email,
            location_id,
            department,
            specialization,
            profile_picture
          )
        `)
        .eq('team_id', team.id);

      if (error) {
        console.error(`Error fetching members for team ${team.id}:`, error);
        continue;
      }

      const members: User[] = (teamMembers || [])
        .map((tm: any) => ({
          ...tm.users,
          team_id: team.id,
        }))
        .filter(Boolean);

      // Count scheduled members (members with shifts this week)
      const scheduledCount = members.filter((member) =>
        shifts.some((shift) => shift.user_id === member.id)
      ).length;

      processedTeams.push({
        id: team.id,
        name: team.name,
        member_count: members.length,
        scheduled_count: scheduledCount,
        members,
      });
    }

    return processedTeams;
  };

  // Create a new shift
  const createShift = async (shiftData: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🔐 [Auth Check] Checking authentication...');
      
      // Get current user ID and session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('🔐 [Auth Check] Auth error:', authError);
      console.log('🔐 [Auth Check] User:', user);
      
      if (authError || !user) {
        console.error('❌ [Auth Error] Not authenticated:', authError);
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      // Get user role from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('👤 [User Role] User data:', userData);
      console.log('👤 [User Role] User error:', userError);

      if (userError || !userData) {
        console.error('❌ [User Error] Could not fetch user data:', userError);
        throw new Error('Benutzer nicht gefunden');
      }

      // Check if user has permission to create shifts
      const allowedRoles = ['SUPERADMIN', 'ADMIN', 'HR'];
      if (!allowedRoles.includes(userData.role)) {
        console.error('❌ [Permission Error] User role not allowed:', userData.role);
        throw new Error(`Keine Berechtigung. Nur SUPERADMIN, ADMIN und HR können Schichten erstellen. Ihre Rolle: ${userData.role}`);
      }

      console.log('✅ [Permission Check] User has permission. Role:', userData.role);

      // Add created_by field
      const shiftDataWithCreator = {
        ...shiftData,
        created_by: user.id,
      };

      console.log('📤 [Shift Creation] Sending data to Supabase:', shiftDataWithCreator);
      console.log('📤 [Shift Creation] User ID:', user.id);

      const { data, error } = await supabase
        .from('shifts')
        .insert([shiftDataWithCreator])
        .select()
        .single();

      if (error) {
        console.error('❌ [Shift Creation] Error:', error);
        console.error('❌ [Shift Creation] Error Code:', error.code);
        console.error('❌ [Shift Creation] Error Message:', error.message);
        console.error('❌ [Shift Creation] Error Details:', error.details);
        console.error('❌ [Shift Creation] Error Hint:', error.hint);
        throw error;
      }

      console.log('✅ [Shift Creation] Success! Created shift:', data);

      setShifts((prev) => [...prev, data]);
      toast.success('Schicht erfolgreich erstellt');
      return data;
    } catch (err: any) {
      console.error('❌ Error creating shift:', err);
      const errorMessage = err.message || 'Unbekannter Fehler';
      toast.error(`Fehler beim Erstellen der Schicht: ${errorMessage}`);
      throw err;
    }
  };

  // Create multiple shifts at once
  const createMultipleShifts = async (shiftsData: Omit<Shift, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      console.log('🔐 [Multi-Shift Auth Check] Checking authentication...');
      
      // Get current user ID and session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [Auth Error] Not authenticated:', authError);
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      // Get user role from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        console.error('❌ [User Error] Could not fetch user data:', userError);
        throw new Error('Benutzer nicht gefunden');
      }

      // Check if user has permission to create shifts
      const allowedRoles = ['SUPERADMIN', 'ADMIN', 'HR'];
      if (!allowedRoles.includes(userData.role)) {
        console.error('❌ [Permission Error] User role not allowed:', userData.role);
        throw new Error(`Keine Berechtigung. Nur SUPERADMIN, ADMIN und HR können Schichten erstellen. Ihre Rolle: ${userData.role}`);
      }

      console.log('✅ [Permission Check] User has permission. Role:', userData.role);

      // Add created_by field to all shifts
      const shiftsWithCreator = shiftsData.map(shift => ({
        ...shift,
        created_by: user.id,
      }));

      console.log('📤 [Multi-Shift Creation] Sending data to Supabase:', shiftsWithCreator);
      console.log('📤 [Multi-Shift Creation] Count:', shiftsWithCreator.length);

      const { data, error } = await supabase
        .from('shifts')
        .insert(shiftsWithCreator)
        .select();

      if (error) {
        console.error('❌ [Multi-Shift Creation] Error:', error);
        console.error('❌ [Multi-Shift Creation] Error Code:', error.code);
        console.error('❌ [Multi-Shift Creation] Error Message:', error.message);
        console.error('❌ [Multi-Shift Creation] Error Details:', error.details);
        throw error;
      }

      console.log('✅ [Multi-Shift Creation] Success! Created shifts:', data);

      setShifts((prev) => [...prev, ...data]);
      toast.success(`${data.length} Schichten erfolgreich erstellt`);
      return data;
    } catch (err: any) {
      console.error('❌ Error creating multiple shifts:', err);
      const errorMessage = err.message || 'Unbekannter Fehler';
      toast.error(`Fehler beim Erstellen der Schichten: ${errorMessage}`);
      throw err;
    }
  };

  // Get all shifts for a specific user
  const getUserShifts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching user shifts:', error);
        throw error;
      }

      return data as Shift[];
    } catch (err: any) {
      console.error('❌ Error fetching user shifts:', err);
      return [];
    }
  };

  // Get user shifts for a specific week (Monday - Sunday)
  const getUserShiftsForWeek = async (userId: string, weekStart: Date) => {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching user shifts for week:', error);
        throw error;
      }

      return data as Shift[];
    } catch (err: any) {
      console.error('❌ Error fetching user shifts for week:', err);
      return [];
    }
  };

  // Check if a new shift overlaps with existing shifts
  const checkShiftOverlap = (
    userId: string,
    date: string,
    startTime: string,
    endTime: string,
    existingShifts?: Shift[]
  ): { hasOverlap: boolean; overlappingShift?: Shift } => {
    const shiftsToCheck = existingShifts || shifts.filter(s => s.user_id === userId && s.date === date);
    
    for (const shift of shiftsToCheck) {
      const existingStart = shift.start_time;
      const existingEnd = shift.end_time;
      
      // Check for overlap
      if (
        (startTime >= existingStart && startTime < existingEnd) || // New start is during existing shift
        (endTime > existingStart && endTime <= existingEnd) || // New end is during existing shift
        (startTime <= existingStart && endTime >= existingEnd) // New shift completely contains existing shift
      ) {
        return { hasOverlap: true, overlappingShift: shift };
      }
    }
    
    return { hasOverlap: false };
  };

  // Update a shift
  const updateShift = async (shiftId: string, updates: Partial<Shift>) => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;

      setShifts((prev) =>
        prev.map((shift) => (shift.id === shiftId ? data : shift))
      );
      toast.success('Schicht aktualisiert');
      return data;
    } catch (err: any) {
      console.error('Error updating shift:', err);
      toast.error('Fehler beim Aktualisieren der Schicht');
      throw err;
    }
  };

  // Delete a shift
  const deleteShift = async (shiftId: string) => {
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      setShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
      toast.success('Schicht gelöscht');
    } catch (err: any) {
      console.error('Error deleting shift:', err);
      toast.error('Fehler beim Löschen der Schicht');
      throw err;
    }
  };

  // Fetch data on mount and when week changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    locations,
    departments,
    teams,
    shifts,
    users,
    loading,
    error,
    refetch: fetchData,
    createShift,
    createMultipleShifts,
    getUserShifts,
    getUserShiftsForWeek,
    checkShiftOverlap,
    updateShift,
    deleteShift,
  };
}

// Helper: Get week start (Monday)
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

// Helper: Get week end (Sunday)
function getWeekEnd(date: Date): string {
  const start = new Date(getWeekStart(date));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split('T')[0];
}
