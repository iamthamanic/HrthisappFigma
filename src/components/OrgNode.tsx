import { useState, memo } from 'react';
import { MapPin, UserCog, Building2, Layers, Edit2, Trash2, Users } from './icons/HRTHISIcons';
import { cn } from './ui/utils';
import ConnectionPoint, { PinPosition } from './ConnectionPoint';
import { useRAF } from '../hooks/useThrottle';

/**
 * ORG NODE COMPONENT
 * ===================
 * Draggable Node Card (Canva-Style)
 * 
 * Features:
 * - Different types: Location, Executive, Department, Specialization
 * - Free draggable on canvas
 * - 4 connection pin points (visible on hover)
 * - Multi-Connection: Each pin can have multiple connections
 * - Edit button (opens dialog)
 * - Delete button
 * - 280x180px size (consistent)
 */

export type NodeType = 'location' | 'executive' | 'department' | 'specialization';

interface NodeTypeConfig {
  icon: typeof MapPin;
  color: string;
  displayName: string;
}

const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  location: {
    icon: MapPin,
    color: '#3B82F6', // Blue
    displayName: 'Standort',
  },
  executive: {
    icon: UserCog,
    color: '#8B5CF6', // Purple
    displayName: 'Geschäftsführung',
  },
  department: {
    icon: Building2,
    color: '#6B7280', // Gray
    displayName: 'Abteilung',
  },
  specialization: {
    icon: Layers,
    color: '#10B981', // Green
    displayName: 'Spezialisierung',
  },
};

export interface OrgNodeData {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  // Employee assignments
  employeeIds?: string[]; // All assigned employees
  primaryUserId?: string; // Primary responsible person
  backupUserId?: string; // Backup/Vertretung
  backupBackupUserId?: string; // Backup of backup/Vertretung der Vertretung
  teamLeadId?: string; // Team Lead (nur für department & specialization)
}

interface OrgNodeProps {
  node: OrgNodeData;
  isSelected?: boolean;
  isDragging?: boolean;
  connectedPins: PinPosition[]; // Which pins have connections (any connections)
  pinsConnectedToSelected?: PinPosition[]; // 🎯 Which specific pins are connected to the selected node
  isConnectionDragging?: boolean; // Is any connection being dragged?
  readOnly?: boolean; // 🆕 Read-only mode (User View)
  onDragStart?: (nodeId: string, e: React.MouseEvent) => void;
  onDrag?: (nodeId: string, delta: { x: number; y: number }) => void;
  onDragEnd?: (nodeId: string) => void;
  onSelect?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onAssignEmployees?: (nodeId: string) => void; // NEW: Assign employees
  onConnectionStart?: (nodeId: string, position: PinPosition) => void;
  onConnectionEnd?: (nodeId: string, position: PinPosition) => void;
  onPinDisconnect?: (nodeId: string, position: PinPosition) => void;
  className?: string;
}

function OrgNode({
  node,
  isSelected = false,
  isDragging = false,
  connectedPins = [],
  pinsConnectedToSelected = [],
  isConnectionDragging = false,
  readOnly = false,
  onDragStart,
  onDrag,
  onDragEnd,
  onSelect,
  onEdit,
  onDelete,
  onAssignEmployees,
  onConnectionStart,
  onConnectionEnd,
  onPinDisconnect,
  className,
}: OrgNodeProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  const config = NODE_TYPE_CONFIG[node.type];
  const Icon = config.icon;

  const width = node.width || 280;
  const height = node.height || 180;

  // ⚡ PERFORMANCE: RAF-throttled drag handler
  // Reduces onDrag calls from 60+ to ~60fps, synced with paint cycle
  const onDragRAF = useRAF((nodeId: string, delta: { x: number; y: number }) => {
    if (onDrag) {
      onDrag(nodeId, delta);
    }
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onDragStart && !isDragging) {
      e.stopPropagation();
      setDragStartPos({ x: e.clientX, y: e.clientY });
      onDragStart(node.id, e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStartPos) {
      const delta = {
        x: e.clientX - dragStartPos.x,
        y: e.clientY - dragStartPos.y,
      };
      onDragRAF(node.id, delta); // ⚡ RAF-throttled
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && onDragEnd) {
      onDragEnd(node.id);
      setDragStartPos(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(node.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(node.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(node.id);
    }
  };

  const handleAssignEmployees = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAssignEmployees) {
      onAssignEmployees(node.id);
    }
  };

  const pins: PinPosition[] = ['top', 'right', 'bottom', 'left'];

  return (
    <div
      className={cn(
        'absolute select-none transition-shadow duration-200',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
        isDragging && 'opacity-70',
        className
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        width,
        height,
        zIndex: 20, // Above connections (z-10) so nodes are on top
        pointerEvents: 'none', // Allow clicks to pass through to connections below
      }}
    >
      {/* Main card content - THIS has pointer events enabled */}
      <div
        className={cn(
          'w-full h-full cursor-move',
          isDragging && 'cursor-grabbing'
        )}
        style={{ pointerEvents: 'auto' }} // Re-enable pointer events for the actual card
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
      >
      {/* Connection Pin Points (visible on hover, when connected, or when any connection is being dragged) */}
      {pins.map((position) => {
        const isConnected = connectedPins.includes(position);
        const isConnectedToSelected = pinsConnectedToSelected.includes(position);
        
        return (
          <ConnectionPoint
            key={position}
            nodeId={node.id}
            position={position}
            isConnected={isConnected}
            isSelected={isSelected}
            isConnectedToSelected={isConnectedToSelected}
            // Show pins on hover, when dragging node, when connected, or when ANY connection is being dragged
            isVisible={isHovering || isDragging || isConnected || isConnectionDragging}
            onConnectionStart={onConnectionStart || (() => {})}
            onConnectionEnd={onConnectionEnd || (() => {})}
            onDisconnect={onPinDisconnect}
          />
        );
      })}

      {/* Node Card (Figma Design Style) */}
      <div
        className={cn(
          'w-full h-full rounded-lg border-2 shadow-md transition-all duration-200',
          'bg-white/60 backdrop-blur-sm',
          isHovering && 'shadow-lg scale-[1.02]'
        )}
        style={{
          borderColor: config.color,
          opacity: 0.6, // 60% opacity like Figma design
        }}
      >
        {/* Header with Icon & Type */}
        <div
          className="px-4 py-2 rounded-t-md flex items-center gap-2"
          style={{
            backgroundColor: config.color,
            opacity: 0.9,
          }}
        >
          <Icon className="w-5 h-5 text-white" />
          <span className="text-white text-sm font-medium">{config.displayName}</span>
        </div>

        {/* Content */}
        <div className="p-4 flex-1">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{node.title}</h3>
          {node.description && (
            <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line">{node.description}</p>
          )}
          
          {/* Employee assignments info */}
          {(node.employeeIds && node.employeeIds.length > 0) && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Users className="w-3 h-3" />
                <span>{node.employeeIds.length} Mitarbeiter</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions - Always visible (not just on hover) */}
        {readOnly ? (
          /* 👁️ VIEW MODE: Only show permanent "Mitarbeiterzuweisung (View)" icon button */
          onAssignEmployees && (
            <div className="absolute top-2 right-2">
              <button
                onClick={handleAssignEmployees}
                className="p-1.5 bg-white rounded shadow hover:bg-blue-50 transition-colors"
                title="Mitarbeiterzuweisung (View)"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          )
        ) : (
          /* ✏️ EDIT MODE: Show Edit/Assign/Delete buttons ALWAYS (not just on hover) */
          <div className="absolute top-2 right-2 flex gap-1">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-1.5 bg-white rounded shadow hover:bg-gray-50 transition-colors"
                title="Abteilung bearbeiten"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-600" />
              </button>
            )}
            {onAssignEmployees && (
              <button
                onClick={handleAssignEmployees}
                className="p-1.5 bg-white rounded shadow hover:bg-blue-50 transition-colors"
                title="Mitarbeiterzuweisung (Edit)"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 bg-white rounded shadow hover:bg-red-50 transition-colors"
                title="Abteilung löschen"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            )}
          </div>
        )}
      </div>
      {/* Close inner div with pointer-events: auto */}
      </div>
    {/* Close outer container div with pointer-events: none */}
    </div>
  );
}

// ⚡ PERFORMANCE: Memoize component to prevent unnecessary re-renders
// Only re-render when these specific props change
export default memo(OrgNode, (prevProps, nextProps) => {
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.position.x === nextProps.node.position.x &&
    prevProps.node.position.y === nextProps.node.position.y &&
    prevProps.node.title === nextProps.node.title &&
    prevProps.node.type === nextProps.node.type &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isConnectionDragging === nextProps.isConnectionDragging &&
    prevProps.readOnly === nextProps.readOnly &&
    JSON.stringify(prevProps.connectedPins) === JSON.stringify(nextProps.connectedPins) &&
    JSON.stringify(prevProps.pinsConnectedToSelected) === JSON.stringify(nextProps.pinsConnectedToSelected)
  );
});
