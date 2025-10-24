-- =====================================================
-- TEST: Trigger für automatisches Admin-Hinzufügen
-- =====================================================

-- STEP 1: Check if trigger exists
SELECT 
  'TRIGGER CHECK' as test,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_add_hr_superadmin'
AND event_object_table = 'teams';

-- STEP 2: Check if function exists
SELECT 
  'FUNCTION CHECK' as test,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'auto_add_hr_superadmin_to_team';

-- STEP 3: Show all HR/ADMIN/SUPERADMIN users
SELECT 
  'ADMIN USERS' as test,
  id,
  first_name || ' ' || last_name as name,
  email,
  role
FROM users
WHERE role IN ('HR', 'ADMIN', 'SUPERADMIN');

-- STEP 4: Create a test team to verify trigger works
INSERT INTO teams (name, description, organization_id, created_at, updated_at)
VALUES (
  'TRIGGER TEST TEAM',
  'This is a test team to verify the trigger works',
  (SELECT id FROM organizations WHERE is_default = true LIMIT 1),
  NOW(),
  NOW()
)
RETURNING id, name;

-- STEP 5: Check if admins were automatically added
SELECT 
  'TEST RESULT - Team Members' as test,
  t.name as team_name,
  u.first_name || ' ' || u.last_name as member_name,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  tm.joined_at
FROM teams t
JOIN team_members tm ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id
WHERE t.name = 'TRIGGER TEST TEAM'
ORDER BY u.first_name;

-- STEP 6: Clean up test team
DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE name = 'TRIGGER TEST TEAM');
DELETE FROM teams WHERE name = 'TRIGGER TEST TEAM';

-- =====================================================
-- EXPECTED RESULT:
-- - Trigger and function should exist
-- - All HR/ADMIN/SUPERADMIN users should be shown
-- - After INSERT, all admins should be automatically added to the test team
-- - If not, the trigger is not working!
-- =====================================================