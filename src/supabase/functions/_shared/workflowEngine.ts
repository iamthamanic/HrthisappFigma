
import * as kv from "./kv_store.ts";

// Types
interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    type?: string; // For action nodes: SEND_EMAIL, etc.
    triggerType?: string; // For trigger nodes
    config?: any; // Specific config for the action
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

// Helper to get immediate next nodes
const getNextNodes = (nodes: WorkflowNode[], edges: WorkflowEdge[], currentNodeId: string) => {
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  const targetNodeIds = outgoingEdges.map(e => e.target);
  return nodes.filter(n => targetNodeIds.includes(n.id));
};

// Action Handlers
const executeAction = async (node: WorkflowNode, context: ExecutionContext) => {
  const actionType = node.data.type;
  const label = node.data.label;
  
  console.log(`⚡ Executing Action: [${actionType}] ${label}`);
  
  switch (actionType) {
    case 'SEND_EMAIL':
      // Mock Email Sending
      console.log(`📧 Email sent to user ${context.userId}: Subject: "Update from HR"`);
      // In a real app: await sendEmail(...)
      break;

    case 'ASSIGN_DOCUMENT':
      // Mock Document Assignment
      if (context.userId) {
         const docId = `doc_${Date.now()}`;
         await kv.set(`user_document:${context.userId}:${docId}`, {
           documentName: "Onboarding Checklist",
           assignedAt: new Date().toISOString(),
           status: "PENDING"
         });
         console.log(`📄 Document assigned to ${context.userId}`);
      }
      break;

    case 'ASSIGN_EQUIPMENT':
      // Mock Equipment Assignment
      // Logic: Find available equipment of requested type and assign
      // For now, just log
      console.log(`💻 Equipment request created for ${context.userId}`);
      break;

    case 'ASSIGN_BENEFITS':
      console.log(`🎁 Benefit assigned to ${context.userId}`);
      break;

    case 'DISTRIBUTE_COINS':
      if (context.userId) {
        // Fetch current coins (Mock)
        // await incrementUserCoins(context.userId, 100);
        console.log(`🪙 100 Coins distributed to ${context.userId}`);
      }
      break;
      
    case 'DELAY':
      console.log(`⏱️ Delay requested. (Skipping for immediate execution prototype)`);
      break;

    default:
      console.log(`⚠️ Unknown action type: ${actionType}`);
  }
  
  return { success: true, action: actionType };
};

// Main Execution Function
export const executeWorkflowGraph = async (workflow: Workflow, context: ExecutionContext) => {
  const { nodes, edges } = workflow;
  const logs: string[] = [];
  
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  log(`🚀 Starting Workflow Execution for ${workflow.id}`);

  // 1. Find Start Node (Trigger)
  // We assume there is one trigger for now, or we find the one matching context if we had multiple.
  const startNode = nodes.find(n => n.type === 'trigger');
  
  if (!startNode) {
    throw new Error("No trigger node found in workflow.");
  }

  log(`🟢 Trigger fired: ${startNode.data.label}`);

  // Queue for BFS/Traversal
  let queue: WorkflowNode[] = [startNode];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    
    if (visited.has(currentNode.id)) continue;
    visited.add(currentNode.id);

    // Execute Logic for this node (if it's an action)
    if (currentNode.type === 'action') {
      try {
        await executeAction(currentNode, context);
        log(`✅ Action executed: ${currentNode.data.label}`);
      } catch (e: any) {
        log(`❌ Action failed: ${currentNode.data.label} - ${e.message}`);
        // Depending on config, we might stop here or continue
      }
    }

    // Find next nodes
    const nextNodes = getNextNodes(nodes, edges, currentNode.id);
    queue = [...queue, ...nextNodes];
  }

  log(`🏁 Workflow Execution Completed.`);
  return { success: true, logs };
};
