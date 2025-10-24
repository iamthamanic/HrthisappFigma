-- =====================================================
-- Migration 044: Add Teamlead Priority Tags
-- =====================================================
-- This migration adds priority tags to team leads for
-- approval hierarchy: PRIMARY, BACKUP, BACKUP_BACKUP
-- =====================================================

-- Add priority_tag column to team_members table
-- Only applies to users with role='TEAMLEAD'
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS priority_tag TEXT DEFAULT NULL 
CHECK (priority_tag IN ('PRIMARY', 'BACKUP', 'BACKUP_BACKUP') OR priority_tag IS NULL);

-- Add comment
COMMENT ON COLUMN team_members.priority_tag IS 'Priority tag for team leads (PRIMARY=main approver, BACKUP=HR coverage, BACKUP_BACKUP=superadmin coverage). Only applies when role=TEAMLEAD.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_priority_tag ON team_members(team_id, priority_tag) WHERE priority_tag IS NOT NULL;

-- Migration complete
-- 
-- DEFAULT LOGIC (applied in frontend):
-- - ADMIN users with role=TEAMLEAD → priority_tag='PRIMARY'
-- - HR users with role=TEAMLEAD → priority_tag='BACKUP'
-- - SUPERADMIN users with role=TEAMLEAD → priority_tag='BACKUP_BACKUP'
-- - Tags can be manually changed by admins in the UI
-- =====================================================