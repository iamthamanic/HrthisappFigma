/**
 * BrowoKoordinator - Benefits Edge Function
 * Version: 1.0.0
 * 
 * Handles benefits system including coin shop and benefit requests
 * 
 * Routes:
 * - GET  /health                - Health check (NO AUTH)
 * - GET  /browse                - Browse available benefits (AUTH REQUIRED)
 * - POST /request               - Create benefit request (AUTH REQUIRED)
 * - GET  /my-benefits           - Get user's benefits (AUTH REQUIRED)
 * - GET  /my-requests           - Get user's requests (AUTH REQUIRED)
 * - POST /approve/:id           - Approve benefit request (HR/ADMIN)
 * - POST /reject/:id            - Reject benefit request (HR/ADMIN)
 * - GET  /pending               - Get pending benefit requests (HR/ADMIN)
 * - POST /shop/purchase         - Purchase from coin shop (AUTH REQUIRED)
 * - GET  /shop/items            - Get available shop items (AUTH REQUIRED)
 * - GET  /coins/balance         - Get user's coin balance (AUTH REQUIRED)
 * - GET  /coins/transactions    - Get user's coin transactions (AUTH REQUIRED)
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';

// ==================== INLINE TRIGGER HELPER ====================
const TRIGGER_TYPES = {
  BENEFIT_ASSIGNED: 'BENEFIT_ASSIGNED',
  BENEFIT_REMOVED: 'BENEFIT_REMOVED',
};

async function triggerWorkflows(
  triggerType: string,
  context: Record<string, any>,
  authToken: string
): Promise<void> {
  try {
    const projectId = Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0];
    if (!projectId) return;

    console.log(`🔔 Triggering workflows for event: ${triggerType}`);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/trigger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({ trigger_type: triggerType, context }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.warn(`[triggerWorkflows] Failed:`, error);
      return;
    }

    const result = await response.json();
    console.log(`✅ Workflows triggered:`, result);
  } catch (error) {
    console.error(`[triggerWorkflows] Error:`, error);
  }
}

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

async function verifyAuth(authHeader: string | null): Promise<{ id: string; email?: string; role?: string; organization_id?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = getSupabaseUserClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Benefits] Auth error:', error);
      return null;
    }

    // Get user details from users table
    const { data: userData } = await getSupabaseClient()
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
      organization_id: userData?.organization_id,
    };
  } catch (error) {
    console.error('[Benefits] Auth verification failed:', error);
    return null;
  }
}

function isHROrAdmin(role?: string): boolean {
  if (!role) return false;
  return ['HR_MANAGER', 'HR_SUPERADMIN'].includes(role);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate user's coin balance
 */
async function getUserCoinBalance(userId: string): Promise<number> {
  const supabase = getSupabaseClient();

  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('amount, type')
    .eq('user_id', userId);

  if (!transactions) return 0;

  let balance = 0;
  transactions.forEach((t: any) => {
    if (t.type === 'EARNED') {
      balance += t.amount;
    } else if (t.type === 'SPENT') {
      balance -= t.amount;
    }
  });

  return Math.max(0, balance);
}

/**
 * Check if user is eligible for benefit
 */
async function checkEligibility(userId: string, benefit: any): Promise<{ eligible: boolean; reason?: string }> {
  const supabase = getSupabaseClient();

  // Check eligibility_months (employment duration)
  if (benefit.eligibility_months > 0) {
    const { data: user } = await supabase
      .from('users')
      .select('start_date')
      .eq('id', userId)
      .single();

    if (user && user.start_date) {
      const startDate = new Date(user.start_date);
      const monthsEmployed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      if (monthsEmployed < benefit.eligibility_months) {
        return {
          eligible: false,
          reason: `Mindestens ${benefit.eligibility_months} Monate Betriebszugehörigkeit erforderlich`,
        };
      }
    }
  }

  // Check max_users limit
  if (benefit.max_users && benefit.current_users >= benefit.max_users) {
    return {
      eligible: false,
      reason: 'Maximale Anzahl an Teilnehmern erreicht',
    };
  }

  return { eligible: true };
}

/**
 * Send notification
 */
async function sendNotification(userId: string, title: string, message: string, type: string, link?: string, data?: any) {
  try {
    await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/BrowoKoordinator-Notification/create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          title,
          message,
          type,
          link,
          data,
        }),
      }
    );
  } catch (err) {
    console.error('[Benefits] Failed to send notification:', err);
  }
}

// ==================== ROUTES ====================

// Health Check (NO AUTH)
app.get('/BrowoKoordinator-Benefits/health', (c) => {
  return c.json({
    status: 'ok',
    function: 'BrowoKoordinator-Benefits',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    purpose: 'Benefits System & Coin Shop Management',
  });
});

// ==================== BROWSE BENEFITS ====================
app.get('/BrowoKoordinator-Benefits/browse', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized browse request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');

    console.log('[Benefits] Browse benefits:', { userId: user.id, category });

    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
      .from('benefits')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_active', true)
      .order('category')
      .order('title');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: benefits, error: benefitsError } = await query;

    if (benefitsError) {
      console.error('[Benefits] Browse error:', benefitsError);
      return c.json({ 
        error: 'Failed to fetch benefits', 
        details: benefitsError.message 
      }, 500);
    }

    // Get user's existing benefits to mark which are already requested/approved
    const { data: userBenefits } = await supabase
      .from('user_benefits')
      .select('benefit_id, status')
      .eq('user_id', user.id);

    const userBenefitMap = new Map();
    userBenefits?.forEach((ub: any) => {
      userBenefitMap.set(ub.benefit_id, ub.status);
    });

    // Enrich benefits with user status
    const enrichedBenefits = benefits?.map((benefit: any) => ({
      ...benefit,
      user_status: userBenefitMap.get(benefit.id) || null,
    }));

    console.log('[Benefits] Benefits fetched:', enrichedBenefits?.length || 0);

    return c.json({
      success: true,
      benefits: enrichedBenefits || [],
      count: enrichedBenefits?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Browse error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== REQUEST BENEFIT ====================
app.post('/BrowoKoordinator-Benefits/request', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { benefit_id, notes } = body;

    if (!benefit_id) {
      return c.json({ error: 'Missing required field: benefit_id' }, 400);
    }

    console.log('[Benefits] Request benefit:', { userId: user.id, benefit_id });

    const supabase = getSupabaseClient();

    // Get benefit details
    const { data: benefit, error: benefitError } = await supabase
      .from('benefits')
      .select('*')
      .eq('id', benefit_id)
      .single();

    if (benefitError || !benefit) {
      console.error('[Benefits] Benefit not found:', benefitError);
      return c.json({ 
        error: 'Benefit not found', 
        details: benefitError?.message 
      }, 404);
    }

    // Check if benefit is request-only or allows both
    if (benefit.purchase_type === 'COINS_ONLY') {
      return c.json({ 
        error: 'This benefit can only be purchased with coins',
        benefit_id,
      }, 400);
    }

    // Check eligibility
    const eligibility = await checkEligibility(user.id, benefit);
    if (!eligibility.eligible) {
      return c.json({ 
        error: 'Not eligible for this benefit',
        reason: eligibility.reason,
      }, 403);
    }

    // Check if user already has this benefit
    const { data: existing } = await supabase
      .from('user_benefits')
      .select('*')
      .eq('user_id', user.id)
      .eq('benefit_id', benefit_id)
      .single();

    if (existing) {
      return c.json({ 
        error: 'You already have a request for this benefit',
        status: existing.status,
      }, 409);
    }

    // Create benefit request
    const { data: userBenefit, error: createError } = await supabase
      .from('user_benefits')
      .insert({
        user_id: user.id,
        benefit_id,
        status: 'PENDING',
        notes,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('[Benefits] Create request failed:', createError);
      return c.json({ 
        error: 'Failed to create benefit request', 
        details: createError.message 
      }, 500);
    }

    console.log('[Benefits] Request created:', userBenefit.id);

    // Send notification to HR/Admin
    // (Find all HR/Admin users in organization and notify them)
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', user.organization_id)
      .in('role', ['HR_MANAGER', 'HR_SUPERADMIN']);

    if (admins) {
      for (const admin of admins) {
        await sendNotification(
          admin.id,
          'Neue Benefit-Anfrage',
          `${user.email} hat ${benefit.title} angefragt`,
          'BENEFIT_REQUEST',
          '/admin/benefits',
          {
            request_id: userBenefit.id,
            benefit_id,
            requester_id: user.id,
          }
        );
      }
    }

    return c.json({
      success: true,
      request: userBenefit,
      message: 'Benefit request created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Request error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GET MY BENEFITS ====================
app.get('/BrowoKoordinator-Benefits/my-benefits', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized my-benefits request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Benefits] Get my benefits:', { userId: user.id });

    const supabase = getSupabaseClient();

    // Get user's benefits (only APPROVED or ACTIVE)
    const { data: userBenefits, error } = await supabase
      .from('user_benefits')
      .select('*, benefits(*)')
      .eq('user_id', user.id)
      .in('status', ['APPROVED', 'ACTIVE'])
      .order('approved_at', { ascending: false });

    if (error) {
      console.error('[Benefits] My benefits error:', error);
      return c.json({ 
        error: 'Failed to fetch benefits', 
        details: error.message 
      }, 500);
    }

    console.log('[Benefits] My benefits fetched:', userBenefits?.length || 0);

    return c.json({
      success: true,
      benefits: userBenefits || [],
      count: userBenefits?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] My benefits error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GET MY REQUESTS ====================
app.get('/BrowoKoordinator-Benefits/my-requests', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized my-requests request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Benefits] Get my requests:', { userId: user.id });

    const supabase = getSupabaseClient();

    // Get user's requests (all statuses)
    const { data: requests, error } = await supabase
      .from('user_benefits')
      .select('*, benefits(*)')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('[Benefits] My requests error:', error);
      return c.json({ 
        error: 'Failed to fetch requests', 
        details: error.message 
      }, 500);
    }

    console.log('[Benefits] My requests fetched:', requests?.length || 0);

    return c.json({
      success: true,
      requests: requests || [],
      count: requests?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] My requests error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== APPROVE BENEFIT REQUEST ====================
app.post('/BrowoKoordinator-Benefits/approve/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized approve request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const requestId = c.req.param('id');
    const body = await c.req.json();
    const { admin_notes } = body;

    console.log('[Benefits] Approve request:', { userId: user.id, requestId, admin_notes });

    const supabase = getSupabaseClient();

    // Get request
    const { data: request, error: requestError } = await supabase
      .from('user_benefits')
      .select('*, benefits(*)')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('[Benefits] Request not found:', requestError);
      return c.json({ 
        error: 'Request not found', 
        details: requestError?.message 
      }, 404);
    }

    if (request.status !== 'PENDING') {
      return c.json({ 
        error: 'Request is not pending',
        current_status: request.status,
      }, 400);
    }

    // Update request to APPROVED
    const { data: updated, error: updateError } = await supabase
      .from('user_benefits')
      .update({
        status: 'APPROVED',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        admin_notes,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('[Benefits] Approve failed:', updateError);
      return c.json({ 
        error: 'Failed to approve request', 
        details: updateError.message 
      }, 500);
    }

    console.log('[Benefits] Request approved:', requestId);

    // Send notification to requester
    await sendNotification(
      request.user_id,
      'Benefit genehmigt!',
      `Dein Antrag für \"${request.benefits.title}\" wurde genehmigt!`,
      'BENEFIT_APPROVED',
      '/benefits',
      {
        request_id: requestId,
        benefit_id: request.benefit_id,
      }
    );
    
    // 🔔 TRIGGER WORKFLOWS: BENEFIT_ASSIGNED
    try {
      const authHeaderValue = `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
      
      // Get user info for context
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, organization_id')
        .eq('id', request.user_id)
        .single();
      
      if (userData) {
        await triggerWorkflows(
          TRIGGER_TYPES.BENEFIT_ASSIGNED,
          {
            benefitId: request.benefit_id,
            benefitName: request.benefits.title,
            userId: request.user_id,
            userName: `${userData.first_name} ${userData.last_name}`,
            assignmentDate: new Date().toISOString(),
            organizationId: userData.organization_id,
          },
          authHeaderValue
        );
        console.log(`✅ BENEFIT_ASSIGNED workflows triggered`);
      }
    } catch (triggerError) {
      console.error('⚠️ Failed to trigger workflows (non-fatal):', triggerError);
    }

    return c.json({
      success: true,
      request: updated,
      message: 'Benefit request approved successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Approve error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== REJECT BENEFIT REQUEST ====================
app.post('/BrowoKoordinator-Benefits/reject/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized reject request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const requestId = c.req.param('id');
    const body = await c.req.json();
    const { rejection_reason } = body;

    if (!rejection_reason) {
      return c.json({ error: 'Rejection reason is required' }, 400);
    }

    console.log('[Benefits] Reject request:', { userId: user.id, requestId, rejection_reason });

    const supabase = getSupabaseClient();

    // Get request
    const { data: request, error: requestError } = await supabase
      .from('user_benefits')
      .select('*, benefits(*)')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('[Benefits] Request not found:', requestError);
      return c.json({ 
        error: 'Request not found', 
        details: requestError?.message 
      }, 404);
    }

    if (request.status !== 'PENDING') {
      return c.json({ 
        error: 'Request is not pending',
        current_status: request.status,
      }, 400);
    }

    // Update request to REJECTED
    // Note: The refund trigger will automatically refund coins if this was a coin purchase
    const { data: updated, error: updateError } = await supabase
      .from('user_benefits')
      .update({
        status: 'REJECTED',
        rejection_reason,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('[Benefits] Reject failed:', updateError);
      return c.json({ 
        error: 'Failed to reject request', 
        details: updateError.message 
      }, 500);
    }

    console.log('[Benefits] Request rejected:', requestId);

    // Send notification to requester
    await sendNotification(
      request.user_id,
      'Benefit abgelehnt',
      `Dein Antrag für \"${request.benefits.title}\" wurde abgelehnt. Grund: ${rejection_reason}`,
      'BENEFIT_REJECTED',
      '/benefits',
      {
        request_id: requestId,
        benefit_id: request.benefit_id,
        reason: rejection_reason,
      }
    );
    
    // 🔔 TRIGGER WORKFLOWS: BENEFIT_REMOVED
    try {
      const authHeaderValue = `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
      
      // Get user info for context
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, organization_id')
        .eq('id', request.user_id)
        .single();
      
      if (userData) {
        await triggerWorkflows(
          TRIGGER_TYPES.BENEFIT_REMOVED,
          {
            benefitId: request.benefit_id,
            benefitName: request.benefits.title,
            userId: request.user_id,
            userName: `${userData.first_name} ${userData.last_name}`,
            removalDate: new Date().toISOString(),
            removalReason: rejection_reason,
            organizationId: userData.organization_id,
          },
          authHeaderValue
        );
        console.log(`✅ BENEFIT_REMOVED workflows triggered`);
      }
    } catch (triggerError) {
      console.error('⚠️ Failed to trigger workflows (non-fatal):', triggerError);
    }

    return c.json({
      success: true,
      request: updated,
      message: 'Benefit request rejected',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Reject error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GET PENDING REQUESTS ====================
app.get('/BrowoKoordinator-Benefits/pending', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized pending request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    console.log('[Benefits] Get pending requests:', { userId: user.id, role: user.role });

    const supabase = getSupabaseClient();

    // Get pending requests from users in same organization
    const { data: pending, error } = await supabase
      .from('user_benefits')
      .select('*, benefits(*), users!user_benefits_user_id_fkey(id, first_name, last_name, email)')
      .eq('status', 'PENDING')
      .order('requested_at', { ascending: true });

    if (error) {
      console.error('[Benefits] Pending error:', error);
      return c.json({ 
        error: 'Failed to fetch pending requests', 
        details: error.message 
      }, 500);
    }

    // Filter by organization (RLS should handle this, but double-check)
    const filtered = pending?.filter((p: any) => {
      return p.benefits?.organization_id === user.organization_id;
    });

    console.log('[Benefits] Pending requests fetched:', filtered?.length || 0);

    return c.json({
      success: true,
      requests: filtered || [],
      count: filtered?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Pending error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== SHOP PURCHASE ====================
app.post('/BrowoKoordinator-Benefits/shop/purchase', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized shop purchase');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { benefit_id } = body;

    if (!benefit_id) {
      return c.json({ error: 'Missing required field: benefit_id' }, 400);
    }

    console.log('[Benefits] Shop purchase:', { userId: user.id, benefit_id });

    const supabase = getSupabaseClient();

    // Get benefit
    const { data: benefit, error: benefitError } = await supabase
      .from('benefits')
      .select('*')
      .eq('id', benefit_id)
      .single();

    if (benefitError || !benefit) {
      console.error('[Benefits] Benefit not found:', benefitError);
      return c.json({ 
        error: 'Benefit not found', 
        details: benefitError?.message 
      }, 404);
    }

    // Check if benefit can be purchased with coins
    if (benefit.purchase_type === 'REQUEST_ONLY') {
      return c.json({ 
        error: 'This benefit requires a request, cannot be purchased with coins',
      }, 400);
    }

    // Check if benefit has coin price
    if (!benefit.coin_price || benefit.coin_price <= 0) {
      return c.json({ 
        error: 'This benefit cannot be purchased with coins',
      }, 400);
    }

    // Check eligibility
    const eligibility = await checkEligibility(user.id, benefit);
    if (!eligibility.eligible) {
      return c.json({ 
        error: 'Not eligible for this benefit',
        reason: eligibility.reason,
      }, 403);
    }

    // Check if user already has this benefit
    const { data: existing } = await supabase
      .from('user_benefits')
      .select('*')
      .eq('user_id', user.id)
      .eq('benefit_id', benefit_id)
      .single();

    if (existing) {
      return c.json({ 
        error: 'You already have this benefit',
        status: existing.status,
      }, 409);
    }

    // Check user's coin balance
    const balance = await getUserCoinBalance(user.id);
    if (balance < benefit.coin_price) {
      return c.json({ 
        error: 'Insufficient coins',
        required: benefit.coin_price,
        balance,
        missing: benefit.coin_price - balance,
      }, 402);
    }

    // Create coin transaction (SPENT)
    const { data: transaction, error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount: benefit.coin_price,
        reason: `Benefit gekauft: ${benefit.title}`,
        type: 'SPENT',
        metadata: {
          benefit_id,
          purchase_type: 'coin_shop',
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error('[Benefits] Transaction failed:', transactionError);
      return c.json({ 
        error: 'Failed to create transaction', 
        details: transactionError.message 
      }, 500);
    }

    // Determine initial status based on requires_approval
    let initialStatus = 'PENDING';
    let approvedAt = null;
    
    if (!benefit.requires_approval && benefit.instant_approval) {
      initialStatus = 'APPROVED';
      approvedAt = new Date().toISOString();
    }

    // Create user_benefit record
    const { data: userBenefit, error: userBenefitError } = await supabase
      .from('user_benefits')
      .insert({
        user_id: user.id,
        benefit_id,
        status: initialStatus,
        requested_at: new Date().toISOString(),
        approved_at: approvedAt,
        notes: 'Gekauft mit Coins',
      })
      .select()
      .single();

    if (userBenefitError) {
      console.error('[Benefits] User benefit creation failed:', userBenefitError);
      // Rollback transaction
      await supabase
        .from('coin_transactions')
        .delete()
        .eq('id', transaction.id);
      
      return c.json({ 
        error: 'Failed to create benefit', 
        details: userBenefitError.message 
      }, 500);
    }

    // Create coin_benefit_purchase record
    const { error: purchaseError } = await supabase
      .from('coin_benefit_purchases')
      .insert({
        user_id: user.id,
        benefit_id,
        coin_amount: benefit.coin_price,
        coin_transaction_id: transaction.id,
        user_benefit_id: userBenefit.id,
        purchased_at: new Date().toISOString(),
      });

    if (purchaseError) {
      console.error('[Benefits] Purchase record failed:', purchaseError);
      // Continue anyway, this is just for tracking
    }

    console.log('[Benefits] Purchase completed:', { 
      benefit_id, 
      transaction_id: transaction.id,
      status: initialStatus,
    });

    // Send notification
    if (initialStatus === 'APPROVED') {
      await sendNotification(
        user.id,
        'Benefit gekauft!',
        `Du hast "${benefit.title}" für ${benefit.coin_price} Coins gekauft!`,
        'BENEFIT_PURCHASED',
        '/benefits',
        {
          benefit_id,
          coins_spent: benefit.coin_price,
        }
      );
    } else {
      // Notify admins for approval
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', user.organization_id)
        .in('role', ['HR_MANAGER', 'HR_SUPERADMIN']);

      if (admins) {
        for (const admin of admins) {
          await sendNotification(
            admin.id,
            'Benefit-Kauf zur Genehmigung',
            `${user.email} hat ${benefit.title} für ${benefit.coin_price} Coins gekauft`,
            'BENEFIT_REQUEST',
            '/admin/benefits',
            {
              request_id: userBenefit.id,
              benefit_id,
              requester_id: user.id,
              purchase_type: 'coins',
            }
          );
        }
      }
    }

    return c.json({
      success: true,
      purchase: {
        benefit_id,
        coins_spent: benefit.coin_price,
        new_balance: balance - benefit.coin_price,
        status: initialStatus,
        requires_approval: benefit.requires_approval,
      },
      message: initialStatus === 'APPROVED' 
        ? 'Benefit erfolgreich gekauft!' 
        : 'Benefit gekauft - wartet auf Genehmigung',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Shop purchase error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GET SHOP ITEMS ====================
app.get('/BrowoKoordinator-Benefits/shop/items', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized shop items request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Benefits] Get shop items:', { userId: user.id });

    const supabase = getSupabaseClient();

    // Get benefits with coin prices
    const { data: items, error } = await supabase
      .from('benefits')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_active', true)
      .not('coin_price', 'is', null)
      .gt('coin_price', 0)
      .in('purchase_type', ['COINS_ONLY', 'BOTH'])
      .order('coin_price');

    if (error) {
      console.error('[Benefits] Shop items error:', error);
      return c.json({ 
        error: 'Failed to fetch shop items', 
        details: error.message 
      }, 500);
    }

    // Get user's existing benefits
    const { data: userBenefits } = await supabase
      .from('user_benefits')
      .select('benefit_id, status')
      .eq('user_id', user.id);

    const userBenefitMap = new Map();
    userBenefits?.forEach((ub: any) => {
      userBenefitMap.set(ub.benefit_id, ub.status);
    });

    // Enrich items with purchase status
    const enrichedItems = items?.map((item: any) => ({
      ...item,
      user_status: userBenefitMap.get(item.id) || null,
    }));

    console.log('[Benefits] Shop items fetched:', enrichedItems?.length || 0);

    return c.json({
      success: true,
      items: enrichedItems || [],
      count: enrichedItems?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Shop items error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GET COIN BALANCE ====================
app.get('/BrowoKoordinator-Benefits/coins/balance', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized coins balance request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Benefits] Get coin balance:', { userId: user.id });

    const balance = await getUserCoinBalance(user.id);

    return c.json({
      success: true,
      balance,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Coin balance error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GET COIN TRANSACTIONS ====================
app.get('/BrowoKoordinator-Benefits/coins/transactions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Benefits] Unauthorized transactions request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    console.log('[Benefits] Get transactions:', { userId: user.id, limit, offset });

    const supabase = getSupabaseClient();

    const { data: transactions, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Benefits] Transactions error:', error);
      return c.json({ 
        error: 'Failed to fetch transactions', 
        details: error.message 
      }, 500);
    }

    const balance = await getUserCoinBalance(user.id);

    console.log('[Benefits] Transactions fetched:', transactions?.length || 0);

    return c.json({
      success: true,
      transactions: transactions || [],
      count: transactions?.length || 0,
      balance,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Benefits] Transactions error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);