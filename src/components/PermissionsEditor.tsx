import { useState, useEffect } from 'react';
import { Shield, Check, X, Save, RotateCcw } from './icons/BrowoKoIcons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { usePermissions, UserRole } from '../hooks/usePermissions';
import { toast } from 'sonner@2.0.3';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultForRole: boolean;
}

interface PermissionsEditorProps {
  userId: string;
  role: UserRole;
  onSave?: () => void;
  readOnly?: boolean;
}

export default function PermissionsEditor({ 
  userId, 
  role, 
  onSave,
  readOnly = false 
}: PermissionsEditorProps) {
  const { getAllPermissions, roleInfo } = usePermissions(role);
  
  // State for custom permissions
  const [customPermissions, setCustomPermissions] = useState<{ [key: string]: boolean }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize permissions from default role permissions
  useEffect(() => {
    // Load user's custom permissions from backend (if any)
    loadUserPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role]); // Only re-run when userId or role changes

  // When role changes, reset to default permissions
  useEffect(() => {
    const defaultPerms: { [key: string]: boolean } = {};
    getAllPermissions.forEach(category => {
      category.permissions.forEach(perm => {
        const permId = `${category.category}::${perm.name}`;
        defaultPerms[permId] = perm.allowed;
      });
    });
    setCustomPermissions(defaultPerms);
    setHasChanges(false);
  }, [role, getAllPermissions]);

  const loadUserPermissions = async () => {
    setIsLoading(true);
    try {
      // TODO: Load from backend
      // For now, initialize with role defaults
      const defaultPerms: { [key: string]: boolean } = {};
      getAllPermissions.forEach(category => {
        category.permissions.forEach(perm => {
          const permId = `${category.category}::${perm.name}`;
          defaultPerms[permId] = perm.allowed;
        });
      });
      setCustomPermissions(defaultPerms);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Fehler beim Laden der Berechtigungen');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (category: string, permName: string) => {
    if (readOnly) return;
    
    const permId = `${category}::${permName}`;
    setCustomPermissions(prev => ({
      ...prev,
      [permId]: !prev[permId]
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to backend
      // await saveUserPermissions(userId, customPermissions);
      
      toast.success('Berechtigungen erfolgreich gespeichert!');
      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Fehler beim Speichern der Berechtigungen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaultPerms: { [key: string]: boolean } = {};
    getAllPermissions.forEach(category => {
      category.permissions.forEach(perm => {
        const permId = `${category.category}::${perm.name}`;
        defaultPerms[permId] = perm.allowed;
      });
    });
    setCustomPermissions(defaultPerms);
    setHasChanges(true);
    toast.info('Auf Standard-Berechtigungen zurückgesetzt');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Overview */}
      <Card className={`${roleInfo.borderColor} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${roleInfo.bgColor}`}>
              <Shield className={`w-6 h-6 ${roleInfo.color}`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${roleInfo.color}`}>
                {roleInfo.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {roleInfo.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      {!readOnly && (
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            💡 <span className="font-medium">Individuelle Berechtigungen:</span> Sie können einzelne Berechtigungen für diesen Benutzer an- oder abwählen. Dies überschreibt die Standard-Berechtigungen der Rolle.
          </AlertDescription>
        </Alert>
      )}

      {readOnly && (
        <Alert className="bg-gray-50 border-gray-200">
          <Shield className="w-4 h-4 text-gray-600" />
          <AlertDescription className="text-gray-900">
            ℹ️ Sie haben keine Berechtigung, die Berechtigungen dieses Benutzers zu ändern. Nur Super-Administratoren können Berechtigungen bearbeiten.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {!readOnly && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Speichert...' : 'Berechtigungen speichern'}
          </Button>
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Zurücksetzen
          </Button>
        </div>
      )}

      {/* Permissions by Category */}
      <div className="space-y-6">
        {getAllPermissions.map((category) => {
          const categoryPerms = category.permissions.map(perm => {
            const permId = `${category.category}::${perm.name}`;
            return {
              ...perm,
              id: permId,
              currentlyAllowed: customPermissions[permId] ?? perm.allowed,
            };
          });

          return (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categoryPerms.map((permission) => (
                  <div
                    key={permission.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                      permission.currentlyAllowed
                        ? 'bg-green-50 border-green-200 hover:border-green-300'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Checkbox - Larger clickable area */}
                    <label 
                      className="mt-0.5 flex-shrink-0 cursor-pointer p-1 -m-1"
                      htmlFor={`permission-${permission.id}`}
                    >
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={permission.currentlyAllowed}
                        onCheckedChange={() => handlePermissionToggle(category.category, permission.name)}
                        disabled={readOnly}
                        className="h-5 w-5"
                      />
                    </label>

                    {/* Icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {permission.currentlyAllowed ? (
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-red-600" />
                        </div>
                      )}
                    </div>

                    {/* Permission Details - Also clickable */}
                    <label 
                      htmlFor={`permission-${permission.id}`}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className={`text-sm font-medium ${
                        permission.currentlyAllowed ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {permission.name}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        permission.currentlyAllowed ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {permission.description}
                      </p>
                    </label>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {permission.currentlyAllowed ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                          Erlaubt
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                          Gesperrt
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save Warning */}
      {hasChanges && !readOnly && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Shield className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            ⚠️ <span className="font-medium">Ungespeicherte Änderungen:</span> Sie haben Berechtigungen geändert. Vergessen Sie nicht, die Änderungen zu speichern!
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Aktive Berechtigungen
            </span>
            <span className="font-semibold text-gray-900">
              {Object.values(customPermissions).filter(Boolean).length} / {Object.keys(customPermissions).length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}