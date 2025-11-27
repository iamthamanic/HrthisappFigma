// ============================================================================
// BROWO KOORDINATOR - AUTOMATION GATEWAY
// ============================================================================
// 14th Edge Function - Automation & Integration Hub
// Provides OpenAPI 3.0 schema, action proxying, webhooks, and API key auth
// ============================================================================

import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// ============================================================================
// CORS & LOGGING
// ============================================================================
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use('*', logger(console.log));

// ============================================================================
// SUPABASE CLIENT
// ============================================================================
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// API KEY AUTHENTICATION MIDDLEWARE
// ============================================================================
async function authenticateApiKey(c: any, next: any) {
  const apiKey = c.req.header('X-API-Key');
  
  if (!apiKey) {
    return c.json({ error: 'API Key required. Provide X-API-Key header.' }, 401);
  }

  const supabase = getSupabaseClient();
  
  // Hash the API key for comparison (in production, use proper hashing)
  const { data: keyData, error } = await supabase
    .from('automation_api_keys')
    .select('*')
    .eq('key_hash', apiKey) // In production, hash this!
    .eq('is_active', true)
    .single();

  if (error || !keyData) {
    return c.json({ error: 'Invalid API Key' }, 401);
  }

  // Update last_used_at
  await supabase
    .from('automation_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  // Store org_id in context
  c.set('organization_id', keyData.organization_id);
  c.set('api_key_id', keyData.id);

  await next();
}

// ============================================================================
// HELPER: LOG AUTOMATION CALL
// ============================================================================
async function logAutomationCall(
  apiKeyId: string,
  action: string,
  method: string,
  success: boolean,
  errorMessage?: string
) {
  const supabase = getSupabaseClient();
  
  await supabase.from('automation_audit_log').insert({
    api_key_id: apiKeyId,
    action,
    method,
    success,
    error_message: errorMessage,
    created_at: new Date().toISOString(),
  });
}

// ============================================================================
// OPENAPI 3.0 SCHEMA GENERATOR
// ============================================================================

const EDGE_FUNCTION_ROUTES = {
  'Antragmanager': [
    { method: 'GET', path: '/leave-requests', description: 'Get all leave requests' },
    { method: 'POST', path: '/leave-requests', description: 'Create a new leave request' },
    { method: 'GET', path: '/leave-requests/:id', description: 'Get leave request by ID' },
    { method: 'PUT', path: '/leave-requests/:id', description: 'Update leave request' },
    { method: 'DELETE', path: '/leave-requests/:id', description: 'Delete leave request' },
    { method: 'POST', path: '/leave-requests/:id/approve', description: 'Approve leave request' },
    { method: 'POST', path: '/leave-requests/:id/reject', description: 'Reject leave request' },
    { method: 'GET', path: '/leave-requests/pending', description: 'Get pending leave requests' },
    { method: 'GET', path: '/leave-requests/team/:teamId', description: 'Get team leave requests' },
    { method: 'GET', path: '/leave-balance', description: 'Get leave balance for user' },
  ],
  'Personalakte': [
    { method: 'GET', path: '/users', description: 'Get all users/employees' },
    { method: 'POST', path: '/users', description: 'Create new employee' },
    { method: 'GET', path: '/users/:id', description: 'Get user by ID' },
    { method: 'PUT', path: '/users/:id', description: 'Update user' },
    { method: 'DELETE', path: '/users/:id', description: 'Delete user' },
    { method: 'GET', path: '/users/:id/profile', description: 'Get user profile' },
    { method: 'PUT', path: '/users/:id/profile', description: 'Update user profile' },
    { method: 'GET', path: '/teams', description: 'Get all teams' },
    { method: 'POST', path: '/teams', description: 'Create new team' },
    { method: 'PUT', path: '/teams/:id', description: 'Update team' },
    { method: 'POST', path: '/teams/:id/members', description: 'Add team member' },
    { method: 'DELETE', path: '/teams/:id/members/:userId', description: 'Remove team member' },
  ],
  'Dokumente': [
    { method: 'GET', path: '/documents', description: 'Get all documents' },
    { method: 'POST', path: '/documents', description: 'Upload new document' },
    { method: 'GET', path: '/documents/:id', description: 'Get document by ID' },
    { method: 'PUT', path: '/documents/:id', description: 'Update document metadata' },
    { method: 'DELETE', path: '/documents/:id', description: 'Delete document' },
    { method: 'GET', path: '/documents/:id/download', description: 'Download document' },
    { method: 'POST', path: '/documents/:id/share', description: 'Share document with user' },
    { method: 'GET', path: '/documents/category/:category', description: 'Get documents by category' },
  ],
  'Lernen': [
    { method: 'GET', path: '/videos', description: 'Get all learning videos' },
    { method: 'POST', path: '/videos', description: 'Create new video' },
    { method: 'GET', path: '/videos/:id', description: 'Get video by ID' },
    { method: 'PUT', path: '/videos/:id', description: 'Update video' },
    { method: 'DELETE', path: '/videos/:id', description: 'Delete video' },
    { method: 'POST', path: '/videos/:id/progress', description: 'Update video progress' },
    { method: 'GET', path: '/quizzes', description: 'Get all quizzes' },
    { method: 'POST', path: '/quizzes', description: 'Create new quiz' },
    { method: 'POST', path: '/quizzes/:id/attempt', description: 'Submit quiz attempt' },
    { method: 'GET', path: '/learning-progress/:userId', description: 'Get user learning progress' },
  ],
  'Benefits': [
    { method: 'GET', path: '/benefits', description: 'Get all benefits' },
    { method: 'POST', path: '/benefits', description: 'Create new benefit' },
    { method: 'GET', path: '/benefits/:id', description: 'Get benefit by ID' },
    { method: 'PUT', path: '/benefits/:id', description: 'Update benefit' },
    { method: 'DELETE', path: '/benefits/:id', description: 'Delete benefit' },
    { method: 'POST', path: '/benefits/:id/request', description: 'Request benefit' },
    { method: 'POST', path: '/benefits/:id/approve', description: 'Approve benefit request' },
    { method: 'GET', path: '/shop-items', description: 'Get all shop items' },
    { method: 'POST', path: '/shop-items/:id/purchase', description: 'Purchase shop item with coins' },
    { method: 'GET', path: '/coins/balance', description: 'Get user coin balance' },
    { method: 'POST', path: '/coins/award', description: 'Award coins to user' },
    { method: 'GET', path: '/achievements', description: 'Get all achievements' },
    { method: 'POST', path: '/achievements/:id/award', description: 'Award achievement to user' },
  ],
  'Zeiterfassung': [
    { method: 'POST', path: '/clock-in', description: 'Clock in (start work session)' },
    { method: 'POST', path: '/clock-out', description: 'Clock out (end work session)' },
    { method: 'GET', path: '/work-sessions', description: 'Get work sessions' },
    { method: 'GET', path: '/work-sessions/:id', description: 'Get work session by ID' },
    { method: 'PUT', path: '/work-sessions/:id', description: 'Update work session' },
    { method: 'DELETE', path: '/work-sessions/:id', description: 'Delete work session' },
    { method: 'GET', path: '/work-sessions/today', description: 'Get today\'s work sessions' },
    { method: 'GET', path: '/work-hours/summary', description: 'Get work hours summary' },
  ],
  'Kalender': [
    { method: 'GET', path: '/calendar', description: 'Get calendar events' },
    { method: 'GET', path: '/calendar/:date', description: 'Get calendar for specific date' },
    { method: 'GET', path: '/calendar/team/:teamId', description: 'Get team calendar' },
    { method: 'GET', path: '/absences', description: 'Get absences' },
    { method: 'GET', path: '/absences/today', description: 'Get today\'s absences' },
    { method: 'GET', path: '/holidays', description: 'Get holidays' },
  ],
  'Organigram': [
    { method: 'GET', path: '/organigram', description: 'Get organization chart' },
    { method: 'GET', path: '/organigram/nodes', description: 'Get all organigram nodes' },
    { method: 'POST', path: '/organigram/nodes', description: 'Create organigram node' },
    { method: 'PUT', path: '/organigram/nodes/:id', description: 'Update organigram node' },
    { method: 'DELETE', path: '/organigram/nodes/:id', description: 'Delete organigram node' },
    { method: 'POST', path: '/organigram/publish', description: 'Publish organigram draft' },
  ],
  'Chat': [
    { method: 'GET', path: '/conversations', description: 'Get all conversations' },
    { method: 'POST', path: '/conversations', description: 'Create new conversation' },
    { method: 'GET', path: '/conversations/:id/messages', description: 'Get conversation messages' },
    { method: 'POST', path: '/conversations/:id/messages', description: 'Send message' },
    { method: 'PUT', path: '/messages/:id', description: 'Update message' },
    { method: 'DELETE', path: '/messages/:id', description: 'Delete message' },
    { method: 'POST', path: '/conversations/:id/typing', description: 'Set typing indicator' },
    { method: 'POST', path: '/messages/:id/read', description: 'Mark message as read' },
  ],
  'Analytics': [
    { method: 'GET', path: '/stats/overview', description: 'Get overview statistics' },
    { method: 'GET', path: '/stats/leave-requests', description: 'Get leave request statistics' },
    { method: 'GET', path: '/stats/work-hours', description: 'Get work hours statistics' },
    { method: 'GET', path: '/stats/learning', description: 'Get learning statistics' },
    { method: 'GET', path: '/stats/benefits', description: 'Get benefits statistics' },
  ],
  'Notification': [
    { method: 'GET', path: '/notifications', description: 'Get user notifications' },
    { method: 'POST', path: '/notifications', description: 'Create notification' },
    { method: 'PUT', path: '/notifications/:id/read', description: 'Mark notification as read' },
    { method: 'DELETE', path: '/notifications/:id', description: 'Delete notification' },
    { method: 'PUT', path: '/notifications/read-all', description: 'Mark all notifications as read' },
  ],
  'Tasks': [
    { method: 'GET', path: '/tasks', description: 'Get all tasks' },
    { method: 'POST', path: '/tasks', description: 'Create new task' },
    { method: 'GET', path: '/tasks/:id', description: 'Get task by ID' },
    { method: 'PUT', path: '/tasks/:id', description: 'Update task' },
    { method: 'DELETE', path: '/tasks/:id', description: 'Delete task' },
    { method: 'PUT', path: '/tasks/:id/complete', description: 'Mark task as complete' },
  ],
  'Field': [
    { method: 'GET', path: '/equipment', description: 'Get all equipment' },
    { method: 'POST', path: '/equipment', description: 'Create equipment' },
    { method: 'PUT', path: '/equipment/:id', description: 'Update equipment' },
    { method: 'DELETE', path: '/equipment/:id', description: 'Delete equipment' },
    { method: 'GET', path: '/vehicles', description: 'Get all vehicles' },
    { method: 'POST', path: '/vehicles', description: 'Create vehicle' },
    { method: 'PUT', path: '/vehicles/:id', description: 'Update vehicle' },
    { method: 'DELETE', path: '/vehicles/:id', description: 'Delete vehicle' },
  ],
};

function generateOpenAPISchema() {
  const paths: any = {};

  // Generate paths from all edge functions
  for (const [functionName, routes] of Object.entries(EDGE_FUNCTION_ROUTES)) {
    for (const route of routes) {
      const fullPath = `/automation/actions/${functionName.toLowerCase()}${route.path}`;
      
      if (!paths[fullPath]) {
        paths[fullPath] = {};
      }

      paths[fullPath][route.method.toLowerCase()] = {
        summary: route.description,
        tags: [functionName],
        security: [{ ApiKeyAuth: [] }],
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - Invalid API Key',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      };
    }
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Browo Koordinator Automation API',
      version: '1.0.0',
      description: 'Complete automation API for Browo Koordinator HR System. All endpoints support n8n and Zapier integration.',
      contact: {
        name: 'Browo Koordinator Support',
      },
    },
    servers: [
      {
        url: `${supabaseUrl}/functions/v1/BrowoKoordinator-Automation`,
        description: 'Production Server',
      },
    ],
    security: [
      { ApiKeyAuth: [] },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key for organization authentication. Generate in Settings > Automation.',
        },
      },
    },
    paths,
    tags: Object.keys(EDGE_FUNCTION_ROUTES).map((name) => ({
      name,
      description: `${name} module endpoints`,
    })),
  };
}

// ============================================================================
// ROUTES
// ============================================================================

// ============================================================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================================================

// Health Check
app.get('/BrowoKoordinator-Automation/automation/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'BrowoKoordinator-Automation',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    message: 'Automation Gateway is running. 186+ actions available.',
  });
});

// ============================================================================
// OPENAPI SCHEMA (no auth required - public schema)
// ============================================================================
app.get('/BrowoKoordinator-Automation/make-server-f659121d/automation/schema', (c) => {
  const schema = generateOpenAPISchema();
  return c.json(schema);
});

// ============================================================================
// AVAILABLE ACTIONS (no auth required - discovery)
// ============================================================================
app.get('/BrowoKoordinator-Automation/make-server-f659121d/automation/actions', (c) => {
  const actions = [];
  
  for (const [functionName, routes] of Object.entries(EDGE_FUNCTION_ROUTES)) {
    for (const route of routes) {
      actions.push({
        id: `${functionName.toLowerCase()}.${route.path.replace(/\//g, '.').replace(/:/g, '')}`,
        module: functionName,
        method: route.method,
        path: route.path,
        description: route.description,
        endpoint: `/automation/actions/${functionName.toLowerCase()}${route.path}`,
      });
    }
  }

  return c.json({
    total: actions.length,
    actions,
    modules: Object.keys(EDGE_FUNCTION_ROUTES),
  });
});

// ============================================================================
// API KEY MANAGEMENT (requires auth)
// ============================================================================

// Generate new API Key
app.post('/BrowoKoordinator-Automation/make-server-f659121d/automation/api-keys/generate', async (c) => {
  try {
    // Use Supabase Auth instead of API Key for this endpoint
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ error: 'Invalid auth token' }, 401);
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    // Case-insensitive role check (supports both 'hr'/'HR' and 'superadmin'/'SUPERADMIN')
    const userRole = userData?.role?.toLowerCase();
    if (!userData || !['hr', 'superadmin'].includes(userRole)) {
      console.error('Authorization failed - User role:', userData?.role, 'Lowercase:', userRole);
      return c.json({ error: 'Only HR/Superadmin can generate API keys' }, 403);
    }

    // Generate API Key (in production, use crypto.randomUUID() and hash it)
    const apiKey = `browoko-${crypto.randomUUID()}`;
    
    const body = await c.req.json();
    const { name } = body;

    const { data: keyData, error } = await supabase
      .from('automation_api_keys')
      .insert({
        organization_id: userData.organization_id,
        key_hash: apiKey, // In production, hash this!
        name: name || 'Automation Key',
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return c.json({ error: 'Failed to create API key', details: error.message }, 500);
    }

    return c.json({
      success: true,
      api_key: apiKey, // Only shown once!
      key_id: keyData.id,
      name: keyData.name,
      created_at: keyData.created_at,
      warning: 'Save this key securely. It will not be shown again!',
    });
  } catch (error: any) {
    console.error('Exception generating API key:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// List API Keys
app.get('/BrowoKoordinator-Automation/make-server-f659121d/automation/api-keys', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Authorization required' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return c.json({ error: 'Invalid auth token' }, 401);
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: keys, error } = await supabase
    .from('automation_api_keys')
    .select('id, name, is_active, created_at, last_used_at')
    .eq('organization_id', userData!.organization_id)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: 'Failed to fetch API keys' }, 500);
  }

  return c.json({ keys });
});

// Revoke API Key
app.delete('/BrowoKoordinator-Automation/make-server-f659121d/automation/api-keys/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Authorization required' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return c.json({ error: 'Invalid auth token' }, 401);
  }

  const keyId = c.req.param('id');

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { error } = await supabase
    .from('automation_api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('organization_id', userData!.organization_id);

  if (error) {
    return c.json({ error: 'Failed to revoke API key' }, 500);
  }

  return c.json({ success: true, message: 'API key revoked' });
});

// ============================================================================
// ACTION PROXY (requires API key auth)
// ============================================================================

// Proxy all actions to respective edge functions
app.all('/BrowoKoordinator-Automation/make-server-f659121d/automation/actions/:module/*', authenticateApiKey, async (c) => {
  const module = c.req.param('module');
  const path = c.req.url.split(`/automation/actions/${module}`)[1];
  const method = c.req.method;
  
  // Map module name to Edge Function name
  const functionNameMap: any = {
    'antragmanager': 'BrowoKoordinator-Antragmanager',
    'personalakte': 'BrowoKoordinator-Personalakte',
    'dokumente': 'BrowoKoordinator-Dokumente',
    'lernen': 'BrowoKoordinator-Lernen',
    'benefits': 'BrowoKoordinator-Benefits',
    'zeiterfassung': 'BrowoKoordinator-Zeiterfassung',
    'kalender': 'BrowoKoordinator-Kalender',
    'organigram': 'BrowoKoordinator-Organigram',
    'chat': 'BrowoKoordinator-Chat',
    'analytics': 'BrowoKoordinator-Analytics',
    'notification': 'BrowoKoordinator-Notification',
    'tasks': 'BrowoKoordinator-Tasks',
    'field': 'BrowoKoordinator-Field',
  };

  const functionName = functionNameMap[module.toLowerCase()];
  
  if (!functionName) {
    await logAutomationCall(
      c.get('api_key_id'),
      `${module}${path}`,
      method,
      false,
      'Unknown module'
    );
    return c.json({ error: `Unknown module: ${module}` }, 404);
  }

  try {
    // Proxy request to target Edge Function
    const targetUrl = `${supabaseUrl}/functions/v1/${functionName}/make-server-f659121d${path}`;
    
    const headers: any = {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      'Content-Type': 'application/json',
      'X-Organization-ID': c.get('organization_id'), // Pass org_id for RLS
    };

    const requestInit: any = {
      method,
      headers,
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const body = await c.req.json();
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(targetUrl, requestInit);
    const data = await response.json();

    await logAutomationCall(
      c.get('api_key_id'),
      `${module}${path}`,
      method,
      response.ok,
      response.ok ? undefined : data.error
    );

    return c.json(data, response.status);
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    await logAutomationCall(
      c.get('api_key_id'),
      `${module}${path}`,
      method,
      false,
      error.message
    );

    return c.json({ error: 'Proxy error', details: error.message }, 500);
  }
});

// ============================================================================
// WEBHOOK MANAGEMENT (Future - for Triggers)
// ============================================================================

// Register Webhook
app.post('/BrowoKoordinator-Automation/make-server-f659121d/automation/webhooks/register', authenticateApiKey, async (c) => {
  const body = await c.req.json();
  const { event_type, webhook_url, secret } = body;

  if (!event_type || !webhook_url) {
    return c.json({ error: 'event_type and webhook_url required' }, 400);
  }

  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('automation_webhooks')
    .insert({
      organization_id: c.get('organization_id'),
      event_type,
      webhook_url,
      secret,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: 'Failed to register webhook' }, 500);
  }

  return c.json({
    success: true,
    webhook: data,
    message: 'Webhook registered. It will receive events for: ' + event_type,
  });
});

// List Webhooks
app.get('/BrowoKoordinator-Automation/make-server-f659121d/automation/webhooks', authenticateApiKey, async (c) => {
  const supabase = getSupabaseClient();
  
  const { data: webhooks, error } = await supabase
    .from('automation_webhooks')
    .select('*')
    .eq('organization_id', c.get('organization_id'))
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: 'Failed to fetch webhooks' }, 500);
  }

  return c.json({ webhooks });
});

// Delete Webhook
app.delete('/BrowoKoordinator-Automation/make-server-f659121d/automation/webhooks/:id', authenticateApiKey, async (c) => {
  const webhookId = c.req.param('id');
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('automation_webhooks')
    .delete()
    .eq('id', webhookId)
    .eq('organization_id', c.get('organization_id'));

  if (error) {
    return c.json({ error: 'Failed to delete webhook' }, 500);
  }

  return c.json({ success: true, message: 'Webhook deleted' });
});

// ============================================================================
// AUDIT LOG (requires auth)
// ============================================================================
app.get('/BrowoKoordinator-Automation/make-server-f659121d/automation/audit-log', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Authorization required' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return c.json({ error: 'Invalid auth token' }, 401);
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  // Get audit logs for this organization's API keys
  const { data: logs, error } = await supabase
    .from('automation_audit_log')
    .select(`
      *,
      automation_api_keys (
        name,
        organization_id
      )
    `)
    .eq('automation_api_keys.organization_id', userData!.organization_id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Audit log error:', error);
    return c.json({ error: 'Failed to fetch audit logs' }, 500);
  }

  return c.json({ logs });
});

// ============================================================================
// START SERVER
// ============================================================================
Deno.serve(app.fetch);