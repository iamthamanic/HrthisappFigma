import type { OrgNodeData } from '../OrgNode';
import type { PinPosition } from '../ConnectionPoint';
import type { Connection, Position } from './BrowoKo_CanvasTypes';

/**
 * CANVAS ORGANIGRAM UTILITIES
 * ===========================
 * Helper functions for canvas calculations and pin management
 */

/**
 * Get all connected pins for a given node
 */
export function getConnectedPins(nodeId: string, connections: Connection[]): PinPosition[] {
  const pins: PinPosition[] = [];
  connections.forEach((conn) => {
    if (conn.sourceNodeId === nodeId) {
      pins.push(conn.sourcePosition);
    }
    if (conn.targetNodeId === nodeId) {
      pins.push(conn.targetPosition);
    }
  });
  return [...new Set(pins)]; // Remove duplicates
}

/**
 * 🎯 Get pin positions of a node that are connected to the selected node
 * Returns only the specific pins involved in connections with selectedNodeId
 */
export function getPinsConnectedToSelectedNode(
  nodeId: string,
  selectedNodeId: string | null,
  connections: Connection[]
): PinPosition[] {
  if (!selectedNodeId || nodeId === selectedNodeId) {
    return [];
  }

  const pins: PinPosition[] = [];
  
  connections.forEach((conn) => {
    // If this node is the source and selected node is the target
    if (conn.sourceNodeId === nodeId && conn.targetNodeId === selectedNodeId) {
      pins.push(conn.sourcePosition);
    }
    // If this node is the target and selected node is the source
    if (conn.targetNodeId === nodeId && conn.sourceNodeId === selectedNodeId) {
      pins.push(conn.targetPosition);
    }
  });
  
  return [...new Set(pins)]; // Remove duplicates
}

/**
 * Get pin position in absolute coordinates
 * IMPORTANT: Must match the visual position of ConnectionPoint component
 * ConnectionPoints have transforms that shift them outside the node bounds
 */
export function getPinPosition(nodeId: string, position: PinPosition, nodes: OrgNodeData[]): Position {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };

  const width = node.width || 280;
  const height = node.height || 180;
  
  // Pin point is 16px (w-4 h-4) + 16px padding (p-2) = total 32px clickable area
  // The center of the actual pin circle (4px radius) is at the center of this 32px area
  // With transforms applied in ConnectionPoint:
  // - top: -translate-y-1/2 shifts it up by 16px (half of 32px total height)
  // - right: translate-x-1/2 shifts it right by 16px
  // - bottom: translate-y-1/2 shifts it down by 16px
  // - left: -translate-x-1/2 shifts it left by 16px
  
  const positions: Record<PinPosition, Position> = {
    // Top pin: centered horizontally, shifted above the top edge
    top: { x: node.position.x + width / 2, y: node.position.y },
    // Right pin: shifted beyond the right edge, centered vertically
    right: { x: node.position.x + width, y: node.position.y + height / 2 },
    // Bottom pin: centered horizontally, shifted below the bottom edge
    bottom: { x: node.position.x + width / 2, y: node.position.y + height },
    // Left pin: shifted beyond the left edge, centered vertically
    left: { x: node.position.x, y: node.position.y + height / 2 },
  };

  return positions[position];
}

/**
 * Calculate bounding box for fit-to-screen functionality
 */
export function calculateNodesBoundingBox(nodes: OrgNodeData[], padding: number = 100) {
  if (nodes.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + (node.width || 280));
    maxY = Math.max(maxY, node.position.y + (node.height || 180));
  });

  // Add padding
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return { minX, minY, maxX, maxY, width, height, centerX, centerY };
}

/**
 * Calculate zoom and pan values to fit all nodes in viewport
 */
export function calculateFitToScreen(
  nodes: OrgNodeData[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 100
): { zoom: number; pan: Position } | null {
  const bbox = calculateNodesBoundingBox(nodes, padding);
  if (!bbox) return null;

  // Calculate zoom to fit all nodes in viewport
  const zoomX = viewportWidth / bbox.width;
  const zoomY = viewportHeight / bbox.height;
  const zoom = Math.min(zoomX, zoomY, 1); // Max 100% zoom

  // Center the bounding box in viewport
  const panX = viewportWidth / 2 - bbox.centerX * zoom;
  const panY = viewportHeight / 2 - bbox.centerY * zoom;

  return { zoom, pan: { x: panX, y: panY } };
}
