/**
 * @file HRTHIS_useCalendarScreen.ts
 * @domain HRTHIS - Calendar Screen
 * @description Custom hook for calendar screen logic
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { useAdminStore } from '../stores/HRTHIS_adminStore';
import { LeaveRequest, User } from '../types/database';
import { supabase } from '../utils/supabase/client';

export function useCalendarScreen() {
  const { profile } = useAuthStore();
  const { users } = useAdminStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'specialization' | 'team' | 'location' | 'company'>('personal');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [teamUsers, setTeamUsers] = useState<Map<string, User>>(new Map());

  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN' || profile?.role === 'HR' || profile?.role === 'TEAMLEAD';

  // Load leave requests AND team users
  useEffect(() => {
    const loadLeaveRequests = async () => {
      if (!profile?.id) return;

      try {
        setLoadingLeaves(true);
        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

        let query = supabase
          .from('leave_requests')
          .select('*')
          .or(`start_date.lte.${end},end_date.gte.${start}`);

        if (viewMode === 'personal') {
          query = query.eq('user_id', profile.id);
        } else {
          query = query.eq('status', 'APPROVED');
        }

        try {
          const { data, error } = await query
            .is('withdrawn_at', null)
            .order('start_date', { ascending: false });

          if (error && error.code === '42703') {
            throw new Error('Column not found');
          }
          if (error) throw error;
          setLeaveRequests(data || []);
          
          // 🔥 PERFORMANCE FIX: Load all unique users ONCE
          if (viewMode === 'team' && data && data.length > 0) {
            const uniqueUserIds = [...new Set(data.map(leave => leave.user_id))];
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('*')
              .in('id', uniqueUserIds);
            
            if (!usersError && usersData) {
              const userMap = new Map(usersData.map(user => [user.id, user]));
              setTeamUsers(userMap);
            }
          } else {
            setTeamUsers(new Map());
          }
        } catch (innerError: any) {
          if (innerError.message === 'Column not found' || innerError.code === '42703') {
            const { data, error } = await query.order('start_date', { ascending: false });
            if (error) throw error;
            setLeaveRequests(data || []);
            
            // Load team users for fallback too
            if (viewMode === 'team' && data && data.length > 0) {
              const uniqueUserIds = [...new Set(data.map(leave => leave.user_id))];
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .in('id', uniqueUserIds);
              
              if (!usersError && usersData) {
                const userMap = new Map(usersData.map(user => [user.id, user]));
                setTeamUsers(userMap);
              }
            } else {
              setTeamUsers(new Map());
            }
          } else {
            throw innerError;
          }
        }
      } catch (error: any) {
        if (error?.code !== '42703' && error?.message !== 'Column not found') {
          console.error('Error loading leave requests:', error);
        }
      } finally {
        setLoadingLeaves(false);
      }
    };

    loadLeaveRequests();
  }, [profile?.id, currentDate, viewMode, refreshTrigger]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get records for a specific day (empty now - time tracking removed)
  const getRecordsForDay = (date: Date) => {
    return [];
  };

  // Get leave requests for a specific day
  const getLeaveRequestsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return (leaveRequests || []).filter(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const day = new Date(dateStr);
      return isWithinInterval(day, { start, end });
    });
  };

  // Navigation
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const handleRefreshCalendar = async () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Export functions (removed - time tracking removed)
  const handleExportCSV = () => {
    console.log('Export CSV - Time tracking feature removed');
  };

  const handleExportPDF = () => {
    console.log('Export PDF - Time tracking feature removed');
  };

  const handleExportICal = () => {
    console.log('Export iCal - Time tracking feature removed');
  };

  return {
    currentDate,
    setCurrentDate,
    selectedDay,
    setSelectedDay,
    viewMode,
    setViewMode,
    refreshTrigger,
    setRefreshTrigger,
    leaveRequests,
    loadingLeaves,
    isAdmin,
    calendarDays,
    users,
    teamUsers,
    getRecordsForDay,
    getLeaveRequestsForDay,
    previousMonth,
    nextMonth,
    today,
    handleRefreshCalendar,
    handleExportCSV,
    handleExportPDF,
    handleExportICal,
  };
}
