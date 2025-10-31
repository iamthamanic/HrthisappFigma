// ============================================================================
// AUTOMATION MANAGEMENT SCREEN
// ============================================================================
// Admin screen for managing automation API keys and monitoring usage
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Plus, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { BrowoKo_CreateAPIKeyDialog } from '../../components/admin/BrowoKo_CreateAPIKeyDialog';
import { BrowoKo_APIKeyCard } from '../../components/admin/BrowoKo_APIKeyCard';
import { automationService, AutomationAPIKey } from '../../services/BrowoKo_automationService';

export default function AutomationManagementScreen() {
  const [apiKeys, setApiKeys] = useState<AutomationAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    console.log('🔄 loadAPIKeys() called');
    setLoading(true);
    setError('');
    
    try {
      const keys = await automationService.getAPIKeys();
      console.log('✅ API Keys loaded in UI:', keys.length);
      setApiKeys(keys);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der API Keys';
      console.error('❌ Error in loadAPIKeys():', err);
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              Automationenverwaltung
            </h1>
            <p className="text-muted-foreground mt-1">
              Verwalte API Keys für n8n und andere Automatisierungstools
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={loadAPIKeys}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Neuen API Key erstellen
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>n8n Integration:</strong> Verwende diese API Keys, um Browo Koordinator 
            mit n8n zu verbinden. Alle 186+ API Routes sind automatisch verfügbar.
            <a 
              href="/N8N_INTEGRATION_COMPLETE_GUIDE.md" 
              target="_blank"
              className="ml-2 underline"
            >
              → Integration Guide
            </a>
          </AlertDescription>
        </Alert>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && apiKeys.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-64 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : apiKeys.length === 0 ? (
          // Empty State
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Zap className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Noch keine API Keys
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Erstelle deinen ersten API Key, um Browo Koordinator 
                mit Automatisierungstools wie n8n zu verbinden.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ersten API Key erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          // API Keys Liste
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Deine API Keys ({apiKeys.length})
              </h2>
            </div>
            
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <BrowoKo_APIKeyCard
                  key={apiKey.id}
                  apiKey={apiKey}
                  onUpdate={loadAPIKeys}
                />
              ))}
            </div>
          </div>
        )}

        {/* Documentation Section */}
        <Card className="mt-8">
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Wie funktioniert's?
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">1. API Key erstellen</h4>
                <p className="text-muted-foreground">
                  Klicke auf "Neuen API Key erstellen" und gib einen beschreibenden Namen ein.
                  Der Key wird nur einmal angezeigt - kopiere ihn sofort!
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">2. In n8n verwenden</h4>
                <p className="text-muted-foreground">
                  Füge den API Key in n8n als Header <code className="bg-muted px-1 rounded">X-API-Key</code> hinzu.
                  Alle 186+ API Routes sind automatisch verfügbar.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">3. Monitoring</h4>
                <p className="text-muted-foreground">
                  Jede API Key Box zeigt dir Statistiken: Anzahl der Aufrufe, 
                  erfolgreiche/fehlgeschlagene Requests und die am häufigsten genutzten Aktionen.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">4. Verwaltung</h4>
                <p className="text-muted-foreground">
                  Benenne API Keys um, um sie besser zu organisieren. 
                  Lösche Keys, die nicht mehr benötigt werden - laufende Automationen werden gestoppt.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Verfügbare Endpunkte:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  'Antragmanager',
                  'Personalakte', 
                  'Dokumente',
                  'Kalender',
                  'Zeiterfassung',
                  'Lernen',
                  'Chat',
                  'Organigram',
                  'Benefits',
                  'Tasks',
                  'Field',
                  'Analytics',
                  'Notification',
                ].map((module) => (
                  <span
                    key={module}
                    className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <BrowoKo_CreateAPIKeyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadAPIKeys}
      />
    </div>
  );
}
