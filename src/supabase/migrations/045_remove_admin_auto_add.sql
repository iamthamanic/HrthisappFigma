-- =====================================================
-- Migration 045: Remove ADMIN from Auto-Add Logic
-- =====================================================
-- This migration REVERSES Migration 043 and restores
-- the original logic from Migration 040:
-- 
-- ✅ HR & SUPERADMIN: Auto-added as TEAMLEAD (BACKUP)
-- ❌ ADMIN: MUST be manually assigned as TEAMLEAD (PRIMARY)
-- 
-- REASONING:
-- - Each team has ONE primary teamlead (ADMIN)
-- - ADMINs can lead multiple teams or none
-- - HR and SUPERADMIN are automatic backups for all teams
-- - This gives flexibility in team structure
-- =====================================================

-- =====================================================
-- STEP 1: Remove ADMIN from Trigger Functions
-- =====================================================

-- Restore the original auto-add function (only HR & SUPERADMIN)
CREATE OR REPLACE FUNCTION auto_add_hr_superadmin_to_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Add all HR and SUPERADMIN users as TEAMLEAD to the new team
  -- NOTE: ADMIN users are NOT automatically added - they must be manually assigned
  INSERT INTO team_members (team_id, user_id, role)
  SELECT 
    NEW.id as team_id,
    u.id as user_id,
    'TEAMLEAD' as role
  FROM users u
  WHERE u.role IN ('HR', 'SUPERADMIN');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restore the original promotion trigger (only HR & SUPERADMIN)
CREATE OR REPLACE FUNCTION auto_add_user_to_all_teams_on_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- If user was promoted to HR or SUPERADMIN, add them to all teams as TEAMLEAD
  -- NOTE: ADMIN users are NOT automatically added - they must be manually assigned
  IF (NEW.role IN ('HR', 'SUPERADMIN') AND (OLD.role IS NULL OR OLD.role NOT IN ('HR', 'SUPERADMIN'))) THEN
    -- Add to all teams as TEAMLEAD
    INSERT INTO team_members (team_id, user_id, role)
    SELECT 
      t.id as team_id,
      NEW.id as user_id,
      'TEAMLEAD' as role
    FROM teams t
    WHERE NOT EXISTS (
      -- Don't add if already a member
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = t.id 
      AND tm.user_id = NEW.id
    );
    
    -- Update existing memberships to TEAMLEAD
    UPDATE team_members
    SET role = 'TEAMLEAD'
    WHERE user_id = NEW.id
    AND role != 'TEAMLEAD';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 2: Remove Automatically Added ADMINs
-- =====================================================

-- Remove ADMINs from teams WHERE:
-- 1. They are TEAMLEAD
-- 2. They have NO priority_tag (meaning they were auto-added)
-- 3. They are the ONLY member in that team (edge case protection)
-- 
-- We DO NOT remove ADMINs who:
-- - Have priority_tag = 'PRIMARY' (manually assigned)
-- - Are the only TEAMLEAD in a team (to prevent teams without leaders)

DELETE FROM team_members tm
USING users u
WHERE tm.user_id = u.id
AND u.role = 'ADMIN'
AND tm.role = 'TEAMLEAD'
AND tm.priority_tag IS NULL -- Only remove auto-added (no tag)
AND EXISTS (
  -- Only delete if there are other TEAMLEADs in this team (HR/SUPERADMIN)
  SELECT 1 FROM team_members tm2
  WHERE tm2.team_id = tm.team_id
  AND tm2.role = 'TEAMLEAD'
  AND tm2.user_id != tm.user_id
);

-- =====================================================
-- STEP 3: Update Priority Tags for Remaining Users
-- =====================================================

-- Set priority tags for HR and SUPERADMIN (if not already set)
-- HR = BACKUP, SUPERADMIN = BACKUP_BACKUP

UPDATE team_members tm
SET priority_tag = 'BACKUP'
FROM users u
WHERE tm.user_id = u.id
AND u.role = 'HR'
AND tm.role = 'TEAMLEAD'
AND tm.priority_tag IS NULL;

UPDATE team_members tm
SET priority_tag = 'BACKUP_BACKUP'
FROM users u
WHERE tm.user_id = u.id
AND u.role = 'SUPERADMIN'
AND tm.role = 'TEAMLEAD'
AND tm.priority_tag IS NULL;

-- =====================================================
-- STEP 4: Verification Query
-- =====================================================

-- Show current state of all team members with admin-level roles
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 045 COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Current Team Assignments:';
END $$;

SELECT 
  t.name as team_name,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  u.role as global_role,
  tm.role as team_role,
  COALESCE(tm.priority_tag, 'NONE') as priority_tag
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE u.role IN ('ADMIN', 'HR', 'SUPERADMIN')
ORDER BY t.name, 
  CASE tm.priority_tag 
    WHEN 'PRIMARY' THEN 1 
    WHEN 'BACKUP' THEN 2 
    WHEN 'BACKUP_BACKUP' THEN 3 
    ELSE 4 
  END,
  u.role;

-- =====================================================
-- DONE! Summary:
-- =====================================================
-- ✅ Triggers updated: Only HR & SUPERADMIN auto-added
-- ✅ Automatically added ADMINs removed from teams
-- ✅ Priority tags set: HR=BACKUP, SUPERADMIN=BACKUP_BACKUP
-- ✅ Manual ADMIN assignments preserved
-- 
-- NEXT STEPS:
-- 1. Manually assign ADMINs as PRIMARY teamleads to specific teams
-- 2. Verify that Anna Admin is TEAMLEAD in "Büro 2"
-- 3. Test approval flow: Anna should now be able to approve Tina's requests
-- =====================================================
