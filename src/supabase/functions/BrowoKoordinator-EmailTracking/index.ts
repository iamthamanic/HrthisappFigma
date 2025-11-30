/**
 * BrowoKoordinator - Email Tracking Edge Function
 * 
 * Tracks email delivery status via Resend webhooks
 * 
 * Routes:
 * - GET    /health                    - Health check
 * - GET    /stats                     - Email statistics
 * - POST   /webhook                   - Resend webhook handler
 * - GET    /logs/:workflowExecutionId - Get email logs for workflow
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

const kvGetByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_f659121d").select("key, value").like("key", prefix + "%");
  if (error) throw new Error(error.message);
  return data?.map((d) => d.value) ?? [];
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

// ==================== ROUTES ====================

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'BrowoKoordinator-EmailTracking',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/stats', async (c) => {
  try {
    const logs = await kvGetByPrefix("email_log:");
    
    const stats = {
      total: logs.length,
      sent: logs.filter((l: any) => l.status === 'SENT').length,
      delivered: logs.filter((l: any) => l.status === 'DELIVERED').length,
      opened: logs.filter((l: any) => l.status === 'OPENED').length,
      clicked: logs.filter((l: any) => l.status === 'CLICKED').length,
      failed: logs.filter((l: any) => l.status === 'FAILED').length,
      bounced: logs.filter((l: any) => l.status === 'BOUNCED').length,
    };
    
    return c.json({ stats });
  } catch (e: any) {
    console.error('❌ Get stats error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/webhook', async (c) => {
  try {
    const body = await c.req.json();
    const event = body.type;
    const data = body.data;
    
    console.log(`📨 Resend Webhook: ${event}`);
    console.log('   Data:', JSON.stringify(data, null, 2));
    
    // Find email log by Resend ID
    const emailId = data.email_id;
    if (!emailId) {
      return c.json({ error: 'Missing email_id' }, 400);
    }
    
    // Store webhook event
    const webhookLog = {
      id: `webhook_${Date.now()}`,
      type: event,
      emailId: emailId,
      data: data,
      receivedAt: new Date().toISOString(),
    };
    
    await kvSet(`email_webhook:${webhookLog.id}`, webhookLog);
    
    // Update email log status
    const logs = await kvGetByPrefix("email_log:");
    const emailLog = logs.find((l: any) => l.resendId === emailId);
    
    if (emailLog) {
      let newStatus = emailLog.status;
      
      switch (event) {
        case 'email.sent':
          newStatus = 'SENT';
          break;
        case 'email.delivered':
          newStatus = 'DELIVERED';
          break;
        case 'email.opened':
          newStatus = 'OPENED';
          emailLog.openedAt = new Date().toISOString();
          break;
        case 'email.clicked':
          newStatus = 'CLICKED';
          emailLog.clickedAt = new Date().toISOString();
          break;
        case 'email.bounced':
          newStatus = 'BOUNCED';
          emailLog.bouncedAt = new Date().toISOString();
          emailLog.bounceReason = data.bounce?.message || 'Unknown';
          break;
        case 'email.complaint':
          newStatus = 'COMPLAINED';
          emailLog.complainedAt = new Date().toISOString();
          break;
        case 'email.failed':
          newStatus = 'FAILED';
          emailLog.failedAt = new Date().toISOString();
          emailLog.failureReason = data.error || 'Unknown';
          break;
      }
      
      emailLog.status = newStatus;
      emailLog.lastUpdated = new Date().toISOString();
      
      await kvSet(`email_log:${emailLog.id}`, emailLog);
      
      console.log(`✅ Email log updated: ${emailLog.id} -> ${newStatus}`);
    }
    
    return c.json({ success: true, event });
  } catch (e: any) {
    console.error('❌ Webhook error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get('/logs/:workflowExecutionId', async (c) => {
  try {
    const executionId = c.req.param('workflowExecutionId');
    
    const logs = await kvGetByPrefix("email_log:");
    const filtered = logs.filter((l: any) => l.workflowExecutionId === executionId);
    
    return c.json({ logs: filtered });
  } catch (e: any) {
    console.error('❌ Get logs error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/log', async (c) => {
  try {
    const body = await c.req.json();
    
    const emailLog = {
      id: body.id || `email_${Date.now()}`,
      workflowExecutionId: body.workflowExecutionId,
      workflowId: body.workflowId,
      nodeId: body.nodeId,
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      subject: body.subject,
      resendId: body.resendId,
      status: body.status || 'SENT',
      sentAt: body.sentAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    
    await kvSet(`email_log:${emailLog.id}`, emailLog);
    console.log(`📧 Email log created: ${emailLog.id}`);
    
    return c.json({ success: true, log: emailLog });
  } catch (e: any) {
    console.error('❌ Create log error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
