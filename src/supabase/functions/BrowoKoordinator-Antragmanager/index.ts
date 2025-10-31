/**
 * BrowoKoordinator - Antragmanager Edge Function
 * Version: 1.0.0
 * 
 * Handles leave request management (Urlaubsanträge) with approval workflow
 * 
 * Routes:
 * - GET    /health                - Health check (NO AUTH)
 * - POST   /submit                - Submit leave request (AUTH REQUIRED)
 * - GET    /my-requests           - Get user's leave requests (AUTH REQUIRED)
 * - GET    /pending               - Get pending approvals for approvers (APPROVER ROLE)
 * - POST   /approve/:id           - Approve leave request (APPROVER ROLE)
 * - POST   /reject/:id            - Reject leave request (APPROVER ROLE)
 * - GET    /team-requests         - Get team leave requests (TEAMLEAD/HR)
 * - DELETE /withdraw/:id          - Withdraw pending request (AUTH REQUIRED)
 * - POST   /cancel/:id            - Cancel approved request (TEAMLEAD/HR)
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== SUPABASE CLIENT ====================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const getSupabaseUserClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
};

// ==================== LOGGING ====================

app.use('*', logger(console.log));

// ==================== CORS ====================

app.use(
  '/*',
  cors({
    origin: '*',
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'apikey'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
  })
);

// ==================== AUTH MIDDLEWARE ====================

async function verifyAuth(authHeader: string | null): Promise<{ id: string; email?: string; role?: string; isTeamLead?: boolean } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = getSupabaseUserClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Antragmanager] Auth error:', error);
      return null;
    }

    // Get user role from users table
    const { data: userData } = await getSupabaseClient()
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check if user is a team lead in ANY team (PRIMARY, BACKUP, or BACKUP_BACKUP)
    const { data: teamLeadData } = await getSupabaseClient()
      .from('team_members')
      .select('role, priority_tag')
      .eq('user_id', user.id)
      .eq('role', 'TEAMLEAD')
      .in('priority_tag', ['PRIMARY', 'BACKUP', 'BACKUP_BACKUP']);

    const isTeamLead = teamLeadData && teamLeadData.length > 0;

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
      isTeamLead: isTeamLead,
    };
  } catch (error) {
    console.error('[Antragmanager] Auth verification failed:', error);
    return null;
  }
}

function isApprover(role?: string, isTeamLead?: boolean): boolean {
  // Global approver roles
  if (role && ['TEAMLEAD', 'HR_MANAGER', 'HR_SUPERADMIN'].includes(role)) {
    return true;
  }
  // Team-level approver (TEAMLEAD in any team with PRIMARY, BACKUP, or BACKUP_BACKUP)
  if (isTeamLead) {
    return true;
  }
  return false;
}

function isHR(role?: string): boolean {
  if (!role) return false;
  return ['HR_MANAGER', 'HR_SUPERADMIN'].includes(role);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate business days between two dates (excluding weekends)
 */
function calculateBusinessDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let businessDays = 0;

  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // Count weekdays (Monday = 1 to Friday = 5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return businessDays;
}

/**
 * Get approver for a leave request based on team hierarchy
 */
async function getApprover(userId: string, supabase: any): Promise<string | null> {
  // Get user's team
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('team_id, teams(team_lead)')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (!teamMember) {
    console.log('[Antragmanager] User not in any team, no approver found');
    return null;
  }

  const teamLead = teamMember.teams?.team_lead;
  
  // Don't allow self-approval
  if (teamLead === userId) {
    console.log('[Antragmanager] User is team lead, finding HR approver');
    // Find HR Manager/Superadmin for approval
    const { data: hrUser } = await supabase
      .from('users')
      .select('id')
      .in('role', ['HR_MANAGER', 'HR_SUPERADMIN'])
      .limit(1)
      .single();
    
    return hrUser?.id || null;
  }

  return teamLead || null;
}

// ==================== ROUTES ====================

// Health Check (NO AUTH)
app.get('/BrowoKoordinator-Antragmanager/health', (c) => {
  return c.json({
    status: 'ok',
    function: 'BrowoKoordinator-Antragmanager',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    purpose: 'Leave Request Management & Approval Workflow',
  });
});

// ==================== SUBMIT LEAVE REQUEST ====================
app.post('/BrowoKoordinator-Antragmanager/submit', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Antragmanager] Unauthorized submit request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { 
      type, 
      start_date, 
      end_date, 
      comment, 
      is_half_day = false,
      federal_state = 'NRW'
    } = body;

    if (!type || !start_date || !end_date) {
      return c.json({ 
        error: 'Missing required fields: type, start_date, end_date' 
      }, 400);
    }

    console.log('[Antragmanager] Submit leave request:', { 
      userId: user.id, 
      type, 
      start_date, 
      end_date,
      is_half_day 
    });

    const supabase = getSupabaseClient();

    // Calculate days
    let days: number;
    if (is_half_day) {
      days = 0.5;
    } else {
      days = calculateBusinessDays(start_date, end_date);
    }

    // Get approver
    const approverId = await getApprover(user.id, supabase);
    
    if (!approverId) {
      console.warn('[Antragmanager] No approver found for user');
      return c.json({ 
        error: 'No approver found. Please contact HR to set up your team structure.' 
      }, 400);
    }

    // Create leave request
    const { data: leaveRequest, error } = await supabase
      .from('leave_requests')
      .insert({
        user_id: user.id,
        type,
        start_date,
        end_date,
        days,
        comment: comment || null,
        status: 'PENDING',
        approved_by: approverId,
        is_half_day,
        federal_state,
        created_by: user.id,
      })
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, first_name, last_name, email),
        approved_by_user:users!leave_requests_approved_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('[Antragmanager] Submit failed:', error);
      return c.json({ 
        error: 'Failed to submit leave request', 
        details: error.message 
      }, 500);
    }

    console.log('[Antragmanager] Leave request created:', leaveRequest.id);

    // TODO: Send notification to approver
    // await sendNotification(approverId, 'NEW_LEAVE_REQUEST', leaveRequest);

    return c.json({
      success: true,
      leave_request: leaveRequest,
      message: 'Leave request submitted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Antragmanager] Submit error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== MY REQUESTS ====================
app.get('/BrowoKoordinator-Antragmanager/my-requests', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Antragmanager] Unauthorized my-requests request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const status = c.req.query('status'); // Filter by status (optional)
    const year = c.req.query('year'); // Filter by year (optional)

    console.log('[Antragmanager] Get my requests:', { userId: user.id, status, year });

    const supabase = getSupabaseClient();

    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
        approved_by_user:users!leave_requests_approved_by_fkey(id, first_name, last_name, email)
      `)
      .eq('user_id', user.id)
      .is('withdrawn_at', null) // Exclude withdrawn requests
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (year) {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      query = query.gte('start_date', startOfYear).lte('start_date', endOfYear);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('[Antragmanager] My requests error:', error);
      return c.json({ 
        error: 'Failed to fetch leave requests', 
        details: error.message 
      }, 500);
    }

    console.log('[Antragmanager] My requests fetched:', requests?.length || 0);

    return c.json({
      success: true,
      requests: requests || [],
      count: requests?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Antragmanager] My requests error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== PENDING APPROVALS ====================
app.get('/BrowoKoordinator-Antragmanager/pending', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Antragmanager] Unauthorized pending request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isApprover(user.role, user.isTeamLead)) {
      return c.json({ 
        error: 'Insufficient permissions - Teamlead or HR required' 
      }, 403);
    }

    console.log('[Antragmanager] Get pending approvals:', { userId: user.id, role: user.role, isTeamLead: user.isTeamLead });

    const supabase = getSupabaseClient();

    let pending = [];
    let error = null;

    // If user is a team lead, get requests from their teams
    if (user.isTeamLead && !isHR(user.role)) {
      // Get all team IDs where user is a team lead
      const { data: userTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'TEAMLEAD');

      const teamIds = userTeams?.map(t => t.team_id) || [];

      if (teamIds.length > 0) {
        // Get pending requests from team members
        const { data: teamMemberIds } = await supabase
          .from('team_members')
          .select('user_id')
          .in('team_id', teamIds)
          .eq('role', 'MEMBER');

        const memberIds = teamMemberIds?.map(m => m.user_id) || [];

        if (memberIds.length > 0) {
          const result = await supabase
            .from('leave_requests')
            .select(`
              *,
              user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
              approved_by_user:users!leave_requests_approved_by_fkey(id, first_name, last_name, email)
            `)
            .in('user_id', memberIds)
            .eq('status', 'PENDING')
            .is('withdrawn_at', null)
            .order('created_at', { ascending: true });
          
          pending = result.data || [];
          error = result.error;
        }
      }
    } else {
      // Original logic: Get pending requests where this user is the approver
      const result = await supabase
        .from('leave_requests')
        .select(`
          *,
          user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
          approved_by_user:users!leave_requests_approved_by_fkey(id, first_name, last_name, email)
        `)
        .eq('approved_by', user.id)
        .eq('status', 'PENDING')
        .is('withdrawn_at', null)
        .order('created_at', { ascending: true });
      
      pending = result.data || [];
      error = result.error;
    }

    if (error) {
      console.error('[Antragmanager] Pending error:', error);
      return c.json({ 
        error: 'Failed to fetch pending approvals', 
        details: error.message 
      }, 500);
    }

    console.log('[Antragmanager] Pending approvals:', pending?.length || 0);

    return c.json({
      success: true,
      pending: pending || [],
      count: pending?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Antragmanager] Pending error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== APPROVE REQUEST ====================
app.post('/BrowoKoordinator-Antragmanager/approve/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Antragmanager] Unauthorized approve request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isApprover(user.role, user.isTeamLead)) {
      return c.json({ 
        error: 'Insufficient permissions - Teamlead or HR required' 
      }, 403);
    }

    const requestId = c.req.param('id');
    const body = await c.req.json();
    const { comment } = body;

    console.log('[Antragmanager] Approve request:', { userId: user.id, requestId, comment });

    const supabase = getSupabaseClient();

    // Get the leave request
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !leaveRequest) {
      console.error('[Antragmanager] Request not found:', fetchError);
      return c.json({ 
        error: 'Leave request not found', 
        details: fetchError?.message 
      }, 404);
    }

    // Check if user is the approver
    if (leaveRequest.approved_by !== user.id && !isHR(user.role)) {
      console.warn('[Antragmanager] User not authorized to approve this request');
      return c.json({ 
        error: 'You are not authorized to approve this request' 
      }, 403);
    }

    // Check if already processed
    if (leaveRequest.status !== 'PENDING') {
      return c.json({ 
        error: `Request already ${leaveRequest.status.toLowerCase()}` 
      }, 400);
    }

    // Approve the request
    const { data: approved, error: updateError } = await supabase
      .from('leave_requests')
      .update({
        status: 'APPROVED',
        approved_at: new Date().toISOString(),
        approver_comment: comment || null,
      })
      .eq('id', requestId)
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
        approved_by_user:users!leave_requests_approved_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('[Antragmanager] Approve failed:', updateError);
      return c.json({ 
        error: 'Failed to approve request', 
        details: updateError.message 
      }, 500);
    }

    console.log('[Antragmanager] Request approved:', requestId);

    // TODO: Send notification to requester
    // await sendNotification(leaveRequest.user_id, 'LEAVE_REQUEST_APPROVED', approved);

    return c.json({
      success: true,
      leave_request: approved,
      message: 'Leave request approved successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Antragmanager] Approve error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== REJECT REQUEST ====================
app.post('/BrowoKoordinator-Antragmanager/reject/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Antragmanager] Unauthorized reject request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isApprover(user.role, user.isTeamLead)) {
      return c.json({ 
        error: 'Insufficient permissions - Teamlead or HR required' 
      }, 403);
    }

    const requestId = c.req.param('id');
    const body = await c.req.json();
    const { reason } = body;

    if (!reason) {
      return c.json({ error: 'Rejection reason is required' }, 400);
    }

    console.log('[Antragmanager] Reject request:', { userId: user.id, requestId, reason });

    const supabase = getSupabaseClient();

    // Get the leave request
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !leaveRequest) {
      console.error('[Antragmanager] Request not found:', fetchError);
      return c.json({ 
        error: 'Leave request not found', 
        details: fetchError?.message 
      }, 404);
    }

    // Check if user is the approver
    if (leaveRequest.approved_by !== user.id && !isHR(user.role)) {
      console.warn('[Antragmanager] User not authorized to reject this request');
      return c.json({ 
        error: 'You are not authorized to reject this request' 
      }, 403);
    }

    // Check if already processed
    if (leaveRequest.status !== 'PENDING') {
      return c.json({ 
        error: `Request already ${leaveRequest.status.toLowerCase()}` 
      }, 400);
    }

    // Reject the request
    const { data: rejected, error: updateError } = await supabase
      .from('leave_requests')
      .update({
        status: 'REJECTED',
        rejection_reason: reason,
      })
      .eq('id', requestId)
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
        approved_by_user:users!leave_requests_approved_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('[Antragmanager] Reject failed:', updateError);
      return c.json({ 
        error: 'Failed to reject request', 
        details: updateError.message 
      }, 500);
    }

    console.log('[Antragmanager] Request rejected:', requestId);

    // TODO: Send notification to requester
    // await sendNotification(leaveRequest.user_id, 'LEAVE_REQUEST_REJECTED', rejected);

    return c.json({
      success: true,
      leave_request: rejected,
      message: 'Leave request rejected',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Antragmanager] Reject error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== TEAM REQUESTS ====================
app.get('/BrowoKoordinator-Antragmanager/team-requests', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Antragmanager] Unauthorized team-requests request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isApprover(user.role, user.isTeamLead)) {
      return c.json({ 
        error: 'Insufficient permissions - Teamlead or HR required' 
      }, 403);
    }

    const status = c.req.query('status'); // Filter by status (optional)
    const year = c.req.query('year'); // Filter by year (optional)

    console.log('[Antragmanager] Get team requests:', { userId: user.id, role: user.role, isTeamLead: user.isTeamLead, status, year });

    const supabase = getSupabaseClient();

    let requests = [];
    let error = null;

    // HR can see all requests
    if (isHR(user.role)) {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
          approved_by_user:users!leave_requests_approved_by_fkey(id, first_name, last_name, email)
        `)
        .is('withdrawn_at', null)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (year) {
        const startOfYear = `${year}-01-01`;
        const endOfYear = `${year}-12-31`;
        query = query.gte('start_date', startOfYear).lte('start_date', endOfYear);
      }

      const result = await query;
      requests = result.data || [];
      error = result.error;
    } 
    // Teamleads only see their team's requests
    else if (user.isTeamLead) {
      // Get all team IDs where user is a team lead
      const { data: userTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'TEAMLEAD');

      const teamIds = userTeams?.map(t => t.team_id) || [];

      if (teamIds.length > 0) {
        // Get team members
        const { data: teamMemberIds } = await supabase
          .from('team_members')
          .select('user_id')
          .in('team_id', teamIds)
          .eq('role', 'MEMBER');

        const memberIds = teamMemberIds?.map(m => m.user_id) || [];

        if (memberIds.length > 0) {
          let query = supabase
            .from('leave_requests')
            .select(`
              *,
              user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
              approved_by_user:users!leave_requests_approved_by_fkey(id, first_name, last_name, email)
            `)
            .in('user_id', memberIds)
            .is('withdrawn_at', null)
            .order('created_at', { ascending: false });

          if (status) {
            query = query.eq('status', status);
          }

          if (year) {
            const startOfYear = `${year}-01-01`;
            const endOfYear = `${year}-12-31`;
            query = query.gte('start_date', startOfYear).lte('start_date', endOfYear);
          }

          const result = await query;
          requests = result.data || [];
          error = result.error;
        }
      }
    }

    if (error) {
      console.error('[Antragmanager] Team requests error:', error);
      return c.json({ 
        error: 'Failed to fetch team requests', 
        details: error.message 
      }, 500);
    }

    console.log('[Antragmanager] Team requests fetched:', requests?.length || 0);

    return c.json({
      success: true,
      requests: requests || [],
      count: requests?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Antragmanager] Team requests error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== WITHDRAW REQUEST ====================
app.delete('/BrowoKoordinator-Antragmanager/withdraw/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Antragmanager] Unauthorized withdraw request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const requestId = c.req.param('id');

    console.log('[Antragmanager] Withdraw request:', { userId: user.id, requestId });

    const supabase = getSupabaseClient();

    // Get the leave request
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !leaveRequest) {
      console.error('[Antragmanager] Request not found:', fetchError);
      return c.json({ 
        error: 'Leave request not found', 
        details: fetchError?.message 
      }, 404);
    }

    // Check if user owns this request
    if (leaveRequest.user_id !== user.id) {
      console.warn('[Antragmanager] User not authorized to withdraw this request');
      return c.json({ 
        error: 'You can only withdraw your own requests' 
      }, 403);
    }

    // Can only withdraw pending requests
    if (leaveRequest.status !== 'PENDING') {
      return c.json({ 
        error: 'Can only withdraw pending requests' 
      }, 400);
    }

    // Already withdrawn
    if (leaveRequest.withdrawn_at) {
      return c.json({ 
        error: 'Request already withdrawn' 
      }, 400);
    }

    // Withdraw the request
    const { data: withdrawn, error: updateError } = await supabase
      .from('leave_requests')
      .update({
        withdrawn_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('[Antragmanager] Withdraw failed:', updateError);
      return c.json({ 
        error: 'Failed to withdraw request', 
        details: updateError.message 
      }, 500);
    }

    console.log('[Antragmanager] Request withdrawn:', requestId);

    return c.json({
      success: true,
      leave_request: withdrawn,
      message: 'Leave request withdrawn successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Antragmanager] Withdraw error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== CANCEL APPROVED REQUEST ====================
app.post('/BrowoKoordinator-Antragmanager/cancel/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Antragmanager] Unauthorized cancel request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isApprover(user.role, user.isTeamLead)) {
      return c.json({ 
        error: 'Insufficient permissions - Teamlead or HR required' 
      }, 403);
    }

    const requestId = c.req.param('id');
    const body = await c.req.json();
    const { reason } = body;

    if (!reason) {
      return c.json({ error: 'Cancellation reason is required' }, 400);
    }

    console.log('[Antragmanager] Cancel request:', { userId: user.id, requestId, reason });

    const supabase = getSupabaseClient();

    // Get the leave request
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !leaveRequest) {
      console.error('[Antragmanager] Request not found:', fetchError);
      return c.json({ 
        error: 'Leave request not found', 
        details: fetchError?.message 
      }, 404);
    }

    // Can only cancel approved requests
    if (leaveRequest.status !== 'APPROVED') {
      return c.json({ 
        error: 'Can only cancel approved requests' 
      }, 400);
    }

    // Already cancelled
    if (leaveRequest.cancelled_at) {
      return c.json({ 
        error: 'Request already cancelled' 
      }, 400);
    }

    // Cancel the request
    const { data: cancelled, error: updateError } = await supabase
      .from('leave_requests')
      .update({
        status: 'REJECTED',
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', requestId)
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
        cancelled_by_user:users!leave_requests_cancelled_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('[Antragmanager] Cancel failed:', updateError);
      return c.json({ 
        error: 'Failed to cancel request', 
        details: updateError.message 
      }, 500);
    }

    console.log('[Antragmanager] Request cancelled:', requestId);

    // TODO: Send notification to requester
    // await sendNotification(leaveRequest.user_id, 'LEAVE_REQUEST_CANCELLED', cancelled);

    return c.json({
      success: true,
      leave_request: cancelled,
      message: 'Leave request cancelled',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Antragmanager] Cancel error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
