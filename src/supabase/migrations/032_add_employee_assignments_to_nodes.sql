-- =====================================================
-- Migration: Add Employee Assignments to Org Nodes
-- =====================================================
-- Adds fields for assigning employees to organigram nodes
-- with primary, backup, and backup-backup roles
-- =====================================================

-- Add employee assignment columns to org_nodes table
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS employee_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_org_nodes_primary_user 
ON org_nodes(primary_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_user 
ON org_nodes(backup_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_backup_user 
ON org_nodes(backup_backup_user_id);

-- Index for array column (GIN index)
CREATE INDEX IF NOT EXISTS idx_org_nodes_employee_ids 
ON org_nodes USING GIN(employee_ids);

-- Add comments
COMMENT ON COLUMN org_nodes.employee_ids IS 'Array of user IDs assigned to this node';
COMMENT ON COLUMN org_nodes.primary_user_id IS 'Primary responsible person (Hauptverantwortlicher)';
COMMENT ON COLUMN org_nodes.backup_user_id IS 'Standard backup/Vertretung';
COMMENT ON COLUMN org_nodes.backup_backup_user_id IS 'Backup of backup/Vertretung der Vertretung';

-- =====================================================
-- Migration Complete
-- =====================================================
