/**
 * @file BrowoKo_TriggerConfigurator.tsx
 * @domain Workflows - Trigger Configuration
 * @description UI component for configuring all 22 workflow trigger types
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { WorkflowTriggerType, TriggerConfig } from '../../types/workflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
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

interface TriggerConfiguratorProps {
  triggerType: WorkflowTriggerType;
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
}

export function BrowoKo_TriggerConfigurator({ 
  triggerType, 
  config, 
  onChange 
}: TriggerConfiguratorProps) {
  
  const getTriggerInfo = (type: WorkflowTriggerType) => {
    const info: Record<WorkflowTriggerType, { 
      icon: any; 
      color: string; 
      category: string;
      description: string;
    }> = {
      // ========== HR / MITARBEITER ==========
      EMPLOYEE_CREATED: {
        icon: User,
        color: 'bg-blue-100 text-blue-800',
        category: 'HR',
        description: 'Wird ausgelöst wenn ein neuer Mitarbeiter angelegt wird'
      },
      EMPLOYEE_UPDATED: {
        icon: User,
        color: 'bg-blue-100 text-blue-800',
        category: 'HR',
        description: 'Wird ausgelöst wenn Mitarbeiter-Daten aktualisiert werden'
      },
      EMPLOYEE_DELETED: {
        icon: User,
        color: 'bg-red-100 text-red-800',
        category: 'HR',
        description: 'Wird ausgelöst wenn ein Mitarbeiter gelöscht wird'
      },
      EMPLOYEE_ADDED_TO_TEAM: {
        icon: Users,
        color: 'bg-purple-100 text-purple-800',
        category: 'HR',
        description: 'Wird ausgelöst wenn ein Mitarbeiter zu einem Team hinzugefügt wird'
      },
      EMPLOYEE_REMOVED_FROM_TEAM: {
        icon: Users,
        color: 'bg-purple-100 text-purple-800',
        category: 'HR',
        description: 'Wird ausgelöst wenn ein Mitarbeiter aus einem Team entfernt wird'
      },
      
      // ========== LEARNING ==========
      LEARNING_VIDEO_STARTED: {
        icon: Video,
        color: 'bg-green-100 text-green-800',
        category: 'Learning',
        description: 'Wird ausgelöst wenn ein Mitarbeiter ein Video startet'
      },
      LEARNING_VIDEO_COMPLETED: {
        icon: Video,
        color: 'bg-green-100 text-green-800',
        category: 'Learning',
        description: 'Wird ausgelöst wenn ein Mitarbeiter ein Video abschließt'
      },
      LEARNING_TEST_COMPLETED: {
        icon: GraduationCap,
        color: 'bg-green-100 text-green-800',
        category: 'Learning',
        description: 'Wird ausgelöst wenn ein Mitarbeiter einen Test abschließt'
      },
      LEARNING_QUIZ_COMPLETED: {
        icon: GraduationCap,
        color: 'bg-green-100 text-green-800',
        category: 'Learning',
        description: 'Wird ausgelöst wenn ein Mitarbeiter eine Lerneinheit abschließt'
      },
      XP_THRESHOLD_REACHED: {
        icon: Award,
        color: 'bg-amber-100 text-amber-800',
        category: 'Gamification',
        description: 'Wird ausgelöst wenn ein Mitarbeiter eine bestimmte XP-Anzahl erreicht'
      },
      LEVEL_UP: {
        icon: Trophy,
        color: 'bg-amber-100 text-amber-800',
        category: 'Gamification',
        description: 'Wird ausgelöst wenn ein Mitarbeiter ein Level aufsteigt'
      },
      COINS_THRESHOLD_REACHED: {
        icon: Coins,
        color: 'bg-yellow-100 text-yellow-800',
        category: 'Gamification',
        description: 'Wird ausgelöst wenn ein Mitarbeiter einen bestimmten Coin-Stand erreicht'
      },
      ACHIEVEMENT_UNLOCKED: {
        icon: Trophy,
        color: 'bg-amber-100 text-amber-800',
        category: 'Gamification',
        description: 'Wird ausgelöst wenn ein Mitarbeiter ein Achievement freischaltet'
      },
      
      // ========== SHOP / BENEFITS ==========
      BENEFIT_PURCHASED: {
        icon: ShoppingCart,
        color: 'bg-pink-100 text-pink-800',
        category: 'Shop',
        description: 'Wird ausgelöst wenn ein Mitarbeiter ein Benefit kauft'
      },
      BENEFIT_REDEEMED: {
        icon: Gift,
        color: 'bg-pink-100 text-pink-800',
        category: 'Shop',
        description: 'Wird ausgelöst wenn ein Mitarbeiter ein Benefit einlöst'
      },
      
      // ========== TASKS ==========
      TASK_COMPLETED: {
        icon: CheckSquare,
        color: 'bg-teal-100 text-teal-800',
        category: 'Tasks',
        description: 'Wird ausgelöst wenn eine Aufgabe abgeschlossen wird'
      },
      TASK_OVERDUE: {
        icon: CheckSquare,
        color: 'bg-red-100 text-red-800',
        category: 'Tasks',
        description: 'Wird ausgelöst wenn eine Aufgabe überfällig ist'
      },
      
      // ========== ANTRÄGE ==========
      REQUEST_APPROVED: {
        icon: FileText,
        color: 'bg-green-100 text-green-800',
        category: 'Anträge',
        description: 'Wird ausgelöst wenn ein Antrag genehmigt wird'
      },
      REQUEST_REJECTED: {
        icon: FileText,
        color: 'bg-red-100 text-red-800',
        category: 'Anträge',
        description: 'Wird ausgelöst wenn ein Antrag abgelehnt wird'
      },
      
      // ========== ZEITBASIERT ==========
      SCHEDULED_DATE: {
        icon: Calendar,
        color: 'bg-indigo-100 text-indigo-800',
        category: 'Zeitbasiert',
        description: 'Wird an einem bestimmten Datum ausgelöst'
      },
      SCHEDULED_CRON: {
        icon: Clock,
        color: 'bg-indigo-100 text-indigo-800',
        category: 'Zeitbasiert',
        description: 'Wird nach Zeitplan (Cron) ausgelöst'
      },
      REMINDER_CHECK: {
        icon: Clock,
        color: 'bg-orange-100 text-orange-800',
        category: 'Zeitbasiert',
        description: 'Periodischer Check für Erinnerungen'
      },
      
      // ========== LEGACY ==========
      ONBOARDING_START: {
        icon: User,
        color: 'bg-gray-100 text-gray-800',
        category: 'Legacy',
        description: 'Veraltet: Nutze EMPLOYEE_CREATED'
      },
      OFFBOARDING_START: {
        icon: User,
        color: 'bg-gray-100 text-gray-800',
        category: 'Legacy',
        description: 'Veraltet: Nutze EMPLOYEE_DELETED'
      },
      PROMOTION: {
        icon: User,
        color: 'bg-gray-100 text-gray-800',
        category: 'Legacy',
        description: 'Veraltet: Nutze EMPLOYEE_UPDATED'
      },
      TIME_BASED: {
        icon: Clock,
        color: 'bg-gray-100 text-gray-800',
        category: 'Legacy',
        description: 'Veraltet: Nutze SCHEDULED_DATE'
      },
      MANUAL: {
        icon: User,
        color: 'bg-gray-100 text-gray-800',
        category: 'Manual',
        description: 'Manuell gestartet'
      },
      EVENT_BASED: {
        icon: Award,
        color: 'bg-gray-100 text-gray-800',
        category: 'Legacy',
        description: 'Veraltet: Nutze spezifische Events'
      },
    };
    
    return info[type];
  };

  const info = getTriggerInfo(triggerType);
  const Icon = info.icon;

  const renderConfigFields = () => {
    switch (triggerType) {
      // ========== HR / MITARBEITER ==========
      case 'EMPLOYEE_ADDED_TO_TEAM':
      case 'EMPLOYEE_REMOVED_FROM_TEAM':
        return (
          <div className="space-y-4">
            <div>
              <Label>Team ID (optional)</Label>
              <Input
                placeholder="Leer lassen für alle Teams"
                value={config.team_id || ''}
                onChange={(e) => onChange({ ...config, team_id: e.target.value || undefined })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wenn leer, wird für alle Teams ausgelöst
              </p>
            </div>
          </div>
        );
      
      // ========== LEARNING ==========
      case 'LEARNING_VIDEO_STARTED':
      case 'LEARNING_VIDEO_COMPLETED':
        return (
          <div className="space-y-4">
            <div>
              <Label>Video ID (optional)</Label>
              <Input
                placeholder="Leer lassen für alle Videos"
                value={config.video_id || ''}
                onChange={(e) => onChange({ ...config, video_id: e.target.value || undefined })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wenn leer, wird für alle Videos ausgelöst
              </p>
            </div>
          </div>
        );
      
      case 'LEARNING_TEST_COMPLETED':
        return (
          <div className="space-y-4">
            <div>
              <Label>Test ID (optional)</Label>
              <Input
                placeholder="Leer lassen für alle Tests"
                value={config.test_id || ''}
                onChange={(e) => onChange({ ...config, test_id: e.target.value || undefined })}
              />
            </div>
            <div>
              <Label>Minimale Punktzahl (optional)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="z.B. 80 für 80%"
                value={config.min_score || ''}
                onChange={(e) => onChange({ ...config, min_score: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nur auslösen wenn mindestens diese Punktzahl erreicht wurde
              </p>
            </div>
          </div>
        );
      
      case 'LEARNING_QUIZ_COMPLETED':
        return (
          <div className="space-y-4">
            <div>
              <Label>Lerneinheit ID (optional)</Label>
              <Input
                placeholder="Leer lassen für alle Lerneinheiten"
                value={config.quiz_id || ''}
                onChange={(e) => onChange({ ...config, quiz_id: e.target.value || undefined })}
              />
            </div>
          </div>
        );
      
      case 'XP_THRESHOLD_REACHED':
        return (
          <div className="space-y-4">
            <div>
              <Label>XP-Schwelle *</Label>
              <Input
                type="number"
                min="1"
                placeholder="z.B. 100, 500, 1000"
                value={config.xp_threshold || ''}
                onChange={(e) => onChange({ ...config, xp_threshold: parseInt(e.target.value) || undefined })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Workflow wird ausgelöst wenn Mitarbeiter diese XP-Anzahl erreicht
              </p>
            </div>
          </div>
        );
      
      case 'LEVEL_UP':
        return (
          <div className="space-y-4">
            <div>
              <Label>Level (optional)</Label>
              <Input
                type="number"
                min="1"
                placeholder="z.B. 5, 10, 20 (leer = jedes Level)"
                value={config.level || ''}
                onChange={(e) => onChange({ ...config, level: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wenn leer, wird bei jedem Level-Aufstieg ausgelöst
              </p>
            </div>
          </div>
        );
      
      case 'COINS_THRESHOLD_REACHED':
        return (
          <div className="space-y-4">
            <div>
              <Label>Coin-Schwelle *</Label>
              <Input
                type="number"
                min="1"
                placeholder="z.B. 500, 1000"
                value={config.coin_threshold || ''}
                onChange={(e) => onChange({ ...config, coin_threshold: parseInt(e.target.value) || undefined })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Workflow wird ausgelöst wenn Mitarbeiter diesen Coin-Stand erreicht
              </p>
            </div>
          </div>
        );
      
      case 'ACHIEVEMENT_UNLOCKED':
        return (
          <div className="space-y-4">
            <div>
              <Label>Achievement ID (optional)</Label>
              <Input
                placeholder="Leer lassen für alle Achievements"
                value={config.achievement_id || ''}
                onChange={(e) => onChange({ ...config, achievement_id: e.target.value || undefined })}
              />
            </div>
          </div>
        );
      
      // ========== SHOP / BENEFITS ==========
      case 'BENEFIT_PURCHASED':
      case 'BENEFIT_REDEEMED':
        return (
          <div className="space-y-4">
            <div>
              <Label>Benefit ID (optional)</Label>
              <Input
                placeholder="Leer lassen für alle Benefits"
                value={config.benefit_id || ''}
                onChange={(e) => onChange({ ...config, benefit_id: e.target.value || undefined })}
              />
            </div>
          </div>
        );
      
      // ========== TASKS ==========
      case 'TASK_COMPLETED':
      case 'TASK_OVERDUE':
        return (
          <div className="space-y-4">
            <div>
              <Label>Task ID (optional)</Label>
              <Input
                placeholder="Leer lassen für alle Aufgaben"
                value={config.task_id || ''}
                onChange={(e) => onChange({ ...config, task_id: e.target.value || undefined })}
              />
            </div>
          </div>
        );
      
      // ========== ANTRÄGE ==========
      case 'REQUEST_APPROVED':
      case 'REQUEST_REJECTED':
        return (
          <div className="space-y-4">
            <div>
              <Label>Antragstyp</Label>
              <Select
                value={config.request_type || 'all'}
                onValueChange={(value) => onChange({ ...config, request_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Anträge</SelectItem>
                  <SelectItem value="leave">Urlaubsanträge</SelectItem>
                  <SelectItem value="document">Dokumentenanträge</SelectItem>
                  <SelectItem value="expense">Spesenanträge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      // ========== ZEITBASIERT ==========
      case 'SCHEDULED_DATE':
        return (
          <div className="space-y-4">
            <div>
              <Label>Datum *</Label>
              <Input
                type="date"
                value={config.date || ''}
                onChange={(e) => onChange({ ...config, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Wiederholung</Label>
              <Select
                value={config.repeat || 'once'}
                onValueChange={(value) => onChange({ ...config, repeat: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Einmalig</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'SCHEDULED_CRON':
        return (
          <div className="space-y-4">
            <div>
              <Label>Cron Expression *</Label>
              <Input
                placeholder='z.B. "0 9 * * 1" = Montags 9 Uhr'
                value={config.cron_expression || ''}
                onChange={(e) => onChange({ ...config, cron_expression: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Minute Stunde Tag Monat Wochentag
              </p>
              <div className="text-xs text-gray-600 mt-2 space-y-1">
                <p><strong>Beispiele:</strong></p>
                <p>• "0 9 * * *" = Täglich 9 Uhr</p>
                <p>• "0 9 * * 1" = Montags 9 Uhr</p>
                <p>• "0 0 1 * *" = Jeden 1. des Monats</p>
              </div>
            </div>
          </div>
        );
      
      case 'REMINDER_CHECK':
        return (
          <div className="space-y-4">
            <div>
              <Label>Check-Typ</Label>
              <Select
                value={config.check_type || 'incomplete_video'}
                onValueChange={(value) => onChange({ ...config, check_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete_video">Unvollständige Videos</SelectItem>
                  <SelectItem value="incomplete_test">Unvollständige Tests</SelectItem>
                  <SelectItem value="incomplete_quiz">Unvollständige Lerneinheiten</SelectItem>
                  <SelectItem value="pending_task">Ausstehende Aufgaben</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Intervall (Stunden)</Label>
              <Input
                type="number"
                min="1"
                placeholder="z.B. 24 für täglich"
                value={config.interval_hours || ''}
                onChange={(e) => onChange({ ...config, interval_hours: parseInt(e.target.value) || undefined })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wie oft soll geprüft werden?
              </p>
            </div>
          </div>
        );
      
      // ========== DEFAULT / NO CONFIG ==========
      default:
        return (
          <div className="text-sm text-gray-500">
            Dieser Trigger benötigt keine zusätzliche Konfiguration.
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${info.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Trigger-Konfiguration</CardTitle>
            <CardDescription>{info.description}</CardDescription>
          </div>
          <Badge variant="outline" className={info.color}>
            {info.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderConfigFields()}
        
        {/* Common Filters (available for all triggers) */}
        <div className="border-t pt-4 mt-6">
          <h4 className="font-medium text-sm mb-3 text-gray-700">Optionale Filter</h4>
          <div className="space-y-4">
            <div>
              <Label>Abteilungen (optional)</Label>
              <Input
                placeholder="Komma-getrennte IDs z.B. dept_1,dept_2"
                value={config.department_ids?.join(',') || ''}
                onChange={(e) => onChange({ 
                  ...config, 
                  department_ids: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nur für bestimmte Abteilungen auslösen
              </p>
            </div>
            
            <div>
              <Label>Standorte (optional)</Label>
              <Input
                placeholder="Komma-getrennte IDs z.B. loc_1,loc_2"
                value={config.location_ids?.join(',') || ''}
                onChange={(e) => onChange({ 
                  ...config, 
                  location_ids: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nur für bestimmte Standorte auslösen
              </p>
            </div>
            
            <div>
              <Label>Rollen (optional)</Label>
              <Input
                placeholder="Komma-getrennte IDs z.B. role_1,role_2"
                value={config.role_ids?.join(',') || ''}
                onChange={(e) => onChange({ 
                  ...config, 
                  role_ids: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nur für bestimmte Rollen auslösen
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
