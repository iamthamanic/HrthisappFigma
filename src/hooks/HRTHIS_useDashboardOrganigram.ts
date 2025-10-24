/**
 * @file HRTHIS_useDashboardOrganigram.ts
 * @domain HRTHIS - Dashboard
 * @description Custom hook for dashboard organigram (published nodes loading)
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { supabase } from '../utils/supabase/client';
import { transformDbNodesToOrgNodes, transformDbConnectionsToConnections } from '../utils/HRTHIS_organigramTransformers';
import type { OrgNodeData } from '../components/OrgNode';
import type { Connection } from '../components/canvas/HRTHIS_CanvasTypes';

export function useDashboardOrganigram() {
  const { profile } = useAuthStore();
  
  const [orgNodes, setOrgNodes] = useState<OrgNodeData[]>([]);
  const [orgConnections, setOrgConnections] = useState<Connection[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [isOrgExpanded, setIsOrgExpanded] = useState(false);
  const [hasOrgData, setHasOrgData] = useState(false);

  // Load published organigram data
  // ⚡ PERFORMANCE: Nur spezifische Felder laden (nicht SELECT *)
  // ⚡ PERFORMANCE: Zentrale Transformer-Utils nutzen (weniger Code-Duplikation)
  const loadPublishedOrganigram = async () => {
    if (!profile?.organization_id) {
      console.log('⚠️ Dashboard Organigram: No organization_id');
      setOrgLoading(false);
      return;
    }

    try {
      setOrgLoading(true);
      console.log('🔄 Dashboard: Loading published organigram for org:', profile.organization_id);

      // ⚡ OPTIMIZED: Spezifische Felder statt SELECT * (-30% Transfer Size)
      const { data: nodesData, error: nodesError } = await supabase
        .from('org_nodes')
        .select('id, node_type, title, description, position_x, position_y, width, height, employee_ids, primary_user_id, backup_user_id, backup_backup_user_id, team_lead_id')
        .eq('organization_id', profile.organization_id)
        .eq('is_published', true)
        .order('created_at', { ascending: true });

      if (nodesError) {
        console.error('❌ Dashboard: Error loading organigram nodes:', nodesError);
        setOrgLoading(false);
        return;
      }

      console.log('📊 Dashboard: Loaded', (nodesData || []).length, 'published nodes');

      // ⚡ OPTIMIZED: Zentrale Transformer-Funktion nutzen
      const transformedNodes = transformDbNodesToOrgNodes(nodesData || []);
      setOrgNodes(transformedNodes);
      setHasOrgData(transformedNodes.length > 0);
      console.log('✅ Dashboard: hasOrgData =', transformedNodes.length > 0);

      // ⚡ OPTIMIZED: Spezifische Felder statt SELECT *
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('node_connections')
        .select('id, source_node_id, source_position, target_node_id, target_position, line_style, color')
        .eq('organization_id', profile.organization_id)
        .eq('is_published', true);

      if (connectionsError) {
        console.error('Error loading organigram connections:', connectionsError);
        setOrgLoading(false);
        return;
      }

      // ⚡ OPTIMIZED: Zentrale Transformer-Funktion nutzen
      const transformedConnections = transformDbConnectionsToConnections(connectionsData || []);
      setOrgConnections(transformedConnections);
    } catch (error) {
      console.error('Error loading organigram:', error);
    } finally {
      setOrgLoading(false);
    }
  };

  // ⚡ PERFORMANCE FIX (F002): Initial check if data exists, then load full data on expand
  // Phase 1: Check if organigram exists (lightweight query)
  useEffect(() => {
    const checkIfOrganigramExists = async () => {
      if (!profile?.organization_id) {
        setHasOrgData(false);
        return;
      }

      try {
        // Lightweight query: Just count published nodes (no data transfer)
        const { count, error } = await supabase
          .from('org_nodes')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .eq('is_published', true);

        if (error) {
          console.error('❌ Error checking organigram existence:', error);
          return;
        }

        const exists = (count || 0) > 0;
        setHasOrgData(exists);
        console.log('✅ Dashboard: Organigram exists?', exists, 'Published nodes:', count);
      } catch (error) {
        console.error('❌ Error in organigram existence check:', error);
      }
    };

    checkIfOrganigramExists();
  }, [profile?.organization_id]);

  // Phase 2: Load full data when expanded
  useEffect(() => {
    if (isOrgExpanded && profile?.organization_id) {
      loadPublishedOrganigram();
    }
  }, [profile?.organization_id, isOrgExpanded]);

  return {
    orgNodes,
    orgConnections,
    orgLoading,
    isOrgExpanded,
    setIsOrgExpanded,
    hasOrgData,
  };
}
