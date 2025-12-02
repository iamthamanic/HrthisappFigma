/**
 * @file BrowoKo_TriggerSelector.tsx
 * @domain Workflows - Trigger Selection
 * @description Dropdown to select from all 22 workflow trigger types
 * @version 1.0.0
 */

import { WorkflowTriggerType } from '../../types/workflow';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { 
  User, 
  GraduationCap, 
  ShoppingCart, 
  CheckSquare, 
  FileText, 
  Clock,
  Users,
  Video,
  Award,
  Coins,
  Trophy,
  Gift,
  Calendar
} from 'lucide-react';

interface TriggerSelectorProps {
  value: WorkflowTriggerType;
  onChange: (value: WorkflowTriggerType) => void;
  disabled?: boolean;
}

export function BrowoKo_TriggerSelector({ value, onChange, disabled }: TriggerSelectorProps) {
  
  const triggers: Array<{
    group: string;
    items: Array<{
      value: WorkflowTriggerType;
      label: string;
      icon: any;
      deprecated?: boolean;
    }>;
  }> = [
    {
      group: '👤 HR / Mitarbeiter',
      items: [
        { value: 'EMPLOYEE_CREATED', label: 'Mitarbeiter angelegt', icon: User },
        { value: 'EMPLOYEE_UPDATED', label: 'Mitarbeiter aktualisiert', icon: User },
        { value: 'EMPLOYEE_DELETED', label: 'Mitarbeiter gelöscht', icon: User },
        { value: 'EMPLOYEE_ADDED_TO_TEAM', label: 'Zu Team hinzugefügt', icon: Users },
        { value: 'EMPLOYEE_REMOVED_FROM_TEAM', label: 'Aus Team entfernt', icon: Users },
      ]
    },
    {
      group: '🎓 Learning / Videos',
      items: [
        { value: 'LEARNING_VIDEO_STARTED', label: 'Video gestartet', icon: Video },
        { value: 'LEARNING_VIDEO_COMPLETED', label: 'Video abgeschlossen', icon: Video },
        { value: 'LEARNING_TEST_COMPLETED', label: 'Test abgeschlossen', icon: GraduationCap },
        { value: 'LEARNING_QUIZ_COMPLETED', label: 'Lerneinheit abgeschlossen', icon: GraduationCap },
      ]
    },
    {
      group: '🏆 Gamification',
      items: [
        { value: 'XP_THRESHOLD_REACHED', label: 'XP-Schwelle erreicht', icon: Award },
        { value: 'LEVEL_UP', label: 'Level aufgestiegen', icon: Trophy },
        { value: 'COINS_THRESHOLD_REACHED', label: 'Coin-Stand erreicht', icon: Coins },
        { value: 'ACHIEVEMENT_UNLOCKED', label: 'Achievement freigeschaltet', icon: Trophy },
      ]
    },
    {
      group: '🛒 Shop / Benefits',
      items: [
        { value: 'BENEFIT_PURCHASED', label: 'Benefit gekauft', icon: ShoppingCart },
        { value: 'BENEFIT_REDEEMED', label: 'Benefit eingelöst', icon: Gift },
      ]
    },
    {
      group: '✅ Aufgaben',
      items: [
        { value: 'TASK_COMPLETED', label: 'Aufgabe abgeschlossen', icon: CheckSquare },
        { value: 'TASK_OVERDUE', label: 'Aufgabe überfällig', icon: CheckSquare },
      ]
    },
    {
      group: '📄 Anträge',
      items: [
        { value: 'REQUEST_APPROVED', label: 'Antrag genehmigt', icon: FileText },
        { value: 'REQUEST_REJECTED', label: 'Antrag abgelehnt', icon: FileText },
      ]
    },
    {
      group: '⏰ Zeitbasiert',
      items: [
        { value: 'SCHEDULED_DATE', label: 'Bestimmtes Datum', icon: Calendar },
        { value: 'SCHEDULED_CRON', label: 'Zeitplan (Cron)', icon: Clock },
        { value: 'REMINDER_CHECK', label: 'Periodischer Check', icon: Clock },
      ]
    },
    {
      group: '⚙️ Sonstige',
      items: [
        { value: 'MANUAL', label: 'Manueller Start', icon: User },
        { value: 'ONBOARDING_START', label: '[Legacy] Onboarding', icon: User, deprecated: true },
        { value: 'OFFBOARDING_START', label: '[Legacy] Offboarding', icon: User, deprecated: true },
        { value: 'PROMOTION', label: '[Legacy] Beförderung', icon: User, deprecated: true },
        { value: 'TIME_BASED', label: '[Legacy] Zeitbasiert', icon: Clock, deprecated: true },
        { value: 'EVENT_BASED', label: '[Legacy] Event-basiert', icon: Award, deprecated: true },
      ]
    }
  ];

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Trigger-Typ auswählen" />
      </SelectTrigger>
      <SelectContent>
        {triggers.map((group) => (
          <SelectGroup key={group.group}>
            <SelectLabel>{group.group}</SelectLabel>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <SelectItem 
                  key={item.value} 
                  value={item.value}
                  className={item.deprecated ? 'opacity-50' : ''}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
