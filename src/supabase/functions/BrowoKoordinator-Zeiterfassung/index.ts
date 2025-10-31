/**
 * BrowoKoordinator - Zeiterfassung Edge Function
 * ================================================
 * Complete time tracking system with approval workflow
 * 
 * Routes (all prefixed with /BrowoKoordinator-Zeiterfassung by Supabase):
 * - GET    /health              - Health check (NO AUTH - PUBLIC for monitoring)
 * - GET    /health-auth         - Authenticated health check (AUTH - with user info)
 * - GET    /sessions            - Get all sessions (AUTH)
 * - GET    /sessions/:id        - Get session by ID (AUTH)
 * - POST   /sessions/clock-in   - Clock in (AUTH)
 * - POST   /sessions/clock-out  - Clock out (AUTH)
 * - GET    /sessions/active     - Get active session (AUTH)
 * - GET    /stats               - Get time stats (AUTH)
 * - GET    /stats/monthly       - Get monthly stats (AUTH)
 * - GET    /stats/weekly        - Get weekly stats (AUTH)
 * - POST   /sessions/break-start - Start break (AUTH)
 * - POST   /sessions/break-end   - End break (AUTH)
 * - GET    /approval-queue      - Sessions to approve (AUTH - TeamLead+)
 * - POST   /sessions/:id/approve - Approve session (AUTH - TeamLead+)
 * - POST   /sessions/:id/reject  - Reject session (AUTH - TeamLead+)
 * 
 * @version 3.0.0 - Work periods integration (day-level tracking)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

// ==================== CORS HEADERS ====================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ==================== SUPABASE CLIENT ====================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const getAnonClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
};

// ==================== AUTH HELPERS ====================

async function verifyAuth(authHeader: string | null): Promise<{ id: string; email?: string; role?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = getAnonClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Zeiterfassung] Auth error:', error);
      return null;
    }

    // Get user role from database
    const { data: userData } = await getSupabaseClient()
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: userData?.role,
    };
  } catch (error) {
    console.error('[Zeiterfassung] Auth verification failed:', error);
    return null;
  }
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;

    // ==================== ROBUST PATH PARSING ====================
    // Supabase strips "/functions/v1/" before the function sees the URL
    // So we receive: /BrowoKoordinator-Zeiterfassung/health
    // OR: /BrowoKoordinator-Zeiterfassung/make-server-f659121d/health
    
    console.log('[Zeiterfassung] Raw URL:', url.pathname);
    
    // Remove the function name prefix
    let pathAfterFunctionName = url.pathname;
    if (pathAfterFunctionName.startsWith('/BrowoKoordinator-Zeiterfassung/')) {
      pathAfterFunctionName = pathAfterFunctionName.slice('/BrowoKoordinator-Zeiterfassung/'.length);
    } else if (pathAfterFunctionName.startsWith('/BrowoKoordinator-Zeiterfassung')) {
      pathAfterFunctionName = pathAfterFunctionName.slice('/BrowoKoordinator-Zeiterfassung'.length);
    }
    
    console.log('[Zeiterfassung] After function name:', pathAfterFunctionName);

    const segments = pathAfterFunctionName.split('/').filter(Boolean);
    console.log('[Zeiterfassung] Segments:', segments);
    
    // Remove Figma Make's "make-server-*" prefix if present
    if (segments[0]?.startsWith('make-server-')) {
      console.log('[Zeiterfassung] Removing make-server prefix:', segments[0]);
      segments.shift();
    }

    const path = segments.join('/');

    console.log(`[Zeiterfassung] ${method} /${path}`);

    // ==================== PUBLIC HEALTH CHECK (NO AUTH) ====================
    // Health endpoint MUST be public for monitoring tools
    if (path === 'health' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: "ok",
          function: "BrowoKoordinator-Zeiterfassung",
          timestamp: new Date().toISOString(),
          version: "3.0.0",
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== AUTH REQUIRED FOR ALL OTHER ROUTES ====================
    const authHeader = req.headers.get('Authorization');
    const user = await verifyAuth(authHeader);
    
    if (!user) {
      console.warn('[Zeiterfassung] Unauthorized request to:', path);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - valid JWT required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // ==================== AUTHENTICATED ROUTES ====================
    // Optional: Authenticated health check with user info
    if (path === 'health-auth' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: "ok",
          function: "BrowoKoordinator-Zeiterfassung",
          timestamp: new Date().toISOString(),
          version: "3.0.0",
          user: { id: user.id, email: user.email, role: user.role },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const supabase = getSupabaseClient();

    // ==================== GET ALL SESSIONS ====================
    if (path === 'sessions' && method === 'GET') {
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');
      const userId = url.searchParams.get('user_id') || user.id;

      console.log('[Zeiterfassung] Get all sessions:', { userId, startDate, endDate });

      let query = supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (startDate) query = query.gte('start_time', startDate);
      if (endDate) query = query.lte('start_time', endDate);

      const { data: sessions, error } = await query;

      if (error) {
        console.error('[Zeiterfassung] Error fetching sessions:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch sessions', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('[Zeiterfassung] Sessions fetched:', sessions?.length || 0);

      return new Response(
        JSON.stringify({
          success: true,
          sessions: sessions || [],
          count: sessions?.length || 0,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== GET SESSION BY ID ====================
    if (path.startsWith('sessions/') && method === 'GET' && !path.includes('clock-') && !path.includes('break-') && !path.includes('active') && !path.includes('approve') && !path.includes('reject')) {
      const sessionId = path.replace('sessions/', '');

      console.log('[Zeiterfassung] Get session by ID:', { userId: user.id, sessionId });

      const { data: session, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        console.error('[Zeiterfassung] Error fetching session:', error);
        return new Response(
          JSON.stringify({ error: 'Session not found', details: error?.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      console.log('[Zeiterfassung] Session fetched:', session.id);

      return new Response(
        JSON.stringify({
          success: true,
          session,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== CLOCK IN ====================
    if (path === 'sessions/clock-in' && method === 'POST') {
      console.log('[Zeiterfassung] Clock in:', { userId: user.id });

      // Check if already clocked in
      const { data: activeSession } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (activeSession) {
        console.warn('[Zeiterfassung] Already clocked in:', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'Already clocked in', session: activeSession }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Get or create work_period for today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const now = new Date().toISOString();

      let workPeriod;
      
      // Check if work_period exists for today
      const { data: existingPeriod } = await supabase
        .from('work_periods')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existingPeriod) {
        workPeriod = existingPeriod;
        console.log('[Zeiterfassung] Using existing work_period:', { periodId: workPeriod.id });
      } else {
        // Create new work_period for today
        const { data: newPeriod, error: periodError } = await supabase
          .from('work_periods')
          .insert({
            user_id: user.id,
            date: today,
            first_clock_in: now,
            is_active: true,
          })
          .select()
          .single();

        if (periodError || !newPeriod) {
          console.error('[Zeiterfassung] Failed to create work_period:', periodError);
          return new Response(
            JSON.stringify({ error: 'Failed to create work period', details: periodError?.message }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            }
          );
        }

        workPeriod = newPeriod;
        console.log('[Zeiterfassung] Created new work_period:', { periodId: workPeriod.id });
      }

      // Count existing sessions for today to get session_number
      const { count: sessionCount } = await supabase
        .from('work_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('work_period_id', workPeriod.id);

      const sessionNumber = (sessionCount || 0) + 1;

      // Create new session
      const { data: session, error } = await supabase
        .from('work_sessions')
        .insert({
          user_id: user.id,
          work_period_id: workPeriod.id,
          session_number: sessionNumber,
          session_type: 'work',
          start_time: now,
          breaks: [],
        })
        .select()
        .single();

      if (error || !session) {
        console.error('[Zeiterfassung] Clock in failed:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to clock in', details: error?.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('[Zeiterfassung] Clock in successful:', { userId: user.id, sessionId: session.id });

      return new Response(
        JSON.stringify({
          success: true,
          session,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== CLOCK OUT ====================
    if (path === 'sessions/clock-out' && method === 'POST') {
      console.log('[Zeiterfassung] Clock out:', { userId: user.id });

      // Find active session
      const { data: activeSession } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (!activeSession) {
        console.warn('[Zeiterfassung] No active session:', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'No active session found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Update session with clock out time
      const now = new Date().toISOString();
      
      const { data: session, error } = await supabase
        .from('work_sessions')
        .update({
          end_time: now,
        })
        .eq('id', activeSession.id)
        .select()
        .single();

      if (error || !session) {
        console.error('[Zeiterfassung] Clock out failed:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to clock out', details: error?.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      // Update work_period with last_clock_out
      const { error: periodError } = await supabase
        .from('work_periods')
        .update({
          last_clock_out: now,
        })
        .eq('id', activeSession.work_period_id);

      if (periodError) {
        console.warn('[Zeiterfassung] Failed to update work_period:', periodError);
        // Don't fail the request, just log the warning
      }

      console.log('[Zeiterfassung] Clock out successful:', { userId: user.id, sessionId: session.id });

      return new Response(
        JSON.stringify({
          success: true,
          session,
          timestamp: now,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== GET ACTIVE SESSION ====================
    if (path === 'sessions/active' && method === 'GET') {
      console.log('[Zeiterfassung] Get active session:', { userId: user.id });

      const { data: activeSession, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('[Zeiterfassung] Error fetching active session:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch active session', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: activeSession || null,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== GET STATS ====================
    if (path === 'stats' && method === 'GET') {
      const userId = url.searchParams.get('user_id') || user.id;

      console.log('[Zeiterfassung] Get stats:', { userId });

      const { data: sessions, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('[Zeiterfassung] Error fetching stats:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch stats', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      const stats = calculateStats(sessions || []);

      return new Response(
        JSON.stringify({
          success: true,
          stats,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== GET MONTHLY STATS ====================
    if (path === 'stats/monthly' && method === 'GET') {
      const userId = url.searchParams.get('user_id') || user.id;
      const year = url.searchParams.get('year') || new Date().getFullYear().toString();
      const month = url.searchParams.get('month') || (new Date().getMonth() + 1).toString();

      console.log('[Zeiterfassung] Get monthly stats:', { userId, year, month });

      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      const { data: sessions, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (error) {
        console.error('[Zeiterfassung] Error fetching monthly stats:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch monthly stats', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      const stats = calculateStats(sessions || []);

      return new Response(
        JSON.stringify({
          success: true,
          stats,
          year: parseInt(year),
          month: parseInt(month),
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== GET WEEKLY STATS ====================
    if (path === 'stats/weekly' && method === 'GET') {
      const userId = url.searchParams.get('user_id') || user.id;

      console.log('[Zeiterfassung] Get weekly stats:', { userId });

      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const { data: sessions, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', weekStart.toISOString());

      if (error) {
        console.error('[Zeiterfassung] Error fetching weekly stats:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch weekly stats', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      const stats = calculateStats(sessions || []);

      return new Response(
        JSON.stringify({
          success: true,
          stats,
          week_start: weekStart.toISOString(),
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== START BREAK ====================
    if (path === 'sessions/break-start' && method === 'POST') {
      console.log('[Zeiterfassung] Break start:', { userId: user.id });

      // Find active session
      const { data: activeSession } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (!activeSession) {
        console.warn('[Zeiterfassung] No active session for break:', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'No active session found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Add break
      const breaks = activeSession.breaks || [];
      breaks.push({
        start: new Date().toISOString(),
        end: null,
      });

      const { data: session, error } = await supabase
        .from('work_sessions')
        .update({ breaks })
        .eq('id', activeSession.id)
        .select()
        .single();

      if (error) {
        console.error('[Zeiterfassung] Break start failed:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to start break', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('[Zeiterfassung] Break start successful:', { userId: user.id, sessionId: session.id });

      return new Response(
        JSON.stringify({
          success: true,
          session,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== END BREAK ====================
    if (path === 'sessions/break-end' && method === 'POST') {
      console.log('[Zeiterfassung] Break end:', { userId: user.id });

      // Find active session
      const { data: activeSession } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (!activeSession) {
        console.warn('[Zeiterfassung] No active session for break end:', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'No active session found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Find active break
      const breaks = activeSession.breaks || [];
      const activeBreakIndex = breaks.findIndex((b: any) => b.end === null);

      if (activeBreakIndex === -1) {
        console.warn('[Zeiterfassung] No active break:', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'No active break found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // End the break
      breaks[activeBreakIndex].end = new Date().toISOString();

      const { data: session, error } = await supabase
        .from('work_sessions')
        .update({ breaks })
        .eq('id', activeSession.id)
        .select()
        .single();

      if (error) {
        console.error('[Zeiterfassung] Break end failed:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to end break', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('[Zeiterfassung] Break end successful:', { userId: user.id, sessionId: session.id });

      return new Response(
        JSON.stringify({
          success: true,
          session,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== GET APPROVAL QUEUE ====================
    if (path === 'approval-queue' && method === 'GET') {
      // Only TeamLead, HR, Superadmin can access
      if (!['teamlead', 'hr', 'superadmin'].includes(user.role || '')) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        );
      }

      console.log('[Zeiterfassung] Get approval queue:', { userId: user.id, role: user.role });

      const { data: sessions, error } = await supabase
        .from('work_sessions')
        .select('*, user:users(first_name, last_name, email)')
        .is('approved_at', null)
        .not('end_time', 'is', null)
        .order('end_time', { ascending: false });

      if (error) {
        console.error('[Zeiterfassung] Error fetching approval queue:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch approval queue', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          sessions: sessions || [],
          count: sessions?.length || 0,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== APPROVE SESSION ====================
    if (path.startsWith('sessions/') && path.endsWith('/approve') && method === 'POST') {
      // Only TeamLead, HR, Superadmin can approve
      if (!['teamlead', 'hr', 'superadmin'].includes(user.role || '')) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        );
      }

      const sessionId = path.replace('sessions/', '').replace('/approve', '');

      console.log('[Zeiterfassung] Approve session:', { userId: user.id, sessionId });

      const { data: session, error } = await supabase
        .from('work_sessions')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('[Zeiterfassung] Approve session failed:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to approve session', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('[Zeiterfassung] Session approved:', { userId: user.id, sessionId });

      return new Response(
        JSON.stringify({
          success: true,
          session,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== REJECT SESSION ====================
    if (path.startsWith('sessions/') && path.endsWith('/reject') && method === 'POST') {
      // Only TeamLead, HR, Superadmin can reject
      if (!['teamlead', 'hr', 'superadmin'].includes(user.role || '')) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        );
      }

      const sessionId = path.replace('sessions/', '').replace('/reject', '');
      const body = await req.json();
      const { reason } = body;

      console.log('[Zeiterfassung] Reject session:', { userId: user.id, sessionId, reason });

      const { data: session, error } = await supabase
        .from('work_sessions')
        .update({
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
          rejection_reason: reason,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('[Zeiterfassung] Reject session failed:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to reject session', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('[Zeiterfassung] Session rejected:', { userId: user.id, sessionId });

      return new Response(
        JSON.stringify({
          success: true,
          session,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================== 404 NOT FOUND ====================
    return new Response(
      JSON.stringify({ error: 'Route not found', path, method }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );

  } catch (error) {
    console.error('[Zeiterfassung] Exception:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ==================== HELPER FUNCTIONS ====================

function calculateStats(sessions: any[]) {
  let totalMinutes = 0;
  let totalBreakMinutes = 0;
  let totalSessions = sessions.length;

  sessions.forEach(session => {
    if (session.start_time && session.end_time) {
      const clockIn = new Date(session.start_time);
      const clockOut = new Date(session.end_time);
      const sessionMinutes = (clockOut.getTime() - clockIn.getTime()) / 1000 / 60;
      
      totalMinutes += sessionMinutes;

      // Calculate break time
      if (session.breaks && Array.isArray(session.breaks)) {
        session.breaks.forEach((breakPeriod: any) => {
          if (breakPeriod.start && breakPeriod.end) {
            const breakStart = new Date(breakPeriod.start);
            const breakEnd = new Date(breakPeriod.end);
            const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / 1000 / 60;
            totalBreakMinutes += breakMinutes;
          }
        });
      }
    }
  });

  const totalWorkMinutes = totalMinutes - totalBreakMinutes;
  const totalHours = Math.floor(totalWorkMinutes / 60);
  const remainingMinutes = Math.round(totalWorkMinutes % 60);

  return {
    total_sessions: totalSessions,
    total_minutes: Math.round(totalMinutes),
    total_break_minutes: Math.round(totalBreakMinutes),
    total_work_minutes: Math.round(totalWorkMinutes),
    total_work_hours: totalHours,
    total_work_hours_decimal: Math.round((totalWorkMinutes / 60) * 100) / 100,
    formatted_time: `${totalHours}h ${remainingMinutes}m`,
  };
}
