import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Info } from '../icons/BrowoKoIcons';

type Role = 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN' | 'EXTERN';

interface AddEmployeeRoleSectionProps {
  role: Role;
  allowedRoles: readonly Role[];
  currentUserRole?: string;
  onRoleChange: (value: Role) => void;
}

const ROLE_LABELS: Record<Role, string> = {
  USER: 'Mitarbeiter (Standard)',
  ADMIN: 'Administrator',
  HR: 'HR',
  SUPERADMIN: 'Super Admin',
  EXTERN: 'Extern'
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  USER: 'Grundlegende Berechtigungen für Mitarbeiter',
  ADMIN: 'Erweiterte Berechtigungen für Team und Mitarbeiterverwaltung',
  HR: 'Personalabteilung - kann Mitarbeiter und Admins erstellen',
  SUPERADMIN: 'Vollzugriff auf alle Funktionen und Einstellungen',
  EXTERN: 'Eingeschränkter Zugriff - nur Übersicht, Field und Dokumente'
};

export default function AddEmployeeRoleSection({
  role,
  allowedRoles,
  currentUserRole,
  onRoleChange
}: AddEmployeeRoleSectionProps) {
  // Show permission info based on current user's role
  const getPermissionInfo = () => {
    if (currentUserRole === 'SUPERADMIN') {
      return 'Als Super Admin können Sie alle Rollen zuweisen (inkl. EXTERN).';
    } else if (currentUserRole === 'HR') {
      return 'Als HR können Sie Mitarbeiter, Administratoren und Externe erstellen.';
    } else if (currentUserRole === 'ADMIN') {
      return 'Als Administrator können Sie Mitarbeiter und Externe erstellen.';
    }
    return 'Sie haben eingeschränkte Berechtigungen zur Rollenzuweisung.';
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-4">Berechtigungen</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="role">Globale Rolle *</Label>
          <Select 
            value={role} 
            onValueChange={(value) => onRoleChange(value as Role)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Rolle wählen" />
            </SelectTrigger>
            <SelectContent>
              {(['USER', 'ADMIN', 'HR', 'SUPERADMIN', 'EXTERN'] as const).map((roleOption) => (
                <SelectItem 
                  key={`role-select-${roleOption}`}
                  value={roleOption}
                  disabled={!allowedRoles.includes(roleOption)}
                >
                  {ROLE_LABELS[roleOption]}
                  {!allowedRoles.includes(roleOption) && ' (Keine Berechtigung)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-2">
            {ROLE_DESCRIPTIONS[role]}
          </p>
        </div>

        {/* Permission Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            {getPermissionInfo()}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
