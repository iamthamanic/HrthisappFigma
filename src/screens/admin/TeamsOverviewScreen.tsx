import { Users, Plus, Building2, AlertCircle } from '../../components/icons/HRTHISIcons';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription } from '@components/ui/alert';

export default function TeamsOverviewScreen() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Teams-Übersicht</h1>
          <p className="text-sm text-gray-500 mt-1">
            Verwalte Teams und Zuordnungen
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Das Team-Management-Feature wird über die Abteilungen in der Mitarbeiterverwaltung gesteuert.
          Gehe zu <strong>Team Management</strong>, um Mitarbeiter Abteilungen zuzuweisen.
        </AlertDescription>
      </Alert>

      {/* Empty State */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Teams-Funktion in Entwicklung
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Aktuell kannst du Mitarbeiter über ihre Abteilungen organisieren. 
            Ein dediziertes Team-Management mit Team-Leads und Team-spezifischen Features folgt bald.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.href = '/admin/team-und-mitarbeiterverwaltung'}>
              <Users className="w-4 h-4 mr-2" />
              Zur Mitarbeiterverwaltung
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
