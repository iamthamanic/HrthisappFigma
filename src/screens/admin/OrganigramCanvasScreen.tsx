import { useState, useEffect } from 'react';
import { Network, Info, ExternalLink, Copy, Check } from '../../components/icons/BrowoKoIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import CanvasOrgChart, { type Connection } from '../../components/canvas/BrowoKo_CanvasOrgChart';
import type { OrgNodeData } from '../../components/OrgNode';
import { useAuthStore } from '../../stores/BrowoKo_authStore';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

/**
 * ORGANIGRAM CANVAS SCREEN
 * =========================
 * Canva-style draggable organigram interface
 * 
 * Features:
 * - Free-form node placement
 * - Multiple node types
 * - Pin point connections
 * - Zoom & pan
 * - Auto-save to Supabase
 */

export default function OrganigramCanvasScreen() {
  const { profile } = useAuthStore();
  const [nodes, setNodes] = useState<OrgNodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [migrationPathCopied, setMigrationPathCopied] = useState(false);
  const [nodeIdMapping, setNodeIdMapping] = useState<Record<string, string>>({});
  const [missingColumns, setMissingColumns] = useState<string[]>([]);

  // Check for missing columns (migrations)
  const checkMigrations = async () => {
    try {
      // Try to select all required columns
      const { error } = await supabase
        .from('org_nodes')
        .select('employee_ids, primary_user_id, backup_user_id, backup_backup_user_id, team_lead_id')
        .limit(1);

      if (error) {
        console.warn('Migration check error:', error);
        
        // Parse error message to find missing columns
        const missing: string[] = [];
        if (error.message.includes('employee_ids')) missing.push('employee_ids');
        if (error.message.includes('primary_user_id')) missing.push('primary_user_id');
        if (error.message.includes('backup_user_id')) missing.push('backup_user_id');
        if (error.message.includes('backup_backup_user_id')) missing.push('backup_backup_user_id');
        if (error.message.includes('team_lead_id')) missing.push('team_lead_id');
        
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

  // Load nodes and connections from Supabase
  const loadData = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if tables exist
      const { data: tableCheckData, error: tableCheckError } = await supabase
        .from('org_nodes')
        .select('id')
        .limit(1);

      // Check for specific error codes that indicate table doesn't exist
      if (tableCheckError) {
        console.error('❌ Table check error:', tableCheckError);
        
        // PGRST205 = table not found in schema cache
        // 42P01 = undefined_table error
        if (tableCheckError.code === 'PGRST205' || tableCheckError.code === '42P01') {
          console.log('⚠️ org_nodes table does not exist - migration required');
          setTableExists(false);
          setLoading(false);
          return;
        }
        
        // Other errors - still show warning but don't continue
        console.warn('Unknown table error, assuming table does not exist');
        setTableExists(false);
        setLoading(false);
        return;
      }

      // Table exists - check for required migrations
      console.log('✅ org_nodes table exists, checking migrations...');
      await checkMigrations();
      
      console.log('✅ Loading data...');

      // Load nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('org_nodes')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true });

      if (nodesError) {
        console.error('Error loading nodes:', nodesError);
        toast.error('Fehler beim Laden der Nodes');
        setLoading(false);
        return;
      }

      // Transform database nodes to OrgNodeData
      const transformedNodes: OrgNodeData[] = (nodesData || []).map((node) => ({
        id: node.id,
        type: node.node_type as any,
        title: node.title,
        description: node.description || undefined,
        position: {
          x: Number(node.position_x) || 0,
          y: Number(node.position_y) || 0,
        },
        width: Number(node.width) || 280,
        height: Number(node.height) || 180,
        // Employee assignments
        employeeIds: node.employee_ids || [],
        primaryUserId: node.primary_user_id || undefined,
        backupUserId: node.backup_user_id || undefined,
        backupBackupUserId: node.backup_backup_user_id || undefined,
        teamLeadId: node.team_lead_id || undefined,
      }));

      setNodes(transformedNodes);

      // Load connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('node_connections')
        .select('*')
        .eq('organization_id', profile.organization_id);

      if (connectionsError) {
        console.error('Error loading connections:', connectionsError);
        toast.error('Fehler beim Laden der Verbindungen');
        setLoading(false);
        return;
      }

      // Transform database connections to Connection[]
      const transformedConnections: Connection[] = (connectionsData || []).map((conn) => ({
        id: conn.id,
        sourceNodeId: conn.source_node_id,
        sourcePosition: conn.source_position as any,
        targetNodeId: conn.target_node_id,
        targetPosition: conn.target_position as any,
        style: conn.line_style as any,
        color: conn.color || '#6B7280',
      }));

      setConnections(transformedConnections);
      
      console.log(`✅ Loaded ${transformedNodes.length} nodes and ${transformedConnections.length} connections`);
    } catch (error) {
      console.error('❌ Unexpected error loading organigram data:', error);
      toast.error('Fehler beim Laden der Daten');
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.organization_id]); // Only re-run when org ID changes

  // Update connections when node IDs change (temp ID → DB UUID)
  useEffect(() => {
    if (Object.keys(nodeIdMapping).length === 0) return;
    
    console.log('🔄 Updating connections with new node IDs:', nodeIdMapping);
    
    setConnections(prevConnections => {
      const updatedConnections = prevConnections.map(conn => {
        let updated = { ...conn };
        
        if (nodeIdMapping[conn.sourceNodeId]) {
          updated.sourceNodeId = nodeIdMapping[conn.sourceNodeId];
        }
        
        if (nodeIdMapping[conn.targetNodeId]) {
          updated.targetNodeId = nodeIdMapping[conn.targetNodeId];
        }
        
        return updated;
      });
      
      return updatedConnections;
    });
    
    // Clear mapping after update
    setNodeIdMapping({});
  }, [nodeIdMapping]);

  // Save nodes to Supabase
  const handleNodesChange = async (updatedNodes: OrgNodeData[]) => {
    setNodes(updatedNodes);

    if (!profile?.organization_id) return;
    
    // Don't attempt to save if tables don't exist
    if (!tableExists) {
      console.warn('⚠️ Cannot save nodes - database tables do not exist. Please run migration first.');
      toast.error('Datenbank-Migration erforderlich. Bitte führen Sie zuerst die Migration aus.');
      return;
    }

    try {
      // Get new nodes (not in database yet)
      const existingNodeIds = nodes.map((n) => n.id);
      const newNodes = updatedNodes.filter((n) => !existingNodeIds.includes(n.id));

      // Insert new nodes
      if (newNodes.length > 0) {
        // For each new node, check if it's a department type and create department first
        for (const node of newNodes) {
          let departmentId = null;

          // If node type is "department", create a department in the departments table
          if (node.type === 'department') {
            const { data: departmentData, error: deptError } = await supabase
              .from('departments')
              .insert({
                name: node.title,
                description: node.description || null,
                organization_id: profile.organization_id,
                sort_order: 999, // Default high sort order
              })
              .select()
              .single();

            if (deptError) {
              console.error('Error creating department:', deptError);
              toast.error('Fehler beim Erstellen der Abteilung');
              continue; // Skip this node if department creation failed
            }

            departmentId = departmentData.id;
            console.log('✅ Created department:', departmentData.name, 'with ID:', departmentId);
          }

          // Insert org_node with optional department_id reference
          // Don't set ID manually - let Postgres generate UUID
          const { data: insertedNode, error: insertError } = await supabase
            .from('org_nodes')
            .insert({
              organization_id: profile.organization_id,
              node_type: node.type,
              title: node.title,
              description: node.description || null,
              position_x: node.position.x,
              position_y: node.position.y,
              width: node.width || 280,
              height: node.height || 180,
              department_id: departmentId, // Link to department if created
              created_by: profile.id,
              employee_ids: node.employeeIds || [],
              primary_user_id: node.primaryUserId || null,
              backup_user_id: node.backupUserId || null,
              backup_backup_user_id: node.backupBackupUserId || null,
              team_lead_id: node.teamLeadId || null,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting node:', insertError);
            toast.error('Fehler beim Erstellen des Nodes');
            
            // Rollback: Delete department if node creation failed
            if (departmentId) {
              await supabase.from('departments').delete().eq('id', departmentId);
            }
            continue;
          }

          // Update the node in the local state with the real DB-generated UUID
          if (insertedNode) {
            const oldNodeId = node.id;
            const newNodeId = insertedNode.id;
            
            const nodeIndex = updatedNodes.findIndex(n => n.id === oldNodeId);
            if (nodeIndex !== -1) {
              updatedNodes[nodeIndex] = {
                ...updatedNodes[nodeIndex],
                id: newNodeId,
              };
              
              // Store mapping for connection updates
              setNodeIdMapping(prev => ({ ...prev, [oldNodeId]: newNodeId }));
              console.log(`📝 Mapped node ID: ${oldNodeId} → ${newNodeId}`);
            }
          }
        }

        // Update the state with the real UUIDs after all inserts are complete
        setNodes(updatedNodes);
        toast.success('Node erstellt');
      }

      // Update existing nodes
      const existingNodes = updatedNodes.filter((n) => existingNodeIds.includes(n.id));
      for (const node of existingNodes) {
        // First, get the current node data to check if it has a linked department
        const { data: currentNodeData } = await supabase
          .from('org_nodes')
          .select('department_id, node_type, title')
          .eq('id', node.id)
          .single();

        // If node type is "department" and has a linked department, update the department too
        if (node.type === 'department' && currentNodeData?.department_id) {
          const { error: deptUpdateError } = await supabase
            .from('departments')
            .update({
              name: node.title,
              description: node.description || null,
            })
            .eq('id', currentNodeData.department_id);

          if (deptUpdateError) {
            console.error('Error updating department:', deptUpdateError);
          }
        }

        // If node was converted TO department type and doesn't have a department yet
        if (node.type === 'department' && !currentNodeData?.department_id) {
          // Create new department
          const { data: newDeptData, error: newDeptError } = await supabase
            .from('departments')
            .insert({
              name: node.title,
              description: node.description || null,
              organization_id: profile.organization_id,
              sort_order: 999,
            })
            .select()
            .single();

          if (!newDeptError && newDeptData) {
            // Update node with department_id
            await supabase
              .from('org_nodes')
              .update({ department_id: newDeptData.id })
              .eq('id', node.id);
            
            console.log('✅ Created department for converted node:', newDeptData.name);
          }
        }

        // If node was converted FROM department to another type, we keep the department_id
        // (Department stays in Firmeneinstellungen but is no longer actively linked)

        // Update the org_node
        const { error: updateError } = await supabase
          .from('org_nodes')
          .update({
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
          })
          .eq('id', node.id);

        if (updateError) {
          console.error('Error updating node:', updateError);
          // Don't show error for every position update (too noisy)
        }
      }

      // Delete removed nodes
      const removedNodeIds = existingNodeIds.filter(
        (id) => !updatedNodes.find((n) => n.id === id)
      );

      if (removedNodeIds.length > 0) {
        // Before deleting, check if any nodes have linked departments
        // NOTE: We do NOT delete the departments from the departments table
        // because they may still be needed in Firmeneinstellungen
        // We only remove the org_node reference
        
        const { error: deleteError } = await supabase
          .from('org_nodes')
          .delete()
          .in('id', removedNodeIds);

        if (deleteError) {
          console.error('Error deleting nodes:', deleteError);
          toast.error('Fehler beim Löschen der Nodes');
          return;
        }

        toast.success('Node gelöscht');
        
        // Note: If you want to also delete the linked departments from the departments table,
        // you would need to query the nodes first, get their department_ids, and then delete those.
        // But this is risky because the department might be used elsewhere in the system.
      }
    } catch (error) {
      console.error('Error saving nodes:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  // Save connections to Supabase
  const handleConnectionsChange = async (updatedConnections: Connection[]) => {
    setConnections(updatedConnections);

    if (!profile?.organization_id) return;
    
    // Don't attempt to save if tables don't exist
    if (!tableExists) {
      console.warn('⚠️ Cannot save connections - database tables do not exist. Please run migration first.');
      toast.error('Datenbank-Migration erforderlich. Bitte führen Sie zuerst die Migration aus.');
      return;
    }

    try {
      // Get new connections
      const existingConnectionIds = connections.map((c) => c.id);
      const newConnections = updatedConnections.filter((c) => !existingConnectionIds.includes(c.id));

      // Insert new connections
      if (newConnections.length > 0) {
        // IMPORTANT: Filter out connections that reference temporary node IDs
        // Temporary IDs start with "node-" while DB-generated UUIDs don't
        const validConnections = newConnections.filter((conn) => {
          const sourceIsValid = !conn.sourceNodeId.startsWith('node-');
          const targetIsValid = !conn.targetNodeId.startsWith('node-');
          
          if (!sourceIsValid || !targetIsValid) {
            console.warn(`⚠️ Skipping connection with temporary node ID: ${conn.id}`, {
              source: conn.sourceNodeId,
              target: conn.targetNodeId,
            });
          }
          
          return sourceIsValid && targetIsValid;
        });
        
        if (validConnections.length === 0) {
          console.log('ℹ️ No valid connections to insert (all have temporary node IDs)');
          return;
        }

        const insertData = validConnections.map((conn) => ({
          id: conn.id,
          organization_id: profile.organization_id,
          source_node_id: conn.sourceNodeId,
          source_position: conn.sourcePosition,
          target_node_id: conn.targetNodeId,
          target_position: conn.targetPosition,
          line_style: conn.style,
          color: conn.color || '#6B7280',
          created_by: profile.id,
        }));

        const { error: insertError } = await supabase
          .from('node_connections')
          .insert(insertData);

        if (insertError) {
          console.error('Error inserting connections:', insertError);
          toast.error('Fehler beim Erstellen der Verbindung');
          return;
        }

        console.log(`✅ Inserted ${validConnections.length} connections`);
        toast.success('Verbindung erstellt');
      }

      // Update existing connections (style changes)
      const existingConnections = updatedConnections.filter((c) => existingConnectionIds.includes(c.id));
      for (const conn of existingConnections) {
        const { error: updateError } = await supabase
          .from('node_connections')
          .update({
            line_style: conn.style,
            color: conn.color || '#6B7280',
          })
          .eq('id', conn.id);

        if (updateError) {
          console.error('Error updating connection:', updateError);
        }
      }

      // Delete removed connections
      const removedConnectionIds = existingConnectionIds.filter(
        (id) => !updatedConnections.find((c) => c.id === id)
      );

      if (removedConnectionIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('node_connections')
          .delete()
          .in('id', removedConnectionIds);

        if (deleteError) {
          console.error('Error deleting connections:', deleteError);
          toast.error('Fehler beim Löschen der Verbindung');
          return;
        }

        toast.success('Verbindung gelöscht');
      }
    } catch (error) {
      console.error('Error saving connections:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Canvas Organigram</h1>
            <p className="text-sm text-gray-500 mt-1">
              Canva-Style Drag & Drop Organigram-Editor
            </p>
          </div>
        </div>
      </div>

      {/* Missing Columns Warning (Migrations 032 & 033) */}
      {missingColumns.length > 0 && (
        <div className="px-6 py-4">
          <Alert className="bg-amber-50 border-amber-300">
            <AlertDescription className="text-amber-900">
              <div className="flex items-start gap-4">
                <div className="text-amber-600 text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">🔧 Zusätzliche Migrationen erforderlich</h3>
                  <p className="text-sm mb-3">
                    Die folgenden Spalten fehlen in der <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">org_nodes</code> Tabelle:
                  </p>
                  
                  <ul className="list-disc ml-4 mb-3 text-sm space-y-1">
                    {missingColumns.map((col) => (
                      <li key={col}>
                        <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">{col}</code>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-white border border-amber-200 rounded-lg p-4 mb-3">
                    <p className="font-medium text-sm text-amber-800 mb-2">📋 Schnellausführung:</p>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto mb-2">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
{`-- Führe diese SQL-Befehle im Supabase SQL Editor aus:

-- Migration 032: Employee Assignments
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS employee_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Migration 033: Team Lead
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Indizes erstellen
CREATE INDEX IF NOT EXISTS idx_org_nodes_primary_user ON org_nodes(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_user ON org_nodes(backup_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_backup_user ON org_nodes(backup_backup_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_team_lead ON org_nodes(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_employee_ids ON org_nodes USING GIN(employee_ids);`}
                      </pre>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const sql = `-- Migration 032: Employee Assignments
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS employee_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Migration 033: Team Lead
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Indizes erstellen
CREATE INDEX IF NOT EXISTS idx_org_nodes_primary_user ON org_nodes(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_user ON org_nodes(backup_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_backup_user ON org_nodes(backup_backup_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_team_lead ON org_nodes(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_employee_ids ON org_nodes USING GIN(employee_ids);`;
                        navigator.clipboard.writeText(sql);
                        toast.success('SQL-Code kopiert! Führe ihn im Supabase SQL Editor aus.');
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      SQL-Code kopieren
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Dokumentation:</strong> Siehe <code className="bg-blue-100 px-1 py-0.5 rounded">/MIGRATION_INSTRUCTIONS.md</code> für detaillierte Anweisungen.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Migration Warning */}
      {!tableExists && (
        <div className="px-6 py-4">
          <Alert className="bg-red-50 border-red-300">
            <AlertDescription className="text-red-900">
              <div className="flex items-start gap-4">
                <div className="text-red-600 text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">🚨 Datenbank-Migration erforderlich</h3>
                  <p className="text-sm mb-3">
                    Die Canvas-Organigram Tabellen <code className="bg-red-100 px-1.5 py-0.5 rounded text-red-800">org_nodes</code> und 
                    <code className="bg-red-100 px-1.5 py-0.5 rounded text-red-800 ml-1">node_connections</code> existieren noch nicht in der Datenbank.
                  </p>
                  
                  <div className="bg-white border border-red-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-red-800">📋 Schnellanleitung:</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText('/supabase/migrations/031_canva_style_organigram.sql');
                          setMigrationPathCopied(true);
                          toast.success('Dateipfad kopiert!');
                          setTimeout(() => setMigrationPathCopied(false), 2000);
                        }}
                        className="text-xs h-7"
                      >
                        {migrationPathCopied ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Kopiert!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Pfad kopieren
                          </>
                        )}
                      </Button>
                    </div>
                    <ol className="text-sm space-y-2 ml-4 list-decimal">
                      <li>Öffnen Sie Ihr <strong>Supabase Dashboard</strong></li>
                      <li>Gehen Sie zu <strong>SQL Editor</strong> (linkes Menü)</li>
                      <li>Klicken Sie auf <strong>"New Query"</strong></li>
                      <li>
                        Öffnen Sie die Datei:{' '}
                        <code className="bg-red-100 px-1.5 py-0.5 rounded text-red-800 text-xs">
                          /supabase/migrations/031_canva_style_organigram.sql
                        </code>
                      </li>
                      <li>Kopieren Sie den <strong>kompletten SQL-Code</strong> (ca. 200 Zeilen)</li>
                      <li>Fügen Sie ihn in den SQL Editor ein</li>
                      <li>Klicken Sie auf <strong>"Run"</strong> (oder drücken Sie Cmd/Ctrl + Enter)</li>
                      <li>Warten Sie auf die Bestätigung: <span className="text-green-600 font-medium">"Success. No rows returned"</span></li>
                      <li>Laden Sie diese Seite neu (F5 oder Cmd/Ctrl + R)</li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Hinweis:</strong> Diese Migration erstellt die Tabellen für das Canva-Style Organigram System mit 
                      automatischer Department-Integration und Pin-Point Connections.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Info Cards */}
      {tableExists && (
        <div className="px-6 py-4 space-y-3">
          {/* Main Features Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-2">Canvas Organigram Features:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ul className="space-y-1 text-blue-800">
                      <li>📦 <strong>4 Node-Typen</strong> → Standort, Geschäftsführer, Abteilung, Spezialisierung</li>
                      <li>🖱️ <strong>Free Drag & Drop</strong> → Nodes frei positionieren (wie Canva)</li>
                      <li>📍 <strong>Pin Points</strong> → 4 Verbindungspunkte pro Node (top, right, bottom, left)</li>
                      <li>🔗 <strong>Manuelle Verbindungen</strong> → Pin zu Pin ziehen</li>
                    </ul>
                    <ul className="space-y-1 text-blue-800">
                      <li>〰️ <strong>Linien-Stile</strong> → Curved (Bezier) oder Orthogonal</li>
                      <li>➕➖ <strong>Zoom & Pan</strong> → Canvas vergrößern/verschieben</li>
                      <li>✏️ <strong>Edit Button</strong> → Node-Dialog öffnen</li>
                      <li>💾 <strong>Auto-Save</strong> → Änderungen automatisch gespeichert</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Integration Info */}
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-900">
              <div className="flex items-start gap-3">
                <div className="text-green-600 text-2xl">🏢</div>
                <div className="text-sm">
                  <p className="font-medium mb-1">Automatische Abteilungs-Integration</p>
                  <p>
                    Wenn Sie eine Node vom Typ <strong>"Abteilung"</strong> erstellen, wird automatisch eine entsprechende 
                    Abteilung in den <strong>Firmeneinstellungen</strong> angelegt. Änderungen am Titel werden synchronisiert.
                  </p>
                  <p className="mt-2 text-xs text-green-700">
                    💡 <strong>Hinweis:</strong> Beim Löschen einer Abteilungs-Node bleibt die Abteilung in den Firmeneinstellungen erhalten.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Canvas */}
      {tableExists && (
        <div className="flex-1 relative overflow-hidden">
          <CanvasOrgChart
            nodes={nodes}
            connections={connections}
            onNodesChange={handleNodesChange}
            onConnectionsChange={handleConnectionsChange}
            className="absolute inset-0"
          />
        </div>
      )}
    </div>
  );
}
