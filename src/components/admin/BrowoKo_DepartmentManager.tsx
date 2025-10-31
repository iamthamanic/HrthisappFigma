import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Building2, Plus, Pencil, Trash2, X } from '../icons/BrowoKoIcons';
import { Department } from '../../types/database';
import { useAdminStore } from '../../stores/BrowoKo_adminStore';

interface DepartmentManagerProps {
  departments?: Department[]; // Optional - will use adminStore if not provided
  onCreateDepartment?: (data: Omit<Department, 'id' | 'organization_id' | 'created_at'>) => Promise<void>;
  onUpdateDepartment?: (id: string, data: Partial<Department>) => Promise<void>;
  onDeleteDepartment?: (id: string) => Promise<void>;
  // NEW: Optional callbacks for unified screen (receive full Department object after DB operation)
  onDepartmentCreate?: (department: Department) => Promise<void>;
  onDepartmentUpdate?: (department: Department) => Promise<void>;
  onDepartmentDelete?: (departmentId: string) => Promise<void>;
}

export default function DepartmentManager({
  departments: departmentsProp,
  onCreateDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onDepartmentCreate,
  onDepartmentUpdate,
  onDepartmentDelete
}: DepartmentManagerProps) {
  // Use adminStore if departments not provided
  const adminStore = useAdminStore();
  const departments = departmentsProp || adminStore.departments;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (department: Department) => {
    setEditing(department);
    setName(department.name);
    setDescription(department.description || '');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      description: description.trim() || null
    };

    if (editing) {
      if (onUpdateDepartment) {
        await onUpdateDepartment(editing.id, data);
      }
      // Call the new callback with full Department object
      if (onDepartmentUpdate) {
        await onDepartmentUpdate({ ...editing, ...data });
      }
    } else {
      if (onCreateDepartment) {
        await onCreateDepartment(data);
      }
      // For create, we need to get the created department from adminStore
      // The new callback will be called after the department is created in adminStore
      const createdDepartment = departments.find(d => d.name === data.name);
      if (onDepartmentCreate && createdDepartment) {
        await onDepartmentCreate(createdDepartment);
      }
    }
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Abteilungen
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Abteilung hinzufügen
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        {showForm && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
            <div>
              <Label htmlFor="department_name">Name *</Label>
              <Input
                id="department_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. IT-Abteilung"
              />
            </div>
            <div>
              <Label htmlFor="department_description">Beschreibung</Label>
              <Textarea
                id="department_description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung der Abteilung..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Abbrechen
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
                {editing ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </div>
        )}

        {/* Departments List */}
        {departments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Noch keine Abteilungen angelegt</p>
          </div>
        ) : (
          <div className="space-y-2">
            {departments.map((department) => (
              <div
                key={department.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{department.name}</p>
                  {department.description && (
                    <p className="text-sm text-gray-500">{department.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(department)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (onDeleteDepartment) {
                        await onDeleteDepartment(department.id);
                      }
                      if (onDepartmentDelete) {
                        await onDepartmentDelete(department.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
