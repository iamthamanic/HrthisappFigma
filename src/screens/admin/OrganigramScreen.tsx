import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Network, 
  Plus, 
  MapPin, 
  Users, 
  GripVertical,
  Edit,
  Trash2,
  UserPlus,
  Save,
  GitBranch,
  List
} from '../../components/icons/BrowoKoIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useOrganigramStore } from '../../stores/BrowoKo_organigramStore';
import { Department, OrganigramPosition } from '../../types/database';
import { toast } from 'sonner@2.0.3';
import SimpleOrgChart from '../../components/SimpleOrgChart';
import DraggableOrgChart from '../../components/DraggableOrgChart';
import EditDepartmentDialog from '../../components/EditDepartmentDialog';

const ItemTypes = {
  DEPARTMENT: 'department',
  POSITION: 'position',
};

// Draggable Department Card
function DepartmentCard({ department, index, moveDepartment }: any) {
  const { locations, positions, users, updateDepartmentLocation } = useOrganigramStore();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(department.location_id || 'none');

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.DEPARTMENT,
    item: { id: department.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.DEPARTMENT,
    hover: (item: any) => {
      if (item.index !== index) {
        moveDepartment(item.index, index);
        item.index = index;
      }
    },
  });

  const departmentPositions = positions.filter(p => p.department_id === department.id);
  const location = locations.find(l => l.id === department.location_id);
  const employeeCount = departmentPositions.filter(p => p.primary_user_id).length;

  const handleSaveLocation = async () => {
    try {
      const locationIdToSave = selectedLocationId === 'none' ? null : selectedLocationId;
      await updateDepartmentLocation(department.id, locationIdToSave);
      setShowLocationDialog(false);
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="cursor-move"
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <div>
                <CardTitle className="text-lg">{department.name}</CardTitle>
                {department.description && (
                  <p className="text-sm text-gray-500 mt-1">{department.description}</p>
                )}
              </div>
            </div>
            <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MapPin className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Standort zuweisen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Standort</Label>
                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Standort wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="organigram-loc-none" value="none">Kein Standort</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={`organigram-loc-${loc.id}`} value={loc.id}>
                            {loc.name} - {loc.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleSaveLocation}>
                      <Save className="w-4 h-4 mr-2" />
                      Speichern
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            {location && (
              <Badge variant="secondary" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {location.name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {employeeCount} Mitarbeiter
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <PositionsList departmentId={department.id} />
        </CardContent>
      </Card>
    </div>
  );
}

// Positions List Component
function PositionsList({ departmentId }: { departmentId: string }) {
  const { positions, users } = useOrganigramStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const departmentPositions = positions
    .filter(p => p.department_id === departmentId)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-3">
      {departmentPositions.map((position, index) => (
        <PositionCard 
          key={position.id} 
          position={position} 
          index={index}
          departmentId={departmentId}
        />
      ))}
      
      {departmentPositions.length === 0 && (
        <div className="text-center py-6 text-gray-400 border-2 border-dashed rounded-lg">
          <p className="text-sm">Keine Positionen</p>
        </div>
      )}

      <CreatePositionDialog 
        departmentId={departmentId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => setShowCreateDialog(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Position hinzufügen
      </Button>
    </div>
  );
}

// Position Card Component
function PositionCard({ position, index, departmentId }: any) {
  const { users, deletePosition } = useOrganigramStore();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const primaryUser = users.find(u => u.id === position.primary_user_id);
  const backupUser = users.find(u => u.id === position.backup_user_id);

  const handleDelete = async () => {
    if (window.confirm('Position wirklich löschen?')) {
      try {
        await deletePosition(position.id);
      } catch (error) {
        // Error handled in store
      }
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{position.name}</h4>
            {position.specialization && (
              <Badge variant="outline" className="text-xs">
                {position.specialization}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <EmployeeAssignment 
          positionId={position.id}
          userId={position.primary_user_id}
          type="primary"
          label="Standard"
        />
        <EmployeeAssignment 
          positionId={position.id}
          userId={position.backup_user_id}
          type="backup"
          label="Vertretung"
        />
      </div>

      <EditPositionDialog
        position={position}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </div>
  );
}

// Employee Assignment Component
function EmployeeAssignment({ positionId, userId, type, label }: any) {
  const { users, assignEmployee } = useOrganigramStore();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(userId || 'none');

  const user = users.find(u => u.id === userId);

  const handleSave = async () => {
    try {
      const userIdToAssign = selectedUserId === 'none' ? null : selectedUserId;
      await assignEmployee(positionId, userIdToAssign, type);
      setShowDialog(false);
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}:</span>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            {user ? (
              <span>{user.first_name} {user.last_name}</span>
            ) : (
              <span className="text-gray-400">Nicht zugewiesen</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label} zuweisen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Mitarbeiter</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="organigram-assign-none" value="none">Keine Zuweisung</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={`organigram-assign-${u.id}`} value={u.id}>
                      {u.first_name} {u.last_name} {u.employee_number ? `(${u.employee_number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Position Dialog
function CreatePositionDialog({ departmentId, open, onOpenChange }: any) {
  const { createPosition } = useOrganigramStore();
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Bitte Position-Namen eingeben');
      return;
    }

    try {
      await createPosition({
        department_id: departmentId,
        name: name.trim(),
        specialization: specialization.trim() || null,
        sort_order: 0,
        // organization_id will be set automatically by database trigger
      });
      setName('');
      setSpecialization('');
      onOpenChange(false);
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Position hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Position *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Senior Developer"
            />
          </div>
          <div>
            <Label>Spezialisierung</Label>
            <Input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="z.B. Frontend, Backend, Full-Stack"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Position Dialog
function EditPositionDialog({ position, open, onOpenChange }: any) {
  const { updatePosition } = useOrganigramStore();
  const [name, setName] = useState(position.name);
  const [specialization, setSpecialization] = useState(position.specialization || '');

  useEffect(() => {
    setName(position.name);
    setSpecialization(position.specialization || '');
  }, [position]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error('Bitte Position-Namen eingeben');
      return;
    }

    try {
      await updatePosition(position.id, {
        name: name.trim(),
        specialization: specialization.trim() || null,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Position bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Position *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Senior Developer"
            />
          </div>
          <div>
            <Label>Spezialisierung</Label>
            <Input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="z.B. Frontend, Backend, Full-Stack"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdate}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Organigram Screen
export default function OrganigramScreen() {
  const { departments, positions, users, loading, tableExists, loadOrganigramData, updateDepartmentOrder } = useOrganigramStore();
  const [localDepartments, setLocalDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState<string>('departments');
  const [selectedPosition, setSelectedPosition] = useState<OrganigramPosition | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showEditDepartmentDialog, setShowEditDepartmentDialog] = useState(false);

  useEffect(() => {
    loadOrganigramData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    setLocalDepartments(departments);
  }, [departments]);

  const moveDepartment = (fromIndex: number, toIndex: number) => {
    const updatedDepartments = [...localDepartments];
    const [movedDepartment] = updatedDepartments.splice(fromIndex, 1);
    updatedDepartments.splice(toIndex, 0, movedDepartment);
    
    // Update sort_order
    const reorderedDepartments = updatedDepartments.map((dept, index) => ({
      ...dept,
      sort_order: index,
    }));
    
    setLocalDepartments(reorderedDepartments);
  };

  const handleSaveOrder = async () => {
    try {
      await updateDepartmentOrder(localDepartments);
    } catch (error) {
      // Error handled in store
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Organigram...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Organigram</h1>
            <p className="text-sm text-gray-500 mt-1">
              Visualisierung der Organisationsstruktur
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/organigram-canvas">
                <Network className="w-4 h-4 mr-2" />
                Canvas Editor (NEU)
              </Link>
            </Button>
            {activeTab === 'list' && (
              <Button onClick={handleSaveOrder}>
                <Save className="w-4 h-4 mr-2" />
                Reihenfolge speichern
              </Button>
            )}
          </div>
        </div>

        {/* Migration Warning - only show if table doesn't exist */}
        {!tableExists && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-900">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-2xl">⚠️</div>
                <div>
                  <p className="font-medium mb-2">Datenbank-Migration erforderlich</p>
                  <p className="text-sm mb-2">
                    Die Organigram-Tabelle wurde noch nicht erstellt. Bitte führen Sie die SQL-Migration aus:
                  </p>
                  <ol className="text-sm space-y-1 ml-4">
                    <li>1. Öffnen Sie die Datei <code className="bg-yellow-100 px-1 py-0.5 rounded">/SQL_ORGANIGRAM.md</code></li>
                    <li>2. Kopieren Sie den kompletten SQL-Code</li>
                    <li>3. Öffnen Sie Supabase Dashboard → SQL Editor</li>
                    <li>4. Fügen Sie den Code ein und führen Sie ihn aus</li>
                    <li>5. Laden Sie diese Seite neu</li>
                  </ol>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Abteilungen
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Positionen
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Listen-Ansicht
            </TabsTrigger>
          </TabsList>

          {/* NEW: Departments View with Drag & Drop */}
          <TabsContent value="departments" className="mt-6">
            {/* Info Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Network className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-2">Abteilungs-Organigram mit Drag & Drop:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <ul className="space-y-1 text-blue-800">
                        <li>🖱️ <strong>Drag & Drop</strong> → Abteilungen frei positionieren</li>
                        <li>➕➖ <strong>Zoom</strong> → Vergrößern/Verkleinern</li>
                        <li>🔗 <strong>Verbindungen</strong> → Automatische Hierarchie-Linien</li>
                        <li>📍 <strong>Standorte</strong> → Pin-Icon für Locations</li>
                      </ul>
                      <ul className="space-y-1 text-blue-800">
                        <li>📥 <strong>Export</strong> → PNG/PDF Download</li>
                        <li>🖥️ <strong>Fullscreen</strong> → Vollbild-Modus</li>
                        <li>✅ Grünes Icon → Primärer Verantwortlicher</li>
                        <li>⚠️ Gelbes Icon → Backup Verantwortlicher</li>
                      </ul>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">💡 Tipp: Positionen werden automatisch gespeichert</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Abteilungs-Hierarchie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DraggableOrgChart 
                  departments={departments} 
                  users={users}
                  onNodeClick={(dept) => {
                    setSelectedDepartment(dept);
                    setShowEditDepartmentDialog(true);
                  }}
                  onAddDepartment={() => {
                    // Add department dialog
                    console.log('Add department clicked');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hierarchy View (OLD: Positions-based) */}
          <TabsContent value="hierarchy" className="mt-6">
            {/* Info Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <GitBranch className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-2">Positions-Hierarchie (Legacy):</p>
                    <div className="grid grid-cols-2 gap-4">
                      <ul className="space-y-1 text-blue-800">
                        <li>🔍 <strong>Suche</strong> → Positionen finden & highlighten</li>
                        <li>➕➖ <strong>Zoom</strong> → Vergrößern/Verkleinern</li>
                        <li>🖱️ <strong>Pan</strong> → Ziehen zum Verschieben</li>
                        <li>🗜️ <strong>Collapse</strong> → Hierarchien einklappen</li>
                        <li>🏷️ <strong>"Leer"</strong> → Abteilung ohne Positionen</li>
                      </ul>
                      <ul className="space-y-1 text-blue-800">
                        <li>📥 <strong>Export</strong> → PNG/PDF Download</li>
                        <li>🖥️ <strong>Fullscreen</strong> → Vollbild-Modus</li>
                        <li>🟣 CEO → 🔵 Teamlead → 🟢 Mitarbeiter</li>
                        <li className="text-xs text-blue-700 mt-2">💡 Tipp: Alle Abteilungen werden angezeigt, auch ohne Positionen</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Positions-Hierarchie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleOrgChart 
                  positions={positions} 
                  users={users} 
                  departments={departments}
                  onNodeClick={(position) => setSelectedPosition(position)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-6">
            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Network className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">So funktioniert's:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>• Abteilungen per Drag & Drop sortieren</li>
                      <li>• Standorte über das Standort-Icon zuweisen</li>
                      <li>• Positionen in Abteilungen hinzufügen und bearbeiten</li>
                      <li>• Mitarbeiter als Standard oder Vertretung zuweisen</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Departments Grid */}
            {localDepartments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Network className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Keine Abteilungen vorhanden
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Bitte erstellen Sie zuerst Abteilungen in den Firmeneinstellungen
                  </p>
                  <Button asChild>
                    <a href="/admin/company-settings">
                      Zu den Firmeneinstellungen
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {localDepartments.map((department, index) => (
                  <DepartmentCard
                    key={department.id}
                    department={department}
                    index={index}
                    moveDepartment={moveDepartment}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Department Dialog */}
        <EditDepartmentDialog
          department={selectedDepartment}
          open={showEditDepartmentDialog}
          onOpenChange={setShowEditDepartmentDialog}
          departments={departments}
          users={users}
        />
      </div>
    </DndProvider>
  );
}
