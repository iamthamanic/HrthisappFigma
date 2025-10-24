import { useState, useEffect } from 'react';
import { Network, ChevronDown, ChevronUp } from '../components/icons/HRTHISIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import CanvasOrgChart, { type Connection } from '../components/canvas/HRTHIS_CanvasOrgChart';
import type { OrgNodeData } from '../components/OrgNode';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { supabase } from '../utils/supabase/client';

/**
 * ORGANIGRAM VIEW SCREEN (USER)
 * ==============================
 * Read-only view of published organigram
 * Collapsed by default, expandable
 */

export default function OrganigramViewScreen() {
  const { profile } = useAuthStore();
  const [nodes, setNodes] = useState<OrgNodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Load PUBLISHED organigram data
  const loadPublishedData = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load ONLY published nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('org_nodes')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_published', true) // Only published nodes
        .order('created_at', { ascending: true });

      if (nodesError) {
        console.error('Error loading nodes:', nodesError);
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
        employeeIds: node.employee_ids || [],
        primaryUserId: node.primary_user_id || undefined,
        backupUserId: node.backup_user_id || undefined,
        backupBackupUserId: node.backup_backup_user_id || undefined,
        teamLeadId: node.team_lead_id || undefined,
      }));

      console.log('📊 User View - Loaded', transformedNodes.length, 'published nodes');
      console.log('Node IDs:', transformedNodes.map(n => ({ id: n.id, title: n.title, description: n.description })));
      console.log('🔍 DEBUG: Descriptions:', transformedNodes.map(n => ({ 
        title: n.title, 
        description: n.description,
        hasDescription: !!n.description,
        descriptionLength: n.description?.length || 0
      })));
      setNodes(transformedNodes);
      setHasData(transformedNodes.length > 0);

      // Load ONLY published connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('node_connections')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_published', true); // Only published connections

      if (connectionsError) {
        console.error('Error loading connections:', connectionsError);
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

      console.log('🔗 User View - Loaded', transformedConnections.length, 'published connections');
      console.log('Connection details:', connectionsData?.map(c => ({
        id: c.id,
        from: c.source_node_id,
        to: c.target_node_id
      })));

      setConnections(transformedConnections);
    } catch (error) {
      console.error('Error loading organigram:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedData();
  }, [profile?.organization_id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Organigram...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Organigram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p>Noch kein Organigram veröffentlicht.</p>
                  {profile?.role === 'HR' || profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN' || profile?.role === 'TEAMLEAD' ? (
                    <p className="text-sm text-blue-600">
                      💡 <strong>Admin-Hinweis:</strong> Gehe zu "Admin → Organigram Canvas", klicke auf "Edit Organigram", erstelle Abteilungen und klicke auf "Push Live" um sie zu veröffentlichen.
                    </p>
                  ) : (
                    <p className="text-sm">Dein Admin wird bald eines erstellen.</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Collapsible Header */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Organigram
            </CardTitle>
            <Button variant="ghost" size="sm">
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Einklappen
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Anzeigen
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="p-0">
            {/* Read-only Canvas - No editing allowed */}
            <div className="relative h-[600px] border-t">
              <CanvasOrgChart
                nodes={nodes}
                connections={connections}
                onNodesChange={() => {}} // Read-only - no changes allowed
                onConnectionsChange={() => {}} // Read-only - no changes allowed
                readOnly={true} // NEW PROP
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
