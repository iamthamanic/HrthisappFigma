import { CheckCircle, Circle, ExternalLink, Copy } from './icons/BrowoKoIcons';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function SetupChecklist() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sqlUserProfile = `-- WICHTIG: Ersetze die User IDs!

INSERT INTO public.users (id, email, first_name, last_name, role, employee_number, position, department, start_date, vacation_days, weekly_hours) VALUES
('DEINE_USER_ID_HIER', 'max.mustermann@hrthis.de', 'Max', 'Mustermann', 'EMPLOYEE', 'PN-20250001', 'Software Engineer', 'IT', '2021-03-01', 30, 40);`;

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          Setup-Checkliste
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1 */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
          <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">1. Datenbank Schema ausführen</p>
            <p className="text-sm text-gray-600 mt-1">
              Supabase Dashboard → SQL Editor → Kopiere <code className="bg-white px-1 rounded">001_initial_schema.sql</code>
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
          <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">2. Storage Setup</p>
            <p className="text-sm text-gray-600 mt-1">
              SQL Editor → Kopiere <code className="bg-white px-1 rounded">002_storage_setup.sql</code>
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-400">
          <Circle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">3. Demo-User erstellen</p>
            <p className="text-sm text-gray-600 mt-1 mb-2">
              Authentication → Users → Add user
            </p>
            <div className="bg-white rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs">
                  <p className="text-gray-700">Email: max.mustermann@hrthis.de</p>
                  <p className="text-gray-700">Password: demo123</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('max.mustermann@hrthis.de', 'email')}
                >
                  {copied === 'email' ? '✓' : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <p className="text-xs text-green-600 font-semibold">✓ Auto Confirm User aktivieren!</p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-400">
          <Circle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">4. User-Profile SQL ausführen</p>
            <p className="text-sm text-gray-600 mt-1 mb-2">
              SQL Editor → Kopiere SQL unten → Ersetze User IDs!
            </p>
            <div className="bg-white rounded p-3">
              <pre className="text-xs overflow-x-auto">{sqlUserProfile}</pre>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => copyToClipboard(sqlUserProfile, 'sql')}
              >
                {copied === 'sql' ? '✓ Kopiert!' : 'SQL kopieren'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="pt-4 border-t space-y-2">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            Supabase Dashboard öffnen
          </a>
          <p className="text-xs text-gray-500">
            📚 Vollständige Anleitung: Siehe <code className="bg-gray-100 px-1 rounded">QUICKSTART.md</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}