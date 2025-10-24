import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Edit, Loader2 } from './icons/HRTHISIcons';
import { User, Department, Location } from '../types/database';

interface QuickEditDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<User>) => Promise<void>;
  departments: Department[];
  locations: Location[];
}

export default function QuickEditDialog({
  user,
  isOpen,
  onClose,
  onSave,
  departments,
  locations,
}: QuickEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    location_id: '',
    weekly_hours: 40,
    vacation_days: 30,
    is_active: true,
  });

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        position: user.position || '',
        department: user.department || '',
        location_id: user.location_id || '',
        weekly_hours: user.weekly_hours || 40,
        vacation_days: user.vacation_days || 30,
        is_active: user.is_active,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await onSave(user.id, formData);
      onClose();
    } catch (error) {
      console.error('Quick edit error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Schnellbearbeitung
          </DialogTitle>
          <DialogDescription>
            Bearbeite {user.first_name} {user.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="z.B. Software Developer"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Abteilung</Label>
            {departments.length > 0 ? (
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Abteilung wählen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={`quick-edit-dept-${dept.id}`} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="z.B. IT"
              />
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Standort</Label>
            <Select 
              value={formData.location_id} 
              onValueChange={(value) => setFormData({ ...formData, location_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Standort wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="quick-edit-loc-none" value="">Kein Standort</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={`quick-edit-loc-${loc.id}`} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weekly Hours */}
          <div className="space-y-2">
            <Label htmlFor="weekly_hours">Wochenstunden</Label>
            <Input
              id="weekly_hours"
              type="number"
              min="0"
              max="60"
              value={formData.weekly_hours}
              onChange={(e) => setFormData({ ...formData, weekly_hours: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Vacation Days */}
          <div className="space-y-2">
            <Label htmlFor="vacation_days">Urlaubstage</Label>
            <Input
              id="vacation_days"
              type="number"
              min="0"
              max="50"
              value={formData.vacation_days}
              onChange={(e) => setFormData({ ...formData, vacation_days: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Aktiver Mitarbeiter</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
