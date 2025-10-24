-- =====================================================
-- MIGRATION 041: FIX AUTO-ADD ADMIN TO TEAMS
-- =====================================================
-- This migration fixes the trigger to also include ADMIN
-- when auto-adding users to new teams
-- =====================================================

-- Update function to auto-add HR/ADMIN/SUPERADMIN to new teams
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
  WHERE u.role IN ('HR', 'ADMIN', 'SUPERADMIN');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function to auto-add user to all teams when promoted to HR/ADMIN/SUPERADMIN
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
-- Also add ADMIN to all existing teams (retroactive fix)
-- =====================================================

-- Add HR, ADMIN, and SUPERADMIN to all existing teams as TEAMLEAD
INSERT INTO team_members (team_id, user_id, role)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role
FROM teams t
CROSS JOIN users u
WHERE u.role IN ('HR', 'ADMIN', 'SUPERADMIN')
AND NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- Update existing HR/ADMIN/SUPERADMIN team members to TEAMLEAD role
UPDATE team_members tm
SET role = 'TEAMLEAD'
FROM users u
WHERE tm.user_id = u.id
AND u.role IN ('HR', 'ADMIN', 'SUPERADMIN')
AND tm.role != 'TEAMLEAD';

-- =====================================================
-- DONE! Now all new teams will automatically get
-- HR, ADMIN, and SUPERADMIN users as TEAMLEAD
-- =====================================================
