import { AlertTriangle, Database, Copy, ExternalLink } from './icons/BrowoKoIcons';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';

const MIGRATION_SQL = `-- Profile Picture & Personal Info Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS private_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bic TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shirt_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pants_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shoe_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS jacket_size TEXT;

CREATE INDEX IF NOT EXISTS idx_users_profile_picture 
ON users(profile_picture_url) 
WHERE profile_picture_url IS NOT NULL;`;

export default function MigrationRequiredAlert() {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    toast.success('SQL in Zwischenablage kopiert! 📋');
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Datenbank-Migration erforderlich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-300 bg-white">
          <Database className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-sm">
            Die <code className="bg-orange-100 px-1 rounded">profile_picture_url</code> Spalte fehlt in der Datenbank.
            Bitte führe die Migration in Supabase aus.
          </AlertDescription>
        </Alert>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-orange-800">📝 Anleitung (2 Minuten):</h3>
          
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Öffne Supabase Dashboard</p>
                <p className="text-sm text-gray-600">
                  Gehe zu{' '}
                  <a 
                    href="https://supabase.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    supabase.com/dashboard
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Öffne SQL Editor</p>
                <p className="text-sm text-gray-600">
                  Klicke in der linken Sidebar auf "SQL Editor" → "New Query"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Kopiere den SQL-Code</p>
                <div className="mt-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    SQL in Zwischenablage kopieren
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Führe den Code aus</p>
                <p className="text-sm text-gray-600">
                  Füge den Code in den SQL Editor ein und klicke auf "Run" (oder Strg+Enter)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Seite neu laden</p>
                <p className="text-sm text-gray-600">
                  Refreshe diese Seite (F5) und der Upload sollte funktionieren! ✅
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SQL Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-orange-800">SQL-Code Vorschau:</h4>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border border-gray-700">
            {MIGRATION_SQL}
          </pre>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Hinweis:</strong> Dieser SQL-Code fügt die fehlenden Spalten zur users-Tabelle hinzu.
            Er verwendet <code className="bg-blue-100 px-1 rounded">IF NOT EXISTS</code>, sodass du ihn
            sicher mehrmals ausführen kannst.
          </p>
        </div>

        {/* Help Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Detaillierte Anleitung: <code className="bg-gray-100 px-1 rounded">QUICK_FIX_GUIDE.md</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
