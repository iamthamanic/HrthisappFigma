/**
 * ORGANIGRAM SERVICE
 * ==================
 * Handles all organigram operations
 * 
 * Replaces direct Supabase calls in stores for:
 * - Organigram CRUD (draft/live system)
 * - Node management
 * - Connection management
 * - Publishing and history
 * - Employee assignments
 */

import { ApiService } from './base/ApiService';
import { NotFoundError, ValidationError, ApiError } from './base/ApiError';
import type { OrganigramNode, OrganigramConnection } from '../types/database';

export interface CreateNodeData {
  organigram_id: string;
  type: 'person' | 'department' | 'team';
  label: string;
  position_x: number;
  position_y: number;
  employee_id?: string;
  department_id?: string;
  team_lead_id?: string;
  metadata?: any;
}

export interface UpdateNodeData {
  label?: string;
  position_x?: number;
  position_y?: number;
  employee_id?: string;
  department_id?: string;
  team_lead_id?: string;
  metadata?: any;
}

export interface CreateConnectionData {
  organigram_id: string;
  source_node_id: string;
  target_node_id: string;
  type?: 'hierarchical' | 'collaborative' | 'informational';
}

export interface OrganigramData {
  id: string;
  organization_id: string;
  version: number;
  is_published: boolean;
  nodes: OrganigramNode[];
  connections: OrganigramConnection[];
  created_at: string;
  updated_at: string;
}

/**
 * ORGANIGRAM SERVICE
 * ==================
 * Manages organigram structure, nodes, and connections
 */
export class OrganigramService extends ApiService {
  // ========================================
  // ORGANIGRAM MANAGEMENT
  // ========================================

  /**
   * Get current organigram (draft or published)
   */
  async getOrganigram(organizationId: string, draft: boolean = false): Promise<OrganigramData> {
    this.logRequest('getOrganigram', 'OrganigramService', { organizationId, draft });

    if (!organizationId) {
      throw new ValidationError(
        'Organization ID ist erforderlich',
        'OrganigramService.getOrganigram',
        { organizationId: 'Organization ID ist erforderlich' }
      );
    }

    try {
      // Get organigram
      const { data: organigram, error: orgError } = await this.supabase
        .from('organigrams')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_published', !draft)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (orgError && orgError.code !== 'PGRST116') {
        this.handleError(orgError, 'OrganigramService.getOrganigram');
      }

      if (!organigram) {
        // Create empty organigram if none exists
        const { data: newOrg, error: createError } = await this.supabase
          .from('organigrams')
          .insert({
            organization_id: organizationId,
            version: 1,
            is_published: !draft,
          })
          .select()
          .single();

        if (createError) {
          this.handleError(createError, 'OrganigramService.getOrganigram');
        }

        return {
          id: newOrg.id,
          organization_id: organizationId,
          version: 1,
          is_published: !draft,
          nodes: [],
          connections: [],
          created_at: newOrg.created_at,
          updated_at: newOrg.updated_at,
        };
      }

      // Get nodes
      const { data: nodes, error: nodesError } = await this.supabase
        .from('organigram_nodes')
        .select('*')
        .eq('organigram_id', organigram.id);

      if (nodesError) {
        this.handleError(nodesError, 'OrganigramService.getOrganigram');
      }

      // Get connections
      const { data: connections, error: connectionsError } = await this.supabase
        .from('organigram_connections')
        .select('*')
        .eq('organigram_id', organigram.id);

      if (connectionsError) {
        this.handleError(connectionsError, 'OrganigramService.getOrganigram');
      }

      const data: OrganigramData = {
        id: organigram.id,
        organization_id: organigram.organization_id,
        version: organigram.version,
        is_published: organigram.is_published,
        nodes: (nodes || []) as OrganigramNode[],
        connections: (connections || []) as OrganigramConnection[],
        created_at: organigram.created_at,
        updated_at: organigram.updated_at,
      };

      this.logResponse('OrganigramService.getOrganigram', {
        nodeCount: nodes?.length || 0,
        connectionCount: connections?.length || 0,
      });
      return data;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.getOrganigram');
    }
  }

  /**
   * Get draft organigram
   */
  async getDraftOrganigram(organizationId: string): Promise<OrganigramData> {
    return await this.getOrganigram(organizationId, true);
  }

  /**
   * Get published organigram
   */
  async getPublishedOrganigram(organizationId: string): Promise<OrganigramData> {
    return await this.getOrganigram(organizationId, false);
  }

  /**
   * Update organigram data (batch update nodes and connections)
   */
  async updateOrganigram(
    organigramId: string,
    nodes: OrganigramNode[],
    connections: OrganigramConnection[]
  ): Promise<OrganigramData> {
    this.logRequest('updateOrganigram', 'OrganigramService', { organigramId });

    if (!organigramId) {
      throw new ValidationError(
        'Organigram ID ist erforderlich',
        'OrganigramService.updateOrganigram',
        { organigramId: 'Organigram ID ist erforderlich' }
      );
    }

    try {
      // Update organigram timestamp
      const { error: updateError } = await this.supabase
        .from('organigrams')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', organigramId);

      if (updateError) {
        this.handleError(updateError, 'OrganigramService.updateOrganigram');
      }

      // Note: Individual nodes and connections are updated via their own methods
      // This is mainly for triggering the updated_at timestamp

      this.logResponse('OrganigramService.updateOrganigram', 'Erfolg');
      return await this.getOrganigram('', false); // Re-fetch updated data
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.updateOrganigram');
    }
  }

  /**
   * Publish organigram (convert draft to live)
   */
  async publishOrganigram(organizationId: string): Promise<OrganigramData> {
    this.logRequest('publishOrganigram', 'OrganigramService', { organizationId });

    if (!organizationId) {
      throw new ValidationError(
        'Organization ID ist erforderlich',
        'OrganigramService.publishOrganigram',
        { organizationId: 'Organization ID ist erforderlich' }
      );
    }

    try {
      // Get draft
      const draft = await this.getDraftOrganigram(organizationId);

      // Mark current published as archived (if exists)
      await this.supabase
        .from('organigrams')
        .update({ is_published: false })
        .eq('organization_id', organizationId)
        .eq('is_published', true);

      // Mark draft as published
      const { error: publishError } = await this.supabase
        .from('organigrams')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq('id', draft.id);

      if (publishError) {
        this.handleError(publishError, 'OrganigramService.publishOrganigram');
      }

      // Create new draft copy
      const { data: newDraft, error: draftError } = await this.supabase
        .from('organigrams')
        .insert({
          organization_id: organizationId,
          version: draft.version + 1,
          is_published: false,
        })
        .select()
        .single();

      if (draftError) {
        this.handleError(draftError, 'OrganigramService.publishOrganigram');
      }

      // Copy nodes to new draft
      if (draft.nodes.length > 0) {
        const nodesCopy = draft.nodes.map((node) => ({
          organigram_id: newDraft.id,
          type: node.type,
          label: node.label,
          position_x: node.position_x,
          position_y: node.position_y,
          employee_id: node.employee_id,
          department_id: node.department_id,
          team_lead_id: node.team_lead_id,
          metadata: node.metadata,
        }));

        await this.supabase.from('organigram_nodes').insert(nodesCopy);
      }

      // Copy connections to new draft
      if (draft.connections.length > 0) {
        const connectionsCopy = draft.connections.map((conn) => ({
          organigram_id: newDraft.id,
          source_node_id: conn.source_node_id,
          target_node_id: conn.target_node_id,
          type: conn.type,
        }));

        await this.supabase.from('organigram_connections').insert(connectionsCopy);
      }

      this.logResponse('OrganigramService.publishOrganigram', 'Erfolg');
      return await this.getPublishedOrganigram(organizationId);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.publishOrganigram');
    }
  }

  /**
   * Get organigram history (all versions)
   */
  async getOrganigramHistory(organizationId: string): Promise<OrganigramData[]> {
    this.logRequest('getOrganigramHistory', 'OrganigramService', { organizationId });

    if (!organizationId) {
      throw new ValidationError(
        'Organization ID ist erforderlich',
        'OrganigramService.getOrganigramHistory',
        { organizationId: 'Organization ID ist erforderlich' }
      );
    }

    try {
      const { data: organigrams, error } = await this.supabase
        .from('organigrams')
        .select('*')
        .eq('organization_id', organizationId)
        .order('version', { ascending: false });

      if (error) {
        this.handleError(error, 'OrganigramService.getOrganigramHistory');
      }

      const history: OrganigramData[] = [];

      for (const org of organigrams || []) {
        const { data: nodes } = await this.supabase
          .from('organigram_nodes')
          .select('*')
          .eq('organigram_id', org.id);

        const { data: connections } = await this.supabase
          .from('organigram_connections')
          .select('*')
          .eq('organigram_id', org.id);

        history.push({
          id: org.id,
          organization_id: org.organization_id,
          version: org.version,
          is_published: org.is_published,
          nodes: (nodes || []) as OrganigramNode[],
          connections: (connections || []) as OrganigramConnection[],
          created_at: org.created_at,
          updated_at: org.updated_at,
        });
      }

      this.logResponse('getOrganigramHistory', { count: history.length });
      return history;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.getOrganigramHistory');
    }
  }

  // ========================================
  // NODE MANAGEMENT
  // ========================================

  /**
   * Create organigram node
   */
  async createNode(data: CreateNodeData): Promise<OrganigramNode> {
    this.logRequest('createNode', 'OrganigramService', data);

    // Validate input
    const errors: Record<string, string> = {};

    if (!data.organigram_id) errors.organigram_id = 'Organigram ID ist erforderlich';
    if (!data.type) errors.type = 'Typ ist erforderlich';
    if (!data.label) errors.label = 'Label ist erforderlich';
    if (data.position_x === undefined) errors.position_x = 'Position X ist erforderlich';
    if (data.position_y === undefined) errors.position_y = 'Position Y ist erforderlich';

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'OrganigramService.createNode',
        errors
      );
    }

    try {
      const { data: node, error } = await this.supabase
        .from('organigram_nodes')
        .insert({
          organigram_id: data.organigram_id,
          type: data.type,
          label: data.label,
          position_x: data.position_x,
          position_y: data.position_y,
          employee_id: data.employee_id || null,
          department_id: data.department_id || null,
          team_lead_id: data.team_lead_id || null,
          metadata: data.metadata || null,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'OrganigramService.createNode');
      }

      if (!node) {
        throw new ApiError(
          'Node konnte nicht erstellt werden',
          'CREATION_FAILED',
          'OrganigramService.createNode'
        );
      }

      this.logResponse('OrganigramService.createNode', { id: node.id });
      return node as OrganigramNode;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.createNode');
    }
  }

  /**
   * Update organigram node
   */
  async updateNode(nodeId: string, updates: UpdateNodeData): Promise<OrganigramNode> {
    this.logRequest('updateNode', 'OrganigramService', { nodeId, updates });

    if (!nodeId) {
      throw new ValidationError(
        'Node ID ist erforderlich',
        'OrganigramService.updateNode',
        { nodeId: 'Node ID ist erforderlich' }
      );
    }

    try {
      const { data: node, error } = await this.supabase
        .from('organigram_nodes')
        .update(updates)
        .eq('id', nodeId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'OrganigramService.updateNode');
      }

      if (!node) {
        throw new NotFoundError('Node', 'OrganigramService.updateNode');
      }

      this.logResponse('OrganigramService.updateNode', { id: node.id });
      return node as OrganigramNode;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.updateNode');
    }
  }

  /**
   * Delete organigram node
   */
  async deleteNode(nodeId: string): Promise<void> {
    this.logRequest('deleteNode', 'OrganigramService', { nodeId });

    if (!nodeId) {
      throw new ValidationError(
        'Node ID ist erforderlich',
        'OrganigramService.deleteNode',
        { nodeId: 'Node ID ist erforderlich' }
      );
    }

    try {
      // Delete all connections involving this node
      await this.supabase
        .from('organigram_connections')
        .delete()
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);

      // Delete the node
      const { error } = await this.supabase
        .from('organigram_nodes')
        .delete()
        .eq('id', nodeId);

      if (error) {
        this.handleError(error, 'OrganigramService.deleteNode');
      }

      this.logResponse('OrganigramService.deleteNode', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.deleteNode');
    }
  }

  // ========================================
  // CONNECTION MANAGEMENT
  // ========================================

  /**
   * Create organigram connection
   */
  async createConnection(data: CreateConnectionData): Promise<OrganigramConnection> {
    this.logRequest('createConnection', 'OrganigramService', data);

    // Validate input
    const errors: Record<string, string> = {};

    if (!data.organigram_id) errors.organigram_id = 'Organigram ID ist erforderlich';
    if (!data.source_node_id) errors.source_node_id = 'Source Node ID ist erforderlich';
    if (!data.target_node_id) errors.target_node_id = 'Target Node ID ist erforderlich';

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'OrganigramService.createConnection',
        errors
      );
    }

    try {
      const { data: connection, error } = await this.supabase
        .from('organigram_connections')
        .insert({
          organigram_id: data.organigram_id,
          source_node_id: data.source_node_id,
          target_node_id: data.target_node_id,
          type: data.type || 'hierarchical',
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'OrganigramService.createConnection');
      }

      if (!connection) {
        throw new ApiError(
          'Connection konnte nicht erstellt werden',
          'CREATION_FAILED',
          'OrganigramService.createConnection'
        );
      }

      this.logResponse('OrganigramService.createConnection', { id: connection.id });
      return connection as OrganigramConnection;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.createConnection');
    }
  }

  /**
   * Delete organigram connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    this.logRequest('deleteConnection', 'OrganigramService', { connectionId });

    if (!connectionId) {
      throw new ValidationError(
        'Connection ID ist erforderlich',
        'OrganigramService.deleteConnection',
        { connectionId: 'Connection ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('organigram_connections')
        .delete()
        .eq('id', connectionId);

      if (error) {
        this.handleError(error, 'OrganigramService.deleteConnection');
      }

      this.logResponse('OrganigramService.deleteConnection', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'OrganigramService.deleteConnection');
    }
  }
}
