import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Save, X } from './icons/BrowoKoIcons';
import { Department, User } from '../types/database';
import { useOrganigramStore } from '../stores/BrowoKo_organigramStore';
import { toast } from 'sonner@2.0.3';

interface EditDepartmentDialogProps {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  users: User[];
}

export default function EditDepartmentDialog({
  department,
  open,
  onOpenChange,
  departments,
  users,
}: EditDepartmentDialogProps) {
  const { updateDepartment } = useOrganigramStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentDepartmentId, setParentDepartmentId] = useState<string>('none');
  const [isLocation, setIsLocation] = useState(false);
  const [primaryUserId, setPrimaryUserId] = useState<string>('none');
  const [backupUserId, setBackupUserId] = useState<string>('none');
  const [xPosition, setXPosition] = useState<string>('');
  const [yPosition, setYPosition] = useState<string>('');

  useEffect(() => {
    if (department) {
      setName(department.name);
      setDescription(department.description || '');
      setParentDepartmentId(department.parent_department_id || 'none');
      setIsLocation(department.is_location || false);
      setPrimaryUserId(department.primary_user_id || 'none');
      setBackupUserId(department.backup_user_id || 'none');
      setXPosition(department.x_position?.toString() || '');
      setYPosition(department.y_position?.toString() || '');
    }
  }, [department]);

  const handleSave = async () => {
    if (!department) return;

    if (!name.trim()) {
      toast.error('Bitte Abteilungs-Namen eingeben');
      return;
    }

    try {
      await updateDepartment(department.id, {
        name: name.trim(),
        description: description.trim() || null,
        parent_department_id: parentDepartmentId === 'none' ? null : parentDepartmentId,
        is_location: isLocation,
        primary_user_id: primaryUserId === 'none' ? null : primaryUserId,
        backup_user_id: backupUserId === 'none' ? null : backupUserId,
        x_position: xPosition ? parseFloat(xPosition) : null,
        y_position: yPosition ? parseFloat(yPosition) : null,
      });
      onOpenChange(false);
    } catch (error) {
      // Error already handled in store
    }
  };

  // Filter out current department and its children from parent selection
  const availableParents = departments.filter(d => {
    if (!department) return true;
    if (d.id === department.id) return false;
    // Prevent circular dependencies (simplified check)
    if (d.parent_department_id === department.id) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="form-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Abteilung bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Abteilungsdetails, weisen Sie Parent-Departments zu und legen Sie Verantwortliche fest.
          </DialogDescription>
        </DialogHeader>

        <div className="form-grid">
          {/* Name */}
          <div className="form-field">
            <Label className="form-label">Name *</Label>
            <Input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. HR, Marketing, IT"
            />
          </div>

          {/* Description */}
          <div className="form-field">
            <Label className="form-label">Beschreibung</Label>
            <Input
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: Kurze Beschreibung"
            />
          </div>

          {/* Parent Department */}
          <div className="form-field">
            <Label className="form-label">Übergeordnete Abteilung</Label>
            <Select value={parentDepartmentId} onValueChange={setParentDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Keine (Root-Abteilung)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="edit-dept-parent-none" value="none">Keine (Root-Abteilung)</SelectItem>
                {availableParents.map((dept) => (
                  <SelectItem key={`edit-dept-parent-${dept.id}`} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Verbindungslinien werden automatisch zwischen Parent und Child gezeichnet
            </p>
          </div>

          {/* Is Location Switch */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Standort (Location)</Label>
              <p className="text-xs text-gray-500 mt-1">
                Standorte werden mit Pin-Icon und kleinerer Höhe angezeigt
              </p>
            </div>
            <Switch
              checked={isLocation}
              onCheckedChange={setIsLocation}
            />
          </div>

          {/* Primary User */}
          <div className="form-field">
            <Label className="form-label">Primärer Verantwortlicher</Label>
            <Select value={primaryUserId} onValueChange={setPrimaryUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Nicht zugewiesen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="edit-dept-manager-none" value="none">Nicht zugewiesen</SelectItem>
                {users.map((user) => (
                  <SelectItem key={`edit-dept-manager-${user.id}`} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Backup User */}
          <div className="form-field">
            <Label className="form-label">Backup Verantwortlicher</Label>
            <Select value={backupUserId} onValueChange={setBackupUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Kein Backup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="edit-dept-backup-none" value="none">Kein Backup</SelectItem>
                {users.map((user) => (
                  <SelectItem key={`edit-dept-backup-${user.id}`} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <Label className="form-label">X-Position (px)</Label>
              <Input
                className="form-input"
                type="number"
                value={xPosition}
                onChange={(e) => setXPosition(e.target.value)}
                placeholder="z.B. 100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Position wird beim Drag & Drop automatisch gespeichert
              </p>
            </div>
            <div className="form-field">
              <Label className="form-label">Y-Position (px)</Label>
              <Input
                className="form-input"
                type="number"
                value={yPosition}
                onChange={(e) => setYPosition(e.target.value)}
                placeholder="z.B. 100"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="form-footer">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}