import type { OrgNodeData, NodeType } from '../OrgNode';
import type { PinPosition } from '../ConnectionPoint';
import type { LineStyle } from '../ConnectionLine';
import type {
  Connection,
  ConnectionDraft,
  ReconnectingConnection,
  Position,
} from './BrowoKo_CanvasTypes';

/**
 * CANVAS ORGANIGRAM EVENT HANDLERS
 * =================================
 * All event handling logic for the Canvas Organigram
 */

/**
 * Node drag handlers
 */
export function createNodeDragHandlers(
  nodes: OrgNodeData[],
  zoom: number,
  onNodesChange: (nodes: OrgNodeData[]) => void,
  onDraggingNodeIdChange: (id: string | null) => void,
  onSelectedNodeIdChange: (id: string | null) => void
) {
  const handleNodeDragStart = (nodeId: string) => {
    onDraggingNodeIdChange(nodeId);
    onSelectedNodeIdChange(nodeId);
  };

  const handleNodeDrag = (nodeId: string, delta: { x: number; y: number }) => {
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          position: {
            x: node.position.x + delta.x / zoom,
            y: node.position.y + delta.y / zoom,
          },
        };
      }
      return node;
    });
    onNodesChange(updatedNodes);
  };

  const handleNodeDragEnd = () => {
    onDraggingNodeIdChange(null);
  };

  return { handleNodeDragStart, handleNodeDrag, handleNodeDragEnd };
}

/**
 * Connection creation handlers
 */
export function createConnectionHandlers(
  connections: Connection[],
  onConnectionsChange: (connections: Connection[]) => void
) {
  const handleConnectionStart = (
    nodeId: string,
    position: PinPosition,
    reconnectingConnection: ReconnectingConnection | null,
    onConnectionDraftChange: (draft: ConnectionDraft | null) => void,
    onMousePositionChange: (pos: Position | null) => void
  ) => {
    console.log('🔗 Connection Start:', nodeId, position);
    
    // If we're already reconnecting from connection line pins, don't start a new connection
    if (reconnectingConnection) {
      console.log('⚠️ Already reconnecting - ignoring new connection start');
      return;
    }
    
    // ✅ MULTI-CONNECTION SUPPORT:
    // Do NOT remove existing connections when starting a drag from a pin
    // A pin can have UNLIMITED connections to different nodes
    // To delete a connection, user must:
    //   1. Click the Connection Line itself (not the pin)
    //   2. Drag the connection line into empty space
    //   3. Or click Delete button on the connection line
    
    onConnectionDraftChange({ sourceNodeId: nodeId, sourcePosition: position });
    onMousePositionChange(null); // Reset mouse position when starting new drag
  };

  const handleConnectionEnd = (
    nodeId: string,
    position: PinPosition,
    connectionDraft: ConnectionDraft | null,
    reconnectingConnection: ReconnectingConnection | null,
    onConnectionDraftChange: (draft: ConnectionDraft | null) => void,
    onMousePositionChange: (pos: Position | null) => void,
    handleReconnectionEnd: (nodeId: string, position: PinPosition) => void
  ) => {
    console.log('🔗 Connection End called:', nodeId, position, 'Draft exists:', !!connectionDraft);
    
    if (!connectionDraft) {
      console.log('⚠️ No connection draft - ignoring');
      return;
    }

    // Check if we're reconnecting an existing connection
    if (reconnectingConnection) {
      handleReconnectionEnd(nodeId, position);
      return;
    }

    // Don't create connection to same node
    if (connectionDraft.sourceNodeId === nodeId) {
      console.log('❌ Cannot connect to same node - cancelling');
      onConnectionDraftChange(null);
      onMousePositionChange(null);
      return;
    }

    // Check if connection already exists (bidirectional check)
    const exists = connections.some(
      (conn) =>
        // SWAPPED: When dragging from A to B, B becomes source and A becomes target
        (conn.sourceNodeId === nodeId &&
        conn.sourcePosition === position &&
        conn.targetNodeId === connectionDraft.sourceNodeId &&
        conn.targetPosition === connectionDraft.sourcePosition) ||
        // Check reverse direction too
        (conn.sourceNodeId === connectionDraft.sourceNodeId &&
        conn.sourcePosition === connectionDraft.sourcePosition &&
        conn.targetNodeId === nodeId &&
        conn.targetPosition === position)
    );

    if (!exists) {
      console.log('✅ Creating new connection');
      // SWAP source and target: The pin we drag TO becomes the source (where line starts)
      // The pin we drag FROM becomes the target (where line ends)
      const newConnection: Connection = {
        id: crypto.randomUUID(),
        sourceNodeId: nodeId, // SWAPPED: end node is source
        sourcePosition: position, // SWAPPED: end position is source
        targetNodeId: connectionDraft.sourceNodeId, // SWAPPED: start node is target
        targetPosition: connectionDraft.sourcePosition, // SWAPPED: start position is target
        style: 'curved',
        color: '#6B7280',
      };
      console.log('✅ New connection created:', newConnection);
      onConnectionsChange([...connections, newConnection]);
    } else {
      console.log('⚠️ Connection already exists - skipping');
    }

    onConnectionDraftChange(null);
    onMousePositionChange(null);
  };

  const handleConnectionDelete = (
    connectionId: string,
    onSelectedConnectionIdChange: (id: string | null) => void
  ) => {
    const updatedConnections = connections.filter((conn) => conn.id !== connectionId);
    onConnectionsChange(updatedConnections);
    onSelectedConnectionIdChange(null);
  };

  const handleConnectionDisconnect = (
    connectionId: string,
    disconnectFromSource: boolean,
    onSelectedConnectionIdChange: (id: string | null) => void
  ) => {
    console.log(`🔌 Disconnecting from ${disconnectFromSource ? 'SOURCE' : 'TARGET'} side`);
    
    // Just delete the connection (user can create a new one)
    const updatedConnections = connections.filter((conn) => conn.id !== connectionId);
    onConnectionsChange(updatedConnections);
    onSelectedConnectionIdChange(null);
  };

  const handleConnectionStyleChange = (connectionId: string, newStyle: LineStyle) => {
    const updatedConnections = connections.map((conn) =>
      conn.id === connectionId ? { ...conn, style: newStyle } : conn
    );
    onConnectionsChange(updatedConnections);
  };

  return {
    handleConnectionStart,
    handleConnectionEnd,
    handleConnectionDelete,
    handleConnectionDisconnect,
    handleConnectionStyleChange,
  };
}

/**
 * Connection reconnection handlers
 */
export function createReconnectionHandlers(
  connections: Connection[],
  onConnectionsChange: (connections: Connection[]) => void
) {
  const handleReconnectionStart = (
    connectionId: string,
    isDraggingSource: boolean,
    onReconnectingConnectionChange: (reconnecting: ReconnectingConnection | null) => void,
    onConnectionDraftChange: (draft: ConnectionDraft | null) => void,
    onMousePositionChange: (pos: Position | null) => void
  ) => {
    console.log('🔄 Reconnection Start:', connectionId, isDraggingSource ? 'SOURCE' : 'TARGET');
    
    const connection = connections.find((conn) => conn.id === connectionId);
    if (!connection) {
      console.error('❌ Connection not found:', connectionId);
      return;
    }

    onReconnectingConnectionChange({
      connectionId,
      isDraggingSource,
      originalSourceNodeId: connection.sourceNodeId,
      originalSourcePosition: connection.sourcePosition,
      originalTargetNodeId: connection.targetNodeId,
      originalTargetPosition: connection.targetPosition,
    });

    // Start connection draft from the pin we're keeping (not dragging)
    if (isDraggingSource) {
      // Dragging source pin, so keep target pin and create draft from target
      onConnectionDraftChange({
        sourceNodeId: connection.targetNodeId,
        sourcePosition: connection.targetPosition,
      });
    } else {
      // Dragging target pin, so keep source pin and create draft from source
      onConnectionDraftChange({
        sourceNodeId: connection.sourceNodeId,
        sourcePosition: connection.sourcePosition,
      });
    }

    onMousePositionChange(null);
  };

  const handleReconnectionEnd = (
    nodeId: string,
    position: PinPosition,
    connectionDraft: ConnectionDraft | null,
    reconnectingConnection: ReconnectingConnection | null,
    onReconnectingConnectionChange: (reconnecting: ReconnectingConnection | null) => void,
    onConnectionDraftChange: (draft: ConnectionDraft | null) => void,
    onMousePositionChange: (pos: Position | null) => void
  ) => {
    console.log('🔄 Reconnection End:', nodeId, position);
    
    if (!reconnectingConnection || !connectionDraft) {
      console.log('⚠️ No reconnection in progress');
      return;
    }

    // Don't reconnect to same node
    if (connectionDraft.sourceNodeId === nodeId) {
      console.log('❌ Cannot reconnect to same node');
      onReconnectingConnectionChange(null);
      onConnectionDraftChange(null);
      onMousePositionChange(null);
      return;
    }

    // Update the connection with new endpoint
    const updatedConnections = connections.map((conn) => {
      if (conn.id === reconnectingConnection.connectionId) {
        if (reconnectingConnection.isDraggingSource) {
          // We dragged the source pin, update it
          return {
            ...conn,
            sourceNodeId: nodeId,
            sourcePosition: position,
          };
        } else {
          // We dragged the target pin, update it
          return {
            ...conn,
            targetNodeId: nodeId,
            targetPosition: position,
          };
        }
      }
      return conn;
    });

    console.log('✅ Connection reconnected');
    onConnectionsChange(updatedConnections);
    
    onReconnectingConnectionChange(null);
    onConnectionDraftChange(null);
    onMousePositionChange(null);
  };

  return { handleReconnectionStart, handleReconnectionEnd };
}

/**
 * Node CRUD handlers
 */
export function createNodeCrudHandlers(
  nodes: OrgNodeData[],
  connections: Connection[],
  onNodesChange: (nodes: OrgNodeData[]) => void,
  onConnectionsChange: (connections: Connection[]) => void,
  onSelectedNodeIdChange: (id: string | null) => void
) {
  const handleCreateNode = (
    data: { type: NodeType; title: string; description: string },
    canvasElement: HTMLDivElement | null,
    pan: Position,
    zoom: number
  ) => {
    // ✅ SPAWN IN VIEWPORT CENTER (like Figma/Canva!)
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const viewportCenterX = rect.width / 2;
    const viewportCenterY = rect.height / 2;
    
    // Convert viewport coordinates to canvas coordinates (inverse of transform)
    const canvasCenterX = (viewportCenterX - pan.x) / zoom;
    const canvasCenterY = (viewportCenterY - pan.y) / zoom;
    
    // Offset for multiple nodes to avoid overlap
    const offset = nodes.length * 40;
    
    const newNode: OrgNodeData = {
      id: crypto.randomUUID(), // ✅ FIX: UUID statt Date.now() für Postgres UUID-Kompatibilität
      type: data.type,
      title: data.title,
      description: data.description,
      position: { 
        x: canvasCenterX + offset - 140, // -140 = half of node width (280/2) to center it
        y: canvasCenterY + offset - 90,   // -90 = half of node height (180/2) to center it
      },
      width: 280,
      height: 180,
    };
    onNodesChange([...nodes, newNode]);
  };

  const handleEditNode = (
    nodeId: string,
    data: { type: NodeType; title: string; description: string }
  ) => {
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? { ...node, type: data.type, title: data.title, description: data.description }
        : node
    );
    onNodesChange(updatedNodes);
  };

  const handleAssignEmployees = (
    nodeId: string,
    data: {
      employeeIds: string[];
      primaryUserId?: string;
      backupUserId?: string;
      backupBackupUserId?: string;
      teamLeadId?: string;
    }
  ) => {
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            employeeIds: data.employeeIds,
            primaryUserId: data.primaryUserId,
            backupUserId: data.backupUserId,
            backupBackupUserId: data.backupBackupUserId,
            teamLeadId: data.teamLeadId,
          }
        : node
    );
    onNodesChange(updatedNodes);
  };

  const handleDeleteNode = (nodeId: string) => {
    // Remove node
    const updatedNodes = nodes.filter((node) => node.id !== nodeId);
    onNodesChange(updatedNodes);

    // Remove all connections to/from this node
    const updatedConnections = connections.filter(
      (conn) => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    );
    onConnectionsChange(updatedConnections);

    onSelectedNodeIdChange(null);
  };

  return {
    handleCreateNode,
    handleEditNode,
    handleAssignEmployees,
    handleDeleteNode,
  };
}

/**
 * Zoom and pan handlers
 */
export function createZoomPanHandlers(
  zoom: number,
  pan: Position,
  setZoom: (zoom: number) => void,
  setPan: (pan: Position) => void,
  canvasElement: HTMLDivElement | null
) {
  const handleZoomIn = () => {
    if (!canvasElement) return;
    
    const newZoom = Math.min(zoom * 1.2, 3);
    
    // Zoom toward center of viewport
    const rect = canvasElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const pointX = (centerX - pan.x) / zoom;
    const pointY = (centerY - pan.y) / zoom;
    
    const newPanX = centerX - pointX * newZoom;
    const newPanY = centerY - pointY * newZoom;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleZoomOut = () => {
    if (!canvasElement) return;
    
    const newZoom = Math.max(zoom / 1.2, 0.3);
    
    // Zoom toward center of viewport
    const rect = canvasElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const pointX = (centerX - pan.x) / zoom;
    const pointY = (centerY - pan.y) / zoom;
    
    const newPanX = centerX - pointX * newZoom;
    const newPanY = centerY - pointY * newZoom;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return { handleZoomIn, handleZoomOut, handleZoomReset };
}
