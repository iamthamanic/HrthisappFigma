import { useState, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import CanvasOrgChart, { type CanvasOrgChartHandle } from '../../components/canvas/BrowoKo_CanvasOrgChart';
import { OrganigramToolbar } from '../../components/organigram/BrowoKo_OrganigramToolbar';
import { OrganigramErrorAlerts } from '../../components/organigram/BrowoKo_OrganigramErrorAlerts';
import { useAuthStore } from '../../stores/BrowoKo_authStore';
import { useOrganigramData } from '../../hooks/BrowoKo_useOrganigramData';
import { useOrganigramHistory } from '../../hooks/BrowoKo_useOrganigramHistory';
import { useOrganigramAutoSave } from '../../hooks/BrowoKo_useOrganigramAutoSave';
import { useOrganigramPublish } from '../../hooks/BrowoKo_useOrganigramPublish';
import type { OrgNodeData } from '../../components/OrgNode';
import type { Connection } from '../../components/canvas/BrowoKo_CanvasOrgChart';

/**
 * ORGANIGRAM CANVAS SCREEN V2 (REFACTORED)
 * ==========================================
 * Admin interface with Draft/Live system and Undo/Redo
 * 
 * ✅ REFACTORED: Phase 2 - Priority 1
 * - Extracted 4 custom hooks (Data, History, AutoSave, Publish)
 * - Extracted 2 UI components (Toolbar, ErrorAlerts)
 * - Reduced from 812 lines → ~180 lines (-78%)
 * 
 * Features:
 * - Edit mode toggle
 * - Draft vs Published versions
 * - Undo/Redo history (Cmd+Z / Ctrl+Z)
 * - Push Live button
 * - Unsaved changes warning
 * - Auto-save drafts
 * 
 * Hooks:
 * - useOrganigramData: Data loading & migrations
 * - useOrganigramHistory: Undo/Redo with keyboard shortcuts
 * - useOrganigramAutoSave: Auto-save drafts to DB
 * - useOrganigramPublish: Publish changes to live
 * 
 * Components:
 * - OrganigramToolbar: All toolbar controls
 * - OrganigramErrorAlerts: Loading & error states
 */

export default function OrganigramCanvasScreenV2() {
  const { profile } = useAuthStore();
  const canvasRef = useRef<CanvasOrgChartHandle>(null);
  
  // UI state (only edit mode - everything else is in hooks!)
  const [isEditMode, setIsEditMode] = useState(false);

  // ✅ HOOK 1: Data Loading & Management
  const data = useOrganigramData(profile?.organization_id);

  // ✅ HOOK 2: Undo/Redo History (with keyboard shortcuts)
  const history = useOrganigramHistory();

  // ✅ HOOK 3: Auto-Save Functionality
  const autoSave = useOrganigramAutoSave(
    profile?.organization_id,
    profile?.id
  );

  // ✅ HOOK 4: Publish Functionality
  const publish = useOrganigramPublish(
    profile?.organization_id,
    profile?.id,
    data.nodes,
    data.connections,
    data.setPublishedNodes,
    data.setPublishedConnections,
    data.setHasUnsavedChanges
  );

  // ========================================
  // EVENT HANDLERS
  // ========================================

  // Handle nodes change (auto-save draft)
  const handleNodesChange = async (updatedNodes: OrgNodeData[]) => {
    // ✅ FIX: ALWAYS update state and history, even if not in edit mode
    // This fixes Undo/Redo when editing nodes via dialogs
    data.setNodes(updatedNodes);
    history.addToHistory(updatedNodes, data.connections);
    data.setHasUnsavedChanges(true);

    // ✅ Auto-save to database ONLY in edit mode
    if (isEditMode && data.tableExists) {
      await autoSave.autoSaveNodes(updatedNodes);
    }
  };

  // Handle connections change (auto-save draft)
  const handleConnectionsChange = async (updatedConnections: Connection[]) => {
    // ✅ FIX: ALWAYS update state and history, even if not in edit mode
    data.setConnections(updatedConnections);
    history.addToHistory(data.nodes, updatedConnections);
    data.setHasUnsavedChanges(true);

    // ✅ Auto-save to database ONLY in edit mode
    if (isEditMode && data.tableExists) {
      await autoSave.autoSaveConnections(updatedConnections);
    }
  };

  // Handle undo (from history hook)
  const handleUndo = () => {
    const state = history.undo();
    if (state) {
      data.setNodes(state.nodes);
      data.setConnections(state.connections);
      data.setHasUnsavedChanges(true);
    }
  };

  // Handle redo (from history hook)
  const handleRedo = () => {
    const state = history.redo();
    if (state) {
      data.setNodes(state.nodes);
      data.setConnections(state.connections);
      data.setHasUnsavedChanges(true);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      toast.info('✏️ Bearbeitungsmodus aktiviert');
    } else {
      toast.info('👀 Ansichtsmodus aktiviert');
    }
  };

  // Add node (via canvas ref)
  const handleAddNode = () => {
    canvasRef.current?.openCreateNodeDialog();
  };

  // ========================================
  // RENDER
  // ========================================

  // ✅ Error Alerts Component (handles loading, errors, migrations)
  const errorAlert = (
    <OrganigramErrorAlerts
      loading={data.loading}
      tableExists={data.tableExists}
      missingColumns={data.missingColumns}
    />
  );

  // Show error alerts if any (returns early)
  if (data.loading || !data.tableExists || data.missingColumns.length > 0) {
    return errorAlert;
  }

  // ✅ Main UI: Toolbar + Canvas
  return (
    <div className="relative w-full h-screen bg-[#f5f5f7]">
      {/* ✅ TOOLBAR COMPONENT: All controls */}
      <OrganigramToolbar
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        hasUnsavedChanges={data.hasUnsavedChanges}
        isPublishing={publish.isPublishing}
        onPublish={publish.publishChanges}
        onAddNode={handleAddNode}
      />

      {/* ✅ CANVAS CONTAINER: Full screen */}
      <div className="w-full h-full">
        <CanvasOrgChart
          ref={canvasRef}
          nodes={data.nodes}
          connections={data.connections}
          onNodesChange={handleNodesChange}
          onConnectionsChange={handleConnectionsChange}
          readOnly={!isEditMode}
        />
      </div>
    </div>
  );
}
