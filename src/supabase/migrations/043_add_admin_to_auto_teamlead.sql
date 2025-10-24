-- =====================================================
-- EXTEND AUTO-TEAMLEAD TO INCLUDE ADMIN ROLE
-- =====================================================
-- This migration extends Migration 040 to also include
-- ADMIN users (not just HR and SUPERADMIN)
-- =====================================================

-- Step 1: Add ADMIN to all existing teams as TEAMLEAD
INSERT INTO team_members (team_id, user_id, role)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role
FROM teams t
CROSS JOIN users u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (
  -- Don't add if already a member
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.user_id = u.id
);

-- Step 2: Update existing ADMIN team members to TEAMLEAD role
UPDATE team_members tm
SET role = 'TEAMLEAD'
FROM users u
WHERE tm.user_id = u.id
AND u.role = 'ADMIN'
AND tm.role != 'TEAMLEAD';

-- =====================================================
-- Update the trigger function to include ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION auto_add_hr_superadmin_to_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Add all HR, SUPERADMIN, and ADMIN users as TEAMLEAD to the new team
  INSERT INTO team_members (team_id, user_id, role)
  SELECT 
    NEW.id as team_id,
    u.id as user_id,
    'TEAMLEAD' as role
  FROM users u
  WHERE u.role IN ('HR', 'SUPERADMIN', 'ADMIN');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Update the promotion trigger to include ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION auto_add_user_to_all_teams_on_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- If user was promoted to HR, SUPERADMIN, or ADMIN, add them to all teams as TEAMLEAD
  IF (NEW.role IN ('HR', 'SUPERADMIN', 'ADMIN') AND (OLD.role IS NULL OR OLD.role NOT IN ('HR', 'SUPERADMIN', 'ADMIN'))) THEN
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
-- DONE! Now:
-- 1. All existing HR/SUPERADMIN/ADMIN are added to all teams as TEAMLEAD
-- 2. New teams automatically get HR/SUPERADMIN/ADMIN as TEAMLEAD
-- 3. Users promoted to HR/SUPERADMIN/ADMIN automatically join all teams as TEAMLEAD
-- =====================================================

-- Verify the setup for ADMIN users
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  u.role as global_role,
  t.name as team_name,
  tm.role as team_role
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE u.role IN ('HR', 'SUPERADMIN', 'ADMIN')
ORDER BY u.first_name, u.last_name, t.name;
