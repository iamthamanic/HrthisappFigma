/**
 * @file OrganigramUnifiedScreen.tsx
 * @version 4.3.0
 * @description UNIFIED Organigram Screen - Canvas + Settings in einer Sidebar
 * 
 * Features:
 * - Left Sidebar: Firmendaten, Standorte, Abteilungen (Collapsible)
 * - Right Canvas: Full-Width Organigram Canvas
 * - Mobile: Bottom Sheet für Settings
 * - Bi-direktionale Sync (Card ↔ Canvas Node)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/HRTHIS_adminStore';
import { useAuthStore } from '../../stores/HRTHIS_authStore';
import type { OrgNodeData } from '../../components/OrgNode';
import type { Connection } from '../../components/canvas/HRTHIS_CanvasTypes';
import type { Location, Department } from '../../types/database';
import { toast } from 'sonner@2.0.3';
import { 
  Building2, 
  MapPin, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Settings,
} from '../../components/icons/HRTHISIcons';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';

// Organigram Components
import { OrganigramErrorAlerts } from '../../components/organigram/HRTHIS_OrganigramErrorAlerts';
import { OrganigramToolbar } from '../../components/organigram/HRTHIS_OrganigramToolbar';
import CanvasOrgChart from '../../components/canvas/HRTHIS_CanvasOrgChart';

// Company Settings Components  
import CompanyBasicSettings from '../../components/admin/HRTHIS_CompanyBasicSettings';
import LocationManager from '../../components/admin/HRTHIS_LocationManager';
import DepartmentManager from '../../components/admin/HRTHIS_DepartmentManager';

// Hooks
import { useOrganigramData } from '../../hooks/HRTHIS_useOrganigramData';
import { useOrganigramAutoSave } from '../../hooks/HRTHIS_useOrganigramAutoSave';
import { useOrganigramHistory } from '../../hooks/HRTHIS_useOrganigramHistory';
import { useOrganigramPublish } from '../../hooks/HRTHIS_useOrganigramPublish';

export default function OrganigramUnifiedScreen() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { 
    locations, 
    departments,
    createLocation,
    updateLocation,
    deleteLocation,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useAdminStore();

  // ========================================
  // STATE
  // ========================================
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop sidebar
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false); // Mobile bottom sheet
  const [editMode, setEditMode] = useState(false);

  // Collapsible sections state
  const [companyOpen, setCompanyOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(true);
  const [departmentsOpen, setDepartmentsOpen] = useState(true);

  // ========================================
  // HOOKS
  // ========================================
  const data = useOrganigramData(profile?.organization_id);
  const autoSave = useOrganigramAutoSave(profile?.organization_id, profile?.id);
  const history = useOrganigramHistory(data.nodes, data.connections);
  const publish = useOrganigramPublish(
    profile?.organization_id,
    data.nodes,
    data.connections,
    data.publishedNodes,
    data.publishedConnections,
    data.loadData
  );

  // ========================================
  // AUTO-LOAD EXISTING LOCATIONS & DEPARTMENTS AS NODES
  // ========================================
  useEffect(() => {
    if (!data.tableExists || (locations.length === 0 && departments.length === 0)) return;

    // Check if we already have location/department nodes
    const hasLocationNodes = data.nodes.some(n => n.type === 'location');
    const hasDepartmentNodes = data.nodes.some(n => n.type === 'department');

    if (hasLocationNodes && hasDepartmentNodes) return; // Already loaded

    const newNodes: OrgNodeData[] = [...data.nodes];

    // Create nodes for existing locations (if not already present)
    if (!hasLocationNodes && locations.length > 0) {
      const locationNodes: OrgNodeData[] = locations.map((loc, i) => ({
        id: crypto.randomUUID(), // ✅ Pure UUID for DB
        type: 'location', // ✅ lowercase type for OrgNodeData
        title: loc.name, // ✅ Use 'title' not 'name' (OrgNodeData interface)
        description: `${loc.city || ''} ${loc.country || ''}`.trim() || undefined,
        position: { x: 100 + (i * 280), y: 100 },
      }));
      newNodes.push(...locationNodes);
    }

    // Create nodes for existing departments (if not already present)
    if (!hasDepartmentNodes && departments.length > 0) {
      const departmentNodes: OrgNodeData[] = departments.map((dept, i) => ({
        id: crypto.randomUUID(), // ✅ Pure UUID for DB
        type: 'department', // ✅ lowercase type for OrgNodeData
        title: dept.name, // ✅ Use 'title' not 'name' (OrgNodeData interface)
        description: dept.description || undefined,
        position: { x: 100 + (i * 280), y: 350 },
      }));
      newNodes.push(...departmentNodes);
    }

    // Update nodes if we added any
    if (newNodes.length > data.nodes.length) {
      data.setNodes(newNodes);
      if (data.tableExists) {
        autoSave.autoSaveNodes(newNodes);
      }
      toast.success(`✅ ${locations.length} Standorte und ${departments.length} Abteilungen im Canvas platziert!`);
    }
  }, [locations, departments, data.tableExists]);

  // ========================================
  // BI-DIRECTIONAL SYNC HANDLERS
  // ========================================

  // Wrapper for createLocation that also creates a Canvas Node
  const handleLocationCreateFromCard = async (locationData: Omit<Location, 'id' | 'organization_id' | 'created_at'>) => {
    // First, create the location in DB via adminStore
    await createLocation(locationData);
    
    // Wait a bit for adminStore to update (it will trigger a reload)
    setTimeout(async () => {
      // Find the newly created location
      const newLocation = locations.find(l => l.name === locationData.name);
      if (!newLocation) {
        console.error('Could not find newly created location');
        return;
      }

      // Create node in canvas with PURE UUID (not prefixed!)
      const newNode: OrgNodeData = {
        id: crypto.randomUUID(), // ✅ Pure UUID for DB
        type: 'location', // ✅ lowercase
        title: newLocation.name, // ✅ Use 'title' not 'name'
        description: `${newLocation.city || ''} ${newLocation.country || ''}`.trim() || undefined,
        position: { 
          x: 100 + (data.nodes.filter(n => n.type === 'location').length * 280), 
          y: 100 
        },
      };

      const updatedNodes = [...data.nodes, newNode];
      data.setNodes(updatedNodes);
      history.addToHistory(updatedNodes, data.connections);

      if (data.tableExists) {
        await autoSave.autoSaveNodes(updatedNodes);
      }

      toast.success('✅ Standort erstellt und im Organigram platziert!');
    }, 500);
  };

  // Wrapper for updateLocation that also updates Canvas Node
  const handleLocationUpdateFromCard = async (locationId: string, locationData: Partial<Location>) => {
    // First, update the location in DB via adminStore
    await updateLocation(locationId, locationData);
    
    // Update node in canvas - find by matching location name
    // Note: We identify locations by their title since we don't have a location_id field
    const location = locations.find(l => l.id === locationId);
    if (!location) return;
    
    const updatedNodes = data.nodes.map(node => {
      // Match node by checking if it's a location with the same title
      if (node.type === 'location' && node.title === location.name) {
        return {
          ...node,
          title: locationData.name || node.title,
          description: locationData.city || locationData.country 
            ? `${locationData.city || ''} ${locationData.country || ''}`.trim() 
            : node.description,
        };
      }
      return node;
    });

    data.setNodes(updatedNodes);
    history.addToHistory(updatedNodes, data.connections);

    if (data.tableExists) {
      await autoSave.autoSaveNodes(updatedNodes);
    }

    toast.success('✅ Standort aktualisiert!');
  };

  // Wrapper for deleteLocation that also deletes Canvas Node
  const handleLocationDeleteFromCard = async (locationId: string) => {
    // First, delete the location from DB via adminStore
    await deleteLocation(locationId);
    
    // Delete node from canvas - find by matching location name
    const location = locations.find(l => l.id === locationId);
    if (!location) return;
    
    const updatedNodes = data.nodes.filter(n => {
      // Remove node if it's a location with matching title
      if (n.type === 'location' && n.title === location.name) {
        return false; // Remove this node
      }
      return true; // Keep other nodes
    });
    
    data.setNodes(updatedNodes);
    history.addToHistory(updatedNodes, data.connections);

    if (data.tableExists) {
      await autoSave.autoSaveNodes(updatedNodes);
    }

    toast.success('✅ Standort gelöscht!');
  };

  // Wrapper for createDepartment that also creates a Canvas Node
  const handleDepartmentCreateFromCard = async (departmentData: Omit<Department, 'id' | 'organization_id' | 'created_at'>) => {
    // First, create the department in DB via adminStore
    await createDepartment(departmentData);
    
    // Wait a bit for adminStore to update (it will trigger a reload)
    setTimeout(async () => {
      // Find the newly created department
      const newDepartment = departments.find(d => d.name === departmentData.name);
      if (!newDepartment) {
        console.error('Could not find newly created department');
        return;
      }

      // Create node in canvas with PURE UUID (not prefixed!)
      const newNode: OrgNodeData = {
        id: crypto.randomUUID(), // ✅ Pure UUID for DB
        type: 'department', // ✅ lowercase
        title: newDepartment.name, // ✅ Use 'title' not 'name'
        description: newDepartment.description || undefined,
        position: { 
          x: 100 + (data.nodes.filter(n => n.type === 'department').length * 280), 
          y: 350 
        },
      };

      const updatedNodes = [...data.nodes, newNode];
      data.setNodes(updatedNodes);
      history.addToHistory(updatedNodes, data.connections);

      if (data.tableExists) {
        await autoSave.autoSaveNodes(updatedNodes);
      }

      toast.success('✅ Abteilung erstellt und im Organigram platziert!');
    }, 500);
  };

  // Wrapper for updateDepartment that also updates Canvas Node
  const handleDepartmentUpdateFromCard = async (departmentId: string, departmentData: Partial<Department>) => {
    // First, update the department in DB via adminStore
    await updateDepartment(departmentId, departmentData);
    
    // Update node in canvas - find by matching department name
    const department = departments.find(d => d.id === departmentId);
    if (!department) return;
    
    const updatedNodes = data.nodes.map(node => {
      // Match node by checking if it's a department with the same title
      if (node.type === 'department' && node.title === department.name) {
        return {
          ...node,
          title: departmentData.name || node.title,
          description: departmentData.description || node.description,
        };
      }
      return node;
    });

    data.setNodes(updatedNodes);
    history.addToHistory(updatedNodes, data.connections);

    if (data.tableExists) {
      await autoSave.autoSaveNodes(updatedNodes);
    }

    toast.success('✅ Abteilung aktualisiert!');
  };

  // Wrapper for deleteDepartment that also deletes Canvas Node
  const handleDepartmentDeleteFromCard = async (departmentId: string) => {
    // First, delete the department from DB via adminStore
    await deleteDepartment(departmentId);
    
    // Delete node from canvas - find by matching department name
    const department = departments.find(d => d.id === departmentId);
    if (!department) return;
    
    const updatedNodes = data.nodes.filter(n => {
      // Remove node if it's a department with matching title
      if (n.type === 'department' && n.title === department.name) {
        return false; // Remove this node
      }
      return true; // Keep other nodes
    });
    
    data.setNodes(updatedNodes);
    history.addToHistory(updatedNodes, data.connections);

    if (data.tableExists) {
      await autoSave.autoSaveNodes(updatedNodes);
    }

    toast.success('✅ Abteilung gelöscht!');
  };

  // ========================================
  // RENDER: SETTINGS SIDEBAR CONTENT
  // ========================================
  const renderSettingsContent = () => (
    <div className="h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Firmeneinstellungen</h2>
        <p className="text-sm text-gray-500 mt-1">Canvas & Organisationsstruktur</p>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Firmendaten Section */}
          <Collapsible open={companyOpen} onOpenChange={setCompanyOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Firmendaten</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${companyOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 pl-2">
                <CompanyBasicSettings />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Standorte Section */}
          <Collapsible open={locationsOpen} onOpenChange={setLocationsOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Standorte</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {locations.length}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${locationsOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 pl-2">
                <LocationManager 
                  onCreate={handleLocationCreateFromCard}
                  onUpdate={handleLocationUpdateFromCard}
                  onDelete={handleLocationDeleteFromCard}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Abteilungen Section */}
          <Collapsible open={departmentsOpen} onOpenChange={setDepartmentsOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Abteilungen</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {departments.length}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${departmentsOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 pl-2">
                <DepartmentManager 
                  onCreate={handleDepartmentCreateFromCard}
                  onUpdate={handleDepartmentUpdateFromCard}
                  onDelete={handleDepartmentDeleteFromCard}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );

  // ========================================
  // RENDER: MAIN LAYOUT
  // ========================================
  return (
    <div className="h-screen bg-[#f5f5f7] flex flex-col">
      {/* ========================================
          HEADER (Desktop + Mobile)
          ======================================== */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Organigram</h1>
          <span className="text-sm text-gray-500">Firmenstruktur & Canvas Organigram</span>
        </div>

        {/* Mobile Settings Button */}
        <div className="md:hidden">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Einstellungen
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              {renderSettingsContent()}
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar Toggle */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Sidebar ausblenden
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 mr-2" />
                Sidebar einblenden
              </>
            )}
          </Button>

          {data.hasUnsavedChanges && (
            <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
              ⚠️ Nicht gespeichert
            </span>
          )}
        </div>
      </div>

      {/* ========================================
          ERROR ALERTS
          ======================================== */}
      {!data.loading && (
        <OrganigramErrorAlerts
          loading={data.loading}
          tableExists={data.tableExists}
          missingColumns={[]}
        />
      )}

      {/* ========================================
          MAIN CONTENT: SIDEBAR + CANVAS
          ======================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {sidebarOpen && (
          <div className="hidden md:block w-80 bg-white border-r border-gray-200 overflow-hidden">
            {renderSettingsContent()}
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          {data.tableExists && !data.loading && (
            <OrganigramToolbar
              editMode={editMode}
              onEditModeChange={setEditMode}
              hasUnsavedChanges={data.hasUnsavedChanges}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              onUndo={history.undo}
              onRedo={history.redo}
              onPublish={publish.handlePublish}
              onRefresh={data.loadData}
              isPublishing={publish.isPublishing}
            />
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
            {data.tableExists && !data.loading && (
              <CanvasOrgChart
                nodes={data.nodes}
                connections={data.connections}
                onNodesChange={data.setNodes}
                onConnectionsChange={data.setConnections}
                editMode={editMode}
                onSave={async () => {
                  await autoSave.autoSaveNodes(data.nodes);
                  await autoSave.autoSaveConnections(data.connections);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
