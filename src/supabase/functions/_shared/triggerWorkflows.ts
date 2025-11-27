/**
 * Shared Helper: Trigger Workflows
 * 
 * This function can be called by ANY Edge Function to trigger workflows
 * when certain events happen (e.g., EMPLOYEE_CREATED, VEHICLE_ASSIGNED, etc.)
 * 
 * Usage Example:
 * ```typescript
 * import { triggerWorkflows, TRIGGER_TYPES } from "../_shared/triggerWorkflows.ts";
 * 
 * // After creating an employee
 * await triggerWorkflows(TRIGGER_TYPES.EMPLOYEE_CREATED, {
 *   userId: newUser.id,
 *   employeeId: newUser.id,
 *   employeeName: newUser.full_name,
 *   organizationId: newUser.organization_id,
 * }, authToken);
 * ```
 */

import { TRIGGER_TYPES, validateTriggerContext } from './triggerRegistry.ts';

// Re-export for convenience
export { TRIGGER_TYPES } from './triggerRegistry.ts';

/**
 * Triggers all workflows that are listening to a specific event
 * 
 * @param triggerType - The event type (e.g., 'EMPLOYEE_CREATED', 'VEHICLE_ASSIGNED')
 * @param context - Data to pass to the workflow (employee data, vehicle data, etc.)
 * @param authToken - The authorization token for the request
 */
export async function triggerWorkflows(
  triggerType: string,
  context: Record<string, any>,
  authToken: string
): Promise<void> {
  try {
    // Validate context has all required fields
    const validation = validateTriggerContext(triggerType, context);
    if (!validation.valid && validation.missing.length > 0) {
      console.warn(
        `[triggerWorkflows] Missing context fields for ${triggerType}:`,
        validation.missing
      );
      console.warn(`[triggerWorkflows] Provided context:`, Object.keys(context));
    }

    const projectId = Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0];
    
    if (!projectId) {
      console.error('[triggerWorkflows] Could not determine project ID');
      return;
    }

    console.log(`🔔 Triggering workflows for event: ${triggerType}`);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/trigger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
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
      // Don't throw - workflows are optional, main operation should continue
      return;
    }

    const result = await response.json();
    console.log(`✅ Workflows triggered successfully:`, result);
  } catch (error) {
    console.error(`[triggerWorkflows] Error triggering workflows:`, error);
    // Don't throw - workflows are optional
  }
}