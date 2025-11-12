import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Specialization {
  id: string;
  name: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

interface SpecializationManagerProps {
  specializations: Specialization[];
  onCreateSpecialization: (name: string) => Promise<void>;
  onUpdateSpecialization: (id: string, name: string) => Promise<void>;
  onDeleteSpecialization: (id: string) => Promise<void>;
}

export default function SpecializationManager({
  specializations,
  onCreateSpecialization,
  onUpdateSpecialization,
  onDeleteSpecialization,
}: SpecializationManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState<Specialization | null>(null);
  const [newName, setNewName] = useState('');
  const [editName, setEditName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Bitte Namen eingeben');
      return;
    }

    try {
      setIsLoading(true);
      await onCreateSpecialization(newName.trim());
      setNewName('');
      setIsCreateOpen(false);
      toast.success('Spezialisierung erstellt! ✅');
    } catch (error: any) {
      console.error('Error creating specialization:', error);
      toast.error(error.message || 'Fehler beim Erstellen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingSpecialization || !editName.trim()) {
      toast.error('Bitte Namen eingeben');
      return;
    }

    try {
      setIsLoading(true);
      await onUpdateSpecialization(editingSpecialization.id, editName.trim());
      setEditingSpecialization(null);
      setEditName('');
      setIsEditOpen(false);
      toast.success('Spezialisierung aktualisiert! ✅');
    } catch (error: any) {
      console.error('Error updating specialization:', error);
      toast.error(error.message || 'Fehler beim Aktualisieren');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (spec: Specialization) => {
    if (!confirm(`Spezialisierung "${spec.name}" wirklich löschen?`)) {
      return;
    }

    try {
      setIsLoading(true);
      await onDeleteSpecialization(spec.id);
      toast.success('Spezialisierung gelöscht! ✅');
    } catch (error: any) {
      console.error('Error deleting specialization:', error);
      toast.error(error.message || 'Fehler beim Löschen');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (spec: Specialization) => {
    setEditingSpecialization(spec);
    setEditName(spec.name);
    setIsEditOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-lg">Spezialisierungen</h3>
              <p className="text-sm text-gray-500">
                Verwalte alle Spezialisierungen deiner Organisation
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          {specializations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Noch keine Spezialisierungen vorhanden.</p>
              <p className="text-sm mt-1">
                Erstelle deine erste Spezialisierung, um loszulegen.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {specializations.map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">{spec.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(spec)}
                      disabled={isLoading}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(spec)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Spezialisierung</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-specialization-name">Name</Label>
              <Input
                id="new-specialization-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="z.B. Frontend Development, Backend Development, Full-Stack"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setNewName('');
              }}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? 'Erstelle...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spezialisierung bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-specialization-name">Name</Label>
              <Input
                id="edit-specialization-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="z.B. Frontend Development, Backend Development"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEdit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setEditingSpecialization(null);
                setEditName('');
              }}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
