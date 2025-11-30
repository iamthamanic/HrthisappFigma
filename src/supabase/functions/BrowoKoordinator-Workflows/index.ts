/**
 * BrowoKoordinator - Workflows Edge Function v1.1.0
 * 
 * Handles Onboarding/Offboarding workflows with node-based execution engine
 * 
 * Routes:
 * - GET    /health                    - Health check (NO AUTH)
 * - GET    /workflows                 - Get all workflows (AUTH REQUIRED)
 * - GET    /workflows/:id             - Get single workflow (AUTH REQUIRED)
 * - POST   /workflows                 - Create workflow (ADMIN/HR)
 * - PUT    /workflows/:id             - Update workflow (ADMIN/HR)
 * - DELETE /workflows/:id             - Delete workflow (ADMIN/HR)
 * - POST   /workflows/:id/execute     - Execute workflow manually (AUTH REQUIRED)
 * - POST   /trigger                   - Trigger workflows by event type (INTERNAL)
 * - GET    /executions                - Get execution logs (AUTH REQUIRED)
 * - GET    /executions/:id            - Get single execution (AUTH REQUIRED)
 * - GET    /trigger-types             - Get all available trigger types (AUTH REQUIRED)
 * 
 * ARCHITECTURE:
 * - Uses KV Store for workflow definitions & execution logs
 * - Node-based workflow engine (similar to n8n/ComfyUI)
 * - Event-driven: ANY action in BrowoKoordinator can trigger workflows
 * - Supports: Email, Tasks, Documents, Benefits, Coins
 * 
 * TRIGGER TYPES (Event-Driven):
 * - EMPLOYEE_CREATED, EMPLOYEE_UPDATED, EMPLOYEE_DELETED
 * - VEHICLE_ASSIGNED, VEHICLE_RETURNED
 * - EQUIPMENT_ASSIGNED, EQUIPMENT_RETURNED
 * - DOCUMENT_UPLOADED, DOCUMENT_SIGNED
 * - BENEFIT_ASSIGNED, BENEFIT_REMOVED
 * - ONBOARDING_START, OFFBOARDING_START
 * - TASK_COMPLETED, TRAINING_COMPLETED
 * - CONTRACT_SIGNED, PROBATION_END
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import { executeAction as executeActionV2 } from './actionExecutor.ts';

const app = new Hono();

// ==================== TRIGGER REGISTRY (INLINE) ====================

interface TriggerDefinition {
  key: string;
  label: string;
  category: 'employee' | 'vehicle' | 'equipment' | 'document' | 'benefit' | 'task' | 'training' | 'contract' | 'other';
  description: string;
  sourceFunction: string;
  expectedContext: string[];
  implemented: boolean;
}

const TRIGGER_REGISTRY: TriggerDefinition[] = [
  // ==================== EMPLOYEE ====================
  {
    key: 'EMPLOYEE_CREATED',
    label: 'Mitarbeiter erstellt',
    category: 'employee',
    description: 'Wird ausgelöst, wenn ein neuer Mitarbeiter angelegt wird',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'employeeEmail', 'department', 'organizationId'],
    implemented: true,
  },
  {
    key: 'EMPLOYEE_UPDATED',
    label: 'Mitarbeiter geändert',
    category: 'employee',
    description: 'Wird ausgelöst, wenn Mitarbeiter-Daten geändert werden',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'changedFields', 'organizationId'],
    implemented: true,
  },
  {
    key: 'EMPLOYEE_DELETED',
    label: 'Mitarbeiter gelöscht',
    category: 'employee',
    description: 'Wird ausgelöst, wenn ein Mitarbeiter gelöscht wird',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'organizationId'],
    implemented: true,
  },
  {
    key: 'ONBOARDING_START',
    label: 'Onboarding gestartet',
    category: 'employee',
    description: 'Wird ausgelöst, wenn der Onboarding-Prozess startet',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'startDate', 'organizationId'],
    implemented: true,
  },
  {
    key: 'OFFBOARDING_START',
    label: 'Offboarding gestartet',
    category: 'employee',
    description: 'Wird ausgelöst, wenn der Offboarding-Prozess startet',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'endDate', 'organizationId'],
    implemented: true,
  },
  
  // ==================== VEHICLE ====================
  {
    key: 'VEHICLE_ASSIGNED',
    label: 'Fahrzeug zugewiesen',
    category: 'vehicle',
    description: 'Wird ausgelöst, wenn ein Fahrzeug einem Mitarbeiter zugewiesen wird',
    sourceFunction: 'BrowoKoordinator-Flotte',
    expectedContext: ['vehicleId', 'vehicleName', 'userId', 'userName', 'assignmentDate', 'organizationId'],
    implemented: false,
  },
  {
    key: 'VEHICLE_RETURNED',
    label: 'Fahrzeug zurückgegeben',
    category: 'vehicle',
    description: 'Wird ausgelöst, wenn ein Fahrzeug zurückgegeben wird',
    sourceFunction: 'BrowoKoordinator-Flotte',
    expectedContext: ['vehicleId', 'vehicleName', 'userId', 'userName', 'returnDate', 'organizationId'],
    implemented: false,
  },
  {
    key: 'VEHICLE_DAMAGE_REPORTED',
    label: 'Fahrzeugschaden gemeldet',
    category: 'vehicle',
    description: 'Wird ausgelöst, wenn ein Schaden am Fahrzeug gemeldet wird',
    sourceFunction: 'BrowoKoordinator-Flotte',
    expectedContext: ['vehicleId', 'vehicleName', 'userId', 'damageDescription', 'reportDate', 'organizationId'],
    implemented: false,
  },
  
  // ==================== EQUIPMENT ====================
  {
    key: 'EQUIPMENT_ASSIGNED',
    label: 'IT-Equipment zugewiesen',
    category: 'equipment',
    description: 'Wird ausgelöst, wenn IT-Equipment einem Mitarbeiter zugewiesen wird',
    sourceFunction: 'BrowoKoordinator-Equipment',
    expectedContext: ['equipmentId', 'equipmentType', 'equipmentName', 'userId', 'userName', 'assignmentDate', 'organizationId'],
    implemented: false,
  },
  {
    key: 'EQUIPMENT_RETURNED',
    label: 'IT-Equipment zurückgegeben',
    category: 'equipment',
    description: 'Wird ausgelöst, wenn IT-Equipment zurückgegeben wird',
    sourceFunction: 'BrowoKoordinator-Equipment',
    expectedContext: ['equipmentId', 'equipmentType', 'equipmentName', 'userId', 'returnDate', 'organizationId'],
    implemented: false,
  },
  
  // ==================== DOCUMENT ====================
  {
    key: 'DOCUMENT_UPLOADED',
    label: 'Dokument hochgeladen',
    category: 'document',
    description: 'Wird ausgelöst, wenn ein Dokument hochgeladen wird',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['documentId', 'documentName', 'documentType', 'uploadedBy', 'uploadedByName', 'organizationId'],
    implemented: false,
  },
  {
    key: 'DOCUMENT_SIGNED',
    label: 'Dokument unterschrieben',
    category: 'document',
    description: 'Wird ausgelöst, wenn ein Dokument unterschrieben wird',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['documentId', 'documentName', 'signedBy', 'signedByName', 'signDate', 'organizationId'],
    implemented: false,
  },
  {
    key: 'DOCUMENT_EXPIRED',
    label: 'Dokument abgelaufen',
    category: 'document',
    description: 'Wird ausgelöst, wenn ein Dokument abläuft (automatisch via Cron)',
    sourceFunction: 'BrowoKoordinator-Cron',
    expectedContext: ['documentId', 'documentName', 'expiryDate', 'userId', 'organizationId'],
    implemented: false,
  },
  
  // ==================== BENEFIT ====================
  {
    key: 'BENEFIT_ASSIGNED',
    label: 'Benefit zugewiesen',
    category: 'benefit',
    description: 'Wird ausgelöst, wenn einem Mitarbeiter ein Benefit zugewiesen wird',
    sourceFunction: 'BrowoKoordinator-Benefits',
    expectedContext: ['benefitId', 'benefitName', 'userId', 'userName', 'assignmentDate', 'organizationId'],
    implemented: true,
  },
  {
    key: 'BENEFIT_REMOVED',
    label: 'Benefit entfernt',
    category: 'benefit',
    description: 'Wird ausgelöst, wenn ein Benefit entfernt wird',
    sourceFunction: 'BrowoKoordinator-Benefits',
    expectedContext: ['benefitId', 'benefitName', 'userId', 'removalDate', 'organizationId'],
    implemented: true,
  },
  
  // ==================== TASK ====================
  {
    key: 'TASK_CREATED',
    label: 'Aufgabe erstellt',
    category: 'task',
    description: 'Wird ausgelöst, wenn eine neue Aufgabe erstellt wird',
    sourceFunction: 'BrowoKoordinator-Tasks',
    expectedContext: ['taskId', 'taskTitle', 'assignedTo', 'assignedToName', 'createdBy', 'organizationId'],
    implemented: true,
  },
  {
    key: 'TASK_COMPLETED',
    label: 'Aufgabe abgeschlossen',
    category: 'task',
    description: 'Wird ausgelöst, wenn eine Aufgabe abgeschlossen wird',
    sourceFunction: 'BrowoKoordinator-Tasks',
    expectedContext: ['taskId', 'taskTitle', 'completedBy', 'completedByName', 'completionDate', 'organizationId'],
    implemented: true,
  },
  
  // ==================== TRAINING ====================
  {
    key: 'TRAINING_ASSIGNED',
    label: 'Schulung zugewiesen',
    category: 'training',
    description: 'Wird ausgelöst, wenn einem Mitarbeiter eine Schulung zugewiesen wird',
    sourceFunction: 'BrowoKoordinator-Training',
    expectedContext: ['trainingId', 'trainingName', 'userId', 'userName', 'assignmentDate', 'organizationId'],
    implemented: false,
  },
  {
    key: 'TRAINING_COMPLETED',
    label: 'Schulung abgeschlossen',
    category: 'training',
    description: 'Wird ausgelöst, wenn eine Schulung abgeschlossen wird',
    sourceFunction: 'BrowoKoordinator-Training',
    expectedContext: ['trainingId', 'trainingName', 'userId', 'userName', 'completionDate', 'organizationId'],
    implemented: false,
  },
  
  // ==================== CONTRACT ====================
  {
    key: 'CONTRACT_SIGNED',
    label: 'Vertrag unterschrieben',
    category: 'contract',
    description: 'Wird ausgelöst, wenn ein Vertrag unterschrieben wird',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['contractId', 'contractType', 'userId', 'userName', 'signDate', 'organizationId'],
    implemented: false,
  },
  {
    key: 'CONTRACT_UPDATED',
    label: 'Vertrag aktualisiert',
    category: 'contract',
    description: 'Wird ausgelöst, wenn ein Vertrag geändert wird',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['contractId', 'contractType', 'userId', 'changedFields', 'organizationId'],
    implemented: false,
  },
  {
    key: 'PROBATION_END',
    label: 'Probezeit endet',
    category: 'contract',
    description: 'Wird ausgelöst, wenn die Probezeit eines Mitarbeiters endet (automatisch via Cron)',
    sourceFunction: 'BrowoKoordinator-Cron',
    expectedContext: ['userId', 'userName', 'probationEndDate', 'organizationId'],
    implemented: false,
  },
  
  // ==================== MANUAL ====================
  {
    key: 'MANUAL',
    label: 'Manueller Trigger',
    category: 'other',
    description: 'Workflow wird manuell vom Admin ausgelöst',
    sourceFunction: 'BrowoKoordinator-Workflows',
    expectedContext: [],
    implemented: true,
  },
];

const TRIGGER_TYPES = TRIGGER_REGISTRY.reduce((acc, trigger) => {
  acc[trigger.key] = trigger.key;
  return acc;
}, {} as Record<string, string>);

function getTriggerByKey(key: string): TriggerDefinition | undefined {
  return TRIGGER_REGISTRY.find(t => t.key === key);
}

/**
 * Internal helper: Trigger workflows by calling the /trigger endpoint
 */
async function triggerWorkflows(triggerType: string, context: Record<string, any>, authToken: string): Promise<void> {
  try {
    console.log(`🔔 Triggering workflows internally for event: ${triggerType}`);

    const projectId = Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0];
    
    if (!projectId) {
      console.error('[triggerWorkflows] Could not determine project ID');
      return;
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/trigger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({
          trigger_type: triggerType,
          context,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.warn(`[triggerWorkflows] Workflow trigger failed:`, error);
      return;
    }

    const result = await response.json();
    console.log(`✅ Workflows triggered successfully:`, result);
  } catch (error) {
    console.error(`[triggerWorkflows] Error triggering workflows:`, error);
  }
}

// ==================== KV STORE (INLINE) ====================

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

// ==================== WORKFLOW ENGINE (INLINE) ====================

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    type?: string;
    triggerType?: string;
    config?: any;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface Workflow {
  id: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface ExecutionContext {
  userId?: string;
  employeeId?: string;
  [key: string]: any;
}

const getNextNodes = (nodes: WorkflowNode[], edges: WorkflowEdge[], currentNodeId: string) => {
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  const targetNodeIds = outgoingEdges.map(e => e.target);
  return nodes.filter(n => targetNodeIds.includes(n.id));
};

const executeAction = async (node: WorkflowNode, context: ExecutionContext) => {
  // Use the new V2 executor with real API calls and variable parsing
  return await executeActionV2(node, context);
};

const executeWorkflowGraph = async (workflow: Workflow, context: ExecutionContext) => {
  const { nodes, edges } = workflow;
  const logs: string[] = [];
  
  // Mutable context that gets enriched by each node
  const workflowContext = { ...context };
  
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  log(`🚀 Starting Workflow Execution for ${workflow.id}`);
  log(`📊 Initial Context: ${JSON.stringify(context)}`);

  const startNode = nodes.find(n => n.type === 'trigger');
  
  if (!startNode) {
    throw new Error("No trigger node found in workflow.");
  }

  log(`🟢 Trigger fired: ${startNode.data.label}`);

  let queue: WorkflowNode[] = [startNode];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    
    if (visited.has(currentNode.id)) continue;
    visited.add(currentNode.id);

    if (currentNode.type === 'action') {
      try {
        const result = await executeAction(currentNode, workflowContext);
        log(`✅ ${result.message || `Action executed: ${currentNode.data.label}`}`);
        
        // Merge any context updates from the action into the workflow context
        if (result.contextUpdates) {
          Object.assign(workflowContext, result.contextUpdates);
          log(`📊 Context updated: ${JSON.stringify(result.contextUpdates)}`);
        }
      } catch (e: any) {
        log(`❌ Action failed: ${currentNode.data.label} - ${e.message}`);
        // Continue execution even if one action fails (configurable behavior)
      }
    }

    const nextNodes = getNextNodes(nodes, edges, currentNode.id);
    queue = [...queue, ...nextNodes];
  }

  log(`🏁 Workflow Execution Completed.`);
  log(`📊 Final Context: ${JSON.stringify(workflowContext)}`);
  return { success: true, logs, finalContext: workflowContext };
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
      console.error('[Workflows] Auth error:', error);
      return null;
    }

    const supabaseAdmin = getSupabaseClient();
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[Workflows] Error fetching user data:', userError);
    }

    return {
      id: user.id,
      email: user.email,
      role: userData?.role,
      organization_id: userData?.organization_id,
    };
  } catch (error) {
    console.error('[Workflows] Auth verification error:', error);
    return null;
  }
}

function isAdminOrHR(role?: string): boolean {
  return role === 'ADMIN' || role === 'HR' || role === 'SUPERADMIN';
}

// ==================== ROUTES ====================

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'BrowoKoordinator-Workflows',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
  });
});

app.get('/workflows', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const workflows = await kvGetByPrefix("workflow:");
    
    const orgWorkflows = workflows.filter((w: any) => 
      w.organization_id === user.organization_id
    );
    
    return c.json({ workflows: orgWorkflows });
  } catch (e: any) {
    console.error('❌ Get workflows error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get('/workflows/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const workflow = await kvGet(`workflow:${id}`);
    
    if (!workflow) {
      return c.json({ error: 'Workflow not found' }, 404);
    }

    if (workflow.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }
    
    return c.json({ workflow });
  } catch (e: any) {
    console.error('❌ Get workflow error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/workflows', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user || !isAdminOrHR(user.role)) {
    return c.json({ error: 'Unauthorized - Admin/HR only' }, 403);
  }

  try {
    const body = await c.req.json();
    const { id, name, description, nodes, edges, trigger_type, is_active } = body;
    
    if (!id || !name) {
      return c.json({ error: 'ID and name are required' }, 400);
    }

    const workflow = {
      id,
      name,
      description: description || null,
      nodes: nodes || [],
      edges: edges || [],
      trigger_type: trigger_type || 'MANUAL',
      is_active: is_active ?? true,
      organization_id: user.organization_id,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kvSet(`workflow:${id}`, workflow);
    console.log(`✅ Workflow created: ${id} by user ${user.id}`);
    
    return c.json({ success: true, workflow });
  } catch (e: any) {
    console.error('❌ Create workflow error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.put('/workflows/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user || !isAdminOrHR(user.role)) {
    return c.json({ error: 'Unauthorized - Admin/HR only' }, 403);
  }

  try {
    const id = c.req.param('id');
    const existing = await kvGet(`workflow:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Workflow not found' }, 404);
    }

    if (existing.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const updates = await c.req.json();
    const workflow = {
      ...existing,
      ...updates,
      id,
      organization_id: existing.organization_id,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    await kvSet(`workflow:${id}`, workflow);
    console.log(`✅ Workflow updated: ${id} by user ${user.id}`);
    
    return c.json({ success: true, workflow });
  } catch (e: any) {
    console.error('❌ Update workflow error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.delete('/workflows/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user || !isAdminOrHR(user.role)) {
    return c.json({ error: 'Unauthorized - Admin/HR only' }, 403);
  }

  try {
    const id = c.req.param('id');
    const workflow = await kvGet(`workflow:${id}`);
    
    if (!workflow) {
      return c.json({ error: 'Workflow not found' }, 404);
    }

    if (workflow.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await kvDel(`workflow:${id}`);
    console.log(`🗑️ Workflow deleted: ${id} by user ${user.id}`);
    
    return c.json({ success: true });
  } catch (e: any) {
    console.error('❌ Delete workflow error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/workflows/:id/execute', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const workflow = await kvGet(`workflow:${id}`);
    
    if (!workflow) {
      return c.json({ error: 'Workflow not found' }, 404);
    }

    if (workflow.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    if (!workflow.is_active) {
      return c.json({ error: 'Workflow is not active' }, 400);
    }

    const body = await c.req.json();
    const context = body.context || {};

    console.log(`🚀 Executing workflow: ${id} for user ${user.id}`);

    const result = await executeWorkflowGraph(workflow, {
      ...context,
      executedBy: user.id,
      executedAt: new Date().toISOString(),
    });

    const executionId = `exec_${id}_${Date.now()}`;
    await kvSet(`execution:${executionId}`, {
      id: executionId,
      workflowId: id,
      workflow_name: workflow.name,
      status: result.success ? 'COMPLETED' : 'FAILED',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      logs: result.logs,
      context,
      executed_by: user.id,
      organization_id: user.organization_id,
    });

    return c.json({
      success: true,
      executionId,
      logs: result.logs,
      message: result.success 
        ? 'Workflow execution completed successfully' 
        : 'Workflow execution failed',
    });
  } catch (e: any) {
    console.error('❌ Workflow execution error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/trigger', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { trigger_type, context } = body;
    
    if (!trigger_type) {
      return c.json({ error: 'Trigger type is required' }, 400);
    }

    const workflows = await kvGetByPrefix("workflow:");
    
    const orgWorkflows = workflows.filter((w: any) => 
      w.organization_id === user.organization_id && w.trigger_type === trigger_type
    );
    
    if (orgWorkflows.length === 0) {
      return c.json({ error: 'No workflows found for this trigger type' }, 404);
    }

    const results = await Promise.all(orgWorkflows.map(async (workflow: Workflow) => {
      console.log(`🚀 Executing workflow: ${workflow.id} for user ${user.id}`);

      const result = await executeWorkflowGraph(workflow, {
        ...context,
        executedBy: user.id,
        executedAt: new Date().toISOString(),
      });

      const executionId = `exec_${workflow.id}_${Date.now()}`;
      await kvSet(`execution:${executionId}`, {
        id: executionId,
        workflowId: workflow.id,
        workflow_name: workflow.name,
        status: result.success ? 'COMPLETED' : 'FAILED',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        logs: result.logs,
        context,
        executed_by: user.id,
        organization_id: user.organization_id,
      });

      return {
        success: true,
        executionId,
        logs: result.logs,
        message: result.success 
          ? 'Workflow execution completed successfully' 
          : 'Workflow execution failed',
      };
    }));

    return c.json({ results });
  } catch (e: any) {
    console.error('❌ Workflow execution error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get('/executions', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const executions = await kvGetByPrefix("execution:");
    
    const orgExecutions = executions.filter((ex: any) => 
      ex.organization_id === user.organization_id
    );

    orgExecutions.sort((a: any, b: any) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    return c.json({ executions: orgExecutions });
  } catch (e: any) {
    console.error('❌ Get executions error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get('/executions/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const execution = await kvGet(`execution:${id}`);
    
    if (!execution) {
      return c.json({ error: 'Execution not found' }, 404);
    }

    if (execution.organization_id !== user.organization_id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json({ execution });
  } catch (e: any) {
    console.error('❌ Get execution error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get('/trigger-types', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await verifyAuth(authHeader);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Return detailed trigger information from registry
    return c.json({ 
      trigger_types: TRIGGER_REGISTRY.map(t => ({
        key: t.key,
        label: t.label,
        category: t.category,
        description: t.description,
        implemented: t.implemented,
        expectedContext: t.expectedContext,
      }))
    });
  } catch (e: any) {
    console.error('❌ Get trigger types error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// ==================== CENTRALIZED TRIGGER ENDPOINTS ====================
// These endpoints allow triggering workflows WITHOUT deploying all Edge Functions
// They can be called from Frontend, other services, or manually via Postman/cURL

/**
 * 🎯 EMPLOYEE TRIGGERS
 */

// EMPLOYEE_DELETED
app.post('/BrowoKoordinator-Workflows/triggers/employee-deleted', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, employeeId, employeeName, organizationId } = body;
    
    console.log('🔔 EMPLOYEE_DELETED trigger called:', { employeeId, employeeName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.EMPLOYEE_DELETED, {
      userId,
      employeeId,
      employeeName,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'EMPLOYEE_DELETED workflows triggered' });
  } catch (error: any) {
    console.error('❌ EMPLOYEE_DELETED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ONBOARDING_START
app.post('/BrowoKoordinator-Workflows/triggers/onboarding-start', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, employeeId, employeeName, startDate, organizationId } = body;
    
    console.log('🔔 ONBOARDING_START trigger called:', { employeeId, employeeName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.ONBOARDING_START, {
      userId,
      employeeId,
      employeeName,
      startDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'ONBOARDING_START workflows triggered' });
  } catch (error: any) {
    console.error('❌ ONBOARDING_START trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// OFFBOARDING_START
app.post('/BrowoKoordinator-Workflows/triggers/offboarding-start', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, employeeId, employeeName, endDate, organizationId } = body;
    
    console.log('🔔 OFFBOARDING_START trigger called:', { employeeId, employeeName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.OFFBOARDING_START, {
      userId,
      employeeId,
      employeeName,
      endDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'OFFBOARDING_START workflows triggered' });
  } catch (error: any) {
    console.error('❌ OFFBOARDING_START trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * 🎯 TASK TRIGGERS
 */

// TASK_CREATED
app.post('/BrowoKoordinator-Workflows/triggers/task-created', async (c) => {
  try {
    const body = await c.req.json();
    const { taskId, taskTitle, assignedTo, assignedToName, createdBy, organizationId } = body;
    
    console.log('🔔 TASK_CREATED trigger called:', { taskId, taskTitle });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.TASK_CREATED, {
      taskId,
      taskTitle,
      assignedTo,
      assignedToName,
      createdBy,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'TASK_CREATED workflows triggered' });
  } catch (error: any) {
    console.error('❌ TASK_CREATED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// TASK_COMPLETED
app.post('/BrowoKoordinator-Workflows/triggers/task-completed', async (c) => {
  try {
    const body = await c.req.json();
    const { taskId, taskTitle, completedBy, completedByName, completionDate, organizationId } = body;
    
    console.log('🔔 TASK_COMPLETED trigger called:', { taskId, taskTitle });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.TASK_COMPLETED, {
      taskId,
      taskTitle,
      completedBy,
      completedByName,
      completionDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'TASK_COMPLETED workflows triggered' });
  } catch (error: any) {
    console.error('❌ TASK_COMPLETED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * 🎯 TRAINING TRIGGERS
 */

// TRAINING_ASSIGNED
app.post('/BrowoKoordinator-Workflows/triggers/training-assigned', async (c) => {
  try {
    const body = await c.req.json();
    const { trainingId, trainingName, userId, userName, assignmentDate, organizationId } = body;
    
    console.log('🔔 TRAINING_ASSIGNED trigger called:', { trainingId, trainingName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.TRAINING_ASSIGNED, {
      trainingId,
      trainingName,
      userId,
      userName,
      assignmentDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'TRAINING_ASSIGNED workflows triggered' });
  } catch (error: any) {
    console.error('❌ TRAINING_ASSIGNED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// TRAINING_COMPLETED
app.post('/BrowoKoordinator-Workflows/triggers/training-completed', async (c) => {
  try {
    const body = await c.req.json();
    const { trainingId, trainingName, userId, userName, completionDate, organizationId } = body;
    
    console.log('🔔 TRAINING_COMPLETED trigger called:', { trainingId, trainingName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.TRAINING_COMPLETED, {
      trainingId,
      trainingName,
      userId,
      userName,
      completionDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'TRAINING_COMPLETED workflows triggered' });
  } catch (error: any) {
    console.error('❌ TRAINING_COMPLETED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * 🎯 DOCUMENT TRIGGERS
 */

// DOCUMENT_UPLOADED
app.post('/BrowoKoordinator-Workflows/triggers/document-uploaded', async (c) => {
  try {
    const body = await c.req.json();
    const { documentId, documentName, documentType, uploadedBy, uploadedByName, organizationId } = body;
    
    console.log('🔔 DOCUMENT_UPLOADED trigger called:', { documentId, documentName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.DOCUMENT_UPLOADED, {
      documentId,
      documentName,
      documentType,
      uploadedBy,
      uploadedByName,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'DOCUMENT_UPLOADED workflows triggered' });
  } catch (error: any) {
    console.error('❌ DOCUMENT_UPLOADED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// DOCUMENT_SIGNED
app.post('/BrowoKoordinator-Workflows/triggers/document-signed', async (c) => {
  try {
    const body = await c.req.json();
    const { documentId, documentName, signedBy, signedByName, signDate, organizationId } = body;
    
    console.log('🔔 DOCUMENT_SIGNED trigger called:', { documentId, documentName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.DOCUMENT_SIGNED, {
      documentId,
      documentName,
      signedBy,
      signedByName,
      signDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'DOCUMENT_SIGNED workflows triggered' });
  } catch (error: any) {
    console.error('❌ DOCUMENT_SIGNED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * 🎯 EQUIPMENT TRIGGERS
 */

// EQUIPMENT_ASSIGNED
app.post('/BrowoKoordinator-Workflows/triggers/equipment-assigned', async (c) => {
  try {
    const body = await c.req.json();
    const { equipmentId, equipmentType, equipmentName, userId, userName, assignmentDate, organizationId } = body;
    
    console.log('🔔 EQUIPMENT_ASSIGNED trigger called:', { equipmentId, equipmentName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.EQUIPMENT_ASSIGNED, {
      equipmentId,
      equipmentType,
      equipmentName,
      userId,
      userName,
      assignmentDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'EQUIPMENT_ASSIGNED workflows triggered' });
  } catch (error: any) {
    console.error('❌ EQUIPMENT_ASSIGNED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// EQUIPMENT_RETURNED
app.post('/BrowoKoordinator-Workflows/triggers/equipment-returned', async (c) => {
  try {
    const body = await c.req.json();
    const { equipmentId, equipmentType, equipmentName, userId, returnDate, organizationId } = body;
    
    console.log('🔔 EQUIPMENT_RETURNED trigger called:', { equipmentId, equipmentName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.EQUIPMENT_RETURNED, {
      equipmentId,
      equipmentType,
      equipmentName,
      userId,
      returnDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'EQUIPMENT_RETURNED workflows triggered' });
  } catch (error: any) {
    console.error('❌ EQUIPMENT_RETURNED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * 🎯 VEHICLE TRIGGERS
 */

// VEHICLE_ASSIGNED
app.post('/BrowoKoordinator-Workflows/triggers/vehicle-assigned', async (c) => {
  try {
    const body = await c.req.json();
    const { vehicleId, vehicleName, userId, userName, assignmentDate, organizationId } = body;
    
    console.log('🔔 VEHICLE_ASSIGNED trigger called:', { vehicleId, vehicleName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.VEHICLE_ASSIGNED, {
      vehicleId,
      vehicleName,
      userId,
      userName,
      assignmentDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'VEHICLE_ASSIGNED workflows triggered' });
  } catch (error: any) {
    console.error('❌ VEHICLE_ASSIGNED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// VEHICLE_RETURNED
app.post('/BrowoKoordinator-Workflows/triggers/vehicle-returned', async (c) => {
  try {
    const body = await c.req.json();
    const { vehicleId, vehicleName, userId, userName, returnDate, organizationId } = body;
    
    console.log('🔔 VEHICLE_RETURNED trigger called:', { vehicleId, vehicleName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.VEHICLE_RETURNED, {
      vehicleId,
      vehicleName,
      userId,
      userName,
      returnDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'VEHICLE_RETURNED workflows triggered' });
  } catch (error: any) {
    console.error('❌ VEHICLE_RETURNED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// VEHICLE_DAMAGE_REPORTED
app.post('/BrowoKoordinator-Workflows/triggers/vehicle-damage-reported', async (c) => {
  try {
    const body = await c.req.json();
    const { vehicleId, vehicleName, userId, damageDescription, reportDate, organizationId } = body;
    
    console.log('🔔 VEHICLE_DAMAGE_REPORTED trigger called:', { vehicleId, vehicleName });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.VEHICLE_DAMAGE_REPORTED, {
      vehicleId,
      vehicleName,
      userId,
      damageDescription,
      reportDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'VEHICLE_DAMAGE_REPORTED workflows triggered' });
  } catch (error: any) {
    console.error('❌ VEHICLE_DAMAGE_REPORTED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * 🎯 CONTRACT TRIGGERS
 */

// CONTRACT_SIGNED
app.post('/BrowoKoordinator-Workflows/triggers/contract-signed', async (c) => {
  try {
    const body = await c.req.json();
    const { contractId, contractType, userId, userName, signDate, organizationId } = body;
    
    console.log('🔔 CONTRACT_SIGNED trigger called:', { contractId, contractType });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.CONTRACT_SIGNED, {
      contractId,
      contractType,
      userId,
      userName,
      signDate,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'CONTRACT_SIGNED workflows triggered' });
  } catch (error: any) {
    console.error('❌ CONTRACT_SIGNED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// CONTRACT_UPDATED
app.post('/BrowoKoordinator-Workflows/triggers/contract-updated', async (c) => {
  try {
    const body = await c.req.json();
    const { contractId, contractType, userId, changedFields, organizationId } = body;
    
    console.log('🔔 CONTRACT_UPDATED trigger called:', { contractId, contractType });
    
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    await triggerWorkflows(TRIGGER_TYPES.CONTRACT_UPDATED, {
      contractId,
      contractType,
      userId,
      changedFields,
      organizationId,
    }, authHeader);
    
    return c.json({ success: true, message: 'CONTRACT_UPDATED workflows triggered' });
  } catch (error: any) {
    console.error('❌ CONTRACT_UPDATED trigger error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);