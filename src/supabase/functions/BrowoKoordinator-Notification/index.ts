/**
 * BrowoKoordinator - Notification Edge Function
 * Version: 1.0.0
 * 
 * Handles notification system: push notifications, in-app notifications, preferences
 * 
 * Routes:
 * - GET    /health                - Health check (NO AUTH)
 * - GET    /my-notifications      - Get user's notifications (AUTH REQUIRED)
 * - POST   /create                - Create notification (SYSTEM/ADMIN)
 * - POST   /mark-read/:id         - Mark notification as read (AUTH REQUIRED)
 * - POST   /mark-all-read         - Mark all as read (AUTH REQUIRED)
 * - DELETE /delete/:id            - Delete notification (AUTH REQUIRED)
 * - DELETE /delete-all-read       - Delete all read (AUTH REQUIRED)
 * - GET    /unread-count          - Get unread count (AUTH REQUIRED)
 * - POST   /send-bulk             - Send bulk notifications (ADMIN)
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
      console.error('[Notification] Auth error:', error);
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
    console.error('[Notification] Auth verification failed:', error);
    return null;
  }
}

function isAdmin(role?: string): boolean {
  if (!role) return false;
  return ['HR_SUPERADMIN', 'HR_MANAGER'].includes(role);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate notification type
 */
function isValidNotificationType(type: string): boolean {
  const validTypes = [
    'LEAVE_REQUEST_PENDING',
    'LEAVE_REQUEST_APPROVED',
    'LEAVE_REQUEST_REJECTED',
    'DOCUMENT_UPLOADED',
    'BENEFIT_APPROVED',
    'BENEFIT_REJECTED',
    'COINS_AWARDED',
    'ACHIEVEMENT_UNLOCKED',
    'VIDEO_ADDED',
    'ANNOUNCEMENT_CREATED',
    'ORGANIGRAM_UPDATED',
  ];
  return validTypes.includes(type);
}

// ==================== ROUTES ====================

// Health Check (NO AUTH)
app.get('/BrowoKoordinator-Notification/health', (c) => {
  return c.json({
    status: 'ok',
    function: 'BrowoKoordinator-Notification',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    purpose: 'Notification Management & Real-time Updates',
  });
});

// ==================== GET MY NOTIFICATIONS ====================
app.get('/BrowoKoordinator-Notification/my-notifications', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Notification] Unauthorized my-notifications request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const unreadOnly = c.req.query('unreadOnly') === 'true';
    const type = c.req.query('type'); // Optional filter by type

    console.log('[Notification] Get my notifications:', { 
      userId: user.id, 
      limit, 
      offset, 
      unreadOnly,
      type 
    });

    const supabase = getSupabaseClient();

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('[Notification] Get notifications error:', error);
      return c.json({ 
        error: 'Failed to fetch notifications', 
        details: error.message 
      }, 500);
    }

    // Also get total count
    let countQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (unreadOnly) {
      countQuery = countQuery.eq('read', false);
    }

    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    const { count: totalCount } = await countQuery;

    console.log('[Notification] Notifications fetched:', notifications?.length || 0);

    return c.json({
      success: true,
      notifications: notifications || [],
      count: notifications?.length || 0,
      total: totalCount || 0,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notification] Get notifications error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== CREATE NOTIFICATION ====================
app.post('/BrowoKoordinator-Notification/create', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Notification] Unauthorized create notification');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { user_id, title, message, type, link, data, related_id } = body;

    if (!user_id || !title || !message || !type) {
      return c.json({ 
        error: 'Missing required fields: user_id, title, message, type' 
      }, 400);
    }

    // Validate notification type
    if (!isValidNotificationType(type)) {
      return c.json({ 
        error: 'Invalid notification type',
        validTypes: [
          'LEAVE_REQUEST_PENDING',
          'LEAVE_REQUEST_APPROVED',
          'LEAVE_REQUEST_REJECTED',
          'DOCUMENT_UPLOADED',
          'BENEFIT_APPROVED',
          'BENEFIT_REJECTED',
          'COINS_AWARDED',
          'ACHIEVEMENT_UNLOCKED',
          'VIDEO_ADDED',
          'ANNOUNCEMENT_CREATED',
          'ORGANIGRAM_UPDATED',
        ]
      }, 400);
    }

    console.log('[Notification] Create notification:', { 
      userId: user.id, 
      targetUser: user_id, 
      title,
      type 
    });

    const supabase = getSupabaseClient();

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        link: link || null,
        data: data || {},
        related_id: related_id || null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Notification] Create failed:', error);
      return c.json({ 
        error: 'Failed to create notification', 
        details: error.message 
      }, 500);
    }

    console.log('[Notification] Notification created:', notification.id);

    // TODO: Send push notification if user has enabled it
    // TODO: Send email notification if user has enabled it

    return c.json({
      success: true,
      notification,
      message: 'Notification created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notification] Create error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== MARK AS READ ====================
app.post('/BrowoKoordinator-Notification/mark-read/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Notification] Unauthorized mark-read request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');

    console.log('[Notification] Mark as read:', { userId: user.id, notificationId });

    const supabase = getSupabaseClient();

    // Get notification to verify ownership
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      console.error('[Notification] Notification not found:', fetchError);
      return c.json({ 
        error: 'Notification not found', 
        details: fetchError?.message 
      }, 404);
    }

    // Check if user owns this notification
    if (notification.user_id !== user.id) {
      console.warn('[Notification] User not authorized to update this notification');
      return c.json({ 
        error: 'You can only update your own notifications' 
      }, 403);
    }

    // Mark as read
    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (updateError) {
      console.error('[Notification] Mark read failed:', updateError);
      return c.json({ 
        error: 'Failed to mark notification as read', 
        details: updateError.message 
      }, 500);
    }

    console.log('[Notification] Notification marked as read:', notificationId);

    return c.json({
      success: true,
      notification: updated,
      message: 'Notification marked as read',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notification] Mark read error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== MARK ALL AS READ ====================
app.post('/BrowoKoordinator-Notification/mark-all-read', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Notification] Unauthorized mark-all-read request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const type = c.req.query('type'); // Optional: mark only specific type as read

    console.log('[Notification] Mark all as read:', { userId: user.id, type });

    const supabase = getSupabaseClient();

    let query = supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('read', false);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query.select();

    if (error) {
      console.error('[Notification] Mark all read failed:', error);
      return c.json({ 
        error: 'Failed to mark notifications as read', 
        details: error.message 
      }, 500);
    }

    const markedCount = data?.length || 0;

    console.log('[Notification] Marked as read:', markedCount);

    return c.json({
      success: true,
      markedCount,
      message: `${markedCount} notifications marked as read`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notification] Mark all read error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== DELETE NOTIFICATION ====================
app.delete('/BrowoKoordinator-Notification/delete/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Notification] Unauthorized delete request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');

    console.log('[Notification] Delete notification:', { userId: user.id, notificationId });

    const supabase = getSupabaseClient();

    // Get notification to verify ownership
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      console.error('[Notification] Notification not found:', fetchError);
      return c.json({ 
        error: 'Notification not found', 
        details: fetchError?.message 
      }, 404);
    }

    // Check if user owns this notification
    if (notification.user_id !== user.id) {
      console.warn('[Notification] User not authorized to delete this notification');
      return c.json({ 
        error: 'You can only delete your own notifications' 
      }, 403);
    }

    // Delete notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (deleteError) {
      console.error('[Notification] Delete failed:', deleteError);
      return c.json({ 
        error: 'Failed to delete notification', 
        details: deleteError.message 
      }, 500);
    }

    console.log('[Notification] Notification deleted:', notificationId);

    return c.json({
      success: true,
      message: 'Notification deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notification] Delete error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== DELETE ALL READ ====================
app.delete('/BrowoKoordinator-Notification/delete-all-read', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Notification] Unauthorized delete-all-read request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Notification] Delete all read:', { userId: user.id });

    const supabase = getSupabaseClient();

    // Delete all read notifications for user
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('read', true)
      .select();

    if (error) {
      console.error('[Notification] Delete all read failed:', error);
      return c.json({ 
        error: 'Failed to delete notifications', 
        details: error.message 
      }, 500);
    }

    const deletedCount = data?.length || 0;

    console.log('[Notification] Deleted read notifications:', deletedCount);

    return c.json({
      success: true,
      deletedCount,
      message: `${deletedCount} read notifications deleted`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notification] Delete all read error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== GET UNREAD COUNT ====================
app.get('/BrowoKoordinator-Notification/unread-count', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Notification] Unauthorized unread-count request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const type = c.req.query('type'); // Optional: count only specific type

    console.log('[Notification] Get unread count:', { userId: user.id, type });

    const supabase = getSupabaseClient();

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (type) {
      query = query.eq('type', type);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[Notification] Unread count error:', error);
      return c.json({ 
        error: 'Failed to get unread count', 
        details: error.message 
      }, 500);
    }

    console.log('[Notification] Unread count:', count);

    return c.json({
      success: true,
      unreadCount: count || 0,
      type: type || 'all',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notification] Unread count error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== SEND BULK NOTIFICATIONS ====================
app.post('/BrowoKoordinator-Notification/send-bulk', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Notification] Unauthorized send-bulk request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const body = await c.req.json();
    const { user_ids, title, message, type, link, data } = body;

    if (!user_ids || !Array.isArray(user_ids) || !title || !message || !type) {
      return c.json({ 
        error: 'Missing required fields: user_ids (array), title, message, type' 
      }, 400);
    }

    // Validate notification type
    if (!isValidNotificationType(type)) {
      return c.json({ 
        error: 'Invalid notification type' 
      }, 400);
    }

    console.log('[Notification] Send bulk:', { 
      userId: user.id, 
      recipientCount: user_ids.length, 
      title,
      type 
    });

    const supabase = getSupabaseClient();

    // Create notifications for all users
    const notifications = user_ids.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
      data: data || {},
      read: false,
    }));

    const { data: created, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('[Notification] Bulk send failed:', error);
      return c.json({ 
        error: 'Failed to send bulk notifications', 
        details: error.message 
      }, 500);
    }

    const successCount = created?.length || 0;

    console.log('[Notification] Bulk notifications sent:', successCount);

    return c.json({
      success: true,
      sentCount: successCount,
      totalRequested: user_ids.length,
      message: `${successCount} notifications sent successfully`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notification] Bulk send error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
