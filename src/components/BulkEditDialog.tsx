import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Loader2, MapPin, Building2 } from './icons/BrowoKoIcons';
import { User, Location, Department } from '../types/database';
import sanitize from '../utils/security/BrowoKo_sanitization';

type BulkEditType = 'location' | 'department';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editType: BulkEditType | null;
  selectedUsers: User[];
  locations: Location[];
  departments: Department[];
  onSave: (updates: Partial<User>) => Promise<void>;
}

export default function BulkEditDialog({
  isOpen,
  onClose,
  editType,
  selectedUsers,
  locations,
  departments,
  onSave,
}: BulkEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [department, setDepartment] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Partial<User> = {};
      
      if (editType === 'location') {
        // Handle "NONE" as null location
        updates.location_id = locationId === 'NONE' ? null : (locationId || null);
      } else if (editType === 'department') {
        // ✅ SANITIZE DEPARTMENT NAME
        const sanitizedDepartment = sanitize.text(department);
        updates.department = sanitizedDepartment || null;
      }

      await onSave(updates);
      handleClose();
    } catch (error) {
      console.error('Bulk edit error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setLocationId('');
    setDepartment('');
    onClose();
  };

  if (!editType) return null;

  const title = editType === 'location' ? 'Standort ändern' : 'Abteilung ändern';
  const icon = editType === 'location' ? <MapPin className="w-5 h-5" /> : <Building2 className="w-5 h-5" />;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription>
            Ändere {editType === 'location' ? 'den Standort' : 'die Abteilung'} für {selectedUsers.length} Mitarbeiter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Location Edit */}
          {editType === 'location' && (
            <div className="space-y-2">
              <Label htmlFor="location">Neuer Standort *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Standort wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Kein Standort</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={`bulk-loc-${loc.id}`} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department Edit */}
          {editType === 'department' && (
            <div className="space-y-2">
              <Label htmlFor="department">Neue Abteilung *</Label>
              {departments.length > 0 ? (
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Abteilung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={`bulk-dept-${dept.id}`} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-500">Keine Abteilungen verfügbar</p>
              )}
            </div>
          )}

          {/* Affected Users Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Betroffene Mitarbeiter ({selectedUsers.length})
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedUsers.slice(0, 10).map((user) => (
                <p key={user.id} className="text-xs text-gray-600">
                  • {user.first_name} {user.last_name}
                </p>
              ))}
              {selectedUsers.length > 10 && (
                <p className="text-xs text-gray-500 italic">
                  ... und {selectedUsers.length - 10} weitere
                </p>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-xs text-yellow-900">
              <strong>Achtung:</strong> Diese Änderung betrifft alle {selectedUsers.length} ausgewählten Mitarbeiter.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave}
            disabled={
              saving || 
              (editType === 'department' && !department)
            }
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Für {selectedUsers.length} Mitarbeiter speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
