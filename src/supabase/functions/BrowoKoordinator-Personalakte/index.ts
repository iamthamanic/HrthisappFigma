/**
 * BrowoKoordinator - Personalakte Edge Function v1.0.2
 * 
 * Handles employee personnel files: profiles, documents, notes
 * 
 * Routes:
 * - GET  /health - Health check (NO AUTH)
 * - GET  /employees - Get all employees (AUTH REQUIRED)
 * - GET  /employees/:id - Get employee profile (AUTH REQUIRED)
 * - PUT  /employees/:id - Update employee profile (AUTH REQUIRED)
 * - GET  /employees/:id/documents - Get employee documents (AUTH REQUIRED)
 * - GET  /employees/:id/notes - Get employee notes (HR/ADMIN)
 * - POST /employees/:id/notes - Add note to employee (HR/ADMIN)
 * - DELETE /employees/:id/notes/:note_id - Delete note (HR/ADMIN)
 * - DELETE /employees/:id - Delete employee (HR/ADMIN)
 * - POST /employees/:id/onboarding/start - Start onboarding process (HR/ADMIN)
 * - POST /employees/:id/offboarding/start - Start offboarding process (HR/ADMIN)
 * 
 * SCHEMA NOTES (v1.0.2):
 * - users.department is TEXT, not UUID (no department_id!)
 * - documents.uploaded_at, not created_at
 * - user_notes.author_id, not created_by
 * - user_notes has NO category column!
 * - phone, work_phone exist (NOT mobile_phone, home_phone, private_email!)
 * - emergency_contacts is JSONB array (NOT individual fields!)
 * - language_skills is JSONB array (migration 057)
 * - contract_status, contract_end_date, probation_period_months exist (migration 056/057)
 * - country, state, house_number exist (migration 056/064)
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

// ==================== INLINE TRIGGER HELPER ====================
const TRIGGER_TYPES = {
  EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED: 'EMPLOYEE_DELETED',
  ONBOARDING_START: 'ONBOARDING_START',
  OFFBOARDING_START: 'OFFBOARDING_START',
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
  organization_id?: string;
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
      console.error('[Personalakte] Auth error:', error);
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
      console.error('[Personalakte] Error fetching user data:', userError);
    }

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
      organization_id: userData?.organization_id,
    };
  } catch (error) {
    console.error('[Personalakte] Auth verification failed:', error);
    return null;
  }
}

function isHROrAdmin(role?: string): boolean {
  if (!role) return false;
  return ['HR', 'ADMIN', 'SUPERADMIN'].includes(role);
}

// ==================== ROUTES ====================

// Health check (no auth required)
app.get("/BrowoKoordinator-Personalakte/health", (c) => {
  return c.json({
    status: "ok",
    function: "BrowoKoordinator-Personalakte",
    timestamp: new Date().toISOString(),
    version: "1.0.2",
  });
});

// Get All Employees
app.get("/BrowoKoordinator-Personalakte/employees", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized employees request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const search = c.req.query('search');
    const department = c.req.query('department'); // TEXT search
    const role = c.req.query('role');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    console.log('[Personalakte] Get employees:', { 
      userId: user.id, 
      search, 
      department, 
      role,
      limit,
      offset 
    });

    const supabase = getSupabaseClient();

    // Build query - NOTE: department is TEXT, not UUID!
    let query = supabase
      .from('users')
      .select('id, first_name, last_name, email, role, department, profile_picture, phone, position, created_at')
      .eq('organization_id', user.organization_id);

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (department) {
      query = query.ilike('department', `%${department}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    query = query.order('last_name', { ascending: true });

    const { data: employees, error: employeesError } = await query;

    if (employeesError) {
      console.error('[Personalakte] Error fetching employees:', employeesError);
      return c.json({ error: 'Failed to fetch employees', details: employeesError.message }, 500);
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    return c.json({
      success: true,
      employees: employees || [],
      total: totalCount || 0,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Get employees error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Employee Profile
app.get("/BrowoKoordinator-Personalakte/employees/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized employee profile request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const employeeId = c.req.param('id');

    // Users can view own profile, HR/Admin can view any
    if (employeeId !== user.id && !isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    console.log('[Personalakte] Get employee profile:', { userId: user.id, employeeId });

    const supabase = getSupabaseClient();

    // Get complete employee profile
    const { data: employee, error: employeeError } = await supabase
      .from('users')
      .select('*')
      .eq('id', employeeId)
      .eq('organization_id', user.organization_id)
      .single();

    if (employeeError || !employee) {
      return c.json({ error: 'Employee not found' }, 404);
    }

    // Get teams the employee is part of (basic info only, no role field!)
    const { data: teamMemberships } = await supabase
      .from('team_members')
      .select('team_id, is_lead, teams(id, name, description)')
      .eq('user_id', employeeId);

    const teams = teamMemberships?.map(tm => ({
      id: tm.team_id,
      name: (tm.teams as any)?.name,
      description: (tm.teams as any)?.description,
      is_lead: tm.is_lead,
    })) || [];

    // Calculate leave balance
    const yearlyAllowance = employee.yearly_leave_days || employee.vacation_days || 0;
    const usedDays = employee.used_leave_days || 0;
    const remainingDays = yearlyAllowance - usedDays;

    return c.json({
      success: true,
      employee: {
        // Basic Info
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        profile_picture: employee.profile_picture,
        
        // Employment
        role: employee.role,
        position: employee.position,
        department: employee.department, // TEXT field!
        teams: teams,
        start_date: employee.start_date,
        end_date: employee.end_date,
        employment_type: employee.employment_type,
        employee_number: employee.employee_number,
        contract_status: employee.contract_status, // ✅ Migration 056
        contract_end_date: employee.contract_end_date, // ✅ Migration 056
        probation_period_months: employee.probation_period_months, // ✅ Migration 057
        re_entry_dates: employee.re_entry_dates || [], // ✅ Migration 056 (JSONB)
        
        // Personal Data
        birth_date: employee.birth_date, // ✅ Original + migration 056
        gender: employee.gender, // ✅ Migration 056
        // NOTE: nationality does NOT exist in schema!
        
        // Address (JSONB + some individual fields from migration 056/064)
        address: employee.address, // JSONB in original schema
        country: employee.country, // ✅ Added in migration 056
        state: employee.state, // ✅ Added in migration 056
        house_number: employee.house_number, // ✅ Added in migration 064
        
        // Contact
        work_phone: employee.work_phone, // ✅ Exists (migration 057)
        // NOTE: mobile_phone, home_phone, private_email do NOT exist in schema!
        
        // Emergency Contacts (JSONB array from migration 057)
        emergency_contacts: employee.emergency_contacts || [], // [{first_name, last_name, phone, email}, ...]
        
        // Bank Info (if exists - check if these are in schema)
        // NOTE: Need to verify if these columns exist!
        
        // Tax & Insurance (if exists)
        // NOTE: Need to verify if these columns exist!
        
        // Language Skills (Migration 057)
        language_skills: employee.language_skills || [], // JSONB: [{language, level}, ...]
        
        // Leave
        yearly_leave_days: yearlyAllowance,
        vacation_days: employee.vacation_days, // Legacy field
        used_leave_days: usedDays,
        remaining_leave_days: remainingDays,
        
        // Work Time
        weekly_hours: employee.weekly_hours,
        break_minutes: employee.break_minutes,
        
        // Gamification
        coin_balance: employee.coin_balance || 0,
        learning_level: employee.learning_level || 1,
        learning_xp: employee.learning_xp || 0,
        
        // Status
        is_active: employee.is_active,
        
        // Meta
        created_at: employee.created_at,
        updated_at: employee.updated_at,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Get employee profile error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Update Employee Profile
app.put("/BrowoKoordinator-Personalakte/employees/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized update employee');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const employeeId = c.req.param('id');
    
    // Users can update own profile (limited fields), HR/Admin can update any
    if (employeeId !== user.id && !isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const body = await c.req.json();

    console.log('[Personalakte] Update employee:', { 
      userId: user.id, 
      employeeId, 
      updates: Object.keys(body) 
    });

    const supabase = getSupabaseClient();

    // Verify employee exists and get current data
    const { data: existingEmployee, error: checkError } = await supabase
      .from('users')
      .select('id, first_name, last_name, organization_id')
      .eq('id', employeeId)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existingEmployee) {
      return c.json({ error: 'Employee not found' }, 404);
    }

    // Define which fields users can update (vs HR/Admin)
    // NOTE: Based on actual schema - mobile_phone does NOT exist!
    const userEditableFields = [
      'phone', 'work_phone', // ✅ These exist (NOT mobile_phone or home_phone!)
      'profile_picture',
      // Emergency contacts are JSONB array, not individual fields
      'emergency_contacts', // JSONB: [{first_name, last_name, phone, email}, ...]
    ];

    const hrEditableFields = [
      ...userEditableFields,
      // Basic Info
      'first_name', 'last_name', 'email',
      'role', 'position', 'department', // department is TEXT!
      'employee_number',
      
      // Employment
      'start_date', 'end_date', 'employment_type',
      'contract_status', 'contract_end_date',
      'probation_period_months',
      
      // Personal
      'birth_date', 'gender',
      
      // Location (part of address JSONB or separate fields)
      'country', 'state', // From migration 056
      
      // Bank/Tax (if they exist - check schema)
      'iban', 'bic', 'bank_name',
      'tax_id', 'social_security_number',
      'health_insurance', 'health_insurance_number',
      
      // Leave
      'yearly_leave_days', 'vacation_days', 'used_leave_days',
      
      // Work Time
      'weekly_hours', 'break_minutes',
      
      // Language Skills & Other JSONB
      'language_skills', // JSONB: [{language, level}, ...]
      're_entry_dates', // JSONB array
      
      // Status
      'is_active',
    ];

    // Filter allowed fields based on user role
    const allowedFields = isHROrAdmin(user.role) ? hrEditableFields : userEditableFields;
    const updateFields: any = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateFields[key] = value;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    // Perform update
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', employeeId)
      .select()
      .single();

    if (updateError) {
      console.error('[Personalakte] Error updating employee:', updateError);
      return c.json({ error: 'Failed to update employee', details: updateError.message }, 500);
    }

    console.log(`✅ Employee updated successfully: ${employeeId}`);
    
    // 🔔 TRIGGER WORKFLOWS: EMPLOYEE_UPDATED
    try {
      const authHeaderValue = authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
      
      await triggerWorkflows(
        TRIGGER_TYPES.EMPLOYEE_UPDATED,
        {
          userId: employeeId,
          employeeId: employeeId,
          employeeName: `${existingEmployee.first_name} ${existingEmployee.last_name}`,
          changedFields: Object.keys(updateFields),
          organizationId: existingEmployee.organization_id,
        },
        authHeaderValue
      );
      
      console.log(`✅ EMPLOYEE_UPDATED workflows triggered`);
    } catch (triggerError) {
      console.error('⚠️ Failed to trigger workflows (non-fatal):', triggerError);
    }

    return c.json({
      success: true,
      employee: updatedEmployee,
      message: 'Employee updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Update employee error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Employee Documents
app.get("/BrowoKoordinator-Personalakte/employees/:id/documents", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized documents request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const employeeId = c.req.param('id');
    
    // Users can see own documents, HR/Admin can see any
    if (employeeId !== user.id && !isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const category = c.req.query('category');

    console.log('[Personalakte] Get employee documents:', { userId: user.id, employeeId, category });

    const supabase = getSupabaseClient();

    // Build query - NOTE: uses uploaded_at, not created_at!
    let query = supabase
      .from('documents')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('user_id', employeeId);

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('uploaded_at', { ascending: false });

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('[Personalakte] Error fetching documents:', documentsError);
      return c.json({ error: 'Failed to fetch documents', details: documentsError.message }, 500);
    }

    // Group by category
    const byCategory: { [key: string]: any[] } = {};
    documents?.forEach(doc => {
      const cat = doc.category || 'uncategorized';
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      byCategory[cat].push(doc);
    });

    return c.json({
      success: true,
      documents: documents || [],
      byCategory,
      total: documents?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Get documents error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Employee Notes (HR/Admin only)
app.get("/BrowoKoordinator-Personalakte/employees/:id/notes", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized notes request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const employeeId = c.req.param('id');

    console.log('[Personalakte] Get notes:', { userId: user.id, employeeId });

    const supabase = getSupabaseClient();

    // Fetch all notes for employee with author info
    // NOTE: Uses author_id, not created_by!
    const { data: notes, error: notesError } = await supabase
      .from('user_notes')
      .select(`
        id,
        note_text,
        created_at,
        author_id,
        is_private,
        author:users!user_notes_author_id_fkey(first_name, last_name, email)
      `)
      .eq('user_id', employeeId)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('[Personalakte] Error fetching notes:', notesError);
      return c.json({ error: 'Failed to fetch notes', details: notesError.message }, 500);
    }

    // Format notes with author info
    const formattedNotes = notes?.map(note => ({
      id: note.id,
      note_text: note.note_text,
      is_private: note.is_private,
      created_at: note.created_at,
      author: {
        id: note.author_id,
        name: (note.author as any) 
          ? `${(note.author as any).first_name} ${(note.author as any).last_name}` 
          : 'Unknown',
        email: (note.author as any)?.email,
      },
    })) || [];

    return c.json({
      success: true,
      notes: formattedNotes,
      total: formattedNotes.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Get notes error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Add Employee Note (HR/Admin only)
app.post("/BrowoKoordinator-Personalakte/employees/:id/notes", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized add note');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const employeeId = c.req.param('id');
    const body = await c.req.json();
    const { note_text, is_private } = body;

    if (!note_text) {
      return c.json({ error: 'Missing required field: note_text' }, 400);
    }

    console.log('[Personalakte] Add note:', { userId: user.id, employeeId, is_private });

    const supabase = getSupabaseClient();

    // Verify employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('users')
      .select('id')
      .eq('id', employeeId)
      .eq('organization_id', user.organization_id)
      .single();

    if (employeeError || !employee) {
      return c.json({ error: 'Employee not found' }, 404);
    }

    // Create note - NOTE: Uses author_id, not created_by! No category field!
    const { data: note, error: noteError } = await supabase
      .from('user_notes')
      .insert({
        user_id: employeeId,
        note_text,
        author_id: user.id, // NOT created_by!
        is_private: is_private !== undefined ? is_private : true,
      })
      .select()
      .single();

    if (noteError) {
      console.error('[Personalakte] Error creating note:', noteError);
      return c.json({ error: 'Failed to create note', details: noteError.message }, 500);
    }

    return c.json({
      success: true,
      note,
      message: 'Note added successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Add note error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Delete Employee Note (HR/Admin only)
app.delete("/BrowoKoordinator-Personalakte/employees/:id/notes/:note_id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized delete note');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const employeeId = c.req.param('id');
    const noteId = c.req.param('note_id');

    console.log('[Personalakte] Delete note:', { userId: user.id, employeeId, noteId });

    const supabase = getSupabaseClient();

    // Verify note exists and belongs to this employee
    const { data: note, error: checkError } = await supabase
      .from('user_notes')
      .select('id, user_id')
      .eq('id', noteId)
      .eq('user_id', employeeId)
      .single();

    if (checkError || !note) {
      return c.json({ error: 'Note not found' }, 404);
    }

    // Delete note
    const { error: deleteError } = await supabase
      .from('user_notes')
      .delete()
      .eq('id', noteId);

    if (deleteError) {
      console.error('[Personalakte] Error deleting note:', deleteError);
      return c.json({ error: 'Failed to delete note', details: deleteError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Note deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Delete note error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== DELETE EMPLOYEE ====================
// Delete Employee (HR/Admin only) - Triggers EMPLOYEE_DELETED
app.delete("/BrowoKoordinator-Personalakte/employees/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized delete employee');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const employeeId = c.req.param('id');

    console.log('[Personalakte] Delete employee:', { userId: user.id, employeeId });

    const supabase = getSupabaseClient();

    // Get employee data before deleting
    const { data: employee, error: fetchError } = await supabase
      .from('users')
      .select('id, first_name, last_name, organization_id')
      .eq('id', employeeId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !employee) {
      return c.json({ error: 'Employee not found' }, 404);
    }

    // Delete employee (soft delete by setting is_active = false)
    const { error: deleteError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', employeeId);

    if (deleteError) {
      console.error('[Personalakte] Error deleting employee:', deleteError);
      return c.json({ error: 'Failed to delete employee', details: deleteError.message }, 500);
    }

    console.log(`✅ Employee deleted: ${employeeId}`);
    
    // 🔔 TRIGGER WORKFLOWS: EMPLOYEE_DELETED
    try {
      const authHeaderValue = authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
      
      await triggerWorkflows(
        TRIGGER_TYPES.EMPLOYEE_DELETED,
        {
          userId: employeeId,
          employeeId: employeeId,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          organizationId: employee.organization_id,
        },
        authHeaderValue
      );
      
      console.log(`✅ EMPLOYEE_DELETED workflows triggered`);
    } catch (triggerError) {
      console.error('⚠️ Failed to trigger workflows (non-fatal):', triggerError);
    }

    return c.json({
      success: true,
      message: 'Employee deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Delete employee error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== ONBOARDING START ====================
// Start Onboarding Process - Triggers ONBOARDING_START
app.post("/BrowoKoordinator-Personalakte/employees/:id/onboarding/start", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized onboarding start');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const employeeId = c.req.param('id');
    const body = await c.req.json();
    const { start_date } = body;

    console.log('[Personalakte] Start onboarding:', { userId: user.id, employeeId, start_date });

    const supabase = getSupabaseClient();

    // Get employee data
    const { data: employee, error: fetchError } = await supabase
      .from('users')
      .select('id, first_name, last_name, organization_id, start_date')
      .eq('id', employeeId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !employee) {
      return c.json({ error: 'Employee not found' }, 404);
    }

    console.log(`✅ Onboarding started for: ${employeeId}`);
    
    // 🔔 TRIGGER WORKFLOWS: ONBOARDING_START
    try {
      const authHeaderValue = authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
      
      await triggerWorkflows(
        TRIGGER_TYPES.ONBOARDING_START,
        {
          userId: employeeId,
          employeeId: employeeId,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          startDate: start_date || employee.start_date || new Date().toISOString(),
          organizationId: employee.organization_id,
        },
        authHeaderValue
      );
      
      console.log(`✅ ONBOARDING_START workflows triggered`);
    } catch (triggerError) {
      console.error('⚠️ Failed to trigger workflows (non-fatal):', triggerError);
    }

    return c.json({
      success: true,
      message: 'Onboarding process started',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Onboarding start error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== OFFBOARDING START ====================
// Start Offboarding Process - Triggers OFFBOARDING_START
app.post("/BrowoKoordinator-Personalakte/employees/:id/offboarding/start", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Personalakte] Unauthorized offboarding start');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const employeeId = c.req.param('id');
    const body = await c.req.json();
    const { end_date } = body;

    console.log('[Personalakte] Start offboarding:', { userId: user.id, employeeId, end_date });

    const supabase = getSupabaseClient();

    // Get employee data
    const { data: employee, error: fetchError } = await supabase
      .from('users')
      .select('id, first_name, last_name, organization_id, end_date')
      .eq('id', employeeId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !employee) {
      return c.json({ error: 'Employee not found' }, 404);
    }

    console.log(`✅ Offboarding started for: ${employeeId}`);
    
    // 🔔 TRIGGER WORKFLOWS: OFFBOARDING_START
    try {
      const authHeaderValue = authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
      
      await triggerWorkflows(
        TRIGGER_TYPES.OFFBOARDING_START,
        {
          userId: employeeId,
          employeeId: employeeId,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          endDate: end_date || employee.end_date || new Date().toISOString(),
          organizationId: employee.organization_id,
        },
        authHeaderValue
      );
      
      console.log(`✅ OFFBOARDING_START workflows triggered`);
    } catch (triggerError) {
      console.error('⚠️ Failed to trigger workflows (non-fatal):', triggerError);
    }

    return c.json({
      success: true,
      message: 'Offboarding process started',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Personalakte] Offboarding start error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);