/**
 * BrowoKoordinator - Kalender Edge Function
 * Version: 2.0.0
 * 
 * Handles calendar visualization, team calendar, shifts, and absences overview
 * 
 * NOTE: Leave Request MANAGEMENT (Create/Update/Delete/Approve/Reject) is handled by BrowoKoordinator-Antragmanager
 * This function is ONLY for calendar visualization and shift planning
 * 
 * Routes:
 * - GET    /health                    - Health check (NO AUTH)
 * - GET    /team-calendar             - Team calendar view with absences
 * - GET    /absences                  - Absences overview (read-only from leave_requests)
 * - GET    /holidays                  - German public holidays by state and year
 * - GET    /shifts                    - Get shifts for team/user
 * - POST   /shifts                    - Create shift
 * - PUT    /shifts/:id                - Update shift
 * - DELETE /shifts/:id                - Delete shift
 * - POST   /export                    - Export calendar (iCal format)
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

async function verifyAuth(authHeader: string | null): Promise<{ id: string; email?: string; role?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = getSupabaseUserClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Kalender] Auth error:', error);
      return null;
    }

    // Get user role from users table
    const { data: userData } = await getSupabaseClient()
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
    };
  } catch (error) {
    console.error('[Kalender] Auth verification failed:', error);
    return null;
  }
}

// ==================== HELPER FUNCTIONS ====================

// Calculate German public holidays
function calculateGermanHolidays(year: number, state: string = 'NRW'): Array<{ date: string; name: string; type: string }> {
  const holidays: Array<{ date: string; name: string; type: string }> = [];
  
  // Fixed holidays (same every year)
  const fixedHolidays = [
    { date: `${year}-01-01`, name: 'Neujahr', type: 'PUBLIC_HOLIDAY' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit', type: 'PUBLIC_HOLIDAY' },
    { date: `${year}-10-03`, name: 'Tag der Deutschen Einheit', type: 'PUBLIC_HOLIDAY' },
    { date: `${year}-12-25`, name: '1. Weihnachtstag', type: 'PUBLIC_HOLIDAY' },
    { date: `${year}-12-26`, name: '2. Weihnachtstag', type: 'PUBLIC_HOLIDAY' },
  ];

  // Easter calculation (Gauss algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easter = new Date(year, month - 1, day);
  
  // Movable holidays based on Easter
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const movableHolidays = [
    { date: formatDate(addDays(easter, -2)), name: 'Karfreitag', type: 'PUBLIC_HOLIDAY' },
    { date: formatDate(addDays(easter, 1)), name: 'Ostermontag', type: 'PUBLIC_HOLIDAY' },
    { date: formatDate(addDays(easter, 39)), name: 'Christi Himmelfahrt', type: 'PUBLIC_HOLIDAY' },
    { date: formatDate(addDays(easter, 50)), name: 'Pfingstmontag', type: 'PUBLIC_HOLIDAY' },
  ];

  // State-specific holidays
  const stateSpecificHolidays: Record<string, Array<{ date: string; name: string; type: string }>> = {
    'BW': [
      { date: `${year}-01-06`, name: 'Heilige Drei Könige', type: 'PUBLIC_HOLIDAY' },
      { date: formatDate(addDays(easter, 60)), name: 'Fronleichnam', type: 'PUBLIC_HOLIDAY' },
      { date: `${year}-11-01`, name: 'Allerheiligen', type: 'PUBLIC_HOLIDAY' },
    ],
    'BY': [
      { date: `${year}-01-06`, name: 'Heilige Drei Könige', type: 'PUBLIC_HOLIDAY' },
      { date: formatDate(addDays(easter, 60)), name: 'Fronleichnam', type: 'PUBLIC_HOLIDAY' },
      { date: `${year}-08-15`, name: 'Mariä Himmelfahrt', type: 'PUBLIC_HOLIDAY' },
      { date: `${year}-11-01`, name: 'Allerheiligen', type: 'PUBLIC_HOLIDAY' },
    ],
    'NRW': [
      { date: formatDate(addDays(easter, 60)), name: 'Fronleichnam', type: 'PUBLIC_HOLIDAY' },
      { date: `${year}-11-01`, name: 'Allerheiligen', type: 'PUBLIC_HOLIDAY' },
    ],
    'HE': [
      { date: formatDate(addDays(easter, 60)), name: 'Fronleichnam', type: 'PUBLIC_HOLIDAY' },
    ],
    'RP': [
      { date: formatDate(addDays(easter, 60)), name: 'Fronleichnam', type: 'PUBLIC_HOLIDAY' },
      { date: `${year}-11-01`, name: 'Allerheiligen', type: 'PUBLIC_HOLIDAY' },
    ],
    'SL': [
      { date: formatDate(addDays(easter, 60)), name: 'Fronleichnam', type: 'PUBLIC_HOLIDAY' },
      { date: `${year}-08-15`, name: 'Mariä Himmelfahrt', type: 'PUBLIC_HOLIDAY' },
      { date: `${year}-11-01`, name: 'Allerheiligen', type: 'PUBLIC_HOLIDAY' },
    ],
  };

  holidays.push(...fixedHolidays);
  holidays.push(...movableHolidays);
  
  if (stateSpecificHolidays[state]) {
    holidays.push(...stateSpecificHolidays[state]);
  }

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

// ==================== ROUTES ====================

// Health Check (NO AUTH)
app.get('/BrowoKoordinator-Kalender/health', (c) => {
  return c.json({
    status: 'ok',
    function: 'BrowoKoordinator-Kalender',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    purpose: 'Calendar Visualization & Shift Planning',
    note: 'Leave Request Management is handled by BrowoKoordinator-Antragmanager',
  });
});

// ==================== TEAM CALENDAR ====================
app.get('/BrowoKoordinator-Kalender/team-calendar', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Kalender] Unauthorized team calendar request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const month = c.req.query('month') || String(new Date().getMonth() + 1);
    const year = c.req.query('year') || String(new Date().getFullYear());
    const teamId = c.req.query('team_id');

    console.log('[Kalender] Get team calendar:', { userId: user.id, month, year, teamId });

    const supabase = getSupabaseClient();

    // Build date range for the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

    // Get approved leave requests for the month
    let leaveQuery = supabase
      .from('leave_requests')
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
        team:teams(id, name)
      `)
      .eq('status', 'APPROVED')
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    if (teamId) {
      leaveQuery = leaveQuery.eq('team_id', teamId);
    }

    const { data: absences, error: absencesError } = await leaveQuery;

    if (absencesError) {
      console.error('[Kalender] Error fetching absences:', absencesError);
      return c.json({ error: 'Failed to fetch absences', details: absencesError.message }, 500);
    }

    // Get shifts for the month (if shifts table exists)
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        *,
        user:users!shifts_user_id_fkey(id, first_name, last_name, email),
        team:teams(id, name)
      `)
      .gte('date', startDate)
      .lte('date', endDate);

    // Shifts table might not exist yet, that's okay
    const shiftsData = shiftsError ? [] : (shifts || []);

    // Get holidays for the month
    const holidays = calculateGermanHolidays(parseInt(year), 'NRW').filter(h => {
      return h.date >= startDate && h.date <= endDate;
    });

    console.log('[Kalender] Team calendar data:', {
      absences: absences?.length || 0,
      shifts: shiftsData.length,
      holidays: holidays.length,
    });

    return c.json({
      success: true,
      calendar: {
        month: parseInt(month),
        year: parseInt(year),
        absences: absences || [],
        shifts: shiftsData,
        holidays,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Kalender] Team calendar error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== ABSENCES OVERVIEW ====================
app.get('/BrowoKoordinator-Kalender/absences', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Kalender] Unauthorized absences request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const teamId = c.req.query('team_id');

    console.log('[Kalender] Get absences:', { userId: user.id, startDate, endDate, teamId });

    const supabase = getSupabaseClient();

    // Get approved leave requests within date range (read-only)
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, first_name, last_name, email, profile_picture),
        team:teams(id, name)
      `)
      .eq('status', 'APPROVED')
      .order('start_date', { ascending: true });

    if (startDate) {
      query = query.lte('end_date', endDate || '9999-12-31').gte('start_date', startDate);
    }
    if (endDate && !startDate) {
      query = query.lte('start_date', endDate);
    }
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data: absences, error } = await query;

    if (error) {
      console.error('[Kalender] Error fetching absences:', error);
      return c.json({ error: 'Failed to fetch absences', details: error.message }, 500);
    }

    console.log('[Kalender] Absences fetched:', absences?.length || 0);

    return c.json({
      success: true,
      absences: absences || [],
      count: absences?.length || 0,
      note: 'This is a read-only view. To manage leave requests, use BrowoKoordinator-Antragmanager',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Kalender] Get absences error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GERMAN PUBLIC HOLIDAYS ====================
app.get('/BrowoKoordinator-Kalender/holidays', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Kalender] Unauthorized holidays request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const year = c.req.query('year') || new Date().getFullYear().toString();
    const state = c.req.query('state') || 'NRW'; // Default: Nordrhein-Westfalen

    console.log('[Kalender] Get holidays:', { userId: user.id, year, state });

    const holidays = calculateGermanHolidays(parseInt(year), state);

    console.log('[Kalender] Holidays calculated:', holidays.length);

    return c.json({
      success: true,
      holidays,
      year: parseInt(year),
      state,
      count: holidays.length,
      available_states: ['BW', 'BY', 'NRW', 'HE', 'RP', 'SL'],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Kalender] Holidays error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GET SHIFTS ====================
app.get('/BrowoKoordinator-Kalender/shifts', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Kalender] Unauthorized shifts request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const userId = c.req.query('user_id');
    const teamId = c.req.query('team_id');

    console.log('[Kalender] Get shifts:', { userId: user.id, startDate, endDate, teamId });

    const supabase = getSupabaseClient();

    let query = supabase
      .from('shifts')
      .select(`
        *,
        user:users!shifts_user_id_fkey(id, first_name, last_name, email),
        team:teams(id, name)
      `)
      .order('date', { ascending: true });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data: shifts, error } = await query;

    if (error) {
      console.error('[Kalender] Error fetching shifts:', error);
      return c.json({ error: 'Failed to fetch shifts', details: error.message }, 500);
    }

    console.log('[Kalender] Shifts fetched:', shifts?.length || 0);

    return c.json({
      success: true,
      shifts: shifts || [],
      count: shifts?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Kalender] Get shifts error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== CREATE SHIFT ====================
app.post('/BrowoKoordinator-Kalender/shifts', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Kalender] Unauthorized create shift');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { user_id, team_id, date, shift_type, start_time, end_time, notes } = body;

    if (!user_id || !date || !shift_type) {
      return c.json({ error: 'Missing required fields: user_id, date, shift_type' }, 400);
    }

    // Only HR/Teamleads can create shifts
    if (user.role !== 'HR_SUPERADMIN' && user.role !== 'HR_MANAGER') {
      // Check if user is teamlead
      const supabase = getSupabaseClient();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'TEAMLEAD')
        .limit(1)
        .single();

      if (!teamMember) {
        console.warn('[Kalender] User not authorized to create shifts');
        return c.json({ error: 'Not authorized to create shifts' }, 403);
      }
    }

    console.log('[Kalender] Create shift:', { userId: user.id, date, shift_type });

    const supabase = getSupabaseClient();

    const { data: shift, error } = await supabase
      .from('shifts')
      .insert({
        user_id,
        team_id,
        date,
        shift_type,
        start_time,
        end_time,
        notes,
        created_by: user.id,
      })
      .select(`
        *,
        user:users!shifts_user_id_fkey(id, first_name, last_name, email),
        team:teams(id, name)
      `)
      .single();

    if (error) {
      console.error('[Kalender] Create shift failed:', error);
      return c.json({ error: 'Failed to create shift', details: error.message }, 500);
    }

    console.log('[Kalender] Shift created:', shift.id);

    return c.json({
      success: true,
      shift,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Kalender] Create shift error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== UPDATE SHIFT ====================
app.put('/BrowoKoordinator-Kalender/shifts/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Kalender] Unauthorized update shift');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const shiftId = c.req.param('id');
    const body = await c.req.json();

    console.log('[Kalender] Update shift:', { userId: user.id, shiftId, updates: body });

    const supabase = getSupabaseClient();

    // Get existing shift
    const { data: existingShift, error: fetchError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single();

    if (fetchError || !existingShift) {
      console.error('[Kalender] Shift not found:', fetchError);
      return c.json({ error: 'Shift not found', details: fetchError?.message }, 404);
    }

    // Check authorization
    if (user.role !== 'HR_SUPERADMIN' && user.role !== 'HR_MANAGER' && existingShift.created_by !== user.id) {
      console.warn('[Kalender] User not authorized to update this shift');
      return c.json({ error: 'Not authorized to update this shift' }, 403);
    }

    // Update shift
    const updates: any = { updated_at: new Date().toISOString() };
    if (body.date !== undefined) updates.date = body.date;
    if (body.shift_type !== undefined) updates.shift_type = body.shift_type;
    if (body.start_time !== undefined) updates.start_time = body.start_time;
    if (body.end_time !== undefined) updates.end_time = body.end_time;
    if (body.notes !== undefined) updates.notes = body.notes;

    const { data: shift, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', shiftId)
      .select(`
        *,
        user:users!shifts_user_id_fkey(id, first_name, last_name, email),
        team:teams(id, name)
      `)
      .single();

    if (error) {
      console.error('[Kalender] Update shift failed:', error);
      return c.json({ error: 'Failed to update shift', details: error.message }, 500);
    }

    console.log('[Kalender] Shift updated:', shift.id);

    return c.json({
      success: true,
      shift,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Kalender] Update shift error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== DELETE SHIFT ====================
app.delete('/BrowoKoordinator-Kalender/shifts/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Kalender] Unauthorized delete shift');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const shiftId = c.req.param('id');

    console.log('[Kalender] Delete shift:', { userId: user.id, shiftId });

    const supabase = getSupabaseClient();

    // Get existing shift
    const { data: existingShift, error: fetchError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single();

    if (fetchError || !existingShift) {
      console.error('[Kalender] Shift not found:', fetchError);
      return c.json({ error: 'Shift not found', details: fetchError?.message }, 404);
    }

    // Check authorization
    if (user.role !== 'HR_SUPERADMIN' && user.role !== 'HR_MANAGER' && existingShift.created_by !== user.id) {
      console.warn('[Kalender] User not authorized to delete this shift');
      return c.json({ error: 'Not authorized to delete this shift' }, 403);
    }

    // Delete shift
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);

    if (error) {
      console.error('[Kalender] Delete shift failed:', error);
      return c.json({ error: 'Failed to delete shift', details: error.message }, 500);
    }

    console.log('[Kalender] Shift deleted:', shiftId);

    return c.json({
      success: true,
      message: 'Shift deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Kalender] Delete shift error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== EXPORT CALENDAR ====================
app.post('/BrowoKoordinator-Kalender/export', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Kalender] Unauthorized export request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { start_date, end_date, include_absences, include_shifts, include_holidays, state } = body;

    console.log('[Kalender] Export calendar:', { userId: user.id, start_date, end_date });

    const supabase = getSupabaseClient();
    const events: Array<any> = [];

    // Get absences if requested
    if (include_absences) {
      const { data: absences } = await supabase
        .from('leave_requests')
        .select(`
          *,
          user:users!leave_requests_user_id_fkey(first_name, last_name)
        `)
        .eq('status', 'APPROVED')
        .gte('start_date', start_date)
        .lte('end_date', end_date);

      if (absences) {
        absences.forEach(absence => {
          events.push({
            type: 'absence',
            title: `${absence.user.first_name} ${absence.user.last_name} - ${absence.type}`,
            start: absence.start_date,
            end: absence.end_date,
            description: absence.comment || '',
          });
        });
      }
    }

    // Get shifts if requested
    if (include_shifts) {
      const { data: shifts } = await supabase
        .from('shifts')
        .select(`
          *,
          user:users!shifts_user_id_fkey(first_name, last_name)
        `)
        .gte('date', start_date)
        .lte('date', end_date);

      if (shifts) {
        shifts.forEach(shift => {
          events.push({
            type: 'shift',
            title: `${shift.user.first_name} ${shift.user.last_name} - ${shift.shift_type}`,
            start: shift.date,
            time: `${shift.start_time || ''} - ${shift.end_time || ''}`,
            description: shift.notes || '',
          });
        });
      }
    }

    // Get holidays if requested
    if (include_holidays) {
      const year = parseInt(start_date.split('-')[0]);
      const holidays = calculateGermanHolidays(year, state || 'NRW');
      
      holidays.forEach(holiday => {
        if (holiday.date >= start_date && holiday.date <= end_date) {
          events.push({
            type: 'holiday',
            title: holiday.name,
            start: holiday.date,
            description: 'Gesetzlicher Feiertag',
          });
        }
      });
    }

    console.log('[Kalender] Export events:', events.length);

    // Generate iCal format
    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += 'PRODID:-//BrowoKoordinator//Kalender Export//DE\r\n';
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';
    ical += 'X-WR-CALNAME:BrowoKoordinator Kalender\r\n';
    ical += 'X-WR-TIMEZONE:Europe/Berlin\r\n';

    events.forEach((event, index) => {
      ical += 'BEGIN:VEVENT\r\n';
      ical += `UID:${Date.now()}-${index}@browoko.com\r\n`;
      ical += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
      ical += `DTSTART;VALUE=DATE:${event.start.replace(/[-]/g, '')}\r\n`;
      if (event.end) {
        ical += `DTEND;VALUE=DATE:${event.end.replace(/[-]/g, '')}\r\n`;
      }
      ical += `SUMMARY:${event.title}\r\n`;
      if (event.description) {
        ical += `DESCRIPTION:${event.description}\r\n`;
      }
      ical += `CATEGORIES:${event.type}\r\n`;
      ical += 'END:VEVENT\r\n';
    });

    ical += 'END:VCALENDAR\r\n';

    console.log('[Kalender] iCal generated');

    return c.json({
      success: true,
      format: 'iCal',
      events_count: events.length,
      ical_data: ical,
      download_filename: `browoko_calendar_${start_date}_${end_date}.ics`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Kalender] Export error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
