/**
 * BrowoKoordinator - Tasks Edge Function
 * 
 * Handles task management system: tasks, assignments, comments, status tracking
 * 
 * Routes:
 * - GET  /health - Health check (NO AUTH)
 * - GET  /tasks - Get all tasks (AUTH REQUIRED)
 * - GET  /tasks/:id - Get task details (AUTH REQUIRED)
 * - POST /tasks - Create task (AUTH REQUIRED)
 * - PUT  /tasks/:id - Update task (OWNER/ASSIGNEE/ADMIN)
 * - DELETE /tasks/:id - Delete task (OWNER/ADMIN)
 * - POST /tasks/:id/assign - Assign task to user (OWNER/ADMIN)
 * - POST /tasks/:id/unassign - Unassign user from task (OWNER/ADMIN)
 * - POST /tasks/:id/comments - Add comment (AUTH REQUIRED)
 * - GET  /tasks/:id/comments - Get comments (AUTH REQUIRED)
 * - POST /tasks/:id/status - Update task status (OWNER/ASSIGNEE/ADMIN)
 * - POST /tasks/:id/priority - Update task priority (OWNER/ADMIN)
 * - GET  /my-tasks - Get tasks assigned to me (AUTH REQUIRED)
 * - GET  /team-tasks - Get team tasks (AUTH REQUIRED)
 * - POST /tasks/:id/attachments - Add attachment (OWNER/ASSIGNEE)
 * - DELETE /tasks/:id/attachments/:attachment_id - Delete attachment (OWNER/ADMIN)
 * 
 * @version 1.0.0
 * @date 2025-10-30
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

async function verifyAuth(authHeader: string | null): Promise<{ id: string; email?: string; role?: string; organization_id?: string } | null> {
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
      console.error('[Tasks] Auth error:', error);
      return null;
    }

    // Get user's organization_id and role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[Tasks] Error fetching user data:', userError);
    }

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
      organization_id: userData?.organization_id,
    };
  } catch (error) {
    console.error('[Tasks] Auth verification failed:', error);
    return null;
  }
}

function isAdmin(role?: string): boolean {
  if (!role) return false;
  return ['ADMIN', 'SUPERADMIN', 'HR'].includes(role);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user can modify task (owner, assignee, or admin)
 */
async function canModifyTask(supabase: any, taskId: string, userId: string, role?: string): Promise<boolean> {
  if (isAdmin(role)) return true;

  const { data: task } = await supabase
    .from('tasks')
    .select('created_by')
    .eq('id', taskId)
    .single();

  if (task?.created_by === userId) return true;

  const { data: assignment } = await supabase
    .from('task_assignments')
    .select('id')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .single();

  return !!assignment;
}

/**
 * Get task with full details (assignments, comments count, attachments count)
 */
async function getTaskWithDetails(supabase: any, taskId: string) {
  // Get task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:users!tasks_created_by_fkey(id, first_name, last_name, email)
    `)
    .eq('id', taskId)
    .single();

  if (taskError) throw taskError;

  // Get assignments
  const { data: assignments } = await supabase
    .from('task_assignments')
    .select(`
      id,
      assigned_at,
      user:users!task_assignments_user_id_fkey(id, first_name, last_name, email),
      assigner:users!task_assignments_assigned_by_fkey(id, first_name, last_name, email)
    `)
    .eq('task_id', taskId);

  // Get comments count
  const { count: commentsCount } = await supabase
    .from('task_comments')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId);

  // Get attachments count
  const { count: attachmentsCount } = await supabase
    .from('task_attachments')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId);

  return {
    ...task,
    assignments: assignments || [],
    comments_count: commentsCount || 0,
    attachments_count: attachmentsCount || 0,
  };
}

// ==================== ROUTES ====================

// Health check (no auth required)
app.get("/BrowoKoordinator-Tasks/health", (c) => {
  return c.json({
    status: "ok",
    function: "BrowoKoordinator-Tasks",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ==================== TASK CRUD ====================

// Get All Tasks
app.get("/BrowoKoordinator-Tasks/tasks", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized tasks request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const status = c.req.query('status');
    const priority = c.req.query('priority');
    const assigned_to = c.req.query('assigned_to');
    const team_id = c.req.query('team_id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    console.log('[Tasks] Get tasks:', { 
      userId: user.id, 
      status, 
      priority, 
      assigned_to,
      team_id,
      limit, 
      offset 
    });

    const supabase = getSupabaseClient();

    let query = supabase
      .from('tasks')
      .select(`
        *,
        creator:users!tasks_created_by_fkey(id, first_name, last_name, email),
        assignments:task_assignments(
          id,
          user:users!task_assignments_user_id_fkey(id, first_name, last_name, email)
        )
      `, { count: 'exact' })
      .eq('organization_id', user.organization_id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (team_id) {
      query = query.eq('team_id', team_id);
    }
    if (assigned_to) {
      // Filter tasks assigned to specific user
      const { data: assignedTasks } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('user_id', assigned_to);
      
      const taskIds = assignedTasks?.map(a => a.task_id) || [];
      if (taskIds.length > 0) {
        query = query.in('id', taskIds);
      } else {
        // No tasks found for this user
        return c.json({
          success: true,
          tasks: [],
          total: 0,
          limit,
          offset,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Pagination & sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('[Tasks] Error fetching tasks:', error);
      return c.json({ error: 'Failed to fetch tasks', details: error.message }, 500);
    }

    return c.json({
      success: true,
      tasks: tasks || [],
      total: count || 0,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Get tasks error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Task Details
app.get("/BrowoKoordinator-Tasks/tasks/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized task details request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');

    console.log('[Tasks] Get task details:', { userId: user.id, taskId });

    const supabase = getSupabaseClient();

    const task = await getTaskWithDetails(supabase, taskId);

    // Check access (must be in same organization or assigned)
    if (task.organization_id !== user.organization_id) {
      const isAssigned = task.assignments.some((a: any) => a.user.id === user.id);
      if (!isAssigned) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    return c.json({
      success: true,
      task,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Get task details error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Create Task
app.post("/BrowoKoordinator-Tasks/tasks", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized create task');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { 
      title, 
      description, 
      status = 'TODO', 
      priority = 'MEDIUM',
      due_date,
      team_id,
      assigned_to // Array of user IDs to assign
    } = body;

    if (!title) {
      return c.json({ error: 'Missing required field: title' }, 400);
    }

    console.log('[Tasks] Create task:', { userId: user.id, title, status, priority });

    const supabase = getSupabaseClient();

    // Create task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        status,
        priority,
        due_date,
        team_id,
        created_by: user.id,
        organization_id: user.organization_id,
      })
      .select(`
        *,
        creator:users!tasks_created_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (taskError) {
      console.error('[Tasks] Error creating task:', taskError);
      return c.json({ error: 'Failed to create task', details: taskError.message }, 500);
    }

    // Assign users if provided
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      const assignments = assigned_to.map(userId => ({
        task_id: task.id,
        user_id: userId,
        assigned_by: user.id,
      }));

      const { error: assignError } = await supabase
        .from('task_assignments')
        .insert(assignments);

      if (assignError) {
        console.error('[Tasks] Error assigning users:', assignError);
        // Don't fail the whole operation, just log
      }
    }

    // Get full task details
    const fullTask = await getTaskWithDetails(supabase, task.id);

    return c.json({
      success: true,
      task: fullTask,
      message: 'Task created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Create task error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Update Task
app.put("/BrowoKoordinator-Tasks/tasks/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized update task');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const body = await c.req.json();

    console.log('[Tasks] Update task:', { userId: user.id, taskId, updates: Object.keys(body) });

    const supabase = getSupabaseClient();

    // Check permissions
    const canModify = await canModifyTask(supabase, taskId, user.id, user.role);
    if (!canModify) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Allowed update fields
    const allowedFields = ['title', 'description', 'status', 'priority', 'due_date', 'team_id'];
    const updates: any = {};
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Set completed_at if status is DONE
    if (updates.status === 'DONE') {
      updates.completed_at = new Date().toISOString();
    } else if (updates.status && updates.status !== 'DONE') {
      updates.completed_at = null;
    }

    // Update task
    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        creator:users!tasks_created_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('[Tasks] Error updating task:', updateError);
      return c.json({ error: 'Failed to update task', details: updateError.message }, 500);
    }

    // Get full task details
    const fullTask = await getTaskWithDetails(supabase, taskId);

    return c.json({
      success: true,
      task: fullTask,
      message: 'Task updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Update task error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Delete Task
app.delete("/BrowoKoordinator-Tasks/tasks/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized delete task');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');

    console.log('[Tasks] Delete task:', { userId: user.id, taskId });

    const supabase = getSupabaseClient();

    // Check permissions (only creator or admin)
    const { data: task } = await supabase
      .from('tasks')
      .select('created_by, organization_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (task.created_by !== user.id && !isAdmin(user.role)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    if (task.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Delete task (CASCADE will delete assignments, comments, attachments)
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error('[Tasks] Error deleting task:', deleteError);
      return c.json({ error: 'Failed to delete task', details: deleteError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Task deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Delete task error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== TASK ASSIGNMENTS ====================

// Assign Task to User
app.post("/BrowoKoordinator-Tasks/tasks/:id/assign", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized assign task');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const body = await c.req.json();
    const { user_id } = body;

    if (!user_id) {
      return c.json({ error: 'Missing required field: user_id' }, 400);
    }

    console.log('[Tasks] Assign task:', { userId: user.id, taskId, assignTo: user_id });

    const supabase = getSupabaseClient();

    // Check permissions (creator or admin)
    const { data: task } = await supabase
      .from('tasks')
      .select('created_by, organization_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (task.created_by !== user.id && !isAdmin(user.role)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Assign user
    const { data: assignment, error: assignError } = await supabase
      .from('task_assignments')
      .insert({
        task_id: taskId,
        user_id,
        assigned_by: user.id,
      })
      .select(`
        id,
        assigned_at,
        user:users!task_assignments_user_id_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (assignError) {
      // Check if already assigned
      if (assignError.code === '23505') {
        return c.json({ error: 'User already assigned to this task' }, 400);
      }
      console.error('[Tasks] Error assigning task:', assignError);
      return c.json({ error: 'Failed to assign task', details: assignError.message }, 500);
    }

    return c.json({
      success: true,
      assignment,
      message: 'User assigned to task successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Assign task error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Unassign User from Task
app.post("/BrowoKoordinator-Tasks/tasks/:id/unassign", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized unassign task');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const body = await c.req.json();
    const { user_id } = body;

    if (!user_id) {
      return c.json({ error: 'Missing required field: user_id' }, 400);
    }

    console.log('[Tasks] Unassign task:', { userId: user.id, taskId, unassignFrom: user_id });

    const supabase = getSupabaseClient();

    // Check permissions (creator or admin)
    const { data: task } = await supabase
      .from('tasks')
      .select('created_by')
      .eq('id', taskId)
      .single();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (task.created_by !== user.id && !isAdmin(user.role)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Unassign user
    const { error: unassignError } = await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', user_id);

    if (unassignError) {
      console.error('[Tasks] Error unassigning task:', unassignError);
      return c.json({ error: 'Failed to unassign task', details: unassignError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'User unassigned from task successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Unassign task error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== TASK COMMENTS ====================

// Get Task Comments
app.get("/BrowoKoordinator-Tasks/tasks/:id/comments", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized comments request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');

    console.log('[Tasks] Get comments:', { userId: user.id, taskId });

    const supabase = getSupabaseClient();

    // Check task access
    const { data: task } = await supabase
      .from('tasks')
      .select('organization_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (task.organization_id !== user.organization_id) {
      // Check if assigned
      const { data: assignment } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .single();

      if (!assignment) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('task_comments')
      .select(`
        *,
        author:users!task_comments_user_id_fkey(id, first_name, last_name, email)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('[Tasks] Error fetching comments:', commentsError);
      return c.json({ error: 'Failed to fetch comments', details: commentsError.message }, 500);
    }

    return c.json({
      success: true,
      comments: comments || [],
      total: comments?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Get comments error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Add Comment to Task
app.post("/BrowoKoordinator-Tasks/tasks/:id/comments", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized add comment');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const body = await c.req.json();
    const { comment_text } = body;

    if (!comment_text) {
      return c.json({ error: 'Missing required field: comment_text' }, 400);
    }

    console.log('[Tasks] Add comment:', { userId: user.id, taskId });

    const supabase = getSupabaseClient();

    // Check task access
    const { data: task } = await supabase
      .from('tasks')
      .select('organization_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (task.organization_id !== user.organization_id) {
      // Check if assigned
      const { data: assignment } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .single();

      if (!assignment) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    // Add comment
    const { data: comment, error: commentError } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        comment_text,
      })
      .select(`
        *,
        author:users!task_comments_user_id_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (commentError) {
      console.error('[Tasks] Error adding comment:', commentError);
      return c.json({ error: 'Failed to add comment', details: commentError.message }, 500);
    }

    return c.json({
      success: true,
      comment,
      message: 'Comment added successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Add comment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== TASK STATUS & PRIORITY ====================

// Update Task Status
app.post("/BrowoKoordinator-Tasks/tasks/:id/status", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized status update');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    if (!status) {
      return c.json({ error: 'Missing required field: status' }, 400);
    }

    // Validate status
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status value' }, 400);
    }

    console.log('[Tasks] Update status:', { userId: user.id, taskId, status });

    const supabase = getSupabaseClient();

    // Check permissions
    const canModify = await canModifyTask(supabase, taskId, user.id, user.role);
    if (!canModify) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Update status
    const updates: any = { status };
    if (status === 'DONE') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        creator:users!tasks_created_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('[Tasks] Error updating status:', updateError);
      return c.json({ error: 'Failed to update status', details: updateError.message }, 500);
    }

    // Get full task details
    const fullTask = await getTaskWithDetails(supabase, taskId);

    return c.json({
      success: true,
      task: fullTask,
      message: 'Task status updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Update status error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Update Task Priority
app.post("/BrowoKoordinator-Tasks/tasks/:id/priority", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized priority update');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const body = await c.req.json();
    const { priority } = body;

    if (!priority) {
      return c.json({ error: 'Missing required field: priority' }, 400);
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(priority)) {
      return c.json({ error: 'Invalid priority value' }, 400);
    }

    console.log('[Tasks] Update priority:', { userId: user.id, taskId, priority });

    const supabase = getSupabaseClient();

    // Check permissions (creator or admin only)
    const { data: task } = await supabase
      .from('tasks')
      .select('created_by')
      .eq('id', taskId)
      .single();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (task.created_by !== user.id && !isAdmin(user.role)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Update priority
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ priority })
      .eq('id', taskId)
      .select(`
        *,
        creator:users!tasks_created_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('[Tasks] Error updating priority:', updateError);
      return c.json({ error: 'Failed to update priority', details: updateError.message }, 500);
    }

    // Get full task details
    const fullTask = await getTaskWithDetails(supabase, taskId);

    return c.json({
      success: true,
      task: fullTask,
      message: 'Task priority updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Update priority error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== MY TASKS & TEAM TASKS ====================

// Get My Tasks
app.get("/BrowoKoordinator-Tasks/my-tasks", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized my-tasks request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const status = c.req.query('status');

    console.log('[Tasks] Get my tasks:', { userId: user.id, status });

    const supabase = getSupabaseClient();

    // Get task IDs assigned to user
    let assignmentQuery = supabase
      .from('task_assignments')
      .select('task_id')
      .eq('user_id', user.id);

    const { data: assignments } = await assignmentQuery;
    
    const taskIds = assignments?.map(a => a.task_id) || [];

    if (taskIds.length === 0) {
      return c.json({
        success: true,
        tasks: [],
        total: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Get tasks
    let query = supabase
      .from('tasks')
      .select(`
        *,
        creator:users!tasks_created_by_fkey(id, first_name, last_name, email),
        assignments:task_assignments(
          id,
          user:users!task_assignments_user_id_fkey(id, first_name, last_name, email)
        )
      `, { count: 'exact' })
      .in('id', taskIds);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('[Tasks] Error fetching my tasks:', error);
      return c.json({ error: 'Failed to fetch my tasks', details: error.message }, 500);
    }

    return c.json({
      success: true,
      tasks: tasks || [],
      total: count || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Get my tasks error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Team Tasks
app.get("/BrowoKoordinator-Tasks/team-tasks", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized team-tasks request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const team_id = c.req.query('team_id');

    if (!team_id) {
      return c.json({ error: 'Missing required query parameter: team_id' }, 400);
    }

    console.log('[Tasks] Get team tasks:', { userId: user.id, team_id });

    const supabase = getSupabaseClient();

    // Check user is team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership && !isAdmin(user.role)) {
      return c.json({ error: 'Access denied: not a team member' }, 403);
    }

    // Get team tasks
    const { data: tasks, error, count } = await supabase
      .from('tasks')
      .select(`
        *,
        creator:users!tasks_created_by_fkey(id, first_name, last_name, email),
        assignments:task_assignments(
          id,
          user:users!task_assignments_user_id_fkey(id, first_name, last_name, email)
        )
      `, { count: 'exact' })
      .eq('team_id', team_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Tasks] Error fetching team tasks:', error);
      return c.json({ error: 'Failed to fetch team tasks', details: error.message }, 500);
    }

    return c.json({
      success: true,
      tasks: tasks || [],
      total: count || 0,
      team_id,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Get team tasks error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== TASK ATTACHMENTS ====================

// Add Attachment to Task
app.post("/BrowoKoordinator-Tasks/tasks/:id/attachments", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized add attachment');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const body = await c.req.json();
    const { file_url, file_name, file_type, file_size } = body;

    if (!file_url || !file_name) {
      return c.json({ error: 'Missing required fields: file_url, file_name' }, 400);
    }

    console.log('[Tasks] Add attachment:', { userId: user.id, taskId, file_name });

    const supabase = getSupabaseClient();

    // Check permissions (creator or assignee)
    const canModify = await canModifyTask(supabase, taskId, user.id, user.role);
    if (!canModify) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Add attachment
    const { data: attachment, error: attachError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        file_url,
        file_name,
        file_type,
        file_size,
        uploaded_by: user.id,
      })
      .select(`
        *,
        uploader:users!task_attachments_uploaded_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (attachError) {
      console.error('[Tasks] Error adding attachment:', attachError);
      return c.json({ error: 'Failed to add attachment', details: attachError.message }, 500);
    }

    return c.json({
      success: true,
      attachment,
      message: 'Attachment added successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Add attachment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Delete Attachment
app.delete("/BrowoKoordinator-Tasks/tasks/:id/attachments/:attachment_id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Tasks] Unauthorized delete attachment');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const attachmentId = c.req.param('attachment_id');

    console.log('[Tasks] Delete attachment:', { userId: user.id, taskId, attachmentId });

    const supabase = getSupabaseClient();

    // Check attachment exists and permissions
    const { data: attachment } = await supabase
      .from('task_attachments')
      .select('uploaded_by, task_id')
      .eq('id', attachmentId)
      .eq('task_id', taskId)
      .single();

    if (!attachment) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    // Only uploader or admin can delete
    if (attachment.uploaded_by !== user.id && !isAdmin(user.role)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Delete attachment
    const { error: deleteError } = await supabase
      .from('task_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      console.error('[Tasks] Error deleting attachment:', deleteError);
      return c.json({ error: 'Failed to delete attachment', details: deleteError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Attachment deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tasks] Delete attachment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
