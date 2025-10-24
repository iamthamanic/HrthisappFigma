import { AlertCircle } from '../icons/HRTHISIcons';
import { Alert, AlertDescription } from '../ui/alert';

/**
 * ORGANIGRAM ERROR ALERTS COMPONENT
 * ==================================
 * Displays loading, error, and migration alerts
 * 
 * Features:
 * - Loading spinner
 * - Table missing alert
 * - Missing columns alert (migrations)
 * 
 * Extracted from: OrganigramCanvasScreenV2.tsx (Lines 628-669)
 */

export interface OrganigramErrorAlertsProps {
  loading: boolean;
  tableExists: boolean;
  missingColumns: string[];
}

export function OrganigramErrorAlerts({
  loading,
  tableExists,
  missingColumns,
}: OrganigramErrorAlertsProps) {
  
  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Organigram...</p>
        </div>
      </div>
    );
  }

  // Table Missing Alert
  if (!tableExists) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Migration erforderlich!</strong>
            <br />
            Bitte führe die Migration aus: <code>/supabase/migrations/034_add_draft_live_system.sql</code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Missing Columns Alert
  if (missingColumns.length > 0) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Fehlende Datenbank-Spalten!</strong>
            <br />
            Bitte führe diese Migration aus: <code>/SUPABASE_SQL_MIGRATIONS.sql</code>
            <br />
            Fehlende Spalten: {missingColumns.join(', ')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No errors - return null (component won't render anything)
  return null;
}
