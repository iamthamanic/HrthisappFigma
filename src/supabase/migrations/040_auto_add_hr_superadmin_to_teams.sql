-- =====================================================
-- AUTO-ADD HR & SUPERADMIN TO ALL TEAMS AS TEAMLEAD
-- =====================================================
-- This migration ensures that HR and SUPERADMIN users
-- are automatically added as TEAMLEAD to all teams
-- =====================================================

-- Step 1: Add HR and SUPERADMIN to all existing teams as TEAMLEAD
INSERT INTO team_members (team_id, user_id, role)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role
FROM teams t
CROSS JOIN users u
WHERE u.role IN ('HR', 'SUPERADMIN')
AND NOT EXISTS (
  -- Don't add if already a member
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.user_id = u.id
);

-- Step 2: Update existing HR/SUPERADMIN team members to TEAMLEAD role
UPDATE team_members tm
SET role = 'TEAMLEAD'
FROM users u
WHERE tm.user_id = u.id
AND u.role IN ('HR', 'SUPERADMIN')
AND tm.role != 'TEAMLEAD';

-- =====================================================
-- Create function to auto-add HR/SUPERADMIN to new teams
-- =====================================================

CREATE OR REPLACE FUNCTION auto_add_hr_superadmin_to_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Add all HR and SUPERADMIN users as TEAMLEAD to the new team
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

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_add_hr_superadmin ON teams;

-- Create trigger that fires after team is created
CREATE TRIGGER trigger_auto_add_hr_superadmin
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_hr_superadmin_to_team();

-- =====================================================
-- Create function to auto-add user to all teams when promoted to HR/SUPERADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION auto_add_user_to_all_teams_on_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- If user was promoted to HR or SUPERADMIN, add them to all teams as TEAMLEAD
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

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_add_to_teams_on_promotion ON users;

-- Create trigger that fires after user role is updated
CREATE TRIGGER trigger_auto_add_to_teams_on_promotion
  AFTER UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_user_to_all_teams_on_promotion();

-- =====================================================
-- DONE! Now:
-- 1. All existing HR/SUPERADMIN are added to all teams as TEAMLEAD
-- 2. New teams automatically get HR/SUPERADMIN as TEAMLEAD
-- 3. Users promoted to HR/SUPERADMIN automatically join all teams as TEAMLEAD
-- =====================================================

-- Verify the setup
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  u.role as global_role,
  t.name as team_name,
  tm.role as team_role
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE u.role IN ('HR', 'SUPERADMIN')
ORDER BY u.first_name, u.last_name, t.name;
