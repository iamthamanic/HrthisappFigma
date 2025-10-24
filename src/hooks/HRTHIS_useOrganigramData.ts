import { useState, useEffect } from 'react';
import type { OrgNodeData } from '../components/OrgNode';
import type { Connection } from '../components/canvas/HRTHIS_CanvasOrgChart';
import { supabase } from '../utils/supabase/client';
import {
  transformDbNodesToOrgNodes,
  transformDbConnectionsToConnections,
} from '../utils/HRTHIS_organigramTransformers';

/**
 * ORGANIGRAM DATA HOOK
 * =====================
 * Manages data loading, migrations check, and unsaved changes detection
 * 
 * Features:
 * - Loads draft + published nodes/connections
 * - Checks table existence
 * - Checks for missing columns (migrations)
 * - Detects unsaved changes (draft vs published)
 * 
 * Extracted from: OrganigramCanvasScreenV2.tsx (Lines 42-200)
 */

export interface UseOrganigramDataReturn {
  // Data State
  nodes: OrgNodeData[];
  setNodes: React.Dispatch<React.SetStateAction<OrgNodeData[]>>;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  publishedNodes: OrgNodeData[];
  setPublishedNodes: React.Dispatch<React.SetStateAction<OrgNodeData[]>>;
  publishedConnections: Connection[];
  setPublishedConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  
  // Status
  loading: boolean;
  tableExists: boolean;
  missingColumns: string[];
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Methods
  loadData: () => Promise<void>;
}

export function useOrganigramData(organizationId: string | undefined): UseOrganigramDataReturn {
  // Data state
  const [nodes, setNodes] = useState<OrgNodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [publishedNodes, setPublishedNodes] = useState<OrgNodeData[]>([]);
  const [publishedConnections, setPublishedConnections] = useState<Connection[]>([]);
  
  // Status state
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for missing columns (migrations)
  const checkMigrations = async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('org_nodes')
        .select('employee_ids, primary_user_id, backup_user_id, backup_backup_user_id, team_lead_id, is_published')
        .limit(1);

      if (error) {
        console.warn('Migration check error:', error);
        const missing: string[] = [];
        if (error.message.includes('employee_ids')) missing.push('employee_ids');
        if (error.message.includes('primary_user_id')) missing.push('primary_user_id');
        if (error.message.includes('backup_user_id')) missing.push('backup_user_id');
        if (error.message.includes('backup_backup_user_id')) missing.push('backup_backup_user_id');
        if (error.message.includes('team_lead_id')) missing.push('team_lead_id');
        if (error.message.includes('is_published')) missing.push('is_published');
        
        setMissingColumns(missing);
        return missing.length > 0;
      }
      
      setMissingColumns([]);
      return false;
    } catch (err) {
      console.error('Error checking migrations:', err);
      return false;
    }
  };

  // Check if draft differs from published
  const checkForUnsavedChanges = (
    draftNodes: any[],
    publishedNodes: any[],
    draftConnections: any[],
    publishedConnections: any[]
  ) => {
    const hasChanges =
      draftNodes.length !== publishedNodes.length ||
      draftConnections.length !== publishedConnections.length ||
      JSON.stringify(draftNodes) !== JSON.stringify(publishedNodes) ||
      JSON.stringify(draftConnections) !== JSON.stringify(publishedConnections);
    
    setHasUnsavedChanges(hasChanges);
  };

  // ⚡ PERFORMANCE OPTIMIZED: Load data (draft + published)
  // F001: Spezifische Felder statt SELECT * (-30% Transfer)
  // F003: 2 Queries statt 4 (-100-150ms TTFB)
  // F004: Zentrale Transformer-Utils (-2KB Bundle)
  const loadData = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if tables exist
      const { error: tableCheckError } = await supabase
        .from('org_nodes')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error('❌ Table check error:', tableCheckError);
        if (tableCheckError.code === 'PGRST205' || tableCheckError.code === '42P01') {
          setTableExists(false);
          setLoading(false);
          return;
        }
      }

      // Check migrations
      await checkMigrations();

      // ⚡ OPTIMIZED: Lade ALLE Nodes in 1 Query (statt 2 separate)
      // Spezifische Felder statt SELECT * spart ~30% Transfer-Size
      const { data: allNodesData, error: nodesError } = await supabase
        .from('org_nodes')
        .select('id, node_type, title, description, position_x, position_y, width, height, employee_ids, primary_user_id, backup_user_id, backup_backup_user_id, team_lead_id, is_published, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (nodesError) {
        console.error('Error loading nodes:', nodesError);
      } else if (allNodesData) {
        // ✅ FIX: Split ZUERST, DANN transformieren
        const draftNodesData = allNodesData.filter(n => !n.is_published);
        const publishedNodesData = allNodesData.filter(n => n.is_published);
        
        const draftNodes = transformDbNodesToOrgNodes(draftNodesData);
        const publishedNodesTransformed = transformDbNodesToOrgNodes(publishedNodesData);
        
        setNodes(draftNodes);
        setPublishedNodes(publishedNodesTransformed);
        
        // Store for unsaved changes check
        (window as any)._draftNodesData = draftNodesData;
        (window as any)._publishedNodesData = publishedNodesData;
      }

      // ⚡ OPTIMIZED: Lade ALLE Connections in 1 Query (statt 2 separate)
      const { data: allConnectionsData, error: connectionsError } = await supabase
        .from('node_connections')
        .select('id, source_node_id, source_position, target_node_id, target_position, line_style, color, is_published')
        .eq('organization_id', organizationId);

      if (connectionsError) {
        console.error('Error loading connections:', connectionsError);
      } else if (allConnectionsData) {
        // ✅ FIX: Split ZUERST, DANN transformieren
        const draftConnectionsData = allConnectionsData.filter(c => !c.is_published);
        const publishedConnectionsData = allConnectionsData.filter(c => c.is_published);
        
        const draftConnections = transformDbConnectionsToConnections(draftConnectionsData);
        const publishedConnectionsTransformed = transformDbConnectionsToConnections(publishedConnectionsData);
        
        setConnections(draftConnections);
        setPublishedConnections(publishedConnectionsTransformed);

        // Check for unsaved changes with correct data
        const draftNodesData = (window as any)._draftNodesData || [];
        const publishedNodesData = (window as any)._publishedNodesData || [];
        
        checkForUnsavedChanges(
          draftNodesData,
          publishedNodesData,
          draftConnectionsData,
          publishedConnectionsData
        );
      }

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when organization changes
  useEffect(() => {
    loadData();
  }, [organizationId]);

  return {
    // Data
    nodes,
    setNodes,
    connections,
    setConnections,
    publishedNodes,
    setPublishedNodes,
    publishedConnections,
    setPublishedConnections,
    
    // Status
    loading,
    tableExists,
    missingColumns,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    
    // Methods
    loadData,
  };
}
