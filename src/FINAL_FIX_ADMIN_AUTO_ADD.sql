-- =====================================================
-- FINAL FIX: Auto-Add HR/ADMIN/SUPERADMIN to Teams
-- =====================================================
-- This script ensures the trigger is properly installed
-- and all existing teams have HR/ADMIN/SUPERADMIN
-- =====================================================

-- STEP 1: Drop and recreate the trigger function (FORCE REFRESH)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_add_hr_superadmin ON teams;
DROP FUNCTION IF EXISTS auto_add_hr_superadmin_to_team() CASCADE;

CREATE OR REPLACE FUNCTION auto_add_hr_superadmin_to_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Add all HR, ADMIN, and SUPERADMIN users as TEAMLEAD to the new team
  INSERT INTO team_members (team_id, user_id, role, is_lead, joined_at)
  SELECT 
    NEW.id as team_id,
    u.id as user_id,
    'TEAMLEAD' as role,
    true as is_lead,
    NOW() as joined_at
  FROM users u
  WHERE u.role IN ('HR', 'ADMIN', 'SUPERADMIN')
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_auto_add_hr_superadmin
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_hr_superadmin_to_team();

-- =====================================================
-- STEP 2: Add HR/ADMIN/SUPERADMIN to ALL existing teams
-- =====================================================

INSERT INTO team_members (team_id, user_id, role, is_lead, joined_at)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role,
  true as is_lead,
  NOW() as joined_at
FROM teams t
CROSS JOIN users u
WHERE u.role IN ('HR', 'ADMIN', 'SUPERADMIN')
ON CONFLICT (team_id, user_id) DO UPDATE
SET role = 'TEAMLEAD', is_lead = true;

-- =====================================================
-- STEP 3: Also update the promotion trigger
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_add_to_teams_on_promotion ON users;
DROP FUNCTION IF EXISTS auto_add_user_to_all_teams_on_promotion() CASCADE;

CREATE OR REPLACE FUNCTION auto_add_user_to_all_teams_on_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- If user was promoted to HR, ADMIN, or SUPERADMIN
  IF (NEW.role IN ('HR', 'ADMIN', 'SUPERADMIN') AND (OLD.role IS NULL OR OLD.role NOT IN ('HR', 'ADMIN', 'SUPERADMIN'))) THEN
    -- Add to all teams as TEAMLEAD
    INSERT INTO team_members (team_id, user_id, role, is_lead, joined_at)
    SELECT 
      t.id as team_id,
      NEW.id as user_id,
      'TEAMLEAD' as role,
      true as is_lead,
      NOW() as joined_at
    FROM teams t
    ON CONFLICT (team_id, user_id) DO UPDATE
    SET role = 'TEAMLEAD', is_lead = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_add_to_teams_on_promotion
  AFTER UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_user_to_all_teams_on_promotion();

-- =====================================================
-- STEP 4: Verify the setup
-- =====================================================

SELECT 
  'All Teams with Admins' as status,
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
-- 1. Trigger is installed and will auto-add HR/ADMIN/SUPERADMIN
-- 2. All existing teams now have HR/ADMIN/SUPERADMIN as TEAMLEAD
-- 3. Frontend code no longer deletes them
-- =====================================================
