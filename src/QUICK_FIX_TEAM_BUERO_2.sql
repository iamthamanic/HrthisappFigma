-- =====================================================
-- QUICK FIX: Add Ali to "Büro 2" + Fix Trigger
-- =====================================================

-- STEP 1: Show current team members for "Büro 2"
SELECT 
  'BEFORE FIX - Büro 2 Members' as status,
  t.name as team_name,
  u.first_name || ' ' || u.last_name as member_name,
  u.email,
  u.role as global_role,
  tm.role as team_role
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN users u ON tm.user_id = u.id
WHERE t.name = 'Büro 2'
ORDER BY u.first_name;

-- =====================================================
-- STEP 2: Add ALL HR/ADMIN/SUPERADMIN to "Büro 2"
-- =====================================================

INSERT INTO team_members (team_id, user_id, role)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role
FROM teams t
CROSS JOIN users u
WHERE t.name = 'Büro 2'
AND u.role IN ('HR', 'ADMIN', 'SUPERADMIN')
AND NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: Verify the fix for "Büro 2"
-- =====================================================

SELECT 
  'AFTER FIX - Büro 2 Members' as status,
  t.name as team_name,
  u.first_name || ' ' || u.last_name as member_name,
  u.email,
  u.role as global_role,
  tm.role as team_role
FROM teams t
JOIN team_members tm ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id
WHERE t.name = 'Büro 2'
ORDER BY u.first_name;

-- =====================================================
-- STEP 4: Re-create the trigger (FORCE UPDATE)
-- =====================================================

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS trigger_auto_add_hr_superadmin ON teams;
DROP FUNCTION IF EXISTS auto_add_hr_superadmin_to_team();

-- Re-create function with ADMIN included
CREATE OR REPLACE FUNCTION auto_add_hr_superadmin_to_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Add all HR, ADMIN, and SUPERADMIN users as TEAMLEAD to the new team
  INSERT INTO team_members (team_id, user_id, role)
  SELECT 
    NEW.id as team_id,
    u.id as user_id,
    'TEAMLEAD' as role
  FROM users u
  WHERE u.role IN ('HR', 'ADMIN', 'SUPERADMIN')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger
CREATE TRIGGER trigger_auto_add_hr_superadmin
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_hr_superadmin_to_team();

-- =====================================================
-- STEP 5: Also update the promotion trigger
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_add_to_teams_on_promotion ON users;
DROP FUNCTION IF EXISTS auto_add_user_to_all_teams_on_promotion();

CREATE OR REPLACE FUNCTION auto_add_user_to_all_teams_on_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- If user was promoted to HR, ADMIN, or SUPERADMIN, add them to all teams as TEAMLEAD
  IF (NEW.role IN ('HR', 'ADMIN', 'SUPERADMIN') AND (OLD.role IS NULL OR OLD.role NOT IN ('HR', 'ADMIN', 'SUPERADMIN'))) THEN
    -- Add to all teams as TEAMLEAD
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
    )
    ON CONFLICT DO NOTHING;
    
    -- Update existing memberships to TEAMLEAD
    UPDATE team_members
    SET role = 'TEAMLEAD'
    WHERE user_id = NEW.id
    AND role != 'TEAMLEAD';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_add_to_teams_on_promotion
  AFTER UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_user_to_all_teams_on_promotion();

-- =====================================================
-- STEP 6: Show ALL teams and their admins
-- =====================================================

SELECT 
  'ALL TEAMS - Admin Members' as status,
  t.name as team_name,
  u.first_name || ' ' || u.last_name as admin_name,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as total_members
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN users u ON tm.user_id = u.id AND u.role IN ('HR', 'ADMIN', 'SUPERADMIN')
ORDER BY t.name, u.first_name;

-- =====================================================
-- DONE! 
-- 1. Ali is now in "Büro 2" as TEAMLEAD
-- 2. Trigger is updated to include ADMIN
-- 3. All future teams will automatically get HR/ADMIN/SUPERADMIN
-- =====================================================
