/**
 * @file BrowoKo_AuditLogsView.tsx
 * @domain BrowoKo - Audit Logs View
 * @description Collapsible audit log view grouped by feature categories
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  ChevronDown, ChevronRight, User, Briefcase, Clock, Calendar, 
  FileText, Gift, Coins, Award, GraduationCap, 
  Shield, Info 
} from './icons/BrowoKoIcons';
import { 
  auditLogService, 
  AUDIT_CATEGORY_METADATA, 
  type AuditLog, 
  type AuditLogCategory 
} from '../services/BrowoKo_auditLogService';
import { toast } from 'sonner@2.0.3';

// Icon mapping
const ICON_MAP: Record<string, any> = {
  User,
  Briefcase,
  Clock,
  Calendar,
  FileText,
  Gift,
  Coins,
  Award,
  GraduationCap,
  Shield,
  Info,
};

interface AuditLogsViewProps {
  userId: string;
  userName?: string;
}

export function AuditLogsView({ userId, userName }: AuditLogsViewProps) {
  const [logs, setLogs] = useState<Record<AuditLogCategory, AuditLog[]>>({} as any);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<AuditLogCategory, number>>({} as any);

  useEffect(() => {
    loadAuditLogs();
  }, [userId]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const [logsData, countsData] = await Promise.all([
        auditLogService.getUserAuditLogsByCategory(userId),
        auditLogService.getAuditLogsCountByCategory(userId),
      ]);

      setLogs(logsData as any);
      setCounts(countsData);
    } catch (error) {
      console.error('[AuditLogsView] Error loading audit logs:', error);
      toast.error('Fehler beim Laden der Logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30 animate-spin" />
            <p>Logs werden geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort categories by order - SHOW ALL CATEGORIES, not just those with logs
  const sortedCategories = Object.keys(AUDIT_CATEGORY_METADATA).sort(
    (a, b) =>
      AUDIT_CATEGORY_METADATA[a as AuditLogCategory].order -
      AUDIT_CATEGORY_METADATA[b as AuditLogCategory].order
  ) as AuditLogCategory[];

  // Total count of all logs across all categories
  const totalLogsCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Logs
            </CardTitle>
            <Badge variant="secondary">
              {totalLogsCount} Einträge
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Category Sections - SHOW ALL CATEGORIES (collapsed by default) */}
      {sortedCategories.map((category) => {
        const metadata = AUDIT_CATEGORY_METADATA[category];
        const categoryLogs = logs[category] || [];
        const categoryCount = counts[category] || 0;
        const isOpen = openCategories.has(category);
        const IconComponent = ICON_MAP[metadata.icon] || Info;

        return (
          <Card key={category}>
            <Collapsible open={isOpen} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <IconComponent className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">{metadata.label}</CardTitle>
                      </div>
                      <Badge variant="secondary">{categoryCount}</Badge>
                    </div>
                  </CardHeader>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  {categoryLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Keine Aktivitäten in dieser Kategorie</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categoryLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        {/* Log Description */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm flex-1">{log.description}</p>
                          <Badge
                            variant={
                              log.action === 'INSERT'
                                ? 'default'
                                : log.action === 'DELETE'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="shrink-0"
                          >
                            {log.action === 'INSERT'
                              ? 'Erstellt'
                              : log.action === 'DELETE'
                              ? 'Gelöscht'
                              : 'Geändert'}
                          </Badge>
                        </div>

                        {/* Change Details */}
                        {log.field_name && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 p-3 bg-white rounded border border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Feld</p>
                              <p className="text-sm font-medium">{log.field_name}</p>
                            </div>
                            {log.old_value && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Alt</p>
                                <p className="text-sm text-red-600 line-through">
                                  {log.old_value}
                                </p>
                              </div>
                            )}
                            {log.new_value && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Neu</p>
                                <p className="text-sm text-green-600 font-medium">
                                  {log.new_value}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Valid From (for time-based changes) */}
                        {log.valid_from && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Gültig ab:{' '}
                              {new Date(log.valid_from).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        )}

                        {/* Change Reason */}
                        {log.change_reason && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs text-blue-700">
                              <strong>Grund:</strong> {log.change_reason}
                            </p>
                          </div>
                        )}

                        {/* Footer: Who & When */}
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>
                              {log.changed_by_name}
                              {log.changed_by_role && log.changed_by_role !== 'user' && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {log.changed_by_role === 'superadmin'
                                    ? 'Super Admin'
                                    : log.changed_by_role === 'admin'
                                    ? 'Admin'
                                    : log.changed_by_role === 'hr'
                                    ? 'HR'
                                    : log.changed_by_role === 'teamlead'
                                    ? 'Teamlead'
                                    : log.changed_by_role}
                                </Badge>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(log.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
