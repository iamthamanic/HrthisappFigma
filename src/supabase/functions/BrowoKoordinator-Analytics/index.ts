/**
 * BrowoKoordinator - Analytics Edge Function v1.0.0
 * 
 * Handles analytics and statistics for the application
 * 
 * Routes:
 * - GET  /health - Health check (NO AUTH)
 * - GET  /overview - Analytics overview (HR/ADMIN)
 * - GET  /user-stats - User statistics (AUTH REQUIRED)
 * - GET  /time-tracking - Time tracking stats (AUTH REQUIRED)
 * - GET  /leave-stats - Leave statistics (AUTH REQUIRED)
 * - GET  /dashboard - Dashboard quick stats (AUTH REQUIRED)
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Initialize Supabase client with service role key for admin operations
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// Enable logger
app.use('*', logger(console.log));

// CORS Configuration (for Figma Make compatibility)
app.use(
  "/*",
  cors({
    origin: '*', // Allow ALL origins (needed for Figma Make)
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Info", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours
  }),
);

// ==================== AUTH MIDDLEWARE ====================

async function verifyAuth(authHeader: string | null): Promise<{ 
  id: string; 
  email?: string; 
  role?: string; 
  organization_id?: string 
} | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Analytics] Auth error:', error);
      return null;
    }

    // Get organization_id from users table
    const supabaseAdmin = getSupabaseClient();
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[Analytics] Error fetching user data:', userError);
    }

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
      organization_id: userData?.organization_id,
    };
  } catch (error) {
    console.error('[Analytics] Auth verification failed:', error);
    return null;
  }
}

function isHROrAdmin(role?: string): boolean {
  if (!role) return false;
  return ['HR', 'ADMIN', 'SUPERADMIN'].includes(role);
}

// ==================== HELPER FUNCTIONS ====================

function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  return {
    startDate: startDate.toISOString(),
    endDate,
  };
}

// ==================== ROUTES ====================

// Health check (no auth required)
app.get("/BrowoKoordinator-Analytics/health", (c) => {
  return c.json({
    status: "ok",
    function: "BrowoKoordinator-Analytics",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Get Dashboard Quick Stats (Personal)
app.get("/BrowoKoordinator-Analytics/dashboard", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Analytics] Unauthorized dashboard request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Analytics] Get dashboard stats:', { userId: user.id });

    const supabase = getSupabaseClient();
    const { startDate, endDate } = getDateRange('month');

    // Get user's time tracking this month
    const { data: workSessions, error: workError } = await supabase
      .from('work_sessions')
      .select('start_time, end_time, total_hours')
      .eq('user_id', user.id)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    const totalHoursThisMonth = workSessions?.reduce((sum, session) => {
      return sum + (session.total_hours || 0);
    }, 0) || 0;

    // Get pending leave requests
    const { data: pendingLeaves, error: leaveError } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    // Get user's achievements
    const { data: achievements, error: achievementError } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id);

    // Get user's coin balance
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('coin_balance, yearly_leave_days, used_leave_days')
      .eq('id', user.id)
      .single();

    return c.json({
      success: true,
      stats: {
        hoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
        pendingLeaves: pendingLeaves?.length || 0,
        achievements: achievements?.length || 0,
        coinBalance: userData?.coin_balance || 0,
        leaveBalance: (userData?.yearly_leave_days || 0) - (userData?.used_leave_days || 0),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Analytics] Dashboard error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Analytics Overview (HR/Admin only)
app.get("/BrowoKoordinator-Analytics/overview", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Analytics] Unauthorized overview request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Analytics] Get overview:', { userId: user.id, role: user.role });

    const supabase = getSupabaseClient();
    const { startDate: weekStart } = getDateRange('week');
    const { startDate: monthStart } = getDateRange('month');

    // Total users in organization
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    // Active users this week (users with work sessions)
    const { data: activeUsersWeek, error: activeWeekError } = await supabase
      .from('work_sessions')
      .select('user_id')
      .eq('organization_id', user.organization_id)
      .gte('start_time', weekStart);

    const uniqueActiveUsersWeek = new Set(activeUsersWeek?.map(s => s.user_id) || []).size;

    // Leave requests stats
    const { count: pendingLeaves, error: pendingError } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id)
      .eq('status', 'pending');

    const { count: approvedLeaves, error: approvedError } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id)
      .eq('status', 'approved');

    // Documents stats
    const { count: totalDocuments, error: docsError } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    // Total work hours this month
    const { data: workSessionsMonth, error: workMonthError } = await supabase
      .from('work_sessions')
      .select('total_hours')
      .eq('organization_id', user.organization_id)
      .gte('start_time', monthStart);

    const totalHoursMonth = workSessionsMonth?.reduce((sum, s) => sum + (s.total_hours || 0), 0) || 0;

    // Learning progress
    const { count: totalCourses, error: coursesError } = await supabase
      .from('learning_videos')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    const { count: totalQuizzes, error: quizzesError } = await supabase
      .from('learning_quizzes')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    return c.json({
      success: true,
      overview: {
        users: {
          total: totalUsers || 0,
          activeThisWeek: uniqueActiveUsersWeek,
        },
        leaves: {
          pending: pendingLeaves || 0,
          approved: approvedLeaves || 0,
        },
        timeTracking: {
          totalHoursThisMonth: Math.round(totalHoursMonth * 10) / 10,
        },
        documents: {
          total: totalDocuments || 0,
        },
        learning: {
          totalCourses: totalCourses || 0,
          totalQuizzes: totalQuizzes || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Analytics] Overview error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get User Stats
app.get("/BrowoKoordinator-Analytics/user-stats", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Analytics] Unauthorized user-stats request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const targetUserId = c.req.query('userId') || user.id;
    
    // Non-admin can only view their own stats
    if (targetUserId !== user.id && !isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    console.log('[Analytics] Get user stats:', { userId: user.id, targetUserId });

    const supabase = getSupabaseClient();
    const { startDate: yearStart } = getDateRange('year');

    // User basic info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, email, role, coin_balance, yearly_leave_days, used_leave_days, learning_level, learning_xp')
      .eq('id', targetUserId)
      .single();

    // Total work hours (all time)
    const { data: workSessions, error: workError } = await supabase
      .from('work_sessions')
      .select('total_hours')
      .eq('user_id', targetUserId);

    const totalWorkHours = workSessions?.reduce((sum, s) => sum + (s.total_hours || 0), 0) || 0;

    // Work hours this year
    const { data: workSessionsYear, error: workYearError } = await supabase
      .from('work_sessions')
      .select('total_hours')
      .eq('user_id', targetUserId)
      .gte('start_time', yearStart);

    const workHoursThisYear = workSessionsYear?.reduce((sum, s) => sum + (s.total_hours || 0), 0) || 0;

    // Leave stats
    const { count: totalLeaves, error: leavesError } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('status', 'approved');

    // Achievements
    const { count: achievementsCount, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    // Learning progress
    const { count: completedVideos, error: videosError } = await supabase
      .from('video_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('completed', true);

    const { count: passedQuizzes, error: quizzesError } = await supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('passed', true);

    return c.json({
      success: true,
      userStats: {
        user: {
          name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown',
          email: userData?.email,
          role: userData?.role,
        },
        workTime: {
          totalHours: Math.round(totalWorkHours * 10) / 10,
          hoursThisYear: Math.round(workHoursThisYear * 10) / 10,
        },
        leaves: {
          yearlyAllowance: userData?.yearly_leave_days || 0,
          used: userData?.used_leave_days || 0,
          remaining: (userData?.yearly_leave_days || 0) - (userData?.used_leave_days || 0),
          totalApproved: totalLeaves || 0,
        },
        gamification: {
          coinBalance: userData?.coin_balance || 0,
          achievements: achievementsCount || 0,
        },
        learning: {
          level: userData?.learning_level || 1,
          xp: userData?.learning_xp || 0,
          completedVideos: completedVideos || 0,
          passedQuizzes: passedQuizzes || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Analytics] User stats error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Time Tracking Stats
app.get("/BrowoKoordinator-Analytics/time-tracking", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Analytics] Unauthorized time-tracking request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const period = c.req.query('period') || 'month';
    const targetUserId = c.req.query('userId') || user.id;

    // Non-admin can only view their own stats
    if (targetUserId !== user.id && !isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    console.log('[Analytics] Get time tracking stats:', { userId: user.id, targetUserId, period });

    const supabase = getSupabaseClient();
    const { startDate, endDate } = getDateRange(period);

    // Get work sessions
    const { data: workSessions, error: workError } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    if (workError) {
      console.error('[Analytics] Error fetching work sessions:', workError);
      return c.json({ error: 'Failed to fetch work sessions', details: workError.message }, 500);
    }

    // Calculate stats
    const totalHours = workSessions?.reduce((sum, s) => sum + (s.total_hours || 0), 0) || 0;
    const totalBreakMinutes = workSessions?.reduce((sum, s) => sum + (s.total_break_minutes || 0), 0) || 0;
    const workDays = new Set(workSessions?.map(s => new Date(s.start_time).toDateString())).size;

    // Group by day
    const byDay: { [key: string]: { hours: number; sessions: number } } = {};
    workSessions?.forEach(session => {
      const day = new Date(session.start_time).toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = { hours: 0, sessions: 0 };
      }
      byDay[day].hours += session.total_hours || 0;
      byDay[day].sessions += 1;
    });

    // Calculate averages
    const avgHoursPerDay = workDays > 0 ? totalHours / workDays : 0;
    const avgBreakPerDay = workDays > 0 ? totalBreakMinutes / workDays : 0;

    return c.json({
      success: true,
      timeTracking: {
        period,
        summary: {
          totalHours: Math.round(totalHours * 10) / 10,
          totalBreakMinutes,
          workDays,
          averageHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
          averageBreakMinutesPerDay: Math.round(avgBreakPerDay),
        },
        byDay: Object.entries(byDay).map(([date, stats]) => ({
          date,
          hours: Math.round(stats.hours * 10) / 10,
          sessions: stats.sessions,
        })),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Analytics] Time tracking error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Leave Stats
app.get("/BrowoKoordinator-Analytics/leave-stats", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Analytics] Unauthorized leave-stats request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const targetUserId = c.req.query('userId') || user.id;
    const year = c.req.query('year') || new Date().getFullYear().toString();

    // Non-admin can only view their own stats
    if (targetUserId !== user.id && !isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    console.log('[Analytics] Get leave stats:', { userId: user.id, targetUserId, year });

    const supabase = getSupabaseClient();

    // Get user's leave allowance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('yearly_leave_days, used_leave_days')
      .eq('id', targetUserId)
      .single();

    // Get all leave requests for the year
    const yearStart = `${year}-01-01T00:00:00Z`;
    const yearEnd = `${year}-12-31T23:59:59Z`;

    const { data: leaveRequests, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('start_date', yearStart)
      .lte('start_date', yearEnd)
      .order('start_date', { ascending: true });

    if (leaveError) {
      console.error('[Analytics] Error fetching leave requests:', leaveError);
      return c.json({ error: 'Failed to fetch leave requests', details: leaveError.message }, 500);
    }

    // Group by status
    const byStatus = {
      pending: leaveRequests?.filter(r => r.status === 'pending').length || 0,
      approved: leaveRequests?.filter(r => r.status === 'approved').length || 0,
      rejected: leaveRequests?.filter(r => r.status === 'rejected').length || 0,
    };

    // Group by leave type
    const byType: { [key: string]: number } = {};
    leaveRequests?.forEach(request => {
      if (request.status === 'approved') {
        const type = request.leave_type || 'other';
        byType[type] = (byType[type] || 0) + (request.days_count || 0);
      }
    });

    // Calculate total used days from approved requests
    const totalUsedDays = leaveRequests
      ?.filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.days_count || 0), 0) || 0;

    return c.json({
      success: true,
      leaveStats: {
        year: parseInt(year),
        allowance: {
          total: userData?.yearly_leave_days || 0,
          used: totalUsedDays,
          remaining: (userData?.yearly_leave_days || 0) - totalUsedDays,
        },
        byStatus,
        byType,
        requests: leaveRequests?.map(r => ({
          id: r.id,
          startDate: r.start_date,
          endDate: r.end_date,
          days: r.days_count,
          type: r.leave_type,
          status: r.status,
        })) || [],
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Analytics] Leave stats error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
