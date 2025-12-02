import { Node, Edge } from 'reactflow';

// ==========================================
// Environment Variables
// ==========================================

export interface EnvironmentVariable {
  id: string;
  organizationId: string;
  key: string;
  value: string; // Encrypted
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariableInput {
  key: string;
  value: string;
  description?: string;
}

// ==========================================
// Workflow Core Types
// ==========================================

export type WorkflowTriggerType =
  // ========== HR / MITARBEITER EVENTS ==========
  | 'EMPLOYEE_CREATED'           // Neuer Mitarbeiter angelegt
  | 'EMPLOYEE_UPDATED'           // Mitarbeiter-Daten aktualisiert
  | 'EMPLOYEE_DELETED'           // Mitarbeiter gelöscht
  | 'EMPLOYEE_ADDED_TO_TEAM'     // Zu Team hinzugefügt
  | 'EMPLOYEE_REMOVED_FROM_TEAM' // Aus Team entfernt
  
  // ========== LEARNING / GAMIFICATION EVENTS ==========
  | 'LEARNING_VIDEO_STARTED'     // Video gestartet
  | 'LEARNING_VIDEO_COMPLETED'   // Video abgeschlossen
  | 'LEARNING_TEST_COMPLETED'    // Test abgeschlossen
  | 'LEARNING_QUIZ_COMPLETED'    // Lerneinheit abgeschlossen
  | 'XP_THRESHOLD_REACHED'       // XP-Schwelle erreicht
  | 'LEVEL_UP'                   // Level aufgestiegen
  | 'COINS_THRESHOLD_REACHED'    // Coin-Stand erreicht
  | 'ACHIEVEMENT_UNLOCKED'       // Achievement freigeschaltet
  
  // ========== SHOP / BENEFITS EVENTS ==========
  | 'BENEFIT_PURCHASED'          // Benefit gekauft
  | 'BENEFIT_REDEEMED'           // Benefit eingelöst
  
  // ========== TASKS / AUFGABEN EVENTS ==========
  | 'TASK_COMPLETED'             // Aufgabe abgeschlossen
  | 'TASK_OVERDUE'               // Aufgabe überfällig
  
  // ========== ANTRAGS-WORKFLOW EVENTS ==========
  | 'REQUEST_APPROVED'           // Antrag genehmigt
  | 'REQUEST_REJECTED'           // Antrag abgelehnt
  
  // ========== ZEITBASIERTE TRIGGER ==========
  | 'SCHEDULED_DATE'             // Bestimmtes Datum
  | 'SCHEDULED_CRON'             // Cron-basiert (täglich, wöchentlich)
  | 'REMINDER_CHECK'             // Periodischer Check
  
  // ========== LEGACY / BACKWARDS COMPATIBILITY ==========
  | 'ONBOARDING_START'           // @deprecated Use EMPLOYEE_CREATED
  | 'OFFBOARDING_START'          // @deprecated Use EMPLOYEE_DELETED
  | 'PROMOTION'                  // @deprecated Use EMPLOYEE_UPDATED
  | 'TIME_BASED'                 // @deprecated Use SCHEDULED_DATE
  | 'MANUAL'                     // Händisch gestartet
  | 'EVENT_BASED';               // @deprecated Use specific events

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
  
  // Integration & API
  | 'HTTP_REQUEST'       // External API calls (wie n8n)
  
  // Logik
  | 'DELAY'            // Warten
  | 'CONDITION'        // Verzweigung
  | 'WAIT_FOR_EVENT';  // Warten auf Unterschrift etc.

// ==========================================
// HTTP Request Configuration
// ==========================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpAuthType = 
  | 'NONE'
  | 'API_KEY'
  | 'BEARER_TOKEN'
  | 'BASIC_AUTH'
  | 'OAUTH2';

export interface HttpRequestConfig {
  method: HttpMethod;
  url: string; // Supports variables: {{ variable }}
  
  // Authentication
  auth: {
    type: HttpAuthType;
    apiKey?: {
      key: string;
      value: string;
      addTo: 'HEADER' | 'QUERY';
    };
    bearerToken?: {
      token: string;
    };
    basicAuth?: {
      username: string;
      password: string;
    };
    oauth2?: {
      accessToken: string;
    };
  };
  
  // Headers
  headers?: Array<{
    key: string;
    value: string; // Supports variables
  }>;
  
  // Query Parameters
  queryParams?: Array<{
    key: string;
    value: string; // Supports variables
  }>;
  
  // Body (for POST/PUT/PATCH)
  body?: {
    type: 'JSON' | 'FORM_DATA' | 'RAW' | 'NONE';
    content: string; // JSON string or raw content, supports variables
  };
  
  // Response Handling
  responseMapping?: {
    extractToVariable?: string; // Variable name to store response
    jsonPath?: string; // Extract specific field from JSON response
  };
  
  // Error Handling
  retries?: number;
  timeout?: number; // in seconds
  continueOnError?: boolean;
}

export interface HttpRequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  success: boolean;
  error?: string;
}

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

// ==========================================
// Trigger Configuration Types
// ==========================================

export interface TriggerConfig {
  // ========== HR / MITARBEITER ==========
  // EMPLOYEE_ADDED_TO_TEAM / EMPLOYEE_REMOVED_FROM_TEAM
  team_id?: string;
  
  // ========== LEARNING ==========
  // LEARNING_VIDEO_STARTED / LEARNING_VIDEO_COMPLETED
  video_id?: string;
  
  // LEARNING_TEST_COMPLETED
  test_id?: string;
  min_score?: number; // Minimum score required (0-100)
  
  // LEARNING_QUIZ_COMPLETED
  quiz_id?: string;
  
  // XP_THRESHOLD_REACHED
  xp_threshold?: number; // e.g. 100, 500, 1000
  
  // LEVEL_UP
  level?: number; // e.g. 5, 10, 20
  
  // COINS_THRESHOLD_REACHED
  coin_threshold?: number; // e.g. 500, 1000
  
  // ACHIEVEMENT_UNLOCKED
  achievement_id?: string;
  
  // ========== SHOP / BENEFITS ==========
  // BENEFIT_PURCHASED / BENEFIT_REDEEMED
  benefit_id?: string;
  
  // ========== TASKS ==========
  // TASK_COMPLETED / TASK_OVERDUE
  task_id?: string;
  
  // ========== ANTRÄGE ==========
  // REQUEST_APPROVED / REQUEST_REJECTED
  request_type?: 'leave' | 'document' | 'expense' | 'all';
  
  // ========== ZEITBASIERT ==========
  // SCHEDULED_DATE
  date?: string; // ISO 8601 date
  repeat?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  // SCHEDULED_CRON
  cron_expression?: string; // e.g. "0 9 * * 1" = Montags 9 Uhr
  
  // REMINDER_CHECK
  check_type?: 'incomplete_video' | 'incomplete_test' | 'incomplete_quiz' | 'pending_task';
  interval_hours?: number; // Check interval in hours
  
  // ========== LEGACY / FILTERS ==========
  days_offset?: number;      // für TIME_BASED (deprecated)
  department_ids?: string[]; // Filter für alle Trigger
  location_ids?: string[];   // Filter für alle Trigger
  role_ids?: string[];       // Filter für alle Trigger
  event_name?: string;       // für EVENT_BASED (deprecated)
}

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
  trigger_config: TriggerConfig;
  
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