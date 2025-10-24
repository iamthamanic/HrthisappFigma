import { useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import type { OrgNodeData } from '../components/OrgNode';
import type { Connection } from '../components/canvas/HRTHIS_CanvasOrgChart';

/**
 * ORGANIGRAM AUTO-SAVE HOOK
 * ==========================
 * Handles auto-saving draft nodes and connections to database
 * 
 * Features:
 * - Auto-save draft nodes (is_published = false)
 * - Auto-save draft connections (is_published = false)
 * - UPSERT logic (insert new, update existing)
 * - Delete removed items
 * 
 * Extracted from: OrganigramCanvasScreenV2.tsx (Lines 270-423)
 */

export interface UseOrganigramAutoSaveReturn {
  autoSaveNodes: (nodes: OrgNodeData[]) => Promise<void>;
  autoSaveConnections: (connections: Connection[]) => Promise<void>;
}

export function useOrganigramAutoSave(
  organizationId: string | undefined,
  profileId: string | undefined
): UseOrganigramAutoSaveReturn {
  
  // Auto-save draft nodes to DB
  const autoSaveNodes = useCallback(async (updatedNodes: OrgNodeData[]) => {
    if (!organizationId || !profileId) {
      console.warn('Cannot auto-save: missing organizationId or profileId');
      return;
    }

    try {
      // FIRST: Get all existing draft node IDs
      const { data: existingNodes } = await supabase
        .from('org_nodes')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_published', false);

      const existingIds = new Set(existingNodes?.map(n => n.id) || []);
      const updatedIds = new Set(updatedNodes.map(n => n.id));

      // Find IDs to delete (exist in DB but not in updated list)
      const idsToDelete = Array.from(existingIds).filter(id => !updatedIds.has(id));

      // Delete removed nodes
      if (idsToDelete.length > 0) {
        await supabase
          .from('org_nodes')
          .delete()
          .in('id', idsToDelete);
        console.log('🗑️ Deleted', idsToDelete.length, 'removed nodes');
      }

      // UPSERT all current nodes (insert new, update existing)
      if (updatedNodes.length > 0) {
        const nodesToUpsert = updatedNodes.map(node => ({
          id: node.id,
          organization_id: organizationId,
          node_type: node.type,
          title: node.name || node.title || 'Unbenannt', // ✅ FIX: Use node.name (our field) or node.title (DB field)
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
          is_published: false, // DRAFT version
          created_by: profileId,
        }));

        const { error } = await supabase
          .from('org_nodes')
          .upsert(nodesToUpsert, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error('❌ Error auto-saving draft nodes:', error);
        } else {
          console.log('✅ Auto-saved', updatedNodes.length, 'draft nodes');
        }
      } else {
        // If no nodes, delete all draft nodes
        await supabase
          .from('org_nodes')
          .delete()
          .eq('organization_id', organizationId)
          .eq('is_published', false);
        console.log('🗑️ Deleted all draft nodes (empty state)');
      }
    } catch (error) {
      console.error('❌ Error auto-saving draft nodes:', error);
    }
  }, [organizationId, profileId]);

  // Auto-save draft connections to DB
  const autoSaveConnections = useCallback(async (updatedConnections: Connection[]) => {
    if (!organizationId) {
      console.warn('Cannot auto-save: missing organizationId');
      return;
    }

    try {
      // FIRST: Get all existing draft connection IDs
      const { data: existingConnections } = await supabase
        .from('node_connections')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_published', false);

      const existingIds = new Set(existingConnections?.map(c => c.id) || []);
      const updatedIds = new Set(updatedConnections.map(c => c.id));

      // Find IDs to delete (exist in DB but not in updated list)
      const idsToDelete = Array.from(existingIds).filter(id => !updatedIds.has(id));

      // Delete removed connections
      if (idsToDelete.length > 0) {
        await supabase
          .from('node_connections')
          .delete()
          .in('id', idsToDelete);
        console.log('🗑️ Deleted', idsToDelete.length, 'removed connections');
      }

      // UPSERT all current connections (insert new, update existing)
      if (updatedConnections.length > 0) {
        const connectionsToUpsert = updatedConnections.map(conn => ({
          id: conn.id,
          organization_id: organizationId,
          source_node_id: conn.sourceNodeId,
          source_position: conn.sourcePosition,
          target_node_id: conn.targetNodeId,
          target_position: conn.targetPosition,
          line_style: conn.style,
          color: conn.color || '#6B7280',
          is_published: false, // DRAFT version
        }));

        const { error } = await supabase
          .from('node_connections')
          .upsert(connectionsToUpsert, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error('❌ Error auto-saving draft connections:', error);
        } else {
          console.log('✅ Auto-saved', updatedConnections.length, 'draft connections');
        }
      } else {
        // If no connections, delete all draft connections
        await supabase
          .from('node_connections')
          .delete()
          .eq('organization_id', organizationId)
          .eq('is_published', false);
        console.log('🗑️ Deleted all draft connections (empty state)');
      }
    } catch (error) {
      console.error('❌ Error auto-saving draft connections:', error);
    }
  }, [organizationId]);

  return {
    autoSaveNodes,
    autoSaveConnections,
  };
}
