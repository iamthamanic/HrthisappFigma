import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Pencil, Trash2 } from '../icons/BrowoKoIcons';
import { cn } from '../ui/utils';
import OrgNode from '../OrgNode';
import ConnectionLine from '../ConnectionLine';
import CreateNodeDialog from '../CreateNodeDialog';
import EditNodeDialog from '../EditNodeDialog';
import AssignEmployeesDialog from '../AssignEmployeesDialog';
import CanvasControls from './BrowoKo_CanvasControls';
import { getPinPosition, getConnectedPins, getPinsConnectedToSelectedNode, calculateFitToScreen } from './BrowoKo_CanvasUtils';
import {
  createNodeDragHandlers,
  createConnectionHandlers,
  createReconnectionHandlers,
  createNodeCrudHandlers,
  createZoomPanHandlers,
} from './BrowoKo_CanvasHandlers';
import type {
  CanvasOrgChartProps,
  CanvasOrgChartHandle,
  ConnectionDraft,
  ReconnectingConnection,
  Position,
} from './BrowoKo_CanvasTypes';
import { useThrottle, useRAF } from '../../hooks/useThrottle';

/**
 * CANVAS ORG CHART
 * ================
 * Canva-style draggable organigram with modular architecture
 * 
 * Features:
 * - Free-form draggable nodes
 * - Pin point connections
 * - Multiple node types
 * - Zoom & pan
 * - Connection management
 * 
 * Architecture:
 * - BrowoKo_CanvasTypes.ts: TypeScript interfaces
 * - BrowoKo_CanvasUtils.ts: Helper functions
 * - BrowoKo_CanvasHandlers.ts: Event handlers
 * - BrowoKo_CanvasControls.tsx: UI controls
 * - BrowoKo_CanvasOrgChart.tsx: Main component (this file)
 */

const CanvasOrgChart = forwardRef<CanvasOrgChartHandle, CanvasOrgChartProps>((props, ref) => {
  const {
    nodes,
    connections,
    onNodesChange,
    onConnectionsChange,
    className,
    readOnly = false,
  } = props;

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

  // Node management state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<typeof nodes[0] | null>(null);
  const [assigningEmployeesNode, setAssigningEmployeesNode] = useState<typeof nodes[0] | null>(null);

  // Connection management state
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<Position | null>(null);
  const [reconnectingConnection, setReconnectingConnection] = useState<ReconnectingConnection | null>(null);

  // Auto-fit tracking
  const [hasAutoFitted, setHasAutoFitted] = useState(false);

  // Expose method to parent
  useImperativeHandle(ref, () => ({
    openCreateNodeDialog: () => {
      setIsCreateDialogOpen(true);
    },
  }));

  // Create event handlers
  const nodeDragHandlers = createNodeDragHandlers(
    nodes,
    zoom,
    onNodesChange,
    setDraggingNodeId,
    setSelectedNodeId
  );

  const connectionHandlers = createConnectionHandlers(
    connections,
    onConnectionsChange
  );

  const reconnectionHandlers = createReconnectionHandlers(
    connections,
    onConnectionsChange
  );

  const nodeCrudHandlers = createNodeCrudHandlers(
    nodes,
    connections,
    onNodesChange,
    onConnectionsChange,
    setSelectedNodeId
  );

  const zoomPanHandlers = createZoomPanHandlers(
    zoom,
    pan,
    setZoom,
    setPan,
    canvasRef.current
  );

  // Fit to screen handler
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current || nodes.length === 0) {
      zoomPanHandlers.handleZoomReset();
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const result = calculateFitToScreen(nodes, rect.width, rect.height);
    
    if (result) {
      setZoom(result.zoom);
      setPan(result.pan);
    }
  }, [nodes, zoomPanHandlers]);

  // Auto-fit on first load
  useEffect(() => {
    if (nodes.length > 0 && canvasRef.current && !hasAutoFitted) {
      setTimeout(() => {
        handleFitToScreen();
        setHasAutoFitted(true);
      }, 150);
    }
  }, [nodes.length, hasAutoFitted, handleFitToScreen]);

  // ⚡ PERFORMANCE: Mouse wheel zoom handler mit Throttling
  // Verhindert 60+ State-Updates pro Sekunde beim Zoomen
  const handleWheel = useCallback((e: React.WheelEvent | WheelEvent) => {
    e.preventDefault();
    
    const isPinchGesture = e.ctrlKey || e.metaKey;
    const isTwoFingerVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 5;
    const isZoomGesture = isPinchGesture || isTwoFingerVerticalScroll;
    
    if (isZoomGesture) {
      if (!canvasRef.current) return;
      
      const sensitivity = isPinchGesture ? 0.005 : 0.003;
      const delta = 1 - e.deltaY * sensitivity;
      const newZoom = Math.min(Math.max(zoom * delta, 0.3), 3);
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      if (isPinchGesture) {
        const pointX = (mouseX - pan.x) / zoom;
        const pointY = (mouseY - pan.y) / zoom;
        
        const newPanX = mouseX - pointX * newZoom;
        const newPanY = mouseY - pointY * newZoom;
        
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      } else {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const pointX = (centerX - pan.x) / zoom;
        const pointY = (centerY - pan.y) / zoom;
        
        const newPanX = centerX - pointX * newZoom;
        const newPanY = centerY - pointY * newZoom;
        
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [zoom, pan]);

  // ⚡ PERFORMANCE: Throttled wheel handler (max 60fps)
  const handleWheelThrottled = useThrottle(handleWheel, 16);

  // ⚡ PERFORMANCE: Register wheel listener mit Throttling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e: WheelEvent) => {
      handleWheelThrottled(e);
    };

    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [handleWheelThrottled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 🔒 Ignore shortcuts when typing in input fields or dialogs
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable ||
                           target.closest('[role="dialog"]') !== null;
      
      // Allow Delete/Backspace in inputs, but not other shortcuts
      if (isInputField && e.key !== 'Delete' && e.key !== 'Backspace') {
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        e.preventDefault();
        zoomPanHandlers.handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomPanHandlers.handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        zoomPanHandlers.handleZoomReset();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFitToScreen();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete nodes/connections when NOT in an input field
        if (!isInputField) {
          if (selectedNodeId) {
            nodeCrudHandlers.handleDeleteNode(selectedNodeId);
          } else if (selectedConnectionId) {
            connectionHandlers.handleConnectionDelete(selectedConnectionId, setSelectedConnectionId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, selectedNodeId, selectedConnectionId]);

  // Canvas interaction handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isClickOnCanvas = target === canvasRef.current || 
                           target.closest('[data-canvas-background]') !== null ||
                           !target.closest('[data-node-id]') && !target.closest('[data-connection-id]');
    
    if (isClickOnCanvas) {
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
    }
    
    if (e.button === 0 && e.target === canvasRef.current) {
      if (connectionDraft) {
        return;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // ⚡ PERFORMANCE: RAF-throttled mouse position update for connection draft
  // Reduces setMousePosition calls from 60+ to ~60fps, synced with paint cycle
  const updateMousePositionRAF = useRAF((x: number, y: number) => {
    setMousePosition({ x, y });
  });

  // ⚡ PERFORMANCE: RAF-throttled pan update
  // Reduces setPan calls from 60+ to ~60fps, synced with paint cycle
  const updatePanRAF = useRAF((newPan: Position) => {
    setPan(newPan);
  });

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (connectionDraft && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      updateMousePositionRAF(x, y); // ⚡ RAF-throttled
      return;
    }
    
    if (isPanning) {
      updatePanRAF({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }); // ⚡ RAF-throttled
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);
    
    const isCanvasTarget = e.target === canvasRef.current || 
                           (e.target as HTMLElement).classList.contains('bg-white');
    
    if (isCanvasTarget) {
      if (connectionDraft) {
        setConnectionDraft(null);
        setMousePosition(null);
      }

      if (reconnectingConnection) {
        const updatedConnections = connections.filter(
          (conn) => conn.id !== reconnectingConnection.connectionId
        );
        onConnectionsChange(updatedConnections);
        
        setReconnectingConnection(null);
      }
    }
  };

  return (
    <div className={cn("relative w-full h-full bg-white", className)}>
      {/* Zoom Controls */}
      <CanvasControls
        zoom={zoom}
        onZoomIn={zoomPanHandlers.handleZoomIn}
        onZoomOut={zoomPanHandlers.handleZoomOut}
        onFitToScreen={handleFitToScreen}
      />

      {/* Canvas Viewport */}
      <div
        ref={canvasRef}
        className="w-full h-full bg-white relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {/* Transform Stage */}
        <div
          data-canvas-background="true"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            willChange: 'transform',
            width: '10000px',
            height: '10000px',
            position: 'relative',
          }}
        >
          {/* Grid background */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '10000px',
              height: '10000px',
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />

          {/* Connections Layer - z-index ensures it's above grid but can still receive clicks */}
          <svg
            className="absolute top-0 left-0"
            style={{ 
              width: '10000px', 
              height: '10000px', 
              overflow: 'visible', 
              pointerEvents: 'auto',
              zIndex: 10 
            }}
          >
            {/* Existing connections */}
            {connections.map((conn) => {
              const start = getPinPosition(conn.sourceNodeId, conn.sourcePosition, nodes);
              const end = getPinPosition(conn.targetNodeId, conn.targetPosition, nodes);

              const isConnectedToSelectedNode = selectedNodeId && 
                (conn.sourceNodeId === selectedNodeId || conn.targetNodeId === selectedNodeId);

              // Get node names for disconnect dialog
              const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
              const targetNode = nodes.find(n => n.id === conn.targetNodeId);

              return (
                <ConnectionLine
                  key={conn.id}
                  id={conn.id}
                  start={start}
                  end={end}
                  style={conn.style}
                  color={conn.color}
                  strokeWidth={2}
                  isSelected={selectedConnectionId === conn.id}
                  isReconnecting={reconnectingConnection?.connectionId === conn.id}
                  isConnectedToSelectedNode={isConnectedToSelectedNode}
                  onSelect={setSelectedConnectionId}
                  onReconnectStart={(...args) => 
                    reconnectionHandlers.handleReconnectionStart(
                      ...args,
                      setReconnectingConnection,
                      setConnectionDraft,
                      setMousePosition
                    )
                  }
                  onDisconnect={(connectionId, disconnectFromSource) => 
                    connectionHandlers.handleConnectionDisconnect(
                      connectionId,
                      disconnectFromSource,
                      setSelectedConnectionId
                    )
                  }
                  sourceNodeName={sourceNode?.title || 'Start'}
                  targetNodeName={targetNode?.title || 'End'}
                />
              );
            })}

            {/* Draft connection line */}
            {connectionDraft && mousePosition && (() => {
              const start = getPinPosition(connectionDraft.sourceNodeId, connectionDraft.sourcePosition, nodes);
              return (
                <g className="pointer-events-none">
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={mousePosition.x}
                    y2={mousePosition.y}
                    stroke="#3B82F6"
                    strokeWidth={6}
                    opacity={0.2}
                  />
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={mousePosition.x}
                    y2={mousePosition.y}
                    stroke="#3B82F6"
                    strokeWidth={3}
                    strokeDasharray="8,4"
                    opacity={0.8}
                  />
                  <circle
                    cx={mousePosition.x}
                    cy={mousePosition.y}
                    r={6}
                    fill="#3B82F6"
                    opacity={0.6}
                  />
                  <circle
                    cx={mousePosition.x}
                    cy={mousePosition.y}
                    r={3}
                    fill="white"
                    opacity={0.9}
                  />
                </g>
              );
            })()}
          </svg>

          {/* Nodes Layer */}
          {nodes.map((node) => {
            // 🎯 Get which specific pin positions of this node are connected to the selected node
            const pinsConnectedToSelected = getPinsConnectedToSelectedNode(
              node.id,
              selectedNodeId,
              connections
            );

            return (
              <OrgNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isDragging={draggingNodeId === node.id}
                connectedPins={getConnectedPins(node.id, connections)}
                pinsConnectedToSelected={pinsConnectedToSelected}
                readOnly={readOnly} // 🆕 Pass readOnly prop
                onDragStart={readOnly ? undefined : nodeDragHandlers.handleNodeDragStart}
                onDrag={readOnly ? undefined : nodeDragHandlers.handleNodeDrag}
                onDragEnd={readOnly ? undefined : nodeDragHandlers.handleNodeDragEnd}
                onSelect={setSelectedNodeId}
                onEdit={readOnly ? undefined : (nodeId) => {
                  const node = nodes.find((n) => n.id === nodeId);
                  if (node) setEditingNode(node);
                }}
                onAssignEmployees={(nodeId) => {
                  // ✅ Allow in BOTH read-only AND edit mode
                  const node = nodes.find((n) => n.id === nodeId);
                  if (node) setAssigningEmployeesNode(node);
                }}
                onDelete={readOnly ? undefined : nodeCrudHandlers.handleDeleteNode}
                onConnectionStart={readOnly ? undefined : (...args) =>
                  connectionHandlers.handleConnectionStart(
                    ...args,
                    reconnectingConnection,
                    setConnectionDraft,
                    setMousePosition
                  )
                }
                onConnectionEnd={(...args) =>
                  connectionHandlers.handleConnectionEnd(
                    ...args,
                    connectionDraft,
                    reconnectingConnection,
                    setConnectionDraft,
                    setMousePosition,
                    (nodeId, position) =>
                      reconnectionHandlers.handleReconnectionEnd(
                        nodeId,
                        position,
                        connectionDraft,
                        reconnectingConnection,
                        setReconnectingConnection,
                        setConnectionDraft,
                        setMousePosition
                      )
                  )
                }
                onPinDisconnect={undefined}
              />
            );
          })}

          {/* Connection Toolbar */}
          {selectedConnectionId && (() => {
            const conn = connections.find((c) => c.id === selectedConnectionId);
            if (!conn) return null;

            const start = getPinPosition(conn.sourceNodeId, conn.sourcePosition, nodes);
            const end = getPinPosition(conn.targetNodeId, conn.targetPosition, nodes);
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
              <div
                className="absolute bg-white rounded-lg shadow-lg border border-gray-200 flex items-center gap-1 p-1 z-50"
                style={{
                  left: midX,
                  top: midY - 30,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    const nextStyle = conn.style === 'curved' ? 'orthogonal' : 'curved';
                    connectionHandlers.handleConnectionStyleChange(selectedConnectionId, nextStyle);
                  }}
                  className={cn(
                    'p-1.5 rounded hover:bg-gray-100 transition-colors text-xs flex items-center gap-1',
                    conn.style === 'curved' ? 'text-blue-600' : 'text-gray-600'
                  )}
                  title={conn.style === 'curved' ? 'Switch to Orthogonal' : 'Switch to Curved'}
                >
                  <Pencil className="w-3 h-3" />
                  <span className="text-[10px]">{conn.style === 'curved' ? 'Curved' : 'Ortho'}</span>
                </button>

                <button
                  onClick={() => connectionHandlers.handleConnectionDelete(selectedConnectionId, setSelectedConnectionId)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                  title="Delete connection"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Dialogs */}
      <CreateNodeDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={(data) => nodeCrudHandlers.handleCreateNode(data, canvasRef.current, pan, zoom)}
      />

      <EditNodeDialog
        node={editingNode}
        isOpen={!!editingNode}
        onClose={() => setEditingNode(null)}
        onSave={(nodeId, data) => {
          nodeCrudHandlers.handleEditNode(nodeId, data);
          setEditingNode(null);
        }}
      />

      <AssignEmployeesDialog
        isOpen={!!assigningEmployeesNode}
        onClose={() => setAssigningEmployeesNode(null)}
        nodeId={assigningEmployeesNode?.id || ''}
        nodeTitle={assigningEmployeesNode?.title || ''}
        nodeType={assigningEmployeesNode?.type}
        currentEmployeeIds={assigningEmployeesNode?.employeeIds}
        currentPrimaryUserId={assigningEmployeesNode?.primaryUserId}
        currentBackupUserId={assigningEmployeesNode?.backupUserId}
        currentBackupBackupUserId={assigningEmployeesNode?.backupBackupUserId}
        currentTeamLeadId={assigningEmployeesNode?.teamLeadId}
        readOnly={false} // ✅ FIX: Dialog ist IMMER editierbar, unabhängig vom Canvas Mode
        onSave={(data) => {
          if (assigningEmployeesNode) {
            nodeCrudHandlers.handleAssignEmployees(assigningEmployeesNode.id, data);
            setAssigningEmployeesNode(null);
          }
        }}
      />
    </div>
  );
});

CanvasOrgChart.displayName = 'CanvasOrgChart';

export default CanvasOrgChart;
export type { CanvasOrgChartHandle, CanvasOrgChartProps } from './BrowoKo_CanvasTypes';
export type { Connection } from './BrowoKo_CanvasTypes';
