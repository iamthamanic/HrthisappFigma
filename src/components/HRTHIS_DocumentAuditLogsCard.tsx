import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Upload, Edit, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { AuditReport } from '../services/HRTHIS_documentAuditService';
import { getServices } from '../services';
import { toast } from 'sonner@2.0.3';
import { useDateFilter } from '../hooks/useDateFilter';

/**
 * DOCUMENT AUDIT LOGS CARD COMPONENT
 * ===================================
 * Displays document audit logs for a user
 * 
 * Features:
 * - Shows all document actions (UPLOAD, DOWNLOAD, VIEW, UPDATE, DELETE)
 * - Displays document title, action type, and timestamp
 * - Color-coded badges for different actions
 * - User-friendly empty states
 * 
 * Used in:
 * - MeineDaten (Meine Daten)
 * - TeamMemberDetailsScreen (Admin view)
 */

export interface DocumentAuditLogsCardProps {
  userId: string;
  title?: string;
  maxLogs?: number;
}

const ACTION_CONFIG = {
  UPLOAD: {
    icon: Upload,
    label: 'Hochgeladen',
    variant: 'default' as const,
    color: 'text-green-600',
  },
  DOWNLOAD: {
    icon: Download,
    label: 'Heruntergeladen',
    variant: 'secondary' as const,
    color: 'text-blue-600',
  },
  VIEW: {
    icon: Eye,
    label: 'Angesehen',
    variant: 'outline' as const,
    color: 'text-gray-600',
  },
  UPDATE: {
    icon: Edit,
    label: 'Geändert',
    variant: 'secondary' as const,
    color: 'text-orange-600',
  },
  DELETE: {
    icon: Trash2,
    label: 'Gelöscht',
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
};

export function DocumentAuditLogsCard({
  userId,
  title = 'Dokument-Aktivitäten',
  maxLogs = 50,
}: DocumentAuditLogsCardProps) {
  const [logs, setLogs] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use reusable date filter hook
  const { filterDate, setFilterDate, formatFilterDate, filterByDate } = useDateFilter();

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterDate]);

  const loadLogs = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const services = getServices();
      
      // Get audit logs for this user
      const allLogs = await services.documentAudit.getAuditReport({
        user_id: userId,
      });

      // Filter by date using hook
      const filteredLogs = filterByDate(allLogs, 'created_at');

      // Sort by date (newest first) and limit
      const sortedLogs = filteredLogs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, maxLogs);

      setLogs(sortedLogs);
    } catch (err: any) {
      console.error('Error loading document audit logs:', err);
      setError(err.message || 'Fehler beim Laden der Logs');
      toast.error('Dokument-Logs konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    // If less than 24 hours ago, show relative time
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return `Vor ${minutes} Min.`;
      }
      const hours = Math.floor(diffInHours);
      return `Vor ${hours} Std.`;
    }

    // Otherwise show date and time
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionConfig = (action: string) => {
    return ACTION_CONFIG[action as keyof typeof ACTION_CONFIG] || ACTION_CONFIG.VIEW;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {title}
          </CardTitle>
          
          {/* Datumsfilter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                {formatFilterDate(filterDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
              />
              {filterDate && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setFilterDate(undefined)}
                  >
                    Filter zurücksetzen
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Lädt...</div>
        ) : error ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50 text-red-400" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : logs.length > 0 ? (
          <>
            {filterDate && (
              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Gefiltert nach: <span className="font-medium">{formatFilterDate(filterDate)}</span>
                {' '}({logs.length} {logs.length === 1 ? 'Eintrag' : 'Einträge'})
              </div>
            )}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log) => {
              const config = getActionConfig(log.action);
              const Icon = config.icon;

              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {log.document_title || 'Unbekanntes Dokument'}
                        </span>
                        {log.document_category && (
                          <Badge variant="outline" className="text-xs">
                            {log.document_category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(log.created_at)}
                      </div>
                      
                      {/* Show additional details for UPDATE action */}
                      {log.action === 'UPDATE' && log.details && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                          {log.details.old_title !== log.details.new_title && (
                            <div>
                              Titel: <span className="line-through">{log.details.old_title}</span> → {log.details.new_title}
                            </div>
                          )}
                          {log.details.old_category !== log.details.new_category && (
                            <div>
                              Kategorie: <span className="line-through">{log.details.old_category}</span> → {log.details.new_category}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant={config.variant} className="ml-2 flex-shrink-0">
                    {config.label}
                  </Badge>
                </div>
              );
            })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Keine Dokument-Aktivitäten</p>
            <p className="text-xs mt-1">
              {filterDate 
                ? `Keine Aktivitäten am ${formatFilterDate(filterDate)}` 
                : 'Aktivitäten werden hier angezeigt, sobald Dokumente hochgeladen oder bearbeitet werden'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
