-- =====================================================
-- COMPLETE DEBUG: Team Creation & Admin Auto-Add
-- =====================================================

-- STEP 1: Check if trigger exists
SELECT 
  '=== STEP 1: TRIGGER CHECK ===' as step,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_add_hr_superadmin'
AND event_object_table = 'teams';

-- STEP 2: Check if function exists
SELECT 
  '=== STEP 2: FUNCTION CHECK ===' as step,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'auto_add_hr_superadmin_to_team';

-- STEP 3: Show all admin users
SELECT 
  '=== STEP 3: ADMIN USERS ===' as step,
  id,
  first_name || ' ' || last_name as name,
  email,
  role,
  organization_id
FROM users
WHERE role IN ('HR', 'ADMIN', 'SUPERADMIN')
ORDER BY role, first_name;

-- STEP 4: Show default organization
SELECT 
  '=== STEP 4: DEFAULT ORGANIZATION ===' as step,
  id,
  name,
  is_default
FROM organizations
WHERE is_default = true;

-- STEP 5: Create a manual test team to verify trigger
DO $$
DECLARE
  v_team_id uuid;
  v_org_id uuid;
BEGIN
  -- Get default org
  SELECT id INTO v_org_id FROM organizations WHERE is_default = true LIMIT 1;
  
  -- Create test team
  INSERT INTO teams (name, description, organization_id, created_at, updated_at)
  VALUES (
    'DEBUG TEST TEAM ' || NOW()::text,
    'Auto-created test team for debugging',
    v_org_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_team_id;
  
  RAISE NOTICE 'Created test team with ID: %', v_team_id;
  
  -- Wait a moment for trigger to execute
  PERFORM pg_sleep(1);
  
  -- Show team members that were added
  RAISE NOTICE 'Team members after trigger:';
END $$;

-- STEP 6: Show the test team and its members
SELECT 
  '=== STEP 6: TEST TEAM MEMBERS ===' as step,
  t.name as team_name,
  t.id as team_id,
  u.first_name || ' ' || u.last_name as member_name,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  tm.joined_at
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN users u ON tm.user_id = u.id
WHERE t.name LIKE 'DEBUG TEST TEAM%'
ORDER BY t.created_at DESC, u.first_name
LIMIT 20;

-- STEP 7: Count members
SELECT 
  '=== STEP 7: MEMBER COUNT ===' as step,
  t.name as team_name,
  COUNT(tm.user_id) as member_count
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
WHERE t.name LIKE 'DEBUG TEST TEAM%'
GROUP BY t.id, t.name
ORDER BY t.created_at DESC
LIMIT 5;

-- STEP 8: Check if there are any errors in the function
SELECT 
  '=== STEP 8: FUNCTION DEFINITION ===' as step,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'auto_add_hr_superadmin_to_team';

-- =====================================================
-- EXPECTED RESULTS:
-- - Step 1: Should show the trigger exists
-- - Step 3: Should show Ali SuperAdmin and Albert Admin
-- - Step 6: Should show Ali and Albert as TEAMLEAD in the test team
-- - Step 7: Should show member_count = 2 (or more if there are more admins)
-- =====================================================

-- CLEANUP: Remove test teams (uncomment to clean up)
-- DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE name LIKE 'DEBUG TEST TEAM%');
-- DELETE FROM teams WHERE name LIKE 'DEBUG TEST TEAM%';
