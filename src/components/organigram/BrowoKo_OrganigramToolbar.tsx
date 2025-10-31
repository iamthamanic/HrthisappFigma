import { Edit3, Upload, Undo2, Redo2, Info, AlertCircle, Plus } from '../icons/BrowoKoIcons';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../ui/utils';

/**
 * ORGANIGRAM TOOLBAR COMPONENT
 * =============================
 * Toolbar UI for organigram canvas with all controls
 * 
 * Features:
 * - Edit Mode Toggle
 * - Add Node Button
 * - Canvas Controls Help (Popover)
 * - Undo/Redo Buttons
 * - Push Live Button
 * - Unsaved Changes Indicator
 * 
 * Extracted from: OrganigramCanvasScreenV2.tsx (Lines 674-797)
 */

export interface OrganigramToolbarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasUnsavedChanges: boolean;
  isPublishing: boolean;
  onPublish: () => void;
  onAddNode: () => void;
}

export function OrganigramToolbar({
  isEditMode,
  onToggleEditMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasUnsavedChanges,
  isPublishing,
  onPublish,
  onAddNode,
}: OrganigramToolbarProps) {
  return (
    <div className="absolute top-4 left-4 z-[100] bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2">
      {/* Edit Mode Toggle */}
      <Button
        onClick={onToggleEditMode}
        size="sm"
        className={isEditMode ? 'bg-black hover:bg-gray-800 text-white' : ''}
        variant={isEditMode ? 'default' : 'outline'}
      >
        <Edit3 className="w-4 h-4 mr-1" />
        {isEditMode ? 'Ansehen' : 'Bearbeiten'}
      </Button>

      {/* Node hinzufügen - Only in Edit Mode */}
      {isEditMode && (
        <>
          <div className="w-px h-6 bg-gray-300" />
          <Button
            onClick={onAddNode}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            Node hinzufügen
          </Button>

          {/* Canvas Controls Help - Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                title="Canvas Controls"
              >
                <Info className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-3">🎨 Canvas Controls</h4>
                <div className="text-xs space-y-2">
                  <div>🖱️ <strong>Pan:</strong> Drag auf Canvas</div>
                  <div>🔍 <strong>Zoom:</strong> Cmd/Ctrl + Mausrad oder 2-Finger Pinch</div>
                  <div>🎯 <strong>Fit Screen:</strong> F-Taste oder Maximize-Button</div>
                  <div>📍 <strong>Verbindung:</strong> Von Pin Point zu Pin Point ziehen</div>
                  <div>🔄 <strong>Reconnect:</strong> Verbundenen Pin (grün) zu neuem Ziel ziehen</div>
                  <div>👥 <strong>Mitarbeiter:</strong> Hover → Users-Icon klicken</div>
                  <div>⌨️ <strong>Löschen:</strong> Node/Connection auswählen → Delete/Backspace</div>
                  <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t">
                    💡 Mehrere Nodes gleichen Typs möglich
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      <div className="w-px h-6 bg-gray-300" />

      {/* Undo */}
      <Button
        onClick={onUndo}
        disabled={!canUndo}
        size="sm"
        variant="outline"
        title="Rückgängig (Cmd/Ctrl + Z)"
      >
        <Undo2 className="w-4 h-4" />
      </Button>

      {/* Redo */}
      <Button
        onClick={onRedo}
        disabled={!canRedo}
        size="sm"
        variant="outline"
        title="Wiederholen (Cmd/Ctrl + Shift + Z)"
      >
        <Redo2 className="w-4 h-4" />
      </Button>

      {/* Push Live & Unsaved Changes - Only show in edit mode */}
      {isEditMode && (
        <>
          <div className="w-px h-6 bg-gray-300" />

          {/* Push Live */}
          <Button
            onClick={onPublish}
            disabled={!hasUnsavedChanges || isPublishing}
            size="sm"
            className={cn(
              "bg-green-600 hover:bg-green-700",
              hasUnsavedChanges && "animate-pulse"
            )}
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-1" />
                Push Live
              </>
            )}
          </Button>

          {/* Unsaved Changes Indicator (inline) */}
          {hasUnsavedChanges && (
            <>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Nicht veröffentlichte Änderungen</span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
