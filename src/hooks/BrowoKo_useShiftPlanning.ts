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
          .select('id, first_name, last_name, email, location_id, department, specialization, profile_picture')
          .eq('role', 'EMPLOYEE')
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
      const { data, error } = await supabase
        .from('shifts')
        .insert([shiftData])
        .select()
        .single();

      if (error) throw error;

      setShifts((prev) => [...prev, data]);
      toast.success('Schicht erfolgreich erstellt');
      return data;
    } catch (err: any) {
      console.error('Error creating shift:', err);
      toast.error('Fehler beim Erstellen der Schicht');
      throw err;
    }
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
