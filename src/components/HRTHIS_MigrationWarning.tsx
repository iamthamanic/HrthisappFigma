/**
 * MIGRATION WARNING COMPONENT (v4.0.0)
 * Shows a friendly warning if notifications migration is missing
 */

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';

export function HRTHIS_MigrationWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if migration is dismissed in session storage
    const isDismissed = sessionStorage.getItem('migration-warning-dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Check if notifications table exists
    const checkTable = async () => {
      try {
        const { error } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);

        if (error) {
          // Table doesn't exist
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            setShowWarning(true);
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    checkTable();
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('migration-warning-dismissed', 'true');
    setDismissed(true);
    setShowWarning(false);
  };

  if (!showWarning || dismissed) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4 animate-in slide-in-from-top-2 duration-300">
      <Alert className="bg-orange-50 border-orange-200 relative">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        <AlertTitle className="text-orange-900 pr-8">
          Notification System Setup erforderlich
        </AlertTitle>
        <AlertDescription className="text-orange-800 text-sm mt-2">
          <p className="mb-2">
            Das neue Notification System (v4.0.0) benötigt eine Database Migration.
          </p>
          <p className="mb-2">
            <strong>Schritte:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
            <li>Öffne Supabase Dashboard → SQL Editor</li>
            <li>Kopiere den Inhalt von <code className="bg-orange-100 px-1 rounded">/supabase/migrations/053_notifications_system.sql</code></li>
            <li>Führe das Script aus</li>
            <li>Reload die App</li>
          </ol>
          <p className="mt-3 text-xs text-orange-700">
            ℹ️ Die App funktioniert auch ohne Migration - Notifications sind optional.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
