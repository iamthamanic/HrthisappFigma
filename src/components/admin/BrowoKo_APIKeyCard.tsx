// ============================================================================
// API KEY CARD - COLLAPSIBLE MIT AUTOMATION DETAILS
// ============================================================================
// Displays automation API key in list format with expandable audit logs
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { 
  Key, 
  Edit2, 
  Check, 
  X, 
  Trash2, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { automationService, AutomationAPIKey, AutomationStats, AutomationAuditLog } from '../../services/BrowoKo_automationService';

interface APIKeyCardProps {
  apiKey: AutomationAPIKey;
  onUpdate: () => void;
}

export function BrowoKo_APIKeyCard({ apiKey, onUpdate }: APIKeyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(apiKey.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Collapsible State
  const [isOpen, setIsOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AutomationAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [apiKey.id]);

  // Load audit logs when expanded
  useEffect(() => {
    if (isOpen && auditLogs.length === 0) {
      loadAuditLogs();
    }
  }, [isOpen]);

  const loadStats = async () => {
    setLoadingStats(true);
    const data = await automationService.getAPIKeyStats(apiKey.id);
    setStats(data);
    setLoadingStats(false);
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await automationService.getAuditLogs(apiKey.id, 20);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
    setLoadingLogs(false);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === apiKey.name) {
      setIsEditing(false);
      setEditedName(apiKey.name);
      return;
    }

    setLoading(true);
    const success = await automationService.updateAPIKeyName(apiKey.id, editedName.trim());
    
    if (success) {
      onUpdate();
      setIsEditing(false);
    } else {
      setEditedName(apiKey.name);
    }
    
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const success = await automationService.deleteAPIKey(apiKey.id);
    
    if (success) {
      onUpdate();
    }
    
    setLoading(false);
    setShowDeleteDialog(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatMethod = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Liste-Darstellung mit horizontalem Layout */}
        <div className="bg-white border rounded-lg hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="shrink-0">
                <Key className="w-6 h-6 text-primary" />
              </div>

              {/* Hauptinformationen */}
              <div className="flex-1 min-w-0">
                {/* Name (editierbar) */}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setIsEditing(false);
                          setEditedName(apiKey.name);
                        }
                      }}
                      className="h-9 max-w-xs"
                      autoFocus
                      disabled={loading}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={handleSaveName}
                      disabled={loading}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(apiKey.name);
                      }}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-lg">{apiKey.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Erstellt von: {apiKey.creator_name}</span>
                      <span>•</span>
                      <span>Erstellt: {formatDate(apiKey.created_at)}</span>
                    </div>
                    {/* API Key Preview */}
                    <div className="mt-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded inline-block break-all">
                        {apiKey.key_hash.substring(0, 60)}...****
                      </code>
                      <span className="text-xs text-muted-foreground ml-2">
                        (Vollständiger Key nur einmal bei Erstellung sichtbar)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats (kompakt) */}
              {!isEditing && (
                <div className="shrink-0 flex items-center gap-6">
                  {loadingStats ? (
                    <Activity className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : stats ? (
                    <>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Activity className="w-4 h-4" />
                          <span className="font-bold">{stats.total_calls}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Aufrufe</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-bold">{stats.successful_calls}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Erfolg</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="font-bold">{stats.failed_calls}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Fehler</p>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Aktionen */}
              {!isEditing && (
                <div className="shrink-0 flex gap-2">
                  {/* Ausklappen Button - IMMER anzeigen */}
                  <CollapsibleTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      title={isOpen ? "Einklappen" : "Details anzeigen"}
                    >
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => setIsEditing(true)}
                    title="Name bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    title="API Key löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Content - Automation Details */}
          <CollapsibleContent>
            <div className="border-t bg-muted/30 p-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Automation Details</h4>
                </div>

                {/* Top Actions Summary */}
                {stats && stats.top_actions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Top Aktionen:</p>
                    <div className="flex flex-wrap gap-2">
                      {stats.top_actions.map((action, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {action.action.replace('automation.actions.', '')} ({action.count}x)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Used */}
                {stats?.last_used && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Zuletzt verwendet: {formatDate(stats.last_used)}</span>
                  </div>
                )}

                {/* Audit Logs */}
                <div>
                  <p className="text-sm font-medium mb-3">Letzte Aufrufe ({auditLogs.length}):</p>
                  
                  {loadingLogs ? (
                    <div className="flex items-center justify-center py-8">
                      <Activity className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : auditLogs.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`bg-white border rounded-lg p-3 ${
                            log.success
                              ? 'border-green-200'
                              : 'border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            {/* Left: Status + Action */}
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {/* Status Icon */}
                              {log.success ? (
                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              )}
                              
                              {/* Action Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                    {log.action.replace('automation.actions.', '')}
                                  </code>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${formatMethod(log.method)}`}
                                  >
                                    {log.method}
                                  </Badge>
                                </div>
                                
                                {/* Error Message */}
                                {!log.success && log.error_message && (
                                  <div className="mt-2 flex items-start gap-2">
                                    <AlertCircle className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-700 break-words">
                                      {log.error_message}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Timestamp */}
                            <div className="text-xs text-muted-foreground shrink-0">
                              {formatDate(log.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Noch keine Automationen ausgeführt</p>
                    </div>
                  )}
                </div>

                {/* Reload Button */}
                {auditLogs.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAuditLogs}
                      disabled={loadingLogs}
                    >
                      <Activity className={`w-4 h-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} />
                      Aktualisieren
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>API Key löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du den API Key <strong>"{apiKey.name}"</strong> löschen möchtest?
              <br /><br />
              Alle Automationen, die diesen Key verwenden, werden danach nicht mehr funktionieren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Lösche...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
