/**
 * @file BrowoKo_organigramTransformers.ts
 * @domain BrowoKo - Organigram Data Transformers
 * @description Central transformation logic for organigram data
 * @created Phase 3E - Utils Migration
 */

import type { OrgNodeData } from '../components/OrgNode';
import type { Connection } from '../components/canvas/BrowoKo_CanvasTypes';

/**
 * Transform single database node to OrgNodeData
 */
export function transformDbNodeToOrgNode(dbNode: any): OrgNodeData {
  return {
    id: dbNode.id,
    type: dbNode.node_type,
    title: dbNode.title,
    description: dbNode.description || undefined,
    position: { 
      x: Number(dbNode.position_x) || 0, 
      y: Number(dbNode.position_y) || 0 
    },
    width: Number(dbNode.width) || 280,
    height: Number(dbNode.height) || 180,
    employeeIds: dbNode.employee_ids || [],
    primaryUserId: dbNode.primary_user_id || undefined,
    backupUserId: dbNode.backup_user_id || undefined,
    backupBackupUserId: dbNode.backup_backup_user_id || undefined,
    teamLeadId: dbNode.team_lead_id || undefined,
  };
}

/**
 * Transform single database connection to Connection
 */
export function transformDbConnectionToConnection(dbConn: any): Connection {
  return {
    id: dbConn.id,
    sourceNodeId: dbConn.source_node_id,
    sourcePosition: dbConn.source_position,
    targetNodeId: dbConn.target_node_id,
    targetPosition: dbConn.target_position,
    style: dbConn.line_style || 'solid',
    color: dbConn.color || '#6B7280',
  };
}

/**
 * Transform array of database nodes to OrgNodeData[]
 */
export function transformDbNodesToOrgNodes(dbNodes: any[]): OrgNodeData[] {
  return (dbNodes || []).map(transformDbNodeToOrgNode);
}

/**
 * Transform array of database connections to Connection[]
 */
export function transformDbConnectionsToConnections(dbConns: any[]): Connection[] {
  return (dbConns || []).map(transformDbConnectionToConnection);
}

/**
 * Split nodes by published status
 */
export function splitNodesByPublishStatus(nodes: OrgNodeData[], dbNodes: any[]) {
  const draftNodes: OrgNodeData[] = [];
  const publishedNodes: OrgNodeData[] = [];
  
  dbNodes.forEach((dbNode, index) => {
    if (dbNode.is_published) {
      publishedNodes.push(nodes[index]);
    } else {
      draftNodes.push(nodes[index]);
    }
  });
  
  return { draftNodes, publishedNodes };
}

/**
 * Split connections by published status
 */
export function splitConnectionsByPublishStatus(connections: Connection[], dbConns: any[]) {
  const draftConnections: Connection[] = [];
  const publishedConnections: Connection[] = [];
  
  dbConns.forEach((dbConn, index) => {
    if (dbConn.is_published) {
      publishedConnections.push(connections[index]);
    } else {
      draftConnections.push(connections[index]);
    }
  });
  
  return { draftConnections, publishedConnections };
}
