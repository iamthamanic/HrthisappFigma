ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS employee_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE node_connections
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_org_nodes_primary_user ON org_nodes(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_user ON org_nodes(backup_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_backup_user ON org_nodes(backup_backup_user_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_employee_ids ON org_nodes USING GIN(employee_ids);
CREATE INDEX IF NOT EXISTS idx_org_nodes_team_lead ON org_nodes(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_published ON org_nodes(organization_id, is_published);
CREATE INDEX IF NOT EXISTS idx_node_connections_published ON node_connections(organization_id, is_published);
