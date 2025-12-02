/**
 * BrowoKoordinator-Workflows Edge Function
 * Main entry point for workflow engine and environment variables
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';
import * as envVarsManager from './envVarsManager.ts';
import * as kv from './kv_store.tsx';
import type { EnvironmentVariableInput } from './types.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Remove function base path
    const base = '/BrowoKoordinator-Workflows';
    const path = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;

    // Extract organization from context (in real app, get from auth)
    // For now, use a default organization ID
    const organizationId = 'default-org'; // TODO: Get from authenticated user

    console.log(`📥 Request: ${req.method} ${path}`);

    // ============================================
    // WORKFLOWS ROUTES
    // ============================================

    // GET /workflows - List all workflows
    if (path === '/workflows' && req.method === 'GET') {
      try {
        const workflows = await kv.getByPrefix(`workflow:${organizationId}:`);
        
        return new Response(
          JSON.stringify({ workflows }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // GET /workflows/:id - Get specific workflow
    if (path.startsWith('/workflows/') && req.method === 'GET') {
      const workflowId = path.split('/')[2];
      
      try {
        const workflow = await kv.get(`workflow:${organizationId}:${workflowId}`);
        
        if (!workflow) {
          return new Response(
            JSON.stringify({ error: 'Workflow not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            }
          );
        }
        
        return new Response(
          JSON.stringify({ workflow }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // POST /workflows - Create or update workflow
    if (path === '/workflows' && req.method === 'POST') {
      try {
        const workflowData = await req.json();
        const workflowId = workflowData.id || `wf_${Date.now()}`;
        
        const workflow = {
          ...workflowData,
          id: workflowId,
          organization_id: organizationId,
          updated_at: new Date().toISOString(),
          created_at: workflowData.created_at || new Date().toISOString(),
        };
        
        await kv.set(`workflow:${organizationId}:${workflowId}`, workflow);
        
        return new Response(
          JSON.stringify({ workflow }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // DELETE /workflows/:id - Delete workflow
    if (path.startsWith('/workflows/') && req.method === 'DELETE') {
      const workflowId = path.split('/')[2];
      
      try {
        await kv.del(`workflow:${organizationId}:${workflowId}`);
        
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // POST /trigger - Trigger workflows based on event
    if (path === '/trigger' && req.method === 'POST') {
      try {
        const { trigger_type, context } = await req.json();
        
        console.log(`🔔 Trigger received: ${trigger_type}`, context);
        
        // Get all workflows for this organization
        const workflows = await kv.getByPrefix(`workflow:${organizationId}:`);
        
        // Filter workflows matching this trigger type
        const matchingWorkflows = workflows.filter((wf: any) => {
          if (!wf.is_active) return false;
          if (wf.trigger_type !== trigger_type) return false;
          
          // Apply trigger config filters
          const config = wf.trigger_config || {};
          
          // Department filter
          if (config.department_ids && config.department_ids.length > 0) {
            if (!context.department_id || !config.department_ids.includes(context.department_id)) {
              return false;
            }
          }
          
          // Location filter
          if (config.location_ids && config.location_ids.length > 0) {
            if (!context.location_id || !config.location_ids.includes(context.location_id)) {
              return false;
            }
          }
          
          // Role filter
          if (config.role_ids && config.role_ids.length > 0) {
            if (!context.role_id || !config.role_ids.includes(context.role_id)) {
              return false;
            }
          }
          
          // Specific ID filters (video_id, test_id, etc.)
          if (config.video_id && context.video_id !== config.video_id) return false;
          if (config.test_id && context.test_id !== config.test_id) return false;
          if (config.quiz_id && context.quiz_id !== config.quiz_id) return false;
          if (config.benefit_id && context.benefit_id !== config.benefit_id) return false;
          if (config.task_id && context.task_id !== config.task_id) return false;
          if (config.team_id && context.team_id !== config.team_id) return false;
          if (config.achievement_id && context.achievement_id !== config.achievement_id) return false;
          
          // Threshold filters
          if (config.xp_threshold && (!context.xp || context.xp < config.xp_threshold)) return false;
          if (config.coin_threshold && (!context.coins || context.coins < config.coin_threshold)) return false;
          if (config.level && context.level !== config.level) return false;
          if (config.min_score && (!context.score || context.score < config.min_score)) return false;
          
          // Request type filter
          if (config.request_type && config.request_type !== 'all') {
            if (context.request_type !== config.request_type) return false;
          }
          
          return true;
        });
        
        console.log(`✅ Found ${matchingWorkflows.length} matching workflows`);
        
        // TODO: Execute workflows (placeholder for now)
        // In production, this would queue workflow executions
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            triggered_workflows: matchingWorkflows.length,
            workflows: matchingWorkflows.map((w: any) => ({ id: w.id, name: w.name }))
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // ============================================
    // ENVIRONMENT VARIABLES ROUTES
    // ============================================

    // GET /env-vars - List all environment variables
    if (path === '/env-vars' && req.method === 'GET') {
      const variables = await envVarsManager.getAllEnvVars(organizationId);
      
      return new Response(
        JSON.stringify({ variables }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // POST /env-vars - Create new environment variable
    if (path === '/env-vars' && req.method === 'POST') {
      const input: EnvironmentVariableInput = await req.json();
      
      try {
        const variable = await envVarsManager.createEnvVar(organizationId, input);
        
        return new Response(
          JSON.stringify({ variable }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }

    // PUT /env-vars/:id - Update environment variable
    if (path.startsWith('/env-vars/') && req.method === 'PUT') {
      const id = path.split('/')[2];
      const input: Partial<EnvironmentVariableInput> = await req.json();
      
      try {
        const variable = await envVarsManager.updateEnvVar(organizationId, id, input);
        
        return new Response(
          JSON.stringify({ variable }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }

    // DELETE /env-vars/:id - Delete environment variable
    if (path.startsWith('/env-vars/') && req.method === 'DELETE') {
      const id = path.split('/')[2];
      
      try {
        await envVarsManager.deleteEnvVar(organizationId, id);
        
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }

    // 404 - Route not found
    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});