/**
 * TEAM SERVICE
 * ============
 * Handles all team management operations
 * 
 * Replaces direct Supabase calls in stores for:
 * - Creating/updating/deleting teams
 * - Managing team members
 * - Team roles (TEAMLEAD, MEMBER)
 * - Team assignments
 */

import { ApiService } from './base/ApiService';
import { NotFoundError, ValidationError, ApiError } from './base/ApiError';
import type { Team, TeamMember } from '../types/database';

export interface CreateTeamData {
  name: string;
  description?: string;
  department_id?: string;
  organization_id: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  department_id?: string;
}

export interface AddTeamMemberData {
  user_id: string;
  team_id: string;
  role: 'TEAMLEAD' | 'MEMBER';
  priority_tag?: 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP';
}

/**
 * TEAM SERVICE
 * ============
 * Manages teams, team members, and team roles
 */
export class TeamService extends ApiService {
  /**
   * Get team by ID
   */
  async getTeamById(teamId: string): Promise<Team> {
    this.logRequest('getTeamById', 'TeamService', { teamId });

    if (!teamId) {
      throw new ValidationError(
        'Team ID ist erforderlich',
        'TeamService.getTeamById',
        { teamId: 'Team ID ist erforderlich' }
      );
    }

    try {
      const { data: team, error } = await this.supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) {
        throw new NotFoundError('Team', 'TeamService.getTeamById', error);
      }

      if (!team) {
        throw new NotFoundError('Team', 'TeamService.getTeamById');
      }

      this.logResponse('TeamService.getTeamById', { name: team.name });
      return team as Team;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'TeamService.getTeamById');
    }
  }

  /**
   * Get all teams
   */
  async getAllTeams(organizationId?: string): Promise<Team[]> {
    this.logRequest('getAllTeams', 'TeamService', { organizationId });

    try {
      let query = this.supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: teams, error } = await query;

      if (error) {
        this.handleError(error, 'TeamService.getAllTeams');
      }

      this.logResponse('TeamService.getAllTeams', { count: teams?.length || 0 });
      return (teams || []) as Team[];
    } catch (error: any) {
      this.handleError(error, 'TeamService.getAllTeams');
    }
  }

  /**
   * Create new team
   */
  async createTeam(data: CreateTeamData): Promise<Team> {
    this.logRequest('createTeam', 'TeamService', data);

    // Validate input
    if (!data.name || !data.organization_id) {
      throw new ValidationError(
        'Name und Organization ID sind erforderlich',
        'TeamService.createTeam',
        {
          name: !data.name ? 'Name ist erforderlich' : '',
          organization_id: !data.organization_id
            ? 'Organization ID ist erforderlich'
            : '',
        }
      );
    }

    try {
      const { data: team, error } = await this.supabase
        .from('teams')
        .insert({
          name: data.name,
          description: data.description || null,
          department_id: data.department_id || null,
          organization_id: data.organization_id,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'TeamService.createTeam');
      }

      if (!team) {
        throw new ApiError(
          'Team konnte nicht erstellt werden',
          'CREATION_FAILED',
          'TeamService.createTeam'
        );
      }

      this.logResponse('TeamService.createTeam', { name: team.name });
      return team as Team;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'TeamService.createTeam');
    }
  }

  /**
   * Update team
   */
  async updateTeam(teamId: string, updates: UpdateTeamData): Promise<Team> {
    this.logRequest('updateTeam', 'TeamService', { teamId, updates });

    if (!teamId) {
      throw new ValidationError(
        'Team ID ist erforderlich',
        'TeamService.updateTeam',
        { teamId: 'Team ID ist erforderlich' }
      );
    }

    try {
      const { data: team, error } = await this.supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'TeamService.updateTeam');
      }

      if (!team) {
        throw new NotFoundError('Team', 'TeamService.updateTeam');
      }

      this.logResponse('TeamService.updateTeam', { name: team.name });
      return team as Team;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'TeamService.updateTeam');
    }
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string): Promise<void> {
    this.logRequest('deleteTeam', 'TeamService', { teamId });

    if (!teamId) {
      throw new ValidationError(
        'Team ID ist erforderlich',
        'TeamService.deleteTeam',
        { teamId: 'Team ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) {
        this.handleError(error, 'TeamService.deleteTeam');
      }

      this.logResponse('TeamService.deleteTeam', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'TeamService.deleteTeam');
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    this.logRequest('getTeamMembers', 'TeamService', { teamId });

    if (!teamId) {
      throw new ValidationError(
        'Team ID ist erforderlich',
        'TeamService.getTeamMembers',
        { teamId: 'Team ID ist erforderlich' }
      );
    }

    try {
      const { data: members, error } = await this.supabase
        .from('team_members')
        .select(`
          *,
          users (
            id,
            first_name,
            last_name,
            email,
            role,
            position
          )
        `)
        .eq('team_id', teamId)
        .order('role', { ascending: false }); // TEAMLEAD first

      if (error) {
        this.handleError(error, 'TeamService.getTeamMembers');
      }

      this.logResponse('TeamService.getTeamMembers', { count: members?.length || 0 });
      return (members || []) as TeamMember[];
    } catch (error: any) {
      this.handleError(error, 'TeamService.getTeamMembers');
    }
  }

  /**
   * Add member to team
   */
  async addTeamMember(data: AddTeamMemberData): Promise<TeamMember> {
    this.logRequest('addTeamMember', 'TeamService', data);

    // Validate input
    if (!data.user_id || !data.team_id || !data.role) {
      throw new ValidationError(
        'User ID, Team ID und Role sind erforderlich',
        'TeamService.addTeamMember',
        {
          user_id: !data.user_id ? 'User ID ist erforderlich' : '',
          team_id: !data.team_id ? 'Team ID ist erforderlich' : '',
          role: !data.role ? 'Role ist erforderlich' : '',
        }
      );
    }

    try {
      const { data: member, error } = await this.supabase
        .from('team_members')
        .insert({
          user_id: data.user_id,
          team_id: data.team_id,
          role: data.role,
          priority_tag: data.priority_tag || null,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'TeamService.addTeamMember');
      }

      if (!member) {
        throw new ApiError(
          'Team-Mitglied konnte nicht hinzugefügt werden',
          'CREATION_FAILED',
          'TeamService.addTeamMember'
        );
      }

      this.logResponse('TeamService.addTeamMember', { role: member.role });
      return member as TeamMember;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'TeamService.addTeamMember');
    }
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    userId: string,
    teamId: string,
    role: 'TEAMLEAD' | 'MEMBER',
    priorityTag?: 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'
  ): Promise<TeamMember> {
    this.logRequest('updateTeamMemberRole', 'TeamService', {
      userId,
      teamId,
      role,
      priorityTag,
    });

    if (!userId || !teamId || !role) {
      throw new ValidationError(
        'User ID, Team ID und Role sind erforderlich',
        'TeamService.updateTeamMemberRole',
        {
          userId: !userId ? 'User ID ist erforderlich' : '',
          teamId: !teamId ? 'Team ID ist erforderlich' : '',
          role: !role ? 'Role ist erforderlich' : '',
        }
      );
    }

    try {
      const { data: member, error } = await this.supabase
        .from('team_members')
        .update({
          role,
          priority_tag: priorityTag || null,
        })
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'TeamService.updateTeamMemberRole');
      }

      if (!member) {
        throw new NotFoundError('Team-Mitglied', 'TeamService.updateTeamMemberRole');
      }

      this.logResponse('updateTeamMemberRole', { role: member.role });
      return member as TeamMember;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'TeamService.updateTeamMemberRole');
    }
  }

  /**
   * Remove member from team
   */
  async removeTeamMember(userId: string, teamId: string): Promise<void> {
    this.logRequest('removeTeamMember', 'TeamService', { userId, teamId });

    if (!userId || !teamId) {
      throw new ValidationError(
        'User ID und Team ID sind erforderlich',
        'TeamService.removeTeamMember',
        {
          userId: !userId ? 'User ID ist erforderlich' : '',
          teamId: !teamId ? 'Team ID ist erforderlich' : '',
        }
      );
    }

    try {
      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('user_id', userId)
        .eq('team_id', teamId);

      if (error) {
        this.handleError(error, 'TeamService.removeTeamMember');
      }

      this.logResponse('TeamService.removeTeamMember', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'TeamService.removeTeamMember');
    }
  }

  /**
   * Get teams for user
   */
  async getTeamsForUser(userId: string): Promise<Team[]> {
    this.logRequest('getTeamsForUser', 'TeamService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'TeamService.getTeamsForUser',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      const { data: teamMembers, error } = await this.supabase
        .from('team_members')
        .select(`
          teams (
            *
          )
        `)
        .eq('user_id', userId);

      if (error) {
        this.handleError(error, 'TeamService.getTeamsForUser');
      }

      // Extract teams from team_members
      const teams = (teamMembers || [])
        .map((tm: any) => tm.teams)
        .filter(Boolean);

      this.logResponse('TeamService.getTeamsForUser', { count: teams.length });
      return teams as Team[];
    } catch (error: any) {
      this.handleError(error, 'TeamService.getTeamsForUser');
    }
  }

  /**
   * Check if user is team lead
   */
  async isTeamLead(userId: string, teamId: string): Promise<boolean> {
    this.logRequest('isTeamLead', 'TeamService', { userId, teamId });

    try {
      const { data: member, error } = await this.supabase
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single();

      if (error || !member) {
        return false;
      }

      return member.role === 'TEAMLEAD';
    } catch (error: any) {
      console.error('Error checking if user is team lead:', error);
      return false;
    }
  }

  /**
   * Get team leads for team
   */
  async getTeamLeads(teamId: string): Promise<TeamMember[]> {
    this.logRequest('getTeamLeads', 'TeamService', { teamId });

    if (!teamId) {
      throw new ValidationError(
        'Team ID ist erforderlich',
        'TeamService.getTeamLeads',
        { teamId: 'Team ID ist erforderlich' }
      );
    }

    try {
      const { data: members, error } = await this.supabase
        .from('team_members')
        .select(`
          *,
          users (
            id,
            first_name,
            last_name,
            email,
            role,
            position
          )
        `)
        .eq('team_id', teamId)
        .eq('role', 'TEAMLEAD')
        .order('priority_tag', { ascending: true }); // PRIMARY first

      if (error) {
        this.handleError(error, 'TeamService.getTeamLeads');
      }

      this.logResponse('TeamService.getTeamLeads', { count: members?.length || 0 });
      return (members || []) as TeamMember[];
    } catch (error: any) {
      this.handleError(error, 'TeamService.getTeamLeads');
    }
  }
}
