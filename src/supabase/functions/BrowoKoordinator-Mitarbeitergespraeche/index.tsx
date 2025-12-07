/**
 * BROWO KOORDINATOR - MITARBEITERGESPRÄCHE EDGE FUNCTION
 * =======================================================
 * Verwaltet Halbjahresgespräche, Feedback-Gespräche, etc.
 * 
 * Features:
 * - Template-Verwaltung (CRUD)
 * - Gespräche versenden (mit Snapshot)
 * - Antworten speichern (MA + Vorgesetzter)
 * - Unterschriften (Canvas)
 * - PDF-Export
 * - Workflow-Integration
 * 
 * Datenbank-Tabellen:
 * - performance_review_templates
 * - performance_review_questions
 * - performance_reviews
 * - performance_review_answers
 * - performance_review_signatures
 */

import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// CORS + Logger
app.use('*', cors());
app.use('*', logger(console.log));

// Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ========================================
// TYPES
// ========================================
type QuestionType = 
  | 'text-short'
  | 'text-long'
  | 'rating-scale'
  | 'yes-no'
  | 'checkboxes'
  | 'date-input'
  | 'signature';

type ReviewStatus = 
  | 'DRAFT'
  | 'SENT'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  required: boolean;
  order: number;
  // Type-specific fields
  options?: { id: string; text: string }[]; // for checkboxes
  minRating?: number; // for rating-scale
  maxRating?: number; // for rating-scale
  ratingLabels?: { min: string; max: string }; // for rating-scale
}

interface Template {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  questions: Question[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PerformanceReview {
  id: string;
  organization_id: string;
  employee_id: string;
  manager_id?: string;
  template_snapshot: Question[]; // Snapshot beim Versenden
  status: ReviewStatus;
  due_date?: string;
  conversation_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Answer {
  id: string;
  review_id: string;
  question_id: string;
  // MA-Antwort
  employee_answer?: any;
  employee_answered_at?: string;
  // Vorgesetzten-Antwort/Kommentar
  manager_comment?: string;
  manager_answered_at?: string;
}

interface Signature {
  id: string;
  review_id: string;
  user_id: string;
  role: 'employee' | 'manager';
  signature_data: string; // Base64 Canvas Data
  signed_at: string;
}

// ========================================
// UTILITY: AUTH
// ========================================
async function getUserFromRequest(c: any): Promise<{ user: any; error?: string }> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization header' };
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  return { user };
}

async function requireAuth(c: any): Promise<any> {
  const { user, error } = await getUserFromRequest(c);
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return user;
}

// ========================================
// UTILITY: GET USER PROFILE
// ========================================
async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, teams(name, manager_id)')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ========================================
// UTILITY: CHECK PERMISSIONS
// ========================================
async function hasPermission(userId: string, permission: string): Promise<boolean> {
  // Check user_permissions table
  const { data: userPerms } = await supabase
    .from('user_permissions')
    .select('granted')
    .eq('user_id', userId)
    .eq('permission', permission)
    .maybeSingle();

  if (userPerms !== null) {
    return userPerms.granted;
  }

  // Fallback: Check role_permissions
  const profile = await getUserProfile(userId);
  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('granted')
    .eq('role', profile.role)
    .eq('permission', permission)
    .maybeSingle();

  return rolePerms?.granted ?? false;
}

// ========================================
// ROUTES: TEMPLATES
// ========================================

// GET /make-server-f659121d/performance-reviews/templates
// List all templates (filtered by org + permissions)
app.get('/make-server-f659121d/performance-reviews/templates', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user; // Error response

  try {
    const profile = await getUserProfile(user.id);

    const { data, error } = await supabase
      .from('performance_review_templates')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ templates: data || [] });
  } catch (error: any) {
    console.error('❌ [GET /templates] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /make-server-f659121d/performance-reviews/templates/:id
// Get single template
app.get('/make-server-f659121d/performance-reviews/templates/:id', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const templateId = c.req.param('id');
    const profile = await getUserProfile(user.id);

    const { data, error } = await supabase
      .from('performance_review_templates')
      .select('*')
      .eq('id', templateId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error) throw error;

    return c.json({ template: data });
  } catch (error: any) {
    console.error('❌ [GET /templates/:id] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /make-server-f659121d/performance-reviews/templates
// Create template
app.post('/make-server-f659121d/performance-reviews/templates', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const profile = await getUserProfile(user.id);

    // Check permission: access_admin_area (anyone with admin+)
    const canCreate = await hasPermission(user.id, 'access_admin_area');
    if (!canCreate) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    const body = await c.req.json();
    const { title, description, questions } = body;

    if (!title || !questions || !Array.isArray(questions)) {
      return c.json({ error: 'title und questions sind erforderlich' }, 400);
    }

    const { data, error } = await supabase
      .from('performance_review_templates')
      .insert({
        organization_id: profile.organization_id,
        title,
        description,
        questions,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ [POST /templates] Template created:', data.id);
    return c.json({ template: data }, 201);
  } catch (error: any) {
    console.error('❌ [POST /templates] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /make-server-f659121d/performance-reviews/templates/:id
// Update template
app.put('/make-server-f659121d/performance-reviews/templates/:id', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const templateId = c.req.param('id');
    const profile = await getUserProfile(user.id);

    const canUpdate = await hasPermission(user.id, 'access_admin_area');
    if (!canUpdate) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    const body = await c.req.json();
    const { title, description, questions } = body;

    const { data, error } = await supabase
      .from('performance_review_templates')
      .update({
        title,
        description,
        questions,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('organization_id', profile.organization_id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ [PUT /templates/:id] Template updated:', templateId);
    return c.json({ template: data });
  } catch (error: any) {
    console.error('❌ [PUT /templates/:id] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /make-server-f659121d/performance-reviews/templates/:id
// Delete template
app.delete('/make-server-f659121d/performance-reviews/templates/:id', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const templateId = c.req.param('id');
    const profile = await getUserProfile(user.id);

    const canDelete = await hasPermission(user.id, 'access_admin_area');
    if (!canDelete) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    const { error } = await supabase
      .from('performance_review_templates')
      .delete()
      .eq('id', templateId)
      .eq('organization_id', profile.organization_id);

    if (error) throw error;

    console.log('✅ [DELETE /templates/:id] Template deleted:', templateId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ [DELETE /templates/:id] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// ROUTES: PERFORMANCE REVIEWS
// ========================================

// POST /make-server-f659121d/performance-reviews/send
// Send review to employee (creates snapshot)
app.post('/make-server-f659121d/performance-reviews/send', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const profile = await getUserProfile(user.id);
    const body = await c.req.json();
    const { template_id, employee_id, manager_id, due_date } = body;

    if (!template_id || !employee_id) {
      return c.json({ error: 'template_id und employee_id sind erforderlich' }, 400);
    }

    // Check permission
    const canSend = await hasPermission(user.id, 'access_admin_area');
    if (!canSend) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    // Load template
    const { data: template, error: templateError } = await supabase
      .from('performance_review_templates')
      .select('questions')
      .eq('id', template_id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (templateError) throw templateError;

    // Create review with snapshot
    const { data: review, error: reviewError } = await supabase
      .from('performance_reviews')
      .insert({
        organization_id: profile.organization_id,
        employee_id,
        manager_id: manager_id || profile.teams?.manager_id,
        template_snapshot: template.questions, // SNAPSHOT!
        status: 'SENT',
        due_date,
        created_by: user.id
      })
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Create empty answers for all questions
    const answers = template.questions.map((q: Question) => ({
      review_id: review.id,
      question_id: q.id
    }));

    const { error: answersError } = await supabase
      .from('performance_review_answers')
      .insert(answers);

    if (answersError) throw answersError;

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: employee_id,
        title: 'Neues Mitarbeitergespräch',
        message: 'Du hast ein neues Mitarbeitergespräch zum Ausfüllen.',
        type: 'performance_review',
        related_id: review.id,
        organization_id: profile.organization_id
      });

    // Create task
    await supabase
      .from('tasks')
      .insert({
        organization_id: profile.organization_id,
        assigned_to: employee_id,
        title: 'Mitarbeitergespräch ausfüllen',
        description: 'Bitte fülle dein Mitarbeitergespräch aus.',
        due_date,
        status: 'open',
        created_by: user.id
      });

    console.log('✅ [POST /send] Review sent:', review.id);
    return c.json({ review }, 201);
  } catch (error: any) {
    console.error('❌ [POST /send] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /make-server-f659121d/performance-reviews/my-reviews
// Get reviews for current user (employee view)
app.get('/make-server-f659121d/performance-reviews/my-reviews', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const profile = await getUserProfile(user.id);

    const { data, error } = await supabase
      .from('performance_reviews')
      .select('*, created_by_user:users!performance_reviews_created_by_fkey(first_name, last_name)')
      .eq('employee_id', user.id)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ reviews: data || [] });
  } catch (error: any) {
    console.error('❌ [GET /my-reviews] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /make-server-f659121d/performance-reviews/team-reviews
// Get reviews for team (manager/admin view)
app.get('/make-server-f659121d/performance-reviews/team-reviews', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const profile = await getUserProfile(user.id);
    const employeeId = c.req.query('employee_id');

    let query = supabase
      .from('performance_reviews')
      .select('*, employee:users!performance_reviews_employee_id_fkey(first_name, last_name, email)')
      .eq('organization_id', profile.organization_id);

    // HR/Admin sees all
    const isAdmin = await hasPermission(user.id, 'access_admin_area');
    if (!isAdmin) {
      // Teamlead sees only their team
      query = query.eq('manager_id', user.id);
    }

    // Filter by specific employee (for TeamMemberDetails view)
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return c.json({ reviews: data || [] });
  } catch (error: any) {
    console.error('❌ [GET /team-reviews] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /make-server-f659121d/performance-reviews/:id
// Get single review with answers
app.get('/make-server-f659121d/performance-reviews/:id', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const reviewId = c.req.param('id');
    const profile = await getUserProfile(user.id);

    const { data: review, error: reviewError } = await supabase
      .from('performance_reviews')
      .select('*, employee:users!performance_reviews_employee_id_fkey(first_name, last_name, email)')
      .eq('id', reviewId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (reviewError) throw reviewError;

    // Check access
    const isEmployee = review.employee_id === user.id;
    const isManager = review.manager_id === user.id;
    const isAdmin = await hasPermission(user.id, 'access_admin_area');

    if (!isEmployee && !isManager && !isAdmin) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    // Get answers
    const { data: answers, error: answersError } = await supabase
      .from('performance_review_answers')
      .select('*')
      .eq('review_id', reviewId)
      .order('question_id');

    if (answersError) throw answersError;

    // Get signatures
    const { data: signatures, error: signaturesError } = await supabase
      .from('performance_review_signatures')
      .select('*')
      .eq('review_id', reviewId);

    if (signaturesError) throw signaturesError;

    return c.json({ 
      review, 
      answers: answers || [],
      signatures: signatures || []
    });
  } catch (error: any) {
    console.error('❌ [GET /reviews/:id] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /make-server-f659121d/performance-reviews/:id/answer
// Save employee answer
app.put('/make-server-f659121d/performance-reviews/:id/answer', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const reviewId = c.req.param('id');
    const profile = await getUserProfile(user.id);
    const body = await c.req.json();
    const { question_id, answer } = body;

    // Verify user is employee
    const { data: review } = await supabase
      .from('performance_reviews')
      .select('employee_id, status')
      .eq('id', reviewId)
      .single();

    if (review?.employee_id !== user.id) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    if (review.status === 'COMPLETED') {
      return c.json({ error: 'Gespräch bereits abgeschlossen' }, 400);
    }

    // Update answer
    const { data, error } = await supabase
      .from('performance_review_answers')
      .update({
        employee_answer: answer,
        employee_answered_at: new Date().toISOString()
      })
      .eq('review_id', reviewId)
      .eq('question_id', question_id)
      .select()
      .single();

    if (error) throw error;

    // Update review status to IN_PROGRESS if still SENT
    if (review.status === 'SENT') {
      await supabase
        .from('performance_reviews')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', reviewId);
    }

    return c.json({ answer: data });
  } catch (error: any) {
    console.error('❌ [PUT /answer] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /make-server-f659121d/performance-reviews/:id/manager-comment
// Save manager comment
app.put('/make-server-f659121d/performance-reviews/:id/manager-comment', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const reviewId = c.req.param('id');
    const body = await c.req.json();
    const { question_id, comment } = body;

    // Verify user is manager or admin
    const { data: review } = await supabase
      .from('performance_reviews')
      .select('manager_id')
      .eq('id', reviewId)
      .single();

    const isManager = review?.manager_id === user.id;
    const isAdmin = await hasPermission(user.id, 'access_admin_area');

    if (!isManager && !isAdmin) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    // Update comment
    const { data, error } = await supabase
      .from('performance_review_answers')
      .update({
        manager_comment: comment,
        manager_answered_at: new Date().toISOString()
      })
      .eq('review_id', reviewId)
      .eq('question_id', question_id)
      .select()
      .single();

    if (error) throw error;

    return c.json({ answer: data });
  } catch (error: any) {
    console.error('❌ [PUT /manager-comment] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /make-server-f659121d/performance-reviews/:id/submit
// Submit review (employee)
app.put('/make-server-f659121d/performance-reviews/:id/submit', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const reviewId = c.req.param('id');

    // Verify user is employee
    const { data: review } = await supabase
      .from('performance_reviews')
      .select('employee_id')
      .eq('id', reviewId)
      .single();

    if (review?.employee_id !== user.id) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    // Update status
    const { data, error } = await supabase
      .from('performance_reviews')
      .update({ status: 'SUBMITTED', updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    // Notify manager
    if (data.manager_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: data.manager_id,
          title: 'Mitarbeitergespräch eingereicht',
          message: `Ein Mitarbeiter hat sein Gespräch ausgefüllt.`,
          type: 'performance_review',
          related_id: reviewId,
          organization_id: data.organization_id
        });
    }

    console.log('✅ [PUT /submit] Review submitted:', reviewId);
    return c.json({ review: data });
  } catch (error: any) {
    console.error('❌ [PUT /submit] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /make-server-f659121d/performance-reviews/:id/complete
// Mark as completed (manager/admin)
app.put('/make-server-f659121d/performance-reviews/:id/complete', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const reviewId = c.req.param('id');
    const body = await c.req.json();
    const { conversation_date } = body;

    // Verify permission
    const { data: review } = await supabase
      .from('performance_reviews')
      .select('manager_id')
      .eq('id', reviewId)
      .single();

    const isManager = review?.manager_id === user.id;
    const isAdmin = await hasPermission(user.id, 'access_admin_area');

    if (!isManager && !isAdmin) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    // Update status
    const { data, error } = await supabase
      .from('performance_reviews')
      .update({ 
        status: 'COMPLETED',
        conversation_date: conversation_date || new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ [PUT /complete] Review completed:', reviewId);
    return c.json({ review: data });
  } catch (error: any) {
    console.error('❌ [PUT /complete] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /make-server-f659121d/performance-reviews/:id/signature
// Save signature
app.post('/make-server-f659121d/performance-reviews/:id/signature', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const reviewId = c.req.param('id');
    const body = await c.req.json();
    const { signature_data, role } = body;

    if (!signature_data || !role) {
      return c.json({ error: 'signature_data und role sind erforderlich' }, 400);
    }

    // Verify user permission
    const { data: review } = await supabase
      .from('performance_reviews')
      .select('employee_id, manager_id')
      .eq('id', reviewId)
      .single();

    const isEmployee = review?.employee_id === user.id && role === 'employee';
    const isManager = review?.manager_id === user.id && role === 'manager';

    if (!isEmployee && !isManager) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    // Check if signature already exists
    const { data: existing } = await supabase
      .from('performance_review_signatures')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .eq('role', role)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('performance_review_signatures')
        .update({
          signature_data,
          signed_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return c.json({ signature: data });
    } else {
      // Create new
      const { data, error } = await supabase
        .from('performance_review_signatures')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          role,
          signature_data
        })
        .select()
        .single();

      if (error) throw error;
      return c.json({ signature: data }, 201);
    }
  } catch (error: any) {
    console.error('❌ [POST /signature] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /make-server-f659121d/performance-reviews/:id/export-pdf
// Export review as PDF and save to documents
app.post('/make-server-f659121d/performance-reviews/:id/export-pdf', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const reviewId = c.req.param('id');
    const profile = await getUserProfile(user.id);

    // Get review data
    const { data: review, error: reviewError } = await supabase
      .from('performance_reviews')
      .select('*, employee:users!performance_reviews_employee_id_fkey(first_name, last_name)')
      .eq('id', reviewId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (reviewError) throw reviewError;

    // Check permission
    const isEmployee = review.employee_id === user.id;
    const isManager = review.manager_id === user.id;
    const isAdmin = await hasPermission(user.id, 'access_admin_area');

    if (!isEmployee && !isManager && !isAdmin) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    // Get answers
    const { data: answers } = await supabase
      .from('performance_review_answers')
      .select('*')
      .eq('review_id', reviewId);

    // Get signatures
    const { data: signatures } = await supabase
      .from('performance_review_signatures')
      .select('*')
      .eq('review_id', reviewId);

    // Generate PDF URL (placeholder - actual PDF generation would happen here)
    const pdfFileName = `mitarbeitergespraech_${review.employee.first_name}_${review.employee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // TODO: Actual PDF generation would go here
    // For now, we'll create a document entry that references the review
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        organization_id: profile.organization_id,
        user_id: review.employee_id,
        title: `Mitarbeitergespräch - ${review.employee.first_name} ${review.employee.last_name}`,
        file_name: pdfFileName,
        file_type: 'application/pdf',
        file_size: 0, // Placeholder
        file_url: `/performance-reviews/${reviewId}/pdf`, // Placeholder
        category: 'mitarbeitergespraech',
        uploaded_by: user.id
      })
      .select()
      .single();

    if (docError) throw docError;

    console.log('✅ [POST /export-pdf] PDF exported:', document.id);
    return c.json({ document, pdf_data: { review, answers, signatures } });
  } catch (error: any) {
    console.error('❌ [POST /export-pdf] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /make-server-f659121d/performance-reviews/:id/add-note
// Add note to completed review (employee can add notes after completion)
app.post('/make-server-f659121d/performance-reviews/:id/add-note', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  try {
    const reviewId = c.req.param('id');
    const body = await c.req.json();
    const { note } = body;

    // Verify user is employee
    const { data: review } = await supabase
      .from('performance_reviews')
      .select('employee_id, employee_notes')
      .eq('id', reviewId)
      .single();

    if (review?.employee_id !== user.id) {
      return c.json({ error: 'Keine Berechtigung' }, 403);
    }

    // Append note to JSONB array
    const notes = review.employee_notes || [];
    notes.push({
      note,
      created_at: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('performance_reviews')
      .update({ employee_notes: notes })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    return c.json({ review: data });
  } catch (error: any) {
    console.error('❌ [POST /add-note] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// HEALTH CHECK
// ========================================
app.get('/make-server-f659121d/performance-reviews/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'BrowoKoordinator-Mitarbeitergespraeche',
    timestamp: new Date().toISOString() 
  });
});

// ========================================
// START SERVER
// ========================================
Deno.serve(app.fetch);
