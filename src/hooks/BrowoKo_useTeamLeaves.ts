/**
 * @file BrowoKo_useTeamLeaves.ts
 * @domain BrowoKo - Team Leaves
 * @description Loads approved leave requests for team calendar
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { LeaveRequest, User } from '../types/database';

interface LeaveRequestWithUser extends LeaveRequest {
  user?: User;
}

interface TeamLeavesResult {
  leaves: LeaveRequestWithUser[];
  loading: boolean;
  refresh: () => void;
}

export function useTeamLeaves(
  startDate: string,
  endDate: string
): TeamLeavesResult {
  const [leaves, setLeaves] = useState<LeaveRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeamLeaves = useCallback(async () => {
    if (!startDate || !endDate) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get all APPROVED leaves that overlap with the date range
      const { data: leaveRequests, error: leavesError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'APPROVED')
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

      if (leavesError) {
        console.error('Error loading team leaves:', leavesError);
        setLeaves([]);
        return;
      }

      if (!leaveRequests || leaveRequests.length === 0) {
        setLeaves([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(leaveRequests.map(l => l.user_id))];

      // Fetch user data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, position, profile_picture_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Error loading users:', usersError);
        setLeaves(leaveRequests);
        return;
      }

      // Join leaves with users
      const leavesWithUsers: LeaveRequestWithUser[] = leaveRequests.map(leave => ({
        ...leave,
        user: users?.find(u => u.id === leave.user_id)
      }));

      setLeaves(leavesWithUsers);
    } catch (error) {
      console.error('Error in useTeamLeaves:', error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadTeamLeaves();
  }, [loadTeamLeaves]);

  return {
    leaves,
    loading,
    refresh: loadTeamLeaves
  };
}
