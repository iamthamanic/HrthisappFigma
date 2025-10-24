import { useState, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import type { OrgNodeData } from '../components/OrgNode';
import type { Connection } from '../components/canvas/HRTHIS_CanvasOrgChart';

/**
 * ORGANIGRAM PUBLISH HOOK
 * ========================
 * Handles publishing draft changes to live (Push Live functionality)
 * 
 * Features:
 * - Publishes draft to live (is_published = true)
 * - ID Mapping: draft_id → published_id (new UUIDs)
 * - Batch UPSERT for drafts (prevent duplicate key errors)
 * - Batch INSERT for published versions
 * - Updates published state after success
 * 
 * Extracted from: OrganigramCanvasScreenV2.tsx (Lines 426-616, 190 lines!)
 */

export interface UseOrganigramPublishReturn {
  publishChanges: () => Promise<void>;
  isPublishing: boolean;
  nodeIdMapping: Record<string, string>;
}

export function useOrganigramPublish(
  organizationId: string | undefined,
  profileId: string | undefined,
  nodes: OrgNodeData[],
  connections: Connection[],
  setPublishedNodes: (nodes: OrgNodeData[]) => void,
  setPublishedConnections: (connections: Connection[]) => void,
  setHasUnsavedChanges: (value: boolean) => void
): UseOrganigramPublishReturn {
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [nodeIdMapping, setNodeIdMapping] = useState<Record<string, string>>({});

  // Publish changes (Push Live) - Also saves draft!
  const publishChanges = useCallback(async () => {
    if (!organizationId || !profileId) {
      console.warn('Cannot publish: missing organizationId or profileId');
      return;
    }

    try {
      setIsPublishing(true);
      console.log('🚀 Starting publish with', nodes.length, 'nodes and', connections.length, 'connections');

      // ✅ STRATEGY CHANGE: Use UPSERT instead of DELETE + INSERT to avoid race conditions
      // This fixes the duplicate key error when clicking "Push Live" multiple times

      // 1. First, delete all OLD published versions (keep draft as-is for now)
      const { error: deletePublishedNodesError } = await supabase
        .from('org_nodes')
        .delete()
        .eq('organization_id', organizationId)
        .eq('is_published', true);

      if (deletePublishedNodesError) {
        console.error('❌ Error deleting old published nodes:', deletePublishedNodesError);
        throw deletePublishedNodesError;
      }

      const { error: deletePublishedConnectionsError } = await supabase
        .from('node_connections')
        .delete()
        .eq('organization_id', organizationId)
        .eq('is_published', true);

      if (deletePublishedConnectionsError) {
        console.error('❌ Error deleting old published connections:', deletePublishedConnectionsError);
        throw deletePublishedConnectionsError;
      }

      console.log('✅ Deleted old published data');

      // 2. Create ID mapping: draft_id -> published_id (use NEW UUIDs for published)
      const newNodeIdMapping: Record<string, string> = {};

      // 3. Prepare BATCH UPSERTS for nodes (both draft and published)
      const draftNodesToUpsert = [];
      const publishedNodesToInsert = [];

      for (const node of nodes) {
        const draftId = node.id;
        const publishedId = crypto.randomUUID(); // Generate NEW UUID for published version
        newNodeIdMapping[draftId] = publishedId;

        const nodeData = {
          organization_id: organizationId,
          node_type: node.type,
          title: node.title,
          description: node.description || null,
          position_x: node.position.x,
          position_y: node.position.y,
          width: node.width || 280,
          height: node.height || 180,
          employee_ids: node.employeeIds || [],
          primary_user_id: node.primaryUserId || null,
          backup_user_id: node.backupUserId || null,
          backup_backup_user_id: node.backupBackupUserId || null,
          team_lead_id: node.teamLeadId || null,
          created_by: profileId,
        };

        // DRAFT version - UPSERT (update if exists, insert if not)
        draftNodesToUpsert.push({
          ...nodeData,
          id: draftId,
          is_published: false,
        });

        // PUBLISHED version - INSERT (always new)
        publishedNodesToInsert.push({
          ...nodeData,
          id: publishedId,
          is_published: true,
        });
      }

      // Batch UPSERT all draft nodes (prevents duplicate key errors)
      if (draftNodesToUpsert.length > 0) {
        const { error: draftNodesError } = await supabase
          .from('org_nodes')
          .upsert(draftNodesToUpsert, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        if (draftNodesError) {
          console.error('❌ Error upserting draft nodes:', draftNodesError);
          throw draftNodesError;
        }
        console.log('✅ Upserted', draftNodesToUpsert.length, 'draft nodes');
      }

      // Batch INSERT all published nodes (always new UUIDs, no conflicts possible)
      if (publishedNodesToInsert.length > 0) {
        const { error: publishedNodesError } = await supabase
          .from('org_nodes')
          .insert(publishedNodesToInsert);
        
        if (publishedNodesError) {
          console.error('❌ Error inserting published nodes:', publishedNodesError);
          throw publishedNodesError;
        }
        console.log('✅ Inserted', publishedNodesToInsert.length, 'published nodes');
      }

      // 4. Prepare BATCH UPSERTS for connections (both draft and published)
      const draftConnectionsToUpsert = [];
      const publishedConnectionsToInsert = [];

      for (const conn of connections) {
        const draftId = conn.id;
        const publishedId = crypto.randomUUID(); // Generate NEW UUID for published connection
        
        // Map source and target node IDs to published versions
        const publishedSourceNodeId = newNodeIdMapping[conn.sourceNodeId] || conn.sourceNodeId;
        const publishedTargetNodeId = newNodeIdMapping[conn.targetNodeId] || conn.targetNodeId;

        const connectionData = {
          organization_id: organizationId,
          source_position: conn.sourcePosition,
          target_position: conn.targetPosition,
          line_style: conn.style,
          color: conn.color || '#6B7280',
        };

        // DRAFT version - UPSERT
        draftConnectionsToUpsert.push({
          ...connectionData,
          id: draftId,
          source_node_id: conn.sourceNodeId,
          target_node_id: conn.targetNodeId,
          is_published: false,
        });

        // PUBLISHED version (with mapped node IDs) - INSERT
        publishedConnectionsToInsert.push({
          ...connectionData,
          id: publishedId,
          source_node_id: publishedSourceNodeId,
          target_node_id: publishedTargetNodeId,
          is_published: true,
        });
      }

      // Batch UPSERT all draft connections
      if (draftConnectionsToUpsert.length > 0) {
        const { error: draftConnectionsError } = await supabase
          .from('node_connections')
          .upsert(draftConnectionsToUpsert, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        if (draftConnectionsError) {
          console.error('❌ Error upserting draft connections:', draftConnectionsError);
          throw draftConnectionsError;
        }
        console.log('✅ Upserted', draftConnectionsToUpsert.length, 'draft connections');
      }

      // Batch INSERT all published connections
      if (publishedConnectionsToInsert.length > 0) {
        const { error: publishedConnectionsError } = await supabase
          .from('node_connections')
          .insert(publishedConnectionsToInsert);
        
        if (publishedConnectionsError) {
          console.error('❌ Error inserting published connections:', publishedConnectionsError);
          throw publishedConnectionsError;
        }
        console.log('✅ Inserted', publishedConnectionsToInsert.length, 'published connections');
      }

      // Update local state
      setPublishedNodes(nodes);
      setPublishedConnections(connections);
      setNodeIdMapping(newNodeIdMapping); // Store mapping for reference
      setHasUnsavedChanges(false);
      
      toast.success('✅ Änderungen gespeichert & veröffentlicht!', {
        description: `${nodes.length} Nodes & ${connections.length} Verbindungen publiziert.`
      });
    } catch (error) {
      console.error('❌ Error publishing changes:', error);
      toast.error('Fehler beim Veröffentlichen');
    } finally {
      setIsPublishing(false);
    }
  }, [organizationId, profileId, nodes, connections, setPublishedNodes, setPublishedConnections, setHasUnsavedChanges]);

  return {
    publishChanges,
    isPublishing,
    nodeIdMapping,
  };
}
