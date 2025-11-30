/**
 * BrowoKoordinator - Scheduled Executions Cron Job
 * 
 * Runs every 15 minutes to process delayed workflow executions
 * 
 * Usage:
 * - Set up as Supabase Cron Job (every 15 minutes)
 * - OR call manually: POST /process
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

const kvGetByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_f659121d").select("key, value").like("key", prefix + "%");
  if (error) throw new Error(error.message);
  return data?.map((d) => d.value) ?? [];
};

const kvDel = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_f659121d").delete().eq("key", key);
  if (error) throw new Error(error.message);
};

// ==================== MIDDLEWARE ====================

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: '*',
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Info", "apikey"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400,
  }),
);

// ==================== HELPERS ====================

const getProjectId = (): string => {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('SUPABASE_URL not set');
  return url.split('//')[1]?.split('.')[0] || '';
};

const getAnonKey = (): string => {
  return Deno.env.get('SUPABASE_ANON_KEY') ?? '';
};

async function processScheduledExecutions(): Promise<{ processed: number; failed: number }> {
  console.log('🕐 Processing scheduled executions...');
  
  const now = new Date().toISOString();
  let processed = 0;
  let failed = 0;
  
  try {
    // Get all scheduled executions
    const scheduled = await kvGetByPrefix("scheduled_execution:");
    
    console.log(`   Found ${scheduled.length} scheduled executions`);
    
    for (const execution of scheduled) {
      if (execution.status !== 'SCHEDULED') {
        continue; // Skip non-scheduled
      }
      
      // Check if execution time has passed
      if (execution.executeAt > now) {
        continue; // Not yet time
      }
      
      console.log(`   ⚡ Executing scheduled: ${execution.id}`);
      console.log(`      Workflow: ${execution.workflowId}`);
      console.log(`      Execute At: ${execution.executeAt}`);
      
      try {
        // Resume workflow execution
        const projectId = getProjectId();
        const anonKey = getAnonKey();
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/execute`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              workflowId: execution.workflowId,
              context: execution.context,
              resumeFromNode: execution.nodeId, // Continue from after delay
            }),
          }
        );
        
        if (response.ok) {
          // Mark as completed
          execution.status = 'COMPLETED';
          execution.completedAt = new Date().toISOString();
          await kvSet(`scheduled_execution:${execution.id}`, execution);
          
          processed++;
          console.log(`      ✅ Completed: ${execution.id}`);
        } else {
          const error = await response.text();
          throw new Error(`Workflow execution failed: ${error}`);
        }
      } catch (error: any) {
        console.error(`      ❌ Failed to execute ${execution.id}:`, error);
        
        // Mark as failed
        execution.status = 'FAILED';
        execution.failedAt = new Date().toISOString();
        execution.error = error.message;
        await kvSet(`scheduled_execution:${execution.id}`, execution);
        
        failed++;
      }
    }
    
    // Cleanup old completed/failed executions (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    for (const execution of scheduled) {
      if (
        (execution.status === 'COMPLETED' || execution.status === 'FAILED') &&
        (execution.completedAt < thirtyDaysAgo || execution.failedAt < thirtyDaysAgo)
      ) {
        await kvDel(`scheduled_execution:${execution.id}`);
        console.log(`   🗑️ Cleaned up old execution: ${execution.id}`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error processing scheduled executions:', error);
  }
  
  console.log(`✅ Scheduled executions processing complete: ${processed} processed, ${failed} failed`);
  
  return { processed, failed };
}

// ==================== ROUTES ====================

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'BrowoKoordinator-ScheduledExecutions',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.post('/process', async (c) => {
  try {
    const result = await processScheduledExecutions();
    
    return c.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('❌ Process error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get('/pending', async (c) => {
  try {
    const scheduled = await kvGetByPrefix("scheduled_execution:");
    const pending = scheduled.filter((s: any) => s.status === 'SCHEDULED');
    
    return c.json({
      count: pending.length,
      executions: pending.map((e: any) => ({
        id: e.id,
        workflowId: e.workflowId,
        executeAt: e.executeAt,
        createdAt: e.createdAt,
      })),
    });
  } catch (e: any) {
    console.error('❌ Get pending error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// ==================== CRON ENDPOINT ====================

// This endpoint is called by Supabase Cron (every 15 minutes)
app.get('/cron', async (c) => {
  console.log('⏰ CRON TRIGGERED');
  
  const result = await processScheduledExecutions();
  
  return c.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
