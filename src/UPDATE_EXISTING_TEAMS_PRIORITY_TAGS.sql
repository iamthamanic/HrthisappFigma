-- =====================================================
-- Update Existing Teams with Priority Tags
-- =====================================================
-- This SQL updates all existing team_members with
-- default priority tags based on their global role
-- =====================================================

-- Step 1: Set PRIMARY for all ADMIN teamleads
UPDATE team_members tm
SET priority_tag = 'PRIMARY'
FROM users u
WHERE tm.user_id = u.id
  AND tm.role = 'TEAMLEAD'
  AND u.role = 'ADMIN'
  AND tm.priority_tag IS NULL; -- Only update if not already set

-- Step 2: Set BACKUP for all HR teamleads
UPDATE team_members tm
SET priority_tag = 'BACKUP'
FROM users u
WHERE tm.user_id = u.id
  AND tm.role = 'TEAMLEAD'
  AND u.role = 'HR'
  AND tm.priority_tag IS NULL; -- Only update if not already set

-- Step 3: Set BACKUP_BACKUP for all SUPERADMIN teamleads
UPDATE team_members tm
SET priority_tag = 'BACKUP_BACKUP'
FROM users u
WHERE tm.user_id = u.id
  AND tm.role = 'TEAMLEAD'
  AND u.role = 'SUPERADMIN'
  AND tm.priority_tag IS NULL; -- Only update if not already set

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the tags were set correctly:

SELECT 
  t.name as team,
  u.first_name || ' ' || u.last_name as teamlead,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN tm.priority_tag = 'PRIMARY' THEN '✅ Primary (Haupt-Teamlead)'
    WHEN tm.priority_tag = 'BACKUP' THEN '✅ Backup (Stellvertretung)'
    WHEN tm.priority_tag = 'BACKUP_BACKUP' THEN '✅ Backup Backup (Eskalation)'
    ELSE '⚠️ Kein Tag gesetzt'
  END as tag_description
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE tm.role = 'TEAMLEAD'
ORDER BY t.name, 
  CASE tm.priority_tag
    WHEN 'PRIMARY' THEN 1
    WHEN 'BACKUP' THEN 2
    WHEN 'BACKUP_BACKUP' THEN 3
    ELSE 4
  END;

-- =====================================================
-- Expected Result:
-- =====================================================
-- All ADMIN teamleads should have priority_tag = 'PRIMARY'
-- All HR teamleads should have priority_tag = 'BACKUP'
-- All SUPERADMIN teamleads should have priority_tag = 'BACKUP_BACKUP'
-- =====================================================
