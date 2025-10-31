/**
 * @file BrowoKo_useLeaveRequestsList.ts
 * @domain HR - Leave Management
 * @description Loads leave requests based on user role and team membership
 * @namespace BrowoKo_
 * 
 * Role-Based Request Visibility (2-Level Hierarchy + Historical Approvals):
 * - USER: Only own requests
 * - ADMIN/HR/SUPERADMIN: 
 *   1. Requests from teams where they are CURRENTLY TEAMLEAD
 *   2. Historical requests they have approved/rejected (even if team was deleted)
 * 
 * New Role System:
 * - TEAMLEAD is now a team-specific role (team_members.role), not global
 * - Global roles (ADMIN/HR/SUPERADMIN) do NOT automatically grant approval rights
 * - Must have BOTH: Global role (ADMIN/HR/SUPERADMIN) + Team role (TEAMLEAD)
 * - HR and SUPERADMIN are automatically added as TEAMLEAD (with BACKUP tags) to new teams via trigger
 * 
 * Historical Approvals Feature:
 * - Admins continue to see requests they approved/rejected, even after:
 *   - Being removed from a team
 *   - Team being deleted
 *   - User changing teams
 * - This maintains audit trail and prevents "disappearing" approved requests
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { LeaveRequest, User } from '../types/database';
import { toast } from 'sonner@2.0.3';
import { canUserApproveRequest } from '../utils/BrowoKo_leaveApproverLogic';

interface LeaveRequestWithUser extends LeaveRequest {
  user?: User;
  approver?: User;
}

export function useLeaveRequestsList(userId: string, userRole: string) {
  const [requests, setRequests] = useState<LeaveRequestWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine what requests the user can see
  const loadRequests = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // ALL admin roles (ADMIN, HR, SUPERADMIN) see:
      // 1. Requests from teams where they are CURRENTLY TEAMLEAD
      // 2. Historical requests they have approved/rejected (even if team was deleted)
      if (userRole === 'ADMIN' || userRole === 'HR' || userRole === 'SUPERADMIN') {
        // PART 1: Get teams where user is CURRENTLY TEAMLEAD
        const { data: teamLeadData, error: teamLeadError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .eq('role', 'TEAMLEAD');

        if (teamLeadError) throw teamLeadError;

        const teamIds = teamLeadData?.map(tm => tm.team_id) || [];
        let currentTeamUserIds: string[] = [];

        if (teamIds.length > 0) {
          console.log(`✅ User ${userRole} is TEAMLEAD of ${teamIds.length} team(s)`);

          // Get all team members from current teams
          const { data: teamMemberData, error: teamMemberError } = await supabase
            .from('team_members')
            .select('user_id')
            .in('team_id', teamIds);

          if (teamMemberError) throw teamMemberError;

          currentTeamUserIds = teamMemberData?.map(tm => tm.user_id) || [];
        } else {
          console.log(`ℹ️ User ${userRole} is not TEAMLEAD of any team currently`);
        }

        // PART 2: Get requests this user has approved/rejected (historical)
        const { data: historicalRequests, error: historicalError } = await supabase
          .from('leave_requests')
          .select(`
            *,
            user:users!leave_requests_user_id_fkey(
              id,
              first_name,
              last_name,
              email,
              employee_number,
              position,
              department,
              profile_picture_url
            ),
            approver:users!leave_requests_approved_by_fkey(
              id,
              first_name,
              last_name
            )
          `)
          .eq('approved_by', userId)
          .in('status', ['APPROVED', 'REJECTED'])
          .is('withdrawn_at', null)
          .is('cancelled_at', null)
          .order('created_at', { ascending: false });

        if (historicalError) throw historicalError;

        const historicalUserIds = historicalRequests?.map(r => r.user_id) || [];

        // Combine: current team members + historical approved users + self
        const allUserIds = Array.from(new Set([userId, ...currentTeamUserIds, ...historicalUserIds]));

        console.log(`📋 Loading requests for ${allUserIds.length} user(s) (${currentTeamUserIds.length} current team, ${historicalUserIds.length} historical)`);

        // Load ALL requests for these users
        const { data, error } = await supabase
          .from('leave_requests')
          .select(`
            *,
            user:users!leave_requests_user_id_fkey(
              id,
              first_name,
              last_name,
              email,
              employee_number,
              position,
              department,
              profile_picture_url
            ),
            approver:users!leave_requests_approved_by_fkey(
              id,
              first_name,
              last_name
            )
          `)
          .in('user_id', allUserIds)
          .is('withdrawn_at', null)
          .is('cancelled_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
        return;
      }

      // USER sees only their own requests
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          user:users!leave_requests_user_id_fkey(
            id,
            first_name,
            last_name,
            email,
            employee_number,
            position,
            department,
            profile_picture_url
          ),
          approver:users!leave_requests_approved_by_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('user_id', userId)
        .is('withdrawn_at', null)
        .is('cancelled_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);

    } catch (err: any) {
      console.error('Error loading leave requests:', err);
      setError(err.message || 'Fehler beim Laden der Anträge');
      toast.error('Fehler beim Laden der Anträge');
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Approve request (with permission check)
  const approveRequest = useCallback(async (requestId: string) => {
    try {
      // Get the request to check the requester's user_id
      const { data: request, error: fetchError } = await supabase
        .from('leave_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!request) {
        toast.error('Antrag nicht gefunden');
        return false;
      }

      // Check if user has permission to approve this request
      const canApprove = await canUserApproveRequest(userId, request.user_id);
      
      if (!canApprove) {
        toast.error('Sie haben keine Berechtigung, diesen Antrag zu genehmigen');
        return false;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'APPROVED',
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Antrag wurde genehmigt');
      await loadRequests();
      return true;
    } catch (err: any) {
      console.error('Error approving request:', err);
      toast.error('Fehler beim Genehmigen');
      return false;
    }
  }, [userId, loadRequests]);

  // Reject request (with permission check)
  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      // Get the request to check the requester's user_id
      const { data: request, error: fetchError } = await supabase
        .from('leave_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!request) {
        toast.error('Antrag nicht gefunden');
        return false;
      }

      // Check if user has permission to reject this request
      const canReject = await canUserApproveRequest(userId, request.user_id);
      
      if (!canReject) {
        toast.error('Sie haben keine Berechtigung, diesen Antrag abzulehnen');
        return false;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'REJECTED',
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Antrag wurde abgelehnt');
      await loadRequests();
      return true;
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      toast.error('Fehler beim Ablehnen');
      return false;
    }
  }, [userId, loadRequests]);

  return {
    requests,
    loading,
    error,
    reload: loadRequests,
    approveRequest,
    rejectRequest,
  };
}
