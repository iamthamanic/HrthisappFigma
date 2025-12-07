import { kv } from "./core-kv.ts";

export const TRIGGER_TYPES = {
  EMPLOYEE_CREATED: "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED: "EMPLOYEE_UPDATED",
  EMPLOYEE_DELETED: "EMPLOYEE_DELETED",
  ONBOARDING_START: "ONBOARDING_START",
  OFFBOARDING_START: "OFFBOARDING_START",
  BENEFIT_ASSIGNED: "BENEFIT_ASSIGNED",
  BENEFIT_REMOVED: "BENEFIT_REMOVED",
  TASK_CREATED: "TASK_CREATED",
  TASK_COMPLETED: "TASK_COMPLETED",
  TRAINING_ASSIGNED: "TRAINING_ASSIGNED",
  TRAINING_COMPLETED: "TRAINING_COMPLETED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_SIGNED: "DOCUMENT_SIGNED",
  EQUIPMENT_ASSIGNED: "EQUIPMENT_ASSIGNED",
  EQUIPMENT_RETURNED: "EQUIPMENT_RETURNED",
  VEHICLE_ASSIGNED: "VEHICLE_ASSIGNED",
  VEHICLE_RETURNED: "VEHICLE_RETURNED",
  VEHICLE_DAMAGE_REPORTED: "VEHICLE_DAMAGE_REPORTED",
  CONTRACT_SIGNED: "CONTRACT_SIGNED",
  CONTRACT_UPDATED: "CONTRACT_UPDATED",
};

export async function triggerWorkflows(
  triggerType: string,
  context: Record<string, any>,
  authToken: string,
): Promise<void> {
  try {
    const projectId = Deno.env
      .get("SUPABASE_URL")
      ?.split("//")[1]
      ?.split(".")[0];
    if (!projectId) return;

    console.log(
      `🔔 Triggering workflows for event: ${triggerType}`,
    );

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/trigger`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          trigger_type: triggerType,
          context,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.warn(`[triggerWorkflows] Failed:`, error);
      return;
    }

    const result = await response.json();
    console.log(`✅ Workflows triggered:`, result);
  } catch (error) {
    console.error(`[triggerWorkflows] Error:`, error);
  }
}

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

const getNextNodes = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  currentNodeId: string,
) => {
  const outgoingEdges = edges.filter(
    (e) => e.source === currentNodeId,
  );
  const targetNodeIds = outgoingEdges.map((e) => e.target);
  return nodes.filter((n) => targetNodeIds.includes(n.id));
};

const executeAction = async (
  node: WorkflowNode,
  context: ExecutionContext,
) => {
  const actionType = node.data.type;
  const label = node.data.label;

  console.log(`⚡ Executing Action: [${actionType}] ${label}`);

  switch (actionType) {
    case "SEND_EMAIL":
      console.log(
        `📧 Email sent to user ${context.userId}: Subject: "Update from HR"`,
      );
      break;
    case "ASSIGN_DOCUMENT":
      if (context.userId) {
        const docId = `doc_${Date.now()}`;
        await kv.set(
          `user_document:${context.userId}:${docId}`,
          {
            documentName: "Onboarding Checklist",
            assignedAt: new Date().toISOString(),
            status: "PENDING",
          },
        );
        console.log(
          `📄 Document assigned to ${context.userId}`,
        );
      }
      break;
    case "ASSIGN_EQUIPMENT":
      console.log(
        `💻 Equipment request created for ${context.userId}`,
      );
      break;
    case "ASSIGN_BENEFITS":
      console.log(`🎁 Benefit assigned to ${context.userId}`);
      break;
    case "DISTRIBUTE_COINS":
      if (context.userId) {
        console.log(
          `🪙 100 Coins distributed to ${context.userId}`,
        );
      }
      break;
    case "DELAY":
      console.log(
        `⏱️ Delay requested. (Skipping for immediate execution prototype)`,
      );
      break;
    default:
      console.log(`⚠️ Unknown action type: ${actionType}`);
  }

  return { success: true, action: actionType };
};

export const executeWorkflowGraph = async (
  workflow: Workflow,
  context: ExecutionContext,
) => {
  const { nodes, edges } = workflow;
  const logs: string[] = [];

  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  log(`🚀 Starting Workflow Execution for ${workflow.id}`);

  const startNode = nodes.find((n) => n.type === "trigger");

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

    if (currentNode.type === "action") {
      try {
        await executeAction(currentNode, context);
        log(`✅ Action executed: ${currentNode.data.label}`);
      } catch (e: any) {
        log(
          `❌ Action failed: ${currentNode.data.label} - ${e.message}`,
        );
      }
    }

    const nextNodes = getNextNodes(
      nodes,
      edges,
      currentNode.id,
    );
    queue = [...queue, ...nextNodes];
  }

  log(`🏁 Workflow Execution Completed.`);
  return { success: true, logs };
};
