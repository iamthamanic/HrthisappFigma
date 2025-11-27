/**
 * 🔔 TRIGGER REGISTRY - Single Source of Truth
 * 
 * This file defines ALL possible triggers in BrowoKoordinator.
 * When adding new features, add triggers here following the pattern.
 * 
 * NAMING CONVENTION:
 * - Use SCREAMING_SNAKE_CASE
 * - Format: {ENTITY}_{ACTION}
 * - Examples: EMPLOYEE_CREATED, VEHICLE_ASSIGNED, DOCUMENT_SIGNED
 * 
 * CATEGORIES:
 * - Employee, Vehicle, Equipment, Document, Benefit, Task, Training, Contract, etc.
 */

export interface TriggerDefinition {
  /** Unique trigger identifier */
  key: string;
  /** Human-readable label */
  label: string;
  /** Category for grouping */
  category: 'employee' | 'vehicle' | 'equipment' | 'document' | 'benefit' | 'task' | 'training' | 'contract' | 'other';
  /** Description of when this trigger fires */
  description: string;
  /** Edge Function that should call this trigger */
  sourceFunction: string;
  /** Expected context fields */
  expectedContext: string[];
  /** Is this trigger currently implemented? */
  implemented: boolean;
}

/**
 * 🎯 TRIGGER REGISTRY
 * Add new triggers here when adding features to BrowoKoordinator
 */
export const TRIGGER_REGISTRY: TriggerDefinition[] = [
  // ==================== EMPLOYEE ====================
  {
    key: 'EMPLOYEE_CREATED',
    label: 'Mitarbeiter erstellt',
    category: 'employee',
    description: 'Wird ausgelöst, wenn ein neuer Mitarbeiter angelegt wird',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'employeeEmail', 'department', 'organizationId'],
    implemented: true, // ✅ IMPLEMENTED in server/index.tsx (users/create endpoint)
  },
  {
    key: 'EMPLOYEE_UPDATED',
    label: 'Mitarbeiter geändert',
    category: 'employee',
    description: 'Wird ausgelöst, wenn Mitarbeiter-Daten geändert werden',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'changedFields', 'organizationId'],
    implemented: true, // ✅ IMPLEMENTED in Personalakte PUT /employees/:id
  },
  {
    key: 'EMPLOYEE_DELETED',
    label: 'Mitarbeiter gelöscht',
    category: 'employee',
    description: 'Wird ausgelöst, wenn ein Mitarbeiter gelöscht wird',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'organizationId'],
    implemented: true, // ✅ IMPLEMENTED in Personalakte DELETE /employees/:id
  },
  
  // ==================== ONBOARDING/OFFBOARDING ====================
  {
    key: 'ONBOARDING_START',
    label: 'Onboarding gestartet',
    category: 'employee',
    description: 'Wird ausgelöst, wenn der Onboarding-Prozess startet',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'startDate', 'organizationId'],
    implemented: true, // ✅ IMPLEMENTED in Personalakte POST /employees/:id/onboarding/start
  },
  {
    key: 'OFFBOARDING_START',
    label: 'Offboarding gestartet',
    category: 'employee',
    description: 'Wird ausgelöst, wenn der Offboarding-Prozess startet',
    sourceFunction: 'BrowoKoordinator-Personalakte',
    expectedContext: ['userId', 'employeeId', 'employeeName', 'endDate', 'organizationId'],
    implemented: true, // ✅ IMPLEMENTED in Personalakte POST /employees/:id/offboarding/start
  },
  
  // ==================== VEHICLE ====================
  {
    key: 'VEHICLE_ASSIGNED',
    label: 'Fahrzeug zugewiesen',
    category: 'vehicle',
    description: 'Wird ausgelöst, wenn ein Fahrzeug einem Mitarbeiter zugewiesen wird',
    sourceFunction: 'BrowoKoordinator-Flotte',
    expectedContext: ['vehicleId', 'vehicleName', 'userId', 'userName', 'assignmentDate', 'organizationId'],
    implemented: false, // TODO: Implement in Flotte
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
    implemented: false, // TODO: Create Equipment Edge Function
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
    implemented: true, // ✅ IMPLEMENTED in Benefits POST /approve/:id
  },
  {
    key: 'BENEFIT_REMOVED',
    label: 'Benefit entfernt',
    category: 'benefit',
    description: 'Wird ausgelöst, wenn ein Benefit entfernt wird',
    sourceFunction: 'BrowoKoordinator-Benefits',
    expectedContext: ['benefitId', 'benefitName', 'userId', 'removalDate', 'organizationId'],
    implemented: true, // ✅ IMPLEMENTED in Benefits POST /reject/:id
  },
  
  // ==================== TASK ====================
  {
    key: 'TASK_CREATED',
    label: 'Aufgabe erstellt',
    category: 'task',
    description: 'Wird ausgelöst, wenn eine neue Aufgabe erstellt wird',
    sourceFunction: 'BrowoKoordinator-Tasks',
    expectedContext: ['taskId', 'taskTitle', 'assignedTo', 'assignedToName', 'createdBy', 'organizationId'],
    implemented: true, // ✅ IMPLEMENTED in Tasks POST /tasks
  },
  {
    key: 'TASK_COMPLETED',
    label: 'Aufgabe abgeschlossen',
    category: 'task',
    description: 'Wird ausgelöst, wenn eine Aufgabe abgeschlossen wird',
    sourceFunction: 'BrowoKoordinator-Tasks',
    expectedContext: ['taskId', 'taskTitle', 'completedBy', 'completedByName', 'completionDate', 'organizationId'],
    implemented: true, // ✅ IMPLEMENTED in Tasks POST /tasks/:id/status (when status = DONE)
  },
  
  // ==================== TRAINING ====================
  {
    key: 'TRAINING_ASSIGNED',
    label: 'Schulung zugewiesen',
    category: 'training',
    description: 'Wird ausgelöst, wenn einem Mitarbeiter eine Schulung zugewiesen wird',
    sourceFunction: 'BrowoKoordinator-Training',
    expectedContext: ['trainingId', 'trainingName', 'userId', 'userName', 'assignmentDate', 'organizationId'],
    implemented: false, // TODO: Create Training Edge Function
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

/**
 * Get all triggers as a simple key-value object
 */
export const TRIGGER_TYPES = TRIGGER_REGISTRY.reduce((acc, trigger) => {
  acc[trigger.key] = trigger.key;
  return acc;
}, {} as Record<string, string>);

/**
 * Get triggers by category
 */
export function getTriggersByCategory(category: TriggerDefinition['category']): TriggerDefinition[] {
  return TRIGGER_REGISTRY.filter(t => t.category === category);
}

/**
 * Get trigger by key
 */
export function getTriggerByKey(key: string): TriggerDefinition | undefined {
  return TRIGGER_REGISTRY.find(t => t.key === key);
}

/**
 * Get all implemented triggers
 */
export function getImplementedTriggers(): TriggerDefinition[] {
  return TRIGGER_REGISTRY.filter(t => t.implemented);
}

/**
 * Get all unimplemented triggers (TODOs)
 */
export function getUnimplementedTriggers(): TriggerDefinition[] {
  return TRIGGER_REGISTRY.filter(t => !t.implemented);
}

/**
 * Get triggers by Edge Function
 */
export function getTriggersByFunction(functionName: string): TriggerDefinition[] {
  return TRIGGER_REGISTRY.filter(t => t.sourceFunction === functionName);
}

/**
 * Validate trigger context
 * Checks if all expected context fields are present
 */
export function validateTriggerContext(triggerKey: string, context: Record<string, any>): {
  valid: boolean;
  missing: string[];
} {
  const trigger = getTriggerByKey(triggerKey);
  
  if (!trigger) {
    return { valid: false, missing: [] };
  }
  
  const missing = trigger.expectedContext.filter(field => !(field in context));
  
  return {
    valid: missing.length === 0,
    missing,
  };
}