/**
 * LEAVE SERVICE
 * =============
 * Handles all leave request operations
 * 
 * Replaces direct Supabase calls in stores for:
 * - Creating/updating/deleting leave requests
 * - Approving/rejecting leave requests
 * - Getting leave balances
 * - Leave request filtering
 */

import { ApiService } from './base/ApiService';
import { NotFoundError, ValidationError, ApiError, AuthorizationError } from './base/ApiError';
import type { LeaveRequest } from '../types/database';

export interface CreateLeaveRequestData {
  user_id: string;
  type: 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID';
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  days: number;
  reason?: string;
  half_day?: boolean;
}

export interface UpdateLeaveRequestData {
  type?: 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID';
  start_date?: string;
  end_date?: string;
  days?: number;
  reason?: string;
  half_day?: boolean;
}

export interface LeaveRequestFilters {
  user_id?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  type?: 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID';
  start_date?: string;
  end_date?: string;
}

export interface LeaveBalance {
  user_id: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  pending_days: number;
}

/**
 * LEAVE SERVICE
 * =============
 * Manages leave requests, approvals, and balances
 */
export class LeaveService extends ApiService {
  /**
   * Get leave request by ID
   */
  async getLeaveRequestById(requestId: string): Promise<LeaveRequest> {
    this.logRequest('getLeaveRequestById', 'LeaveService', { requestId });

    if (!requestId) {
      throw new ValidationError(
        'Request ID ist erforderlich',
        'LeaveService.getLeaveRequestById',
        { requestId: 'Request ID ist erforderlich' }
      );
    }

    try {
      const { data: request, error } = await this.supabase
        .from('leave_requests')
        .select(`
          *,
          users!leave_requests_user_id_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          approver:users!leave_requests_approved_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        throw new NotFoundError('Urlaubsantrag', 'LeaveService.getLeaveRequestById', error);
      }

      if (!request) {
        throw new NotFoundError('Urlaubsantrag', 'LeaveService.getLeaveRequestById');
      }

      this.logResponse('LeaveService.getLeaveRequestById', { type: request.type });
      return request as LeaveRequest;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LeaveService.getLeaveRequestById');
    }
  }

  /**
   * Get all leave requests with optional filters
   */
  async getAllLeaveRequests(filters?: LeaveRequestFilters): Promise<LeaveRequest[]> {
    this.logRequest('getAllLeaveRequests', 'LeaveService', { filters });

    try {
      let query = this.supabase
        .from('leave_requests')
        .select(`
          *,
          users!leave_requests_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            position,
            department_id
          ),
          approver:users!leave_requests_approved_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.start_date) {
          query = query.gte('start_date', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('end_date', filters.end_date);
        }
      }

      const { data: requests, error } = await query;

      if (error) {
        this.handleError(error, 'LeaveService.getAllLeaveRequests');
      }

      this.logResponse('LeaveService.getAllLeaveRequests', { count: requests?.length || 0 });
      return (requests || []) as LeaveRequest[];
    } catch (error: any) {
      this.handleError(error, 'LeaveService.getAllLeaveRequests');
    }
  }

  /**
   * Get leave requests for user
   */
  async getLeaveRequestsForUser(userId: string): Promise<LeaveRequest[]> {
    this.logRequest('getLeaveRequestsForUser', 'LeaveService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'LeaveService.getLeaveRequestsForUser',
        { userId: 'User ID ist erforderlich' }
      );
    }

    return await this.getAllLeaveRequests({ user_id: userId });
  }

  /**
   * Get pending leave requests
   */
  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    this.logRequest('getPendingLeaveRequests', 'LeaveService');

    return await this.getAllLeaveRequests({ status: 'PENDING' });
  }

  /**
   * Create new leave request
   */
  async createLeaveRequest(data: CreateLeaveRequestData): Promise<LeaveRequest> {
    this.logRequest('createLeaveRequest', 'LeaveService', data);

    // Validate input
    const errors: Record<string, string> = {};

    if (!data.user_id) errors.user_id = 'User ID ist erforderlich';
    if (!data.type) errors.type = 'Typ ist erforderlich';
    if (!data.start_date) errors.start_date = 'Startdatum ist erforderlich';
    if (!data.end_date) errors.end_date = 'Enddatum ist erforderlich';
    if (data.days === undefined || data.days <= 0) {
      errors.days = 'Tage müssen größer als 0 sein';
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'LeaveService.createLeaveRequest',
        errors
      );
    }

    // Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (startDate > endDate) {
      throw new ValidationError(
        'Startdatum muss vor Enddatum liegen',
        'LeaveService.createLeaveRequest',
        { start_date: 'Startdatum muss vor Enddatum liegen' }
      );
    }

    try {
      const { data: request, error } = await this.supabase
        .from('leave_requests')
        .insert({
          user_id: data.user_id,
          type: data.type,
          start_date: data.start_date,
          end_date: data.end_date,
          days: data.days,
          reason: data.reason || null,
          half_day: data.half_day || false,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LeaveService.createLeaveRequest');
      }

      if (!request) {
        throw new ApiError(
          'Urlaubsantrag konnte nicht erstellt werden',
          'CREATION_FAILED',
          'LeaveService.createLeaveRequest'
        );
      }

      this.logResponse('LeaveService.createLeaveRequest', { id: request.id });
      return request as LeaveRequest;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'LeaveService.createLeaveRequest');
    }
  }

  /**
   * Update leave request
   */
  async updateLeaveRequest(
    requestId: string,
    updates: UpdateLeaveRequestData
  ): Promise<LeaveRequest> {
    this.logRequest('updateLeaveRequest', 'LeaveService', { requestId, updates });

    if (!requestId) {
      throw new ValidationError(
        'Request ID ist erforderlich',
        'LeaveService.updateLeaveRequest',
        { requestId: 'Request ID ist erforderlich' }
      );
    }

    try {
      const { data: request, error } = await this.supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LeaveService.updateLeaveRequest');
      }

      if (!request) {
        throw new NotFoundError('Urlaubsantrag', 'LeaveService.updateLeaveRequest');
      }

      this.logResponse('LeaveService.updateLeaveRequest', { id: request.id });
      return request as LeaveRequest;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LeaveService.updateLeaveRequest');
    }
  }

  /**
   * Approve leave request
   */
  async approveLeaveRequest(
    requestId: string,
    approverId: string
  ): Promise<LeaveRequest> {
    this.logRequest('approveLeaveRequest', 'LeaveService', { requestId, approverId });

    if (!requestId || !approverId) {
      throw new ValidationError(
        'Request ID und Approver ID sind erforderlich',
        'LeaveService.approveLeaveRequest',
        {
          requestId: !requestId ? 'Request ID ist erforderlich' : '',
          approverId: !approverId ? 'Approver ID ist erforderlich' : '',
        }
      );
    }

    try {
      const { data: request, error } = await this.supabase
        .from('leave_requests')
        .update({
          status: 'APPROVED',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LeaveService.approveLeaveRequest');
      }

      if (!request) {
        throw new NotFoundError('Urlaubsantrag', 'LeaveService.approveLeaveRequest');
      }

      this.logResponse('LeaveService.approveLeaveRequest', { id: request.id });
      return request as LeaveRequest;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LeaveService.approveLeaveRequest');
    }
  }

  /**
   * Reject leave request
   */
  async rejectLeaveRequest(
    requestId: string,
    approverId: string,
    reason?: string
  ): Promise<LeaveRequest> {
    this.logRequest('rejectLeaveRequest', 'LeaveService', { requestId, approverId });

    if (!requestId || !approverId) {
      throw new ValidationError(
        'Request ID und Approver ID sind erforderlich',
        'LeaveService.rejectLeaveRequest',
        {
          requestId: !requestId ? 'Request ID ist erforderlich' : '',
          approverId: !approverId ? 'Approver ID ist erforderlich' : '',
        }
      );
    }

    try {
      const { data: request, error } = await this.supabase
        .from('leave_requests')
        .update({
          status: 'REJECTED',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LeaveService.rejectLeaveRequest');
      }

      if (!request) {
        throw new NotFoundError('Urlaubsantrag', 'LeaveService.rejectLeaveRequest');
      }

      this.logResponse('LeaveService.rejectLeaveRequest', { id: request.id });
      return request as LeaveRequest;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LeaveService.rejectLeaveRequest');
    }
  }

  /**
   * Delete leave request
   */
  async deleteLeaveRequest(requestId: string): Promise<void> {
    this.logRequest('deleteLeaveRequest', 'LeaveService', { requestId });

    if (!requestId) {
      throw new ValidationError(
        'Request ID ist erforderlich',
        'LeaveService.deleteLeaveRequest',
        { requestId: 'Request ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('leave_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        this.handleError(error, 'LeaveService.deleteLeaveRequest');
      }

      this.logResponse('LeaveService.deleteLeaveRequest', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LeaveService.deleteLeaveRequest');
    }
  }

  /**
   * Get leave balance for user
   */
  async getLeaveBalance(userId: string, year?: number): Promise<LeaveBalance> {
    this.logRequest('getLeaveBalance', 'LeaveService', { userId, year });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'LeaveService.getLeaveBalance',
        { userId: 'User ID ist erforderlich' }
      );
    }

    const currentYear = year || new Date().getFullYear();

    try {
      // Get user's total vacation days
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('vacation_days')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        this.handleError(userError || new Error('User not found'), 'LeaveService.getLeaveBalance');
      }

      const totalDays = user?.vacation_days || 30;

      // Get approved leave requests for the year
      const { data: approvedRequests, error: requestsError } = await this.supabase
        .from('leave_requests')
        .select('days')
        .eq('user_id', userId)
        .eq('status', 'APPROVED')
        .eq('type', 'VACATION')
        .gte('start_date', `${currentYear}-01-01`)
        .lte('end_date', `${currentYear}-12-31`);

      if (requestsError) {
        this.handleError(requestsError, 'LeaveService.getLeaveBalance');
      }

      const usedDays = (approvedRequests || []).reduce(
        (sum, req) => sum + (req.days || 0),
        0
      );

      // Get pending leave requests for the year
      const { data: pendingRequests, error: pendingError } = await this.supabase
        .from('leave_requests')
        .select('days')
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .eq('type', 'VACATION')
        .gte('start_date', `${currentYear}-01-01`)
        .lte('end_date', `${currentYear}-12-31`);

      if (pendingError) {
        this.handleError(pendingError, 'LeaveService.getLeaveBalance');
      }

      const pendingDays = (pendingRequests || []).reduce(
        (sum, req) => sum + (req.days || 0),
        0
      );

      const balance: LeaveBalance = {
        user_id: userId,
        total_days: totalDays,
        used_days: usedDays,
        remaining_days: totalDays - usedDays,
        pending_days: pendingDays,
      };

      this.logResponse('LeaveService.getLeaveBalance', balance);
      return balance;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LeaveService.getLeaveBalance');
    }
  }

  /**
   * Get leave requests for date range
   */
  async getLeaveRequestsForDateRange(
    startDate: string,
    endDate: string
  ): Promise<LeaveRequest[]> {
    this.logRequest('getLeaveRequestsForDateRange', 'LeaveService', {
      startDate,
      endDate,
    });

    if (!startDate || !endDate) {
      throw new ValidationError(
        'Startdatum und Enddatum sind erforderlich',
        'LeaveService.getLeaveRequestsForDateRange',
        {
          startDate: !startDate ? 'Startdatum ist erforderlich' : '',
          endDate: !endDate ? 'Enddatum ist erforderlich' : '',
        }
      );
    }

    return await this.getAllLeaveRequests({
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Check if user has overlapping leave requests
   */
  async hasOverlappingLeaveRequests(
    userId: string,
    startDate: string,
    endDate: string,
    excludeRequestId?: string
  ): Promise<boolean> {
    this.logRequest('hasOverlappingLeaveRequests', 'LeaveService', {
      userId,
      startDate,
      endDate,
      excludeRequestId,
    });

    try {
      let query = this.supabase
        .from('leave_requests')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['PENDING', 'APPROVED'])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId);
      }

      const { data: requests, error } = await query;

      if (error) {
        this.handleError(error, 'LeaveService.hasOverlappingLeaveRequests');
      }

      return (requests || []).length > 0;
    } catch (error: any) {
      console.error('Error checking overlapping leave requests:', error);
      return false;
    }
  }
}
