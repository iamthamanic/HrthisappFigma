/**
 * Leave Request Approver Logic
 * 
 * Determines who is responsible for approving leave requests based on:
 * - Team membership and roles (TEAMLEAD)
 * - Global roles (ADMIN, HR, SUPERADMIN)
 * - Absence/availability of approvers (coverage chain)
 */

import { supabase } from './supabase/client';

export interface Approver {
  id: string;
  first_name: string;
  last_name: string;
  role: 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN';
  team_role?: 'TEAMLEAD' | 'MEMBER';
  is_available: boolean;
  reason?: string; // Why this approver (e.g., "Primary Teamlead", "HR Coverage", "Superadmin Coverage")
}

export interface ApproverChain {
  primary: Approver | null;
  coverage: Approver | null;
  all_approvers: Approver[];
}

/**
 * Check if a user is currently absent (has an approved leave request for today)
 */
async function isUserAbsent(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'APPROVED')
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(1);

  if (error) {
    console.error('Error checking user absence:', error);
    return false;
  }

  return (data && data.length > 0) || false;
}

/**
 * Get all potential approvers for a user's leave request
 * Based on team membership and global roles
 * 
 * Special rule: Only SUPERADMIN can approve HR and SUPERADMIN requests
 */
export async function getApproversForUser(userId: string): Promise<ApproverChain> {
  // Get user's global role first
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Error fetching user role:', userError);
    return { primary: null, coverage: null, all_approvers: [] };
  }

  // SPECIAL RULE: If user is HR or SUPERADMIN, only SUPERADMIN can approve
  if (user.role === 'HR' || user.role === 'SUPERADMIN') {
    const { data: superadmins, error: superadminError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .eq('role', 'SUPERADMIN')
      .neq('id', userId); // Exclude the user themselves

    if (superadminError || !superadmins) {
      return { primary: null, coverage: null, all_approvers: [] };
    }

    const approversWithAvailability = await Promise.all(
      superadmins.map(async (approver) => ({
        ...approver,
        full_name: `${approver.first_name || ''} ${approver.last_name || ''}`.trim(),
        is_available: !(await isUserAbsent(approver.id)),
        reason: 'Superadmin (Required for HR/SUPERADMIN)',
        team_role: 'TEAMLEAD' as const,
      }))
    );

    const available = approversWithAvailability.find((a) => a.is_available);
    
    return {
      primary: available || approversWithAvailability[0] || null,
      coverage: approversWithAvailability[1] || null,
      all_approvers: approversWithAvailability,
    };
  }

  // Get user's teams (for regular users, ADMIN)
  const { data: userTeams, error: teamsError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId);

  if (teamsError) {
    console.error('Error fetching user teams:', teamsError);
    return { primary: null, coverage: null, all_approvers: [] };
  }

  if (!userTeams || userTeams.length === 0) {
    // User has no team - no one can approve (user must be in a team)
    console.warn(`⚠️ User ${userId} is not in any team - no approvers available`);
    return { primary: null, coverage: null, all_approvers: [] };
  }

  const teamIds = userTeams.map((t) => t.team_id);

  // Get all team members who are TEAMLEAD in user's teams WITH priority tags
  const { data: teamLeads, error: leadsError } = await supabase
    .from('team_members')
    .select(`
      user_id,
      role,
      priority_tag,
      users!inner (
        id,
        first_name,
        last_name,
        role
      )
    `)
    .in('team_id', teamIds)
    .eq('role', 'TEAMLEAD')
    .neq('user_id', userId); // Exclude the user themselves

  if (leadsError) {
    console.error('Error fetching team leads:', leadsError);
    return { primary: null, coverage: null, all_approvers: [] };
  }

  // Build approvers list with availability and priority tags
  const approvers: Approver[] = [];

  if (teamLeads && teamLeads.length > 0) {
    for (const lead of teamLeads) {
      const user = (lead.users as any);
      const isAbsent = await isUserAbsent(user.id);
      const priorityTag = (lead as any).priority_tag;
      
      let reason = 'Primary Teamlead';
      if (priorityTag === 'PRIMARY') {
        reason = 'Primary Teamlead';
      } else if (priorityTag === 'BACKUP') {
        reason = 'Backup Teamlead';
      } else if (priorityTag === 'BACKUP_BACKUP') {
        reason = 'Backup (Escalation)';
      } else if (user.role === 'HR') {
        reason = 'HR (Teamlead)';
      } else if (user.role === 'SUPERADMIN') {
        reason = 'Superadmin (Teamlead)';
      } else if (user.role === 'ADMIN') {
        reason = 'Admin (Teamlead)';
      }

      approvers.push({
        id: user.id,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role,
        team_role: 'TEAMLEAD',
        is_available: !isAbsent,
        reason,
        priority_tag: priorityTag,
      });
    }
  }

  // Sort approvers by priority:
  // 1. By priority_tag (PRIMARY > BACKUP > BACKUP_BACKUP)
  // 2. By availability
  // 3. By role (ADMIN > HR > SUPERADMIN for team-specific approval)
  approvers.sort((a, b) => {
    // First, sort by priority tag
    const tagPriority: Record<string, number> = {
      PRIMARY: 1,
      BACKUP: 2,
      BACKUP_BACKUP: 3,
    };

    const aTagPriority = (a as any).priority_tag ? tagPriority[(a as any).priority_tag] : 999;
    const bTagPriority = (b as any).priority_tag ? tagPriority[(b as any).priority_tag] : 999;

    if (aTagPriority !== bTagPriority) {
      return aTagPriority - bTagPriority;
    }

    // Then, sort by availability
    if (a.is_available && !b.is_available) return -1;
    if (!a.is_available && b.is_available) return 1;

    // Finally by role priority (ADMIN > HR > SUPERADMIN for team-specific approval)
    const rolePriority: Record<string, number> = {
      ADMIN: 1,
      HR: 2,
      SUPERADMIN: 3,
    };

    const aPriority = rolePriority[a.role] || 999;
    const bPriority = rolePriority[b.role] || 999;

    return aPriority - bPriority;
  });

  // Determine primary and coverage
  const availableApprovers = approvers.filter((a) => a.is_available);
  
  let primary: Approver | null = null;
  let coverage: Approver | null = null;

  if (availableApprovers.length > 0) {
    // Primary is first available approver
    primary = availableApprovers[0];
    
    // Coverage logic:
    // If primary is ADMIN, coverage is HR or SUPERADMIN
    // If primary is HR, coverage is SUPERADMIN
    // If primary is SUPERADMIN, no coverage needed
    if (primary.role === 'ADMIN') {
      coverage = availableApprovers.find((a) => a.role === 'HR' || a.role === 'SUPERADMIN') || null;
    } else if (primary.role === 'HR') {
      coverage = availableApprovers.find((a) => a.role === 'SUPERADMIN') || null;
    }
  } else {
    // No one available - assign based on hierarchy anyway
    primary = approvers[0] || null;
    if (approvers.length > 1) {
      coverage = approvers.find((a) => a.role === 'HR' || a.role === 'SUPERADMIN') || null;
    }
  }

  return {
    primary,
    coverage,
    all_approvers: approvers,
  };
}

/**
 * Get the responsible approver for a specific leave request
 * (Used for displaying "Zuständig" in UI)
 */
export async function getResponsibleApprover(userId: string): Promise<Approver | null> {
  const chain = await getApproversForUser(userId);
  
  // Return primary if available, otherwise coverage
  if (chain.primary?.is_available) {
    return chain.primary;
  }
  
  if (chain.coverage?.is_available) {
    return chain.coverage;
  }
  
  // No one available - return primary anyway (they'll see the request when they're back)
  return chain.primary;
}

/**
 * Check if a user can approve a leave request
 * 
 * NEW RULES (2-Level Hierarchy):
 * - Global Role (ADMIN/HR/SUPERADMIN) + Team Role (TEAMLEAD) required
 * - SPECIAL CASE: Only SUPERADMIN (who is also TEAMLEAD) can approve HR/SUPERADMIN requests
 * - HR, SUPERADMIN, and ADMIN must ALL be TEAMLEAD of the requester's team
 * - No automatic approval rights based on global role alone
 */
export async function canUserApproveRequest(
  approverId: string,
  requesterId: string
): Promise<boolean> {
  console.log('🔍 canUserApproveRequest called:', { approverId, requesterId });
  
  // Get approver's global role
  const { data: approver, error: approverError } = await supabase
    .from('users')
    .select('role, email, first_name, last_name')
    .eq('id', approverId)
    .single();

  if (approverError || !approver) {
    console.error('❌ Error fetching approver:', approverError);
    return false;
  }

  console.log('👤 Approver:', { 
    email: approver.email, 
    name: `${approver.first_name} ${approver.last_name}`,
    role: approver.role 
  });

  // Get requester's global role
  const { data: requester, error: requesterError } = await supabase
    .from('users')
    .select('role, email, first_name, last_name')
    .eq('id', requesterId)
    .single();

  if (requesterError || !requester) {
    console.error('❌ Error fetching requester:', requesterError);
    return false;
  }

  console.log('👤 Requester:', { 
    email: requester.email, 
    name: `${requester.first_name} ${requester.last_name}`,
    role: requester.role 
  });

  // RULE 1: Only SUPERADMIN can approve HR and SUPERADMIN requests
  // (and they must still be TEAMLEAD in the team - checked below)
  if (requester.role === 'HR' || requester.role === 'SUPERADMIN') {
    console.log('⚠️  RULE 1: Requester is HR/SUPERADMIN - only SUPERADMIN can approve');
    if (approver.role !== 'SUPERADMIN') {
      console.log('❌ FAIL: Approver is not SUPERADMIN');
      return false;
    }
    console.log('✅ RULE 1 PASS: Approver is SUPERADMIN');
    // Continue to team role check below
  }

  // RULE 2: Approver must have admin-level global role
  if (approver.role === 'USER') {
    console.log('❌ FAIL RULE 2: Approver has role USER (no admin rights)');
    return false;
  }

  console.log('✅ RULE 2 PASS: Approver has admin-level role:', approver.role);

  // RULE 3: Approver must be TEAMLEAD in requester's team
  // Get requester's teams
  const { data: requesterTeams, error: teamsError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', requesterId);

  if (teamsError || !requesterTeams || requesterTeams.length === 0) {
    console.log('❌ FAIL RULE 3: Requester is not in any team');
    return false;
  }

  const teamIds = requesterTeams.map((t) => t.team_id);
  console.log('📋 Requester is in teams:', teamIds);

  // Check if approver is TEAMLEAD in any of these teams
  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', approverId)
    .in('team_id', teamIds)
    .eq('role', 'TEAMLEAD')
    .limit(1);

  if (membershipError) {
    console.error('❌ Error checking team membership:', membershipError);
    return false;
  }

  const isTeamlead = (membership && membership.length > 0);
  
  if (!isTeamlead) {
    console.log('❌ FAIL RULE 3: Approver is NOT TEAMLEAD in requester\'s team');
    console.log('   Approver needs to be TEAMLEAD in one of these teams:', teamIds);
    return false;
  }

  console.log('✅ RULE 3 PASS: Approver is TEAMLEAD in team:', membership[0].team_id);
  console.log('✅ SUCCESS: All rules passed - approval allowed!');
  
  // ✅ Approver must be TEAMLEAD in requester's team
  return true;
}
