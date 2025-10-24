-- =====================================================
-- Migration: Add Draft/Live System for Organigram
-- =====================================================
-- Adds is_published flag and version tracking
-- =====================================================

ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE node_connections
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_org_nodes_published 
ON org_nodes(organization_id, is_published);

CREATE INDEX IF NOT EXISTS idx_node_connections_published 
ON node_connections(organization_id, is_published);

COMMENT ON COLUMN org_nodes.is_published IS 'Whether this node is published and visible to all users';
COMMENT ON COLUMN org_nodes.version IS 'Version number for tracking changes';
COMMENT ON COLUMN node_connections.is_published IS 'Whether this connection is published and visible to all users';
COMMENT ON COLUMN node_connections.version IS 'Version number for tracking changes';
