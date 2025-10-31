import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import type { Team, User } from '../types/database';

/**
 * @file BrowoKo_useTeamManagement.ts
 * @domain BrowoKo - Team Management
 * @description Team CRUD operations and member assignments with priority tags
 * @created Phase 3D - Hooks Migration
 */

export function useTeamManagement(organizationId: string | null) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMemberCounts, setTeamMemberCounts] = useState<Record<string, number>>({});
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [userTeamMemberships, setUserTeamMemberships] = useState<Record<string, { role: string; teamName: string }[]>>({});

  /**
   * Load all teams for the organization
   */
  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      setTeams(data || []);

      // Load member counts for each team
      if (data) {
        const counts: Record<string, number> = {};
        for (const team of data) {
          const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('user_id', { count: 'exact' })
            .eq('team_id', team.id);

          if (!membersError) {
            counts[team.id] = members?.length || 0;
          }
        }
        setTeamMemberCounts(counts);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Fehler beim Laden der Teams');
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  /**
   * Load user team memberships (for badges in employee list)
   */
  const loadUserTeamMemberships = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id, role, teams!inner(name)');
      
      if (error) throw error;
      
      // Group by user_id
      const memberships: Record<string, { role: string; teamName: string }[]> = {};
      data?.forEach((tm: any) => {
        if (!memberships[tm.user_id]) {
          memberships[tm.user_id] = [];
        }
        memberships[tm.user_id].push({
          role: tm.role,
          teamName: tm.teams.name,
        });
      });
      
      setUserTeamMemberships(memberships);
    } catch (error) {
      console.error('Error loading team memberships:', error);
    }
  }, []);

  /**
   * Create a new team
   */
  const createTeam = useCallback(async (
    name: string,
    description: string | null,
    teamLeads: string[],
    members: string[],
    teamLeadTags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>
  ) => {
    try {
      // Create team
      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          name,
          description: description || null,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Insert team leads WITH priority tags
      const leadInserts = teamLeads.map(userId => ({
        team_id: team.id,
        user_id: userId,
        role: 'TEAMLEAD',
        is_lead: true,
        priority_tag: teamLeadTags[userId] || null,
        joined_at: new Date().toISOString()
      }));

      // Insert regular members
      const memberInserts = members.map(userId => ({
        team_id: team.id,
        user_id: userId,
        role: 'MEMBER',
        is_lead: false,
        joined_at: new Date().toISOString()
      }));

      const allInserts = [...leadInserts, ...memberInserts];

      if (allInserts.length > 0) {
        // Use upsert to handle conflicts (admins are already added by trigger)
        const { error: insertError } = await supabase
          .from('team_members')
          .upsert(allInserts, {
            onConflict: 'team_id,user_id',
            ignoreDuplicates: false // Update role if user already exists
          });

        if (insertError) throw insertError;
      }

      toast.success('Team erfolgreich erstellt!');
      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Fehler beim Erstellen des Teams');
      throw error;
    }
  }, [organizationId]);

  /**
   * Update an existing team
   */
  const updateTeam = useCallback(async (
    teamId: string,
    name: string,
    description: string | null,
    teamLeads: string[],
    members: string[],
    teamLeadTags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>
  ) => {
    try {
      // Update team info
      const { error } = await supabase
        .from('teams')
        .update({
          name,
          description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;

      // Delete ALL existing members - we'll re-insert the selected ones
      // HR/SUPERADMIN are auto-added by trigger, but can be manually removed if deselected
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      // Insert team leads WITH priority tags
      const leadInserts = teamLeads.map(userId => ({
        team_id: teamId,
        user_id: userId,
        role: 'TEAMLEAD',
        is_lead: true,
        priority_tag: teamLeadTags[userId] || null,
        joined_at: new Date().toISOString()
      }));

      // Insert regular members
      const memberInserts = members.map(userId => ({
        team_id: teamId,
        user_id: userId,
        role: 'MEMBER',
        is_lead: false,
        joined_at: new Date().toISOString()
      }));

      const allInserts = [...leadInserts, ...memberInserts];

      if (allInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('team_members')
          .upsert(allInserts, {
            onConflict: 'team_id,user_id',
            ignoreDuplicates: false
          });

        if (insertError) throw insertError;
      }

      toast.success('Team erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Fehler beim Aktualisieren des Teams');
      throw error;
    }
  }, []);

  /**
   * Delete a team
   */
  const deleteTeam = useCallback(async (teamId: string) => {
    if (!confirm('Möchtest du dieses Team wirklich löschen? Alle Team-Zuweisungen werden entfernt.')) {
      return;
    }

    try {
      // First, delete all team_members entries
      const { error: membersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // Then delete the team
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (teamError) throw teamError;

      toast.success('Team erfolgreich gelöscht!');
      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Fehler beim Löschen des Teams');
    }
  }, [loadTeams]);

  /**
   * Load team members for editing
   */
  const loadTeamMembers = useCallback(async (teamId: string) => {
    try {
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, role, priority_tag, users!inner(role)')
        .eq('team_id', teamId);

      if (!members) return { leads: [], regularMembers: [], tags: {} };

      const leads = members.filter(m => m.role === 'TEAMLEAD').map(m => m.user_id);
      const regularMembers = members.filter(m => m.role === 'MEMBER').map(m => m.user_id);
      
      const tags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'> = {};
      members.forEach((m: any) => {
        if (m.role === 'TEAMLEAD' && m.priority_tag) {
          tags[m.user_id] = m.priority_tag;
        }
      });

      return { leads, regularMembers, tags };
    } catch (error) {
      console.error('Error loading team members:', error);
      return { leads: [], regularMembers: [], tags: {} };
    }
  }, []);

  /**
   * Get default teamleads for new team
   */
  const getDefaultTeamLeads = useCallback((users: User[]) => {
    // Pre-select ONLY HR/SUPERADMIN as teamleads (not ADMIN)
    const autoTeamleads = users.filter(u => 
      u.role === 'HR' || u.role === 'SUPERADMIN'
    );
    
    const leads = autoTeamleads.map(u => u.id);
    
    // Set default priority tags for pre-selected teamleads
    const tags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'> = {};
    autoTeamleads.forEach(u => {
      if (u.role === 'HR') {
        tags[u.id] = 'BACKUP';
      } else if (u.role === 'SUPERADMIN') {
        tags[u.id] = 'BACKUP_BACKUP';
      }
    });

    return { leads, tags };
  }, []);

  return {
    teams,
    teamMemberCounts,
    loadingTeams,
    userTeamMemberships,
    loadTeams,
    loadUserTeamMemberships,
    createTeam,
    updateTeam,
    deleteTeam,
    loadTeamMembers,
    getDefaultTeamLeads,
  };
}
