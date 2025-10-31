// ============================================================================
// BROWO KOORDINATOR - CHAT EDGE FUNCTION
// ============================================================================
// Handles: DMs, Group Chats, Knowledge Wiki, Feedback System
// Version: 1.0.2 (FIXED: Removed embedded resources, returns IDs only)
// ============================================================================

import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContext {
  userId: string;
  role: string;
}

type ConversationType = 'DM' | 'GROUP';
type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'VIDEO' | 'SYSTEM';
type UserStatus = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
type FeedbackStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type FeedbackPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// ============================================================================
// INLINE SHARED UTILITIES
// ============================================================================

// Auth Helper
async function verifyAuth(authHeader: string | null): Promise<AuthContext | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Get user role from users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    userId: user.id,
    role: userData?.role || 'USER'
  };
}

function isAdmin(role: string): boolean {
  return ['ADMIN', 'HR', 'SUPERADMIN'].includes(role);
}

// Supabase Clients
function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// ============================================================================
// HONO APP SETUP
// ============================================================================

const app = new Hono();

// Middleware
app.use('*', logger(console.log));
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/BrowoKoordinator-Chat/health', (c) => {
  return c.json({
    status: 'ok',
    function: 'BrowoKoordinator-Chat',
    timestamp: new Date().toISOString(),
    version: '1.0.2'
  });
});

// ============================================================================
// CONVERSATIONS ROUTES
// ============================================================================

// Get all conversations for user
app.get('/BrowoKoordinator-Chat/conversations', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const supabase = getServiceClient();

  try {
    const { data: conversations, error } = await supabase
      .from('browoko_conversations')
      .select(`
        *,
        members:browoko_conversation_members!inner(user_id, role, last_read_at),
        last_message:browoko_messages(content, created_at, user_id)
      `)
      .eq('members.user_id', auth.userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return c.json({ success: true, conversations: conversations || [] });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// Get conversation details
app.get('/BrowoKoordinator-Chat/conversations/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: member } = await supabase
      .from('browoko_conversation_members')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!member) {
      return c.json({ error: 'Not a member of this conversation' }, 403);
    }

    const { data: conversation, error } = await supabase
      .from('browoko_conversations')
      .select(`
        *,
        members:browoko_conversation_members(
          user_id,
          role,
          joined_at,
          user:users(id, full_name, profile_picture)
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    return c.json({ success: true, conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

// Create new conversation (DM or Group)
app.post('/BrowoKoordinator-Chat/conversations', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { type, name, member_ids } = body;

  if (!type || !['DM', 'GROUP'].includes(type)) {
    return c.json({ error: 'Invalid conversation type' }, 400);
  }

  if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
    return c.json({ error: 'member_ids required' }, 400);
  }

  if (type === 'DM' && member_ids.length !== 1) {
    return c.json({ error: 'DM requires exactly 1 other member' }, 400);
  }

  const supabase = getServiceClient();

  try {
    // Check if DM already exists
    if (type === 'DM') {
      const { data: existing } = await supabase
        .from('browoko_conversations')
        .select(`
          id,
          members:browoko_conversation_members(user_id)
        `)
        .eq('type', 'DM');

      const existingDM = existing?.find(conv => {
        const memberIds = conv.members.map(m => m.user_id).sort();
        const requestIds = [auth.userId, member_ids[0]].sort();
        return JSON.stringify(memberIds) === JSON.stringify(requestIds);
      });

      if (existingDM) {
        return c.json({ 
          success: true, 
          conversation: { id: existingDM.id },
          existing: true 
        });
      }
    }

    const { data: conversation, error: convError } = await supabase
      .from('browoko_conversations')
      .insert({
        type,
        name: type === 'GROUP' ? name : null,
        created_by: auth.userId
      })
      .select()
      .single();

    if (convError) throw convError;

    const allMemberIds = [auth.userId, ...member_ids];
    const members = allMemberIds.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === auth.userId ? 'ADMIN' : 'MEMBER'
    }));

    const { error: membersError } = await supabase
      .from('browoko_conversation_members')
      .insert(members);

    if (membersError) throw membersError;

    return c.json({ success: true, conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

// Update conversation (rename group)
app.put('/BrowoKoordinator-Chat/conversations/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const body = await c.req.json();
  const { name, avatar_url } = body;

  const supabase = getServiceClient();

  try {
    const { data: member } = await supabase
      .from('browoko_conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!member || member.role !== 'ADMIN') {
      return c.json({ error: 'Only admins can update conversation' }, 403);
    }

    const { data: conversation, error } = await supabase
      .from('browoko_conversations')
      .update({ name, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return c.json({ error: 'Failed to update conversation' }, 500);
  }
});

// Delete/Leave conversation
app.delete('/BrowoKoordinator-Chat/conversations/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: member } = await supabase
      .from('browoko_conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!member) {
      return c.json({ error: 'Not a member' }, 403);
    }

    if (member.role === 'ADMIN') {
      const { error } = await supabase
        .from('browoko_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('browoko_conversation_members')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', auth.userId);

      if (error) throw error;
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting/leaving conversation:', error);
    return c.json({ error: 'Failed to delete/leave conversation' }, 500);
  }
});

// Add member to group
app.post('/BrowoKoordinator-Chat/conversations/:id/members', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const body = await c.req.json();
  const { user_id } = body;

  if (!user_id) {
    return c.json({ error: 'user_id required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: member } = await supabase
      .from('browoko_conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!member || member.role !== 'ADMIN') {
      return c.json({ error: 'Only admins can add members' }, 403);
    }

    const { data: newMember, error } = await supabase
      .from('browoko_conversation_members')
      .insert({
        conversation_id: conversationId,
        user_id,
        role: 'MEMBER'
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, member: newMember });
  } catch (error) {
    console.error('Error adding member:', error);
    return c.json({ error: 'Failed to add member' }, 500);
  }
});

// Remove member from group
app.delete('/BrowoKoordinator-Chat/conversations/:id/members/:user_id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const userIdToRemove = c.req.param('user_id');

  const supabase = getServiceClient();

  try {
    const { data: member } = await supabase
      .from('browoko_conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!member || member.role !== 'ADMIN') {
      return c.json({ error: 'Only admins can remove members' }, 403);
    }

    const { error } = await supabase
      .from('browoko_conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userIdToRemove);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// Mark conversation as read
app.put('/BrowoKoordinator-Chat/conversations/:id/read', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { error } = await supabase
      .from('browoko_conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// ============================================================================
// MESSAGES ROUTES
// ============================================================================

// Get messages (paginated)
app.get('/BrowoKoordinator-Chat/conversations/:id/messages', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '50');
  const before = c.req.query('before');

  const supabase = getServiceClient();

  try {
    const { data: member } = await supabase
      .from('browoko_conversation_members')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!member) {
      return c.json({ error: 'Not a member' }, 403);
    }

    let query = supabase
      .from('browoko_messages')
      .select(`
        *,
        user:users(id, full_name, profile_picture),
        attachments:browoko_message_attachments(*),
        reactions:browoko_message_reactions(*, user:users(id, full_name))
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      const { data: beforeMessage } = await supabase
        .from('browoko_messages')
        .select('created_at')
        .eq('id', before)
        .single();

      if (beforeMessage) {
        query = query.lt('created_at', beforeMessage.created_at);
      }
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    return c.json({ success: true, messages: messages || [] });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Send message
app.post('/BrowoKoordinator-Chat/conversations/:id/messages', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const body = await c.req.json();
  const { content, type = 'TEXT', reply_to_message_id } = body;

  if (!content) {
    return c.json({ error: 'content required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: member } = await supabase
      .from('browoko_conversation_members')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!member) {
      return c.json({ error: 'Not a member' }, 403);
    }

    const { data: message, error } = await supabase
      .from('browoko_messages')
      .insert({
        conversation_id: conversationId,
        user_id: auth.userId,
        content,
        type,
        reply_to_message_id
      })
      .select(`
        *,
        user:users(id, full_name, profile_picture)
      `)
      .single();

    if (error) throw error;

    await supabase
      .from('browoko_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return c.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Edit message
app.put('/BrowoKoordinator-Chat/messages/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const messageId = c.req.param('id');
  const body = await c.req.json();
  const { content } = body;

  if (!content) {
    return c.json({ error: 'content required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: message } = await supabase
      .from('browoko_messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (!message || message.user_id !== auth.userId) {
      return c.json({ error: 'Cannot edit this message' }, 403);
    }

    const { data: updatedMessage, error } = await supabase
      .from('browoko_messages')
      .update({ 
        content, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error('Error editing message:', error);
    return c.json({ error: 'Failed to edit message' }, 500);
  }
});

// Delete message
app.delete('/BrowoKoordinator-Chat/messages/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const messageId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: message } = await supabase
      .from('browoko_messages')
      .select('user_id, conversation_id')
      .eq('id', messageId)
      .single();

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    const canDelete = message.user_id === auth.userId || isAdmin(auth.role);

    if (!canDelete) {
      return c.json({ error: 'Cannot delete this message' }, 403);
    }

    const { error } = await supabase
      .from('browoko_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

// Add reaction
app.post('/BrowoKoordinator-Chat/messages/:id/reactions', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const messageId = c.req.param('id');
  const body = await c.req.json();
  const { emoji } = body;

  if (!emoji) {
    return c.json({ error: 'emoji required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: reaction, error } = await supabase
      .from('browoko_message_reactions')
      .insert({
        message_id: messageId,
        user_id: auth.userId,
        emoji
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, reaction });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return c.json({ error: 'Failed to add reaction' }, 500);
  }
});

// Remove reaction
app.delete('/BrowoKoordinator-Chat/messages/:id/reactions', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const messageId = c.req.param('id');
  const emoji = c.req.query('emoji');

  if (!emoji) {
    return c.json({ error: 'emoji query param required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { error } = await supabase
      .from('browoko_message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', auth.userId)
      .eq('emoji', emoji);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return c.json({ error: 'Failed to remove reaction' }, 500);
  }
});

// ============================================================================
// FILE ATTACHMENTS ROUTES
// ============================================================================

// Upload file attachment
app.post('/BrowoKoordinator-Chat/messages/:id/attachments', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const messageId = c.req.param('id');
  const body = await c.req.json();
  const { file_url, file_name, file_type, file_size } = body;

  if (!file_url || !file_name || !file_type) {
    return c.json({ error: 'file_url, file_name, file_type required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: message } = await supabase
      .from('browoko_messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (!message || message.user_id !== auth.userId) {
      return c.json({ error: 'Cannot add attachment to this message' }, 403);
    }

    const { data: attachment, error } = await supabase
      .from('browoko_message_attachments')
      .insert({
        message_id: messageId,
        file_url,
        file_name,
        file_type,
        file_size
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, attachment });
  } catch (error) {
    console.error('Error adding attachment:', error);
    return c.json({ error: 'Failed to add attachment' }, 500);
  }
});

// Get attachments for message
app.get('/BrowoKoordinator-Chat/messages/:id/attachments', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const messageId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: attachments, error } = await supabase
      .from('browoko_message_attachments')
      .select('*')
      .eq('message_id', messageId);

    if (error) throw error;

    return c.json({ success: true, attachments: attachments || [] });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return c.json({ error: 'Failed to fetch attachments' }, 500);
  }
});

// Delete attachment
app.delete('/BrowoKoordinator-Chat/attachments/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const attachmentId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { error } = await supabase
      .from('browoko_message_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return c.json({ error: 'Failed to delete attachment' }, 500);
  }
});

// ============================================================================
// READ RECEIPTS & UNREAD COUNT
// ============================================================================

// Mark message as read
app.post('/BrowoKoordinator-Chat/messages/:id/read', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const messageId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: receipt, error } = await supabase
      .from('browoko_message_reads')
      .insert({
        message_id: messageId,
        user_id: auth.userId
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, receipt });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return c.json({ error: 'Failed to mark message as read' }, 500);
  }
});

// Get unread count for conversation
app.get('/BrowoKoordinator-Chat/conversations/:id/unread', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: member } = await supabase
      .from('browoko_conversation_members')
      .select('last_read_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!member) {
      return c.json({ error: 'Not a member' }, 403);
    }

    const { count, error } = await supabase
      .from('browoko_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('user_id', auth.userId)
      .gt('created_at', member.last_read_at || '1970-01-01');

    if (error) throw error;

    return c.json({ success: true, unread_count: count || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return c.json({ error: 'Failed to fetch unread count' }, 500);
  }
});

// ============================================================================
// TYPING INDICATORS & PRESENCE
// ============================================================================

// Set typing status
app.post('/BrowoKoordinator-Chat/conversations/:id/typing', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const conversationId = c.req.param('id');
  const body = await c.req.json();
  const { is_typing } = body;

  const supabase = getServiceClient();

  try {
    if (is_typing) {
      const { error } = await supabase
        .from('browoko_typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: auth.userId,
          typing_at: new Date().toISOString()
        });

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('browoko_typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', auth.userId);

      if (error) throw error;
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error setting typing status:', error);
    return c.json({ error: 'Failed to set typing status' }, 500);
  }
});

// Get online users
app.get('/BrowoKoordinator-Chat/users/online', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const supabase = getServiceClient();

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: users, error } = await supabase
      .from('browoko_user_presence')
      .select('user_id, status, last_seen_at')
      .gte('last_seen_at', fiveMinutesAgo)
      .neq('status', 'OFFLINE');

    if (error) throw error;

    return c.json({ success: true, users: users || [] });
  } catch (error) {
    console.error('Error fetching online users:', error);
    return c.json({ error: 'Failed to fetch online users' }, 500);
  }
});

// Update presence
app.post('/BrowoKoordinator-Chat/presence', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { status = 'ONLINE' } = body;

  const supabase = getServiceClient();

  try {
    const { error } = await supabase
      .from('browoko_user_presence')
      .upsert({
        user_id: auth.userId,
        status,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    return c.json({ error: 'Failed to update presence' }, 500);
  }
});

// ============================================================================
// SEARCH ROUTES
// ============================================================================

// Search messages
app.get('/BrowoKoordinator-Chat/search/messages', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const query = c.req.query('q');
  const conversationId = c.req.query('conversation_id');

  if (!query) {
    return c.json({ error: 'q query param required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    let searchQuery = supabase
      .from('browoko_messages')
      .select(`
        *,
        conversation:browoko_conversations(*),
        user:users(id, full_name, profile_picture)
      `)
      .ilike('content', `%${query}%`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (conversationId) {
      searchQuery = searchQuery.eq('conversation_id', conversationId);
    }

    const { data: messages, error } = await searchQuery;

    if (error) throw error;

    return c.json({ success: true, messages: messages || [] });
  } catch (error) {
    console.error('Error searching messages:', error);
    return c.json({ error: 'Failed to search messages' }, 500);
  }
});

// Search conversations
app.get('/BrowoKoordinator-Chat/search/conversations', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const query = c.req.query('q');

  if (!query) {
    return c.json({ error: 'q query param required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: conversations, error } = await supabase
      .from('browoko_conversations')
      .select(`
        *,
        members:browoko_conversation_members!inner(user_id)
      `)
      .eq('members.user_id', auth.userId)
      .ilike('name', `%${query}%`)
      .limit(20);

    if (error) throw error;

    return c.json({ success: true, conversations: conversations || [] });
  } catch (error) {
    console.error('Error searching conversations:', error);
    return c.json({ error: 'Failed to search conversations' }, 500);
  }
});

// ============================================================================
// KNOWLEDGE WIKI ROUTES
// ============================================================================

// Get all wiki pages
app.get('/BrowoKoordinator-Chat/knowledge', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const category = c.req.query('category');
  const supabase = getServiceClient();

  try {
    let query = supabase
      .from('browoko_knowledge_pages')
      .select('*')
      .order('updated_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: pages, error } = await query;

    if (error) throw error;

    return c.json({ success: true, pages: pages || [] });
  } catch (error) {
    console.error('Error fetching knowledge pages:', error);
    return c.json({ error: 'Failed to fetch knowledge pages' }, 500);
  }
});

// Get wiki page by ID
app.get('/BrowoKoordinator-Chat/knowledge/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const pageId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: page, error } = await supabase
      .from('browoko_knowledge_pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (error) throw error;

    await supabase
      .from('browoko_knowledge_pages')
      .update({ view_count: (page.view_count || 0) + 1 })
      .eq('id', pageId);

    return c.json({ success: true, page });
  } catch (error) {
    console.error('Error fetching knowledge page:', error);
    return c.json({ error: 'Failed to fetch knowledge page' }, 500);
  }
});

// Create wiki page
app.post('/BrowoKoordinator-Chat/knowledge', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { title, content, category, tags } = body;

  if (!title || !content) {
    return c.json({ error: 'title and content required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: page, error } = await supabase
      .from('browoko_knowledge_pages')
      .insert({
        title,
        content,
        category,
        tags,
        created_by: auth.userId,
        updated_by: auth.userId
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, page });
  } catch (error) {
    console.error('Error creating knowledge page:', error);
    return c.json({ error: 'Failed to create knowledge page' }, 500);
  }
});

// Update wiki page
app.put('/BrowoKoordinator-Chat/knowledge/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const pageId = c.req.param('id');
  const body = await c.req.json();
  const { title, content, category, tags } = body;

  const supabase = getServiceClient();

  try {
    const { data: page, error } = await supabase
      .from('browoko_knowledge_pages')
      .update({
        title,
        content,
        category,
        tags,
        updated_by: auth.userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, page });
  } catch (error) {
    console.error('Error updating knowledge page:', error);
    return c.json({ error: 'Failed to update knowledge page' }, 500);
  }
});

// Delete wiki page
app.delete('/BrowoKoordinator-Chat/knowledge/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const pageId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: page } = await supabase
      .from('browoko_knowledge_pages')
      .select('created_by')
      .eq('id', pageId)
      .single();

    if (!page || (page.created_by !== auth.userId && !isAdmin(auth.role))) {
      return c.json({ error: 'Cannot delete this page' }, 403);
    }

    const { error } = await supabase
      .from('browoko_knowledge_pages')
      .delete()
      .eq('id', pageId);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge page:', error);
    return c.json({ error: 'Failed to delete knowledge page' }, 500);
  }
});

// Search knowledge
app.get('/BrowoKoordinator-Chat/knowledge/search', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const query = c.req.query('q');

  if (!query) {
    return c.json({ error: 'q query param required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: pages, error } = await supabase
      .from('browoko_knowledge_pages')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;

    return c.json({ success: true, pages: pages || [] });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    return c.json({ error: 'Failed to search knowledge' }, 500);
  }
});

// ============================================================================
// FEEDBACK SYSTEM ROUTES
// ============================================================================

// Get all feedback requests
app.get('/BrowoKoordinator-Chat/feedback', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const status = c.req.query('status');
  const priority = c.req.query('priority');
  const supabase = getServiceClient();

  try {
    let query = supabase
      .from('browoko_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin(auth.role)) {
      query = query.eq('submitted_by', auth.userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: feedback, error } = await query;

    if (error) throw error;

    return c.json({ success: true, feedback: feedback || [] });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return c.json({ error: 'Failed to fetch feedback' }, 500);
  }
});

// Get feedback by ID
app.get('/BrowoKoordinator-Chat/feedback/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const feedbackId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: feedback, error } = await supabase
      .from('browoko_feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (error) throw error;

    if (!isAdmin(auth.role) && feedback.submitted_by !== auth.userId) {
      return c.json({ error: 'Cannot view this feedback' }, 403);
    }

    // Get comments separately
    const { data: comments } = await supabase
      .from('browoko_feedback_comments')
      .select('*')
      .eq('feedback_id', feedbackId);

    return c.json({ 
      success: true, 
      feedback: { ...feedback, comments: comments || [] }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return c.json({ error: 'Failed to fetch feedback' }, 500);
  }
});

// Submit feedback/request
app.post('/BrowoKoordinator-Chat/feedback', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { title, description, category, priority = 'MEDIUM' } = body;

  if (!title || !description) {
    return c.json({ error: 'title and description required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: feedback, error } = await supabase
      .from('browoko_feedback')
      .insert({
        title,
        description,
        category,
        priority,
        status: 'PENDING',
        submitted_by: auth.userId
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return c.json({ error: 'Failed to submit feedback' }, 500);
  }
});

// Update feedback (admin only)
app.put('/BrowoKoordinator-Chat/feedback/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  if (!isAdmin(auth.role)) {
    return c.json({ error: 'Admin only' }, 403);
  }

  const feedbackId = c.req.param('id');
  const body = await c.req.json();
  const { status, priority, assigned_to, admin_response } = body;

  const supabase = getServiceClient();

  try {
    const { data: feedback, error } = await supabase
      .from('browoko_feedback')
      .update({
        status,
        priority,
        assigned_to,
        admin_response,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, feedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return c.json({ error: 'Failed to update feedback' }, 500);
  }
});

// Add comment to feedback
app.post('/BrowoKoordinator-Chat/feedback/:id/comments', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const feedbackId = c.req.param('id');
  const body = await c.req.json();
  const { content } = body;

  if (!content) {
    return c.json({ error: 'content required' }, 400);
  }

  const supabase = getServiceClient();

  try {
    const { data: comment, error } = await supabase
      .from('browoko_feedback_comments')
      .insert({
        feedback_id: feedbackId,
        user_id: auth.userId,
        content
      })
      .select('*')
      .single();

    if (error) throw error;

    return c.json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return c.json({ error: 'Failed to add comment' }, 500);
  }
});

// Delete feedback
app.delete('/BrowoKoordinator-Chat/feedback/:id', async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const feedbackId = c.req.param('id');
  const supabase = getServiceClient();

  try {
    const { data: feedback } = await supabase
      .from('browoko_feedback')
      .select('submitted_by')
      .eq('id', feedbackId)
      .single();

    if (!feedback || (feedback.submitted_by !== auth.userId && !isAdmin(auth.role))) {
      return c.json({ error: 'Cannot delete this feedback' }, 403);
    }

    const { error } = await supabase
      .from('browoko_feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return c.json({ error: 'Failed to delete feedback' }, 500);
  }
});

// ============================================================================
// START SERVER
// ============================================================================

Deno.serve(app.fetch);
