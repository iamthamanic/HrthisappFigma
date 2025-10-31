// ============================================================================
// CREATE API KEY DIALOG
// ============================================================================
// Dialog to create new automation API keys
// Shows the key only once after creation!
// ============================================================================

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Copy, Check, AlertCircle, Key } from 'lucide-react';
import { automationService } from '../../services/BrowoKo_automationService';

interface CreateAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BrowoKo_CreateAPIKeyDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAPIKeyDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for showing created key
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein');
      return;
    }

    setLoading(true);
    setError('');

    const result = await automationService.generateAPIKey(name.trim());

    if (result.success && result.api_key) {
      console.log('✅ API Key created, showing in dialog');
      setCreatedKey(result.api_key);
      setName('');
      
      // IMPORTANT: Trigger reload IMMEDIATELY so the key appears in the list
      console.log('🔄 Triggering onSuccess() to reload API keys list');
      onSuccess();
    } else {
      setError(result.error || 'Fehler beim Erstellen des API Keys');
    }

    setLoading(false);
  };

  const handleCopy = async () => {
    if (!createdKey) return;

    try {
      // Try Clipboard API first (works in most modern browsers)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(createdKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for CSP-restricted environments (like Figma Make)
        if (inputRef.current) {
          inputRef.current.select();
          inputRef.current.setSelectionRange(0, createdKey.length);
          
          // Try execCommand as fallback
          const success = document.execCommand('copy');
          if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            // If all fails, at least select the text so user can copy manually
            alert('Bitte kopiere den API Key manuell (Ctrl+C oder Cmd+C)');
          }
        }
      }
    } catch (err) {
      // Last resort: select text for manual copy
      if (inputRef.current) {
        inputRef.current.select();
        alert('Bitte kopiere den API Key manuell mit Ctrl+C (oder Cmd+C auf Mac)');
      }
    }
  };

  const handleClose = () => {
    // onSuccess() is already called in handleCreate(), no need to call again
    setCreatedKey(null);
    setName('');
    setError('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Neuen API Key erstellen
          </DialogTitle>
          <DialogDescription>
            {!createdKey 
              ? 'Erstelle einen neuen API Key für Automation-Integrationen wie n8n oder Zapier.'
              : 'Speichere diesen API Key sicher - er wird nur einmal angezeigt!'}
          </DialogDescription>
        </DialogHeader>

        {!createdKey ? (
          // STEP 1: Create Key
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key-name">Name des API Keys</Label>
              <Input
                id="api-key-name"
                placeholder="z.B. n8n Production, Test Automation, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <p className="text-sm text-muted-foreground">
                Gib einen beschreibenden Namen ein, um den Key später zu identifizieren.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
              >
                {loading ? 'Erstelle...' : 'API Key erstellen'}
              </Button>
            </div>
          </div>
        ) : (
          // STEP 2: Show Created Key
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Wichtig:</strong> Kopiere diesen API Key jetzt! Er wird nur einmal angezeigt.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Dein neuer API Key:</Label>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={createdKey}
                  readOnly
                  className="font-mono text-sm"
                  onClick={(e) => {
                    // Auto-select on click for easy copying
                    e.currentTarget.select();
                  }}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  title="API Key kopieren"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-green-600">
                  ✓ In Zwischenablage kopiert!
                </p>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Nächste Schritte:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Kopiere den API Key (nur jetzt sichtbar!)</li>
                <li>Speichere ihn sicher (z.B. in n8n)</li>
                <li>Verwende ihn im Header: <code className="bg-background px-1 rounded">X-API-Key: {'{'}key{'}'}</code></li>
              </ol>
            </div>

            <Button
              onClick={handleClose}
              className="w-full"
            >
              Fertig
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
