
import { Node, Edge } from 'reactflow';

// ==========================================
// Workflow Core Types
// ==========================================

export type WorkflowTriggerType =
  | 'ONBOARDING_START'    // Mitarbeiter angelegt
  | 'OFFBOARDING_START'   // Kündigung eingetragen
  | 'PROMOTION'           // Rolle/Abteilung geändert
  | 'TIME_BASED'          // X Tage nach Startdatum
  | 'MANUAL'              // Händisch gestartet
  | 'EVENT_BASED';        // Externes Event (z.B. Test bestanden)

export type WorkflowActionType =
  // Kommunikation
  | 'SEND_EMAIL'
  | 'SEND_NOTIFICATION'
  | 'SEND_SLACK'
  
  // Aufgaben & Zuweisungen
  | 'CREATE_TASK'
  | 'ASSIGN_DOCUMENT'
  | 'ASSIGN_TEST'
  | 'ASSIGN_VIDEO'
  | 'ASSIGN_EQUIPMENT' // Placeholder for future IT Asset system
  | 'ASSIGN_TEAM'
  
  // Logik
  | 'DELAY'            // Warten
  | 'CONDITION'        // Verzweigung
  | 'WAIT_FOR_EVENT';  // Warten auf Unterschrift etc.

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

// ==========================================
// Node Data Definitions
// ==========================================

export interface WorkflowNodeData {
  label: string;
  type: WorkflowActionType | WorkflowTriggerType;
  description?: string;
  config: Record<string, any>;
  // UI Helper
  icon?: string;
  color?: string;
}

// React Flow Node Wrapper
export type WorkflowNode = Node<WorkflowNodeData>;

// React Flow Edge Wrapper
export type WorkflowEdge = Edge;

// ==========================================
// Database / Storage Model
// ==========================================

export interface Workflow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  
  // Trigger Definition
  trigger_type: WorkflowTriggerType;
  trigger_config: {
    days_offset?: number;      // für TIME_BASED
    department_ids?: string[]; // Filter
    location_ids?: string[];   // Filter
    role_ids?: string[];       // Filter
    event_name?: string;       // für EVENT_BASED
  };
  
  // The Graph Data (JSON)
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ==========================================
// Execution / Runtime Types
// ==========================================

export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'WAITING';

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string; // Der betroffene Mitarbeiter
  organization_id: string;
  
  status: ExecutionStatus;
  started_at: string;
  completed_at: string | null;
  
  // State Machine
  current_nodes: string[]; // Node IDs die gerade aktiv sind
  context: Record<string, any>; // Variablen Speicher
  
  history: WorkflowStepExecution[];
}

export interface WorkflowStepExecution {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  started_at: string;
  completed_at: string | null;
  result: any;
  error: string | null;
}
