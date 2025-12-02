/**
 * @file workflowHelpers.tsx
 * @domain Workflows - Helper Functions
 * @description Shared helper functions for workflow UI components
 * @version 1.0.0
 */

import { Badge } from '../components/ui/badge';
import type { WorkflowTriggerType } from '../types/workflow';

/**
 * Get visual badge for trigger type
 */
export function getTriggerBadge(type: WorkflowTriggerType) {
  const badges: Record<WorkflowTriggerType, JSX.Element> = {
    // HR / MITARBEITER
    EMPLOYEE_CREATED: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">👤 Mitarbeiter angelegt</Badge>,
    EMPLOYEE_UPDATED: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">👤 Mitarbeiter aktualisiert</Badge>,
    EMPLOYEE_DELETED: <Badge className="bg-red-100 text-red-800 hover:bg-red-200">👤 Mitarbeiter gelöscht</Badge>,
    EMPLOYEE_ADDED_TO_TEAM: <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">👥 Team beigetreten</Badge>,
    EMPLOYEE_REMOVED_FROM_TEAM: <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">👥 Team verlassen</Badge>,
    
    // LEARNING
    LEARNING_VIDEO_STARTED: <Badge className="bg-green-100 text-green-800 hover:bg-green-200">🎥 Video gestartet</Badge>,
    LEARNING_VIDEO_COMPLETED: <Badge className="bg-green-100 text-green-800 hover:bg-green-200">🎥 Video abgeschlossen</Badge>,
    LEARNING_TEST_COMPLETED: <Badge className="bg-green-100 text-green-800 hover:bg-green-200">🎓 Test abgeschlossen</Badge>,
    LEARNING_QUIZ_COMPLETED: <Badge className="bg-green-100 text-green-800 hover:bg-green-200">🎓 Quiz abgeschlossen</Badge>,
    
    // GAMIFICATION
    XP_THRESHOLD_REACHED: <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">⭐ XP-Schwelle</Badge>,
    LEVEL_UP: <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">🏆 Level Up</Badge>,
    COINS_THRESHOLD_REACHED: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">🪙 Coin-Schwelle</Badge>,
    ACHIEVEMENT_UNLOCKED: <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">🏆 Achievement</Badge>,
    
    // SHOP / BENEFITS
    BENEFIT_PURCHASED: <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">🛒 Benefit gekauft</Badge>,
    BENEFIT_REDEEMED: <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">🎁 Benefit eingelöst</Badge>,
    
    // TASKS
    TASK_COMPLETED: <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">✅ Task erledigt</Badge>,
    TASK_OVERDUE: <Badge className="bg-red-100 text-red-800 hover:bg-red-200">⏰ Task überfällig</Badge>,
    
    // ANTRÄGE
    REQUEST_APPROVED: <Badge className="bg-green-100 text-green-800 hover:bg-green-200">✔️ Antrag genehmigt</Badge>,
    REQUEST_REJECTED: <Badge className="bg-red-100 text-red-800 hover:bg-red-200">❌ Antrag abgelehnt</Badge>,
    
    // ZEITBASIERT
    SCHEDULED_DATE: <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">📅 Datum</Badge>,
    SCHEDULED_CRON: <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">⏰ Zeitplan</Badge>,
    REMINDER_CHECK: <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">🔔 Erinnerung</Badge>,
    
    // LEGACY
    ONBOARDING_START: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Onboarding (Legacy)</Badge>,
    OFFBOARDING_START: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Offboarding (Legacy)</Badge>,
    PROMOTION: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Beförderung (Legacy)</Badge>,
    TIME_BASED: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Zeitbasiert (Legacy)</Badge>,
    MANUAL: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Manuell</Badge>,
    EVENT_BASED: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Event (Legacy)</Badge>,
  };
  
  return badges[type] || <Badge variant="outline">{type}</Badge>;
}

/**
 * Get category for trigger type
 */
export function getTriggerCategory(type: WorkflowTriggerType): string {
  const categories: Record<WorkflowTriggerType, string> = {
    EMPLOYEE_CREATED: 'HR',
    EMPLOYEE_UPDATED: 'HR',
    EMPLOYEE_DELETED: 'HR',
    EMPLOYEE_ADDED_TO_TEAM: 'HR',
    EMPLOYEE_REMOVED_FROM_TEAM: 'HR',
    
    LEARNING_VIDEO_STARTED: 'Learning',
    LEARNING_VIDEO_COMPLETED: 'Learning',
    LEARNING_TEST_COMPLETED: 'Learning',
    LEARNING_QUIZ_COMPLETED: 'Learning',
    
    XP_THRESHOLD_REACHED: 'Gamification',
    LEVEL_UP: 'Gamification',
    COINS_THRESHOLD_REACHED: 'Gamification',
    ACHIEVEMENT_UNLOCKED: 'Gamification',
    
    BENEFIT_PURCHASED: 'Shop',
    BENEFIT_REDEEMED: 'Shop',
    
    TASK_COMPLETED: 'Tasks',
    TASK_OVERDUE: 'Tasks',
    
    REQUEST_APPROVED: 'Anträge',
    REQUEST_REJECTED: 'Anträge',
    
    SCHEDULED_DATE: 'Zeitbasiert',
    SCHEDULED_CRON: 'Zeitbasiert',
    REMINDER_CHECK: 'Zeitbasiert',
    
    ONBOARDING_START: 'Legacy',
    OFFBOARDING_START: 'Legacy',
    PROMOTION: 'Legacy',
    TIME_BASED: 'Legacy',
    MANUAL: 'Manual',
    EVENT_BASED: 'Legacy',
  };
  
  return categories[type] || 'Unknown';
}

/**
 * Get human-readable label for trigger type
 */
export function getTriggerLabel(type: WorkflowTriggerType): string {
  const labels: Record<WorkflowTriggerType, string> = {
    EMPLOYEE_CREATED: 'Mitarbeiter angelegt',
    EMPLOYEE_UPDATED: 'Mitarbeiter aktualisiert',
    EMPLOYEE_DELETED: 'Mitarbeiter gelöscht',
    EMPLOYEE_ADDED_TO_TEAM: 'Zu Team hinzugefügt',
    EMPLOYEE_REMOVED_FROM_TEAM: 'Aus Team entfernt',
    
    LEARNING_VIDEO_STARTED: 'Video gestartet',
    LEARNING_VIDEO_COMPLETED: 'Video abgeschlossen',
    LEARNING_TEST_COMPLETED: 'Test abgeschlossen',
    LEARNING_QUIZ_COMPLETED: 'Lerneinheit abgeschlossen',
    
    XP_THRESHOLD_REACHED: 'XP-Schwelle erreicht',
    LEVEL_UP: 'Level aufgestiegen',
    COINS_THRESHOLD_REACHED: 'Coin-Stand erreicht',
    ACHIEVEMENT_UNLOCKED: 'Achievement freigeschaltet',
    
    BENEFIT_PURCHASED: 'Benefit gekauft',
    BENEFIT_REDEEMED: 'Benefit eingelöst',
    
    TASK_COMPLETED: 'Aufgabe abgeschlossen',
    TASK_OVERDUE: 'Aufgabe überfällig',
    
    REQUEST_APPROVED: 'Antrag genehmigt',
    REQUEST_REJECTED: 'Antrag abgelehnt',
    
    SCHEDULED_DATE: 'Bestimmtes Datum',
    SCHEDULED_CRON: 'Zeitplan (Cron)',
    REMINDER_CHECK: 'Periodischer Check',
    
    ONBOARDING_START: 'Onboarding Start',
    OFFBOARDING_START: 'Offboarding Start',
    PROMOTION: 'Beförderung',
    TIME_BASED: 'Zeitbasiert',
    MANUAL: 'Manueller Start',
    EVENT_BASED: 'Event-basiert',
  };
  
  return labels[type] || type;
}
