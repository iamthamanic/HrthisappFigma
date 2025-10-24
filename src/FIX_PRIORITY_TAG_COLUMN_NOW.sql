-- =====================================================
-- QUICK FIX: Add priority_tag column to team_members
-- =====================================================
-- This fixes the error: "Could not find the 'priority_tag' column"
-- =====================================================

-- Step 1: Add the priority_tag column
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS priority_tag TEXT DEFAULT NULL 
CHECK (priority_tag IN ('PRIMARY', 'BACKUP', 'BACKUP_BACKUP') OR priority_tag IS NULL);

-- Step 2: Add comment for documentation
COMMENT ON COLUMN team_members.priority_tag IS 'Priority tag for team leads (PRIMARY=main approver, BACKUP=HR coverage, BACKUP_BACKUP=superadmin coverage). Only applies when role=TEAMLEAD.';

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_priority_tag 
ON team_members(team_id, priority_tag) 
WHERE priority_tag IS NOT NULL;

-- Step 4: Set default tags for existing teamleads (optional but recommended)
UPDATE team_members tm
SET priority_tag = 
  CASE u.role
    WHEN 'ADMIN' THEN 'PRIMARY'
    WHEN 'HR' THEN 'BACKUP'
    WHEN 'SUPERADMIN' THEN 'BACKUP_BACKUP'
  END
FROM users u
WHERE tm.user_id = u.id
  AND tm.role = 'TEAMLEAD'
  AND tm.priority_tag IS NULL;

-- =====================================================
-- Verification Query - Run this to check if it worked
-- =====================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_members' 
  AND column_name = 'priority_tag';

-- Expected result:
-- column_name  | data_type | is_nullable | column_default
-- -------------|-----------|-------------|---------------
-- priority_tag | text      | YES         | NULL

-- =====================================================
-- After running this SQL:
-- 1. Go back to your HRthis app
-- 2. Press Ctrl+Shift+R (hard refresh)
-- 3. Try creating a team again
-- =====================================================
