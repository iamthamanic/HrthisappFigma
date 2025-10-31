/**
 * BrowoKoordinator - Organigram Edge Function v1.0.0
 * 
 * Handles organizational chart system: draft/live versions, nodes, connections, publishing
 * 
 * Routes:
 * - GET  /health - Health check (NO AUTH)
 * - GET  /draft - Get draft organigram (AUTH REQUIRED)
 * - GET  /live - Get live organigram (AUTH REQUIRED)
 * - POST /nodes - Create node (ADMIN)
 * - PUT  /nodes/:id - Update node (ADMIN)
 * - DELETE /nodes/:id - Delete node (ADMIN)
 * - POST /connections - Create connection (ADMIN)
 * - DELETE /connections/:id - Delete connection (ADMIN)
 * - POST /publish - Publish draft to live (ADMIN)
 * - GET  /history - Get version history (ADMIN)
 * - POST /restore/:version - Restore version (ADMIN)
 * - POST /auto-save - Auto-save draft (ADMIN)
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
      console.error('[Organigram] Auth error:', error);
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
      console.error('[Organigram] Error fetching user data:', userError);
    }

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
      organization_id: userData?.organization_id,
    };
  } catch (error) {
    console.error('[Organigram] Auth verification failed:', error);
    return null;
  }
}

function isAdmin(role?: string): boolean {
  if (!role) return false;
  return ['ADMIN', 'SUPERADMIN', 'HR'].includes(role);
}

// ==================== ROUTES ====================

// Health check (no auth required)
app.get("/BrowoKoordinator-Organigram/health", (c) => {
  return c.json({
    status: "ok",
    function: "BrowoKoordinator-Organigram",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Get Draft Organigram
app.get("/BrowoKoordinator-Organigram/draft", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized draft request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      console.warn('[Organigram] User has no organization');
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Organigram] Get draft:', { userId: user.id, orgId: user.organization_id });

    const supabase = getSupabaseClient();

    // Fetch all draft nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('org_nodes')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_published', false)
      .order('created_at', { ascending: true });

    if (nodesError) {
      console.error('[Organigram] Error fetching draft nodes:', nodesError);
      return c.json({ error: 'Failed to fetch draft nodes', details: nodesError.message }, 500);
    }

    // Fetch all draft connections
    const { data: connections, error: connectionsError } = await supabase
      .from('node_connections')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_published', false)
      .order('created_at', { ascending: true });

    if (connectionsError) {
      console.error('[Organigram] Error fetching draft connections:', connectionsError);
      return c.json({ error: 'Failed to fetch draft connections', details: connectionsError.message }, 500);
    }

    return c.json({
      success: true,
      draft: {
        nodes: nodes || [],
        connections: connections || [],
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Get draft error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Live Organigram
app.get("/BrowoKoordinator-Organigram/live", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized live request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      console.warn('[Organigram] User has no organization');
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Organigram] Get live:', { userId: user.id, orgId: user.organization_id });

    const supabase = getSupabaseClient();

    // Fetch all live nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('org_nodes')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_published', true)
      .order('created_at', { ascending: true });

    if (nodesError) {
      console.error('[Organigram] Error fetching live nodes:', nodesError);
      return c.json({ error: 'Failed to fetch live nodes', details: nodesError.message }, 500);
    }

    // Fetch all live connections
    const { data: connections, error: connectionsError } = await supabase
      .from('node_connections')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_published', true)
      .order('created_at', { ascending: true });

    if (connectionsError) {
      console.error('[Organigram] Error fetching live connections:', connectionsError);
      return c.json({ error: 'Failed to fetch live connections', details: connectionsError.message }, 500);
    }

    return c.json({
      success: true,
      live: {
        nodes: nodes || [],
        connections: connections || [],
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Get live error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Create Node
app.post("/BrowoKoordinator-Organigram/nodes", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized create node');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const body = await c.req.json();
    const { 
      node_type,
      title,
      description,
      position_x, 
      position_y, 
      width,
      height,
      department_id,
      metadata,
    } = body;

    if (!node_type || !title || position_x === undefined || position_y === undefined) {
      return c.json({ error: 'Missing required fields: node_type, title, position_x, position_y' }, 400);
    }

    console.log('[Organigram] Create node:', { userId: user.id, node_type, title });

    const supabase = getSupabaseClient();

    // Insert node with draft status
    const { data: node, error: nodeError } = await supabase
      .from('org_nodes')
      .insert({
        organization_id: user.organization_id,
        node_type,
        title,
        description: description || null,
        position_x,
        position_y,
        width: width || 280,
        height: height || 180,
        department_id: department_id || null,
        metadata: metadata || {},
        is_published: false,
        version: 1,
        created_by: user.id,
      })
      .select()
      .single();

    if (nodeError) {
      console.error('[Organigram] Error creating node:', nodeError);
      return c.json({ error: 'Failed to create node', details: nodeError.message }, 500);
    }

    return c.json({
      success: true,
      node,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Create node error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Update Node
app.put("/BrowoKoordinator-Organigram/nodes/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized update node');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const nodeId = c.req.param('id');
    const body = await c.req.json();

    console.log('[Organigram] Update node:', { userId: user.id, nodeId });

    const supabase = getSupabaseClient();

    // Verify node exists and belongs to user's organization
    const { data: existingNode, error: checkError } = await supabase
      .from('org_nodes')
      .select('id')
      .eq('id', nodeId)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existingNode) {
      return c.json({ error: 'Node not found or access denied' }, 404);
    }

    // Update node fields
    const updateFields: any = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.position_x !== undefined) updateFields.position_x = body.position_x;
    if (body.position_y !== undefined) updateFields.position_y = body.position_y;
    if (body.width !== undefined) updateFields.width = body.width;
    if (body.height !== undefined) updateFields.height = body.height;
    if (body.node_type !== undefined) updateFields.node_type = body.node_type;
    if (body.department_id !== undefined) updateFields.department_id = body.department_id;
    if (body.metadata !== undefined) updateFields.metadata = body.metadata;

    const { data: updatedNode, error: updateError } = await supabase
      .from('org_nodes')
      .update(updateFields)
      .eq('id', nodeId)
      .select()
      .single();

    if (updateError) {
      console.error('[Organigram] Error updating node:', updateError);
      return c.json({ error: 'Failed to update node', details: updateError.message }, 500);
    }

    return c.json({
      success: true,
      node: updatedNode,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Update node error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Delete Node
app.delete("/BrowoKoordinator-Organigram/nodes/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized delete node');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const nodeId = c.req.param('id');

    console.log('[Organigram] Delete node:', { userId: user.id, nodeId });

    const supabase = getSupabaseClient();

    // Delete node (connections will be deleted via CASCADE)
    const { error: deleteError } = await supabase
      .from('org_nodes')
      .delete()
      .eq('id', nodeId)
      .eq('organization_id', user.organization_id);

    if (deleteError) {
      console.error('[Organigram] Error deleting node:', deleteError);
      return c.json({ error: 'Failed to delete node', details: deleteError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Node deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Delete node error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Create Connection
app.post("/BrowoKoordinator-Organigram/connections", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized create connection');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const body = await c.req.json();
    const { 
      source_node_id,
      source_position,
      target_node_id,
      target_position,
      line_style,
      color,
      stroke_width,
      label,
      metadata,
    } = body;

    if (!source_node_id || !source_position || !target_node_id || !target_position) {
      return c.json({ error: 'Missing required fields: source_node_id, source_position, target_node_id, target_position' }, 400);
    }

    // Prevent self-connections
    if (source_node_id === target_node_id) {
      return c.json({ error: 'Cannot create connection to same node' }, 400);
    }

    console.log('[Organigram] Create connection:', { userId: user.id, source_node_id, target_node_id });

    const supabase = getSupabaseClient();

    // Insert connection with draft status
    const { data: connection, error: connectionError } = await supabase
      .from('node_connections')
      .insert({
        organization_id: user.organization_id,
        source_node_id,
        source_position,
        target_node_id,
        target_position,
        line_style: line_style || 'curved',
        color: color || '#6B7280',
        stroke_width: stroke_width || 2,
        label: label || null,
        metadata: metadata || {},
        is_published: false,
        version: 1,
        created_by: user.id,
      })
      .select()
      .single();

    if (connectionError) {
      console.error('[Organigram] Error creating connection:', connectionError);
      return c.json({ error: 'Failed to create connection', details: connectionError.message }, 500);
    }

    return c.json({
      success: true,
      connection,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Create connection error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Delete Connection
app.delete("/BrowoKoordinator-Organigram/connections/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized delete connection');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const connectionId = c.req.param('id');

    console.log('[Organigram] Delete connection:', { userId: user.id, connectionId });

    const supabase = getSupabaseClient();

    // Delete connection
    const { error: deleteError } = await supabase
      .from('node_connections')
      .delete()
      .eq('id', connectionId)
      .eq('organization_id', user.organization_id);

    if (deleteError) {
      console.error('[Organigram] Error deleting connection:', deleteError);
      return c.json({ error: 'Failed to delete connection', details: deleteError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Connection deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Delete connection error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Publish Draft to Live
app.post("/BrowoKoordinator-Organigram/publish", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized publish');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Organigram] Publish draft to live:', { userId: user.id, orgId: user.organization_id });

    const supabase = getSupabaseClient();

    // Start transaction-like operations
    // 1. Unpublish all current live nodes & connections (archive them)
    const { error: unpublishNodesError } = await supabase
      .from('org_nodes')
      .update({ is_published: false })
      .eq('organization_id', user.organization_id)
      .eq('is_published', true);

    if (unpublishNodesError) {
      console.error('[Organigram] Error unpublishing nodes:', unpublishNodesError);
      return c.json({ error: 'Failed to unpublish nodes', details: unpublishNodesError.message }, 500);
    }

    const { error: unpublishConnectionsError } = await supabase
      .from('node_connections')
      .update({ is_published: false })
      .eq('organization_id', user.organization_id)
      .eq('is_published', true);

    if (unpublishConnectionsError) {
      console.error('[Organigram] Error unpublishing connections:', unpublishConnectionsError);
      return c.json({ error: 'Failed to unpublish connections', details: unpublishConnectionsError.message }, 500);
    }

    // 2. Get all draft nodes and increment version
    const { data: draftNodes, error: draftNodesError } = await supabase
      .from('org_nodes')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_published', false);

    if (draftNodesError) {
      console.error('[Organigram] Error fetching draft nodes:', draftNodesError);
      return c.json({ error: 'Failed to fetch draft nodes', details: draftNodesError.message }, 500);
    }

    // 3. Publish all draft nodes
    for (const node of (draftNodes || [])) {
      const { error: publishError } = await supabase
        .from('org_nodes')
        .update({ 
          is_published: true,
          version: (node.version || 1) + 1,
        })
        .eq('id', node.id);

      if (publishError) {
        console.error('[Organigram] Error publishing node:', publishError);
      }
    }

    // 4. Get all draft connections and increment version
    const { data: draftConnections, error: draftConnectionsError } = await supabase
      .from('node_connections')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_published', false);

    if (draftConnectionsError) {
      console.error('[Organigram] Error fetching draft connections:', draftConnectionsError);
      return c.json({ error: 'Failed to fetch draft connections', details: draftConnectionsError.message }, 500);
    }

    // 5. Publish all draft connections
    for (const connection of (draftConnections || [])) {
      const { error: publishError } = await supabase
        .from('node_connections')
        .update({ 
          is_published: true,
          version: (connection.version || 1) + 1,
        })
        .eq('id', connection.id);

      if (publishError) {
        console.error('[Organigram] Error publishing connection:', publishError);
      }
    }

    return c.json({
      success: true,
      message: 'Draft published to live successfully',
      published: {
        nodes: draftNodes?.length || 0,
        connections: draftConnections?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Publish error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Version History
app.get("/BrowoKoordinator-Organigram/history", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized history request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Organigram] Get history:', { userId: user.id, orgId: user.organization_id });

    const supabase = getSupabaseClient();

    // Fetch version history
    const { data: nodes, error: nodesError } = await supabase
      .from('org_nodes')
      .select('version, updated_at')
      .eq('organization_id', user.organization_id)
      .order('version', { ascending: false });

    if (nodesError) {
      console.error('[Organigram] Error fetching history:', nodesError);
      return c.json({ error: 'Failed to fetch history', details: nodesError.message }, 500);
    }

    // Group by version
    const versions = nodes?.reduce((acc: any[], node) => {
      const existing = acc.find(v => v.version === node.version);
      if (!existing) {
        acc.push({
          version: node.version,
          updated_at: node.updated_at,
        });
      }
      return acc;
    }, []) || [];

    return c.json({
      success: true,
      versions: versions.sort((a, b) => b.version - a.version),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Get history error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Restore Version
app.post("/BrowoKoordinator-Organigram/restore/:version", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized restore');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const version = parseInt(c.req.param('version'));

    console.log('[Organigram] Restore version:', { userId: user.id, version });

    const supabase = getSupabaseClient();

    // Fetch archived version
    const { data: archivedNodes, error: nodesError } = await supabase
      .from('org_nodes')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('version', version);

    if (nodesError) {
      console.error('[Organigram] Error fetching archived nodes:', nodesError);
      return c.json({ error: 'Failed to fetch archived nodes', details: nodesError.message }, 500);
    }

    const { data: archivedConnections, error: connectionsError } = await supabase
      .from('node_connections')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('version', version);

    if (connectionsError) {
      console.error('[Organigram] Error fetching archived connections:', connectionsError);
      return c.json({ error: 'Failed to fetch archived connections', details: connectionsError.message }, 500);
    }

    if (!archivedNodes || archivedNodes.length === 0) {
      return c.json({ error: 'Version not found' }, 404);
    }

    // Replace draft with archived version
    // 1. Delete current draft
    await supabase
      .from('org_nodes')
      .delete()
      .eq('organization_id', user.organization_id)
      .eq('is_published', false);

    await supabase
      .from('node_connections')
      .delete()
      .eq('organization_id', user.organization_id)
      .eq('is_published', false);

    // 2. Duplicate archived nodes as new draft
    for (const node of archivedNodes) {
      const { id, created_at, updated_at, ...nodeData } = node;
      await supabase
        .from('org_nodes')
        .insert({
          ...nodeData,
          is_published: false,
          created_by: user.id,
        });
    }

    // 3. Duplicate archived connections as new draft
    for (const connection of (archivedConnections || [])) {
      const { id, created_at, updated_at, ...connectionData } = connection;
      await supabase
        .from('node_connections')
        .insert({
          ...connectionData,
          is_published: false,
          created_by: user.id,
        });
    }

    return c.json({
      success: true,
      message: `Version ${version} restored to draft`,
      restored: {
        nodes: archivedNodes.length,
        connections: archivedConnections?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Restore version error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Auto-save Draft
app.post("/BrowoKoordinator-Organigram/auto-save", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Organigram] Unauthorized auto-save');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const body = await c.req.json();
    const { nodes, connections } = body;

    if (!nodes || !connections) {
      return c.json({ error: 'Missing required fields: nodes, connections' }, 400);
    }

    console.log('[Organigram] Auto-save:', { userId: user.id, nodesCount: nodes.length, connectionsCount: connections.length });

    const supabase = getSupabaseClient();

    // Delete all current draft items
    await supabase
      .from('org_nodes')
      .delete()
      .eq('organization_id', user.organization_id)
      .eq('is_published', false);

    await supabase
      .from('node_connections')
      .delete()
      .eq('organization_id', user.organization_id)
      .eq('is_published', false);

    // Insert new draft nodes
    for (const node of nodes) {
      const { id, created_at, updated_at, ...nodeData } = node;
      await supabase
        .from('org_nodes')
        .insert({
          ...nodeData,
          organization_id: user.organization_id,
          is_published: false,
          version: 1,
          created_by: user.id,
        });
    }

    // Insert new draft connections
    for (const connection of connections) {
      const { id, created_at, updated_at, ...connectionData } = connection;
      await supabase
        .from('node_connections')
        .insert({
          ...connectionData,
          organization_id: user.organization_id,
          is_published: false,
          version: 1,
          created_by: user.id,
        });
    }

    return c.json({
      success: true,
      message: 'Draft auto-saved successfully',
      saved: {
        nodes: nodes.length,
        connections: connections.length,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Organigram] Auto-save error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Start server
Deno.serve(app.fetch);
