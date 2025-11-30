/**
 * BrowoKoordinator - Email Templates Edge Function
 * 
 * Handles CRUD operations for email templates
 * 
 * Routes:
 * - GET    /health                    - Health check (NO AUTH)
 * - GET    /templates                 - Get all templates (AUTH REQUIRED)
 * - GET    /templates/:id             - Get single template (AUTH REQUIRED)
 * - POST   /templates                 - Create template (ADMIN/HR)
 * - PUT    /templates/:id             - Update template (ADMIN/HR)
 * - DELETE /templates/:id             - Delete template (ADMIN/HR)
 * - POST   /templates/:id/render      - Render template with variables (AUTH REQUIRED)
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// ==================== KV STORE ====================

const kvClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const kvSet = async (key: string, value: any): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_f659121d").upsert({ key, value });
  if (error) throw new Error(error.message);
};

const kvGet = async (key: string): Promise<any> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_f659121d").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

const kvDel = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_f659121d").delete().eq("key", key);
  if (error) throw new Error(error.message);
};

const kvGetByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_f659121d").select("key, value").like("key", prefix + "%");
  if (error) throw new Error(error.message);
  return data?.map((d) => d.value) ?? [];
};

// ==================== SUPABASE CLIENT ====================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// ==================== MIDDLEWARE ====================

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: '*',
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Info", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400,
  }),
);

// ==================== AUTH ====================

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
      console.error('[EmailTemplates] Auth error:', error);
      return null;
    }

    const supabaseAdmin = getSupabaseClient();
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[EmailTemplates] Error fetching user data:', userError);
    }

    return {
      id: user.id,
      email: user.email,
      role: userData?.role,
      organization_id: userData?.organization_id,
    };
  } catch (error) {
    console.error('[EmailTemplates] Auth verification error:', error);
    return null;
  }
}

function isAdminOrHR(role?: string): boolean {
  return role === 'ADMIN' || role === 'HR' || role === 'SUPERADMIN';
}

// ==================== TEMPLATE RENDERING ====================

function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  
  return result;
}

// ==================== ROUTES ====================

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'BrowoKoordinator-EmailTemplates',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/templates', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const templates = await kvGetByPrefix("email_template:");
    
    const orgTemplates = templates.filter((t: any) => 
      t.organization_id === user.organization_id
    );
    
    return c.json({ templates: orgTemplates });
  } catch (e: any) {
    console.error('❌ Get templates error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get('/templates/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const template = await kvGet(`email_template:${id}`);
    
    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    if (template.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }
    
    return c.json({ template });
  } catch (e: any) {
    console.error('❌ Get template error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/templates', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user || !isAdminOrHR(user.role)) {
    return c.json({ error: 'Unauthorized - Admin/HR only' }, 403);
  }

  try {
    const body = await c.req.json();
    const { id, name, subject, body_html, body_text, category, variables } = body;
    
    if (!id || !name || !subject) {
      return c.json({ error: 'ID, name and subject are required' }, 400);
    }

    const template = {
      id,
      name,
      subject,
      body_html: body_html || '',
      body_text: body_text || '',
      category: category || 'GENERAL',
      variables: variables || [],
      organization_id: user.organization_id,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kvSet(`email_template:${id}`, template);
    console.log(`✅ Template created: ${id} by user ${user.id}`);
    
    return c.json({ success: true, template });
  } catch (e: any) {
    console.error('❌ Create template error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.put('/templates/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user || !isAdminOrHR(user.role)) {
    return c.json({ error: 'Unauthorized - Admin/HR only' }, 403);
  }

  try {
    const id = c.req.param('id');
    const existing = await kvGet(`email_template:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }

    if (existing.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const updates = await c.req.json();
    const template = {
      ...existing,
      ...updates,
      id,
      organization_id: existing.organization_id,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    await kvSet(`email_template:${id}`, template);
    console.log(`✅ Template updated: ${id} by user ${user.id}`);
    
    return c.json({ success: true, template });
  } catch (e: any) {
    console.error('❌ Update template error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.delete('/templates/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user || !isAdminOrHR(user.role)) {
    return c.json({ error: 'Unauthorized - Admin/HR only' }, 403);
  }

  try {
    const id = c.req.param('id');
    const template = await kvGet(`email_template:${id}`);
    
    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    if (template.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await kvDel(`email_template:${id}`);
    console.log(`🗑️ Template deleted: ${id} by user ${user.id}`);
    
    return c.json({ success: true });
  } catch (e: any) {
    console.error('❌ Delete template error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/templates/:id/render', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const template = await kvGet(`email_template:${id}`);
    
    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    if (template.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const body = await c.req.json();
    const variables = body.variables || {};

    const renderedSubject = renderTemplate(template.subject, variables);
    const renderedBodyHtml = renderTemplate(template.body_html, variables);
    const renderedBodyText = renderTemplate(template.body_text, variables);

    return c.json({
      success: true,
      rendered: {
        subject: renderedSubject,
        body_html: renderedBodyHtml,
        body_text: renderedBodyText,
      },
    });
  } catch (e: any) {
    console.error('❌ Render template error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
