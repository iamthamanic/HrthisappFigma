/**
 * @file BrowoKo_useLeaveManagement.ts
 * @domain BrowoKo - Leave Management
 * @description Core leave management hook (create, approve, reject, withdraw)
 * @created Phase 3D - Hooks Migration
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { LeaveRequest, LeaveType, LeaveStatus } from '../types/database';
import { useBusinessDays } from './useBusinessDays';
import { useVacationCarryover } from './BrowoKo_useVacationCarryover';
import { toast } from 'sonner@2.0.3';

interface CreateLeaveRequestInput {
  userId: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  comment?: string;
  isHalfDay?: boolean;
  fileUrl?: string; // For sick notes
  federalState?: string;
  createdBy?: string; // For admin-created requests
  autoApprove?: boolean; // Admin can auto-approve
}

interface LeaveQuota {
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  carryoverDays: number;
}

export function useLeaveManagement(userId: string, federalState?: string) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<LeaveQuota | null>(null);

  const { calculateBusinessDays, isWeekend, isHoliday } = useBusinessDays(null, null, {
    includeHolidays: true,
    federalState,
  });

  // Load all leave requests for user
  const loadLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to load with withdrawn_at filter first (new schema)
      let query = supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId);
      
      // Try to add withdrawn_at filter if column exists
      try {
        const { data, error } = await query
          .is('withdrawn_at', null) // Exclude withdrawn requests
          .order('created_at', { ascending: false });

        if (error && error.code === '42703') {
          // Column doesn't exist yet - fallback to loading without filter
          throw new Error('withdrawn_at column not found');
        }
        
        if (error) throw error;
        setLeaveRequests(data || []);
      } catch (innerError: any) {
        if (innerError.message === 'withdrawn_at column not found' || innerError.code === '42703') {
          // Fallback: Load without withdrawn_at filter
          const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          setLeaveRequests(data || []);
        } else {
          throw innerError;
        }
      }
    } catch (error) {
      // Silent fail - table doesn't exist
      // This is expected when migrations haven't been run
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load vacation quota
  const loadQuota = useCallback(async () => {
    try {
      // Get user's vacation days from profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('vacation_days')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const totalDays = userData?.vacation_days || 0;

      // Calculate used and pending days
      // Try with new schema first (with withdrawn_at/cancelled_at)
      let requests = null;
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .select('total_days, status, type')
          .eq('user_id', userId)
          .eq('type', 'VACATION')
          .is('withdrawn_at', null)
          .is('cancelled_at', null);

        if (error && error.code === '42703') {
          // Column doesn't exist - use fallback
          throw new Error('Column not found');
        }
        if (error) throw error;
        requests = data;
      } catch (fallbackError: any) {
        if (fallbackError.message === 'Column not found' || fallbackError.code === '42703') {
          // Fallback: Load without withdrawn_at/cancelled_at filters
          const { data, error } = await supabase
            .from('leave_requests')
            .select('total_days, status, type')
            .eq('user_id', userId)
            .eq('type', 'VACATION');
          
          if (error) throw error;
          requests = data;
        } else {
          throw fallbackError;
        }
      }

      const usedDays = requests
        ?.filter(r => r.status === 'APPROVED')
        .reduce((sum, r) => sum + (r.total_days || 0), 0) || 0;

      const pendingDays = requests
        ?.filter(r => r.status === 'PENDING')
        .reduce((sum, r) => sum + (r.total_days || 0), 0) || 0;

      setQuota({
        totalDays,
        usedDays,
        pendingDays,
        availableDays: totalDays - usedDays - pendingDays,
        carryoverDays: 0, // TODO: Implement carryover tracking
      });
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  }, [userId]);

  // Check for overlapping requests
  const checkOverlap = useCallback(async (
    startDate: string,
    endDate: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      // ✅ FIXED: Correct date range overlap check
      // An overlap exists when:
      // - New request starts before or on the end of existing request AND
      // - New request ends after or on the start of existing request
      let query = supabase
        .from('leave_requests')
        .select('id, start_date, end_date, status')
        .eq('user_id', userId)
        .in('status', ['PENDING', 'APPROVED'])
        .lte('start_date', endDate)  // ✅ Existing starts before new ends
        .gte('end_date', startDate);  // ✅ Existing ends after new starts

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      // Try with new schema columns first
      try {
        const { data, error } = await query
          .is('withdrawn_at', null)
          .is('cancelled_at', null);

        if (error && error.code === '42703') {
          throw new Error('Column not found');
        }
        if (error) throw error;
        
        // ✅ DEBUG: Log overlap check results
        console.log('📊 Overlap check result:', {
          userId,
          startDate,
          endDate,
          foundRequests: data?.length || 0,
          requests: data?.map(r => ({ id: r.id, start: r.start_date, end: r.end_date, status: r.status }))
        });
        
        return (data || []).length > 0;
      } catch (innerError: any) {
        if (innerError.message === 'Column not found' || innerError.code === '42703') {
          // Fallback: query without withdrawn_at/cancelled_at
          const { data, error } = await query;
          if (error) throw error;
          return (data || []).length > 0;
        } else {
          throw innerError;
        }
      }
    } catch (error) {
      console.error('Error checking overlap:', error);
      return false;
    }
  }, [userId]);

  // Create leave request
  const createLeaveRequest = useCallback(async (
    input: CreateLeaveRequestInput
  ): Promise<{ success: boolean; error?: string; data?: LeaveRequest }> => {
    try {
      // Validate dates
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      if (start > end) {
        return { success: false, error: 'Enddatum muss nach Startdatum liegen' };
      }

      // Check for overlaps
      const hasOverlap = await checkOverlap(input.startDate, input.endDate);
      if (hasOverlap) {
        console.log('❌ Overlap detected:', { userId: input.userId, startDate: input.startDate, endDate: input.endDate });
        return { success: false, error: 'Überschneidung mit bestehendem Antrag' };
      }
      console.log('✅ No overlap found:', { userId: input.userId, startDate: input.startDate, endDate: input.endDate });

      // Calculate business days
      const businessDays = calculateBusinessDays(input.startDate, input.endDate, true);
      const totalDays = input.isHalfDay ? 0.5 : businessDays;

      // Check quota for vacation requests
      if (input.type === 'VACATION' && quota) {
        if (totalDays > quota.availableDays) {
          return {
            success: false,
            error: `Nicht genügend Urlaubstage verfügbar. Verfügbar: ${quota.availableDays} Tage, Angefragt: ${totalDays} Tage`
          };
        }
      }

      // Create request - auto-approve if admin creates for others
      const status = input.autoApprove ? 'APPROVED' : 'PENDING';
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: input.userId,
          start_date: input.startDate,
          end_date: input.endDate,
          type: input.type,
          status,
          comment: input.comment || null,
          total_days: totalDays,
          is_half_day: input.isHalfDay || false,
          file_url: input.fileUrl || null,
          federal_state: input.federalState || federalState || null,
          created_by: input.createdBy || input.userId,
          approved_by: input.autoApprove ? input.createdBy : null,
          approved_at: input.autoApprove ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Reload data
      await Promise.all([loadLeaveRequests(), loadQuota()]);

      // Send notification
      if (input.autoApprove) {
        toast.success('Urlaubsantrag wurde genehmigt und erstellt');
      } else {
        await sendNewRequestNotification(data);
        toast.success('Antrag erfolgreich eingereicht');
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      return { success: false, error: error.message || 'Fehler beim Erstellen des Antrags' };
    }
  }, [calculateBusinessDays, checkOverlap, quota, loadLeaveRequests, loadQuota, federalState]);

  // Withdraw pending request (user can cancel)
  const withdrawRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ withdrawn_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('user_id', userId)
        .eq('status', 'PENDING');

      if (error) throw error;

      await Promise.all([loadLeaveRequests(), loadQuota()]);
      toast.success('Antrag zurückgezogen');
      return true;
    } catch (error) {
      console.error('Error withdrawing request:', error);
      toast.error('Fehler beim Zurückziehen des Antrags');
      return false;
    }
  }, [userId, loadLeaveRequests, loadQuota]);

  // Approve request (admin/HR/TeamLead)
  const approveRequest = useCallback(async (
    requestId: string,
    approverId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'APPROVED',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send notification to user
      const { data: request } = await supabase
        .from('leave_requests')
        .select('user_id, type, start_date, end_date')
        .eq('id', requestId)
        .single();

      if (request) {
        await sendApprovalNotification(request.user_id, requestId, 'approved');
      }

      await loadLeaveRequests();
      toast.success('Antrag genehmigt');
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Fehler beim Genehmigen');
      return false;
    }
  }, [loadLeaveRequests]);

  // Reject request (admin/HR/TeamLead)
  const rejectRequest = useCallback(async (
    requestId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'REJECTED',
          rejection_reason: reason,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send notification to user
      const { data: request } = await supabase
        .from('leave_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

      if (request) {
        await sendApprovalNotification(request.user_id, requestId, 'rejected', reason);
      }

      await loadLeaveRequests();
      toast.success('Antrag abgelehnt');
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Fehler beim Ablehnen');
      return false;
    }
  }, [loadLeaveRequests]);

  // Cancel approved request (admin only, requires user confirmation)
  const cancelApprovedRequest = useCallback(async (
    requestId: string,
    cancelledBy: string,
    userConfirmed: boolean
  ): Promise<boolean> => {
    try {
      if (!userConfirmed) {
        return false;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update({
          cancelled_by: cancelledBy,
          cancelled_at: new Date().toISOString(),
          cancellation_confirmed: true,
          status: 'REJECTED', // Change status to rejected
        })
        .eq('id', requestId)
        .eq('status', 'APPROVED');

      if (error) throw error;

      await Promise.all([loadLeaveRequests(), loadQuota()]);
      toast.success('Genehmigter Antrag storniert');
      return true;
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Fehler beim Stornieren');
      return false;
    }
  }, [loadLeaveRequests, loadQuota]);

  // Helper: Send notification for new request
  const sendNewRequestNotification = async (request: LeaveRequest) => {
    try {
      // Get all admins/HR/TeamLeads
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ['ADMIN', 'SUPERADMIN', 'HR', 'TEAMLEAD'])
        .eq('is_active', true);

      if (!admins) return;

      const typeLabel = request.type === 'VACATION' ? 'Urlaub' : 'Krankmeldung';

      // Create notifications
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: 'Neuer Antrag',
        message: `${typeLabel}: ${new Date(request.start_date).toLocaleDateString('de-DE')} - ${new Date(request.end_date).toLocaleDateString('de-DE')}`,
        type: 'leave',
        read: false,
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Helper: Send approval/rejection notification
  const sendApprovalNotification = async (
    userId: string,
    requestId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    try {
      const title = status === 'approved' ? 'Antrag genehmigt' : 'Antrag abgelehnt';
      const message = status === 'approved'
        ? 'Ihr Urlaubsantrag wurde genehmigt'
        : `Ihr Urlaubsantrag wurde abgelehnt${reason ? `: ${reason}` : ''}`;

      await supabase.from('notifications').insert({
        user_id: userId,
        title,
        message,
        type: 'leave',
        read: false,
      });
    } catch (error) {
      console.error('Error sending approval notification:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadLeaveRequests();
      loadQuota();
    }
  }, [userId, loadLeaveRequests, loadQuota]);

  return {
    leaveRequests,
    quota,
    loading,
    createLeaveRequest,
    withdrawRequest,
    approveRequest,
    rejectRequest,
    cancelApprovedRequest,
    checkOverlap,
    calculateBusinessDays,
    isWeekend,
    isHoliday,
    reload: () => Promise.all([loadLeaveRequests(), loadQuota()]),
  };
}