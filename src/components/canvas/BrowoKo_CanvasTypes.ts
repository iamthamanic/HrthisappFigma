import type { PinPosition } from '../ConnectionPoint';
import type { LineStyle } from '../ConnectionLine';
import type { OrgNodeData } from '../OrgNode';

/**
 * CANVAS ORGANIGRAM TYPES
 * =======================
 * TypeScript interfaces and types for the Canvas Organigram system
 */

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePosition: PinPosition;
  targetNodeId: string;
  targetPosition: PinPosition;
  style: LineStyle;
  color?: string;
}

export interface CanvasOrgChartProps {
  nodes: OrgNodeData[];
  connections: Connection[];
  onNodesChange: (nodes: OrgNodeData[]) => void;
  onConnectionsChange: (connections: Connection[]) => void;
  className?: string;
  readOnly?: boolean;
}

export interface CanvasOrgChartHandle {
  openCreateNodeDialog: () => void;
}

export interface ReconnectingConnection {
  connectionId: string;
  isDraggingSource: boolean; // true = dragging source pin, false = dragging target pin
  originalSourceNodeId: string;
  originalSourcePosition: PinPosition;
  originalTargetNodeId: string;
  originalTargetPosition: PinPosition;
}

export interface ConnectionDraft {
  sourceNodeId: string;
  sourcePosition: PinPosition;
}

export interface Position {
  x: number;
  y: number;
}
