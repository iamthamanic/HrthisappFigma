-- =====================================================
-- Migration 038: Add Team Member Roles
-- =====================================================
-- This migration adds role management to team members
-- allowing differentiation between team leads and members
-- =====================================================

-- Add role column to team_members table
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER' CHECK (role IN ('TEAMLEAD', 'MEMBER'));

-- Add comment
COMMENT ON COLUMN team_members.role IS 'Role of the user in this specific team (TEAMLEAD or MEMBER)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_team_role ON team_members(team_id, role);

-- Migrate existing data: If is_lead = true, set role to TEAMLEAD, otherwise MEMBER
UPDATE team_members
SET role = CASE 
    WHEN is_lead = true THEN 'TEAMLEAD'
    ELSE 'MEMBER'
END
WHERE role IS NULL;

-- Migration complete
