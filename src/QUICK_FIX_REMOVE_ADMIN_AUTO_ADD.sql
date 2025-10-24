-- =====================================================
-- QUICK FIX: Remove ADMIN Auto-Add Logic
-- =====================================================
-- This script applies Migration 045 immediately
-- Copy & Paste this into Supabase SQL Editor
-- =====================================================

-- STEP 1: Show current state BEFORE fix
SELECT 
  '=== BEFORE FIX ===' as status,
  t.name as team_name,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  u.role as global_role,
  tm.role as team_role,
  COALESCE(tm.priority_tag, 'NO TAG') as priority_tag
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE u.role IN ('ADMIN', 'HR', 'SUPERADMIN')
ORDER BY t.name, u.role;

-- STEP 2: Update Trigger Functions (Remove ADMIN)
CREATE OR REPLACE FUNCTION auto_add_hr_superadmin_to_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  SELECT 
    NEW.id as team_id,
    u.id as user_id,
    'TEAMLEAD' as role
  FROM users u
  WHERE u.role IN ('HR', 'SUPERADMIN'); -- ADMIN removed!
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_add_user_to_all_teams_on_promotion()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IN ('HR', 'SUPERADMIN') AND (OLD.role IS NULL OR OLD.role NOT IN ('HR', 'SUPERADMIN'))) THEN
    INSERT INTO team_members (team_id, user_id, role)
    SELECT 
      t.id as team_id,
      NEW.id as user_id,
      'TEAMLEAD' as role
    FROM teams t
    WHERE NOT EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = t.id 
      AND tm.user_id = NEW.id
    );
    
    UPDATE team_members
    SET role = 'TEAMLEAD'
    WHERE user_id = NEW.id
    AND role != 'TEAMLEAD';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Remove auto-added ADMINs (without priority_tag)
DELETE FROM team_members tm
USING users u
WHERE tm.user_id = u.id
AND u.role = 'ADMIN'
AND tm.role = 'TEAMLEAD'
AND tm.priority_tag IS NULL -- Only auto-added
AND EXISTS (
  -- Only delete if there are other TEAMLEADs
  SELECT 1 FROM team_members tm2
  WHERE tm2.team_id = tm.team_id
  AND tm2.role = 'TEAMLEAD'
  AND tm2.user_id != tm.user_id
);

-- STEP 4: Set priority tags for HR and SUPERADMIN
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

-- STEP 5: Show current state AFTER fix
SELECT 
  '=== AFTER FIX ===' as status,
  t.name as team_name,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  u.role as global_role,
  tm.role as team_role,
  COALESCE(tm.priority_tag, 'NO TAG') as priority_tag
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
  END;

-- STEP 6: Check specific case - Anna & Tina
SELECT 
  '=== ANNA & TINA CHECK ===' as status,
  'Anna Admin' as person,
  u.email,
  u.role as global_role,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.email LIKE '%admin%'
  OR u.email LIKE '%content%'
ORDER BY u.email;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- ✅ HR & SUPERADMIN: TEAMLEAD with BACKUP tags in ALL teams
-- ✅ ADMIN: Removed from teams (unless manually assigned with PRIMARY tag)
-- ✅ Anna Admin: May or may not be in teams (depends on manual assignment)
-- 
-- IF ANNA IS NOT IN "Büro 2":
-- You need to manually add her:
--
-- INSERT INTO team_members (team_id, user_id, role, priority_tag)
-- SELECT 
--   t.id,
--   u.id,
--   'TEAMLEAD',
--   'PRIMARY'
-- FROM teams t
-- CROSS JOIN users u
-- WHERE t.name = 'Büro 2'
-- AND u.email = 'admin@halterverbot123.de';
-- =====================================================
