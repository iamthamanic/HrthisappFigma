-- ✅ SCHICHTPLANUNG - User Loading Verification
-- Führe diese Queries aus, um zu prüfen, ob User korrekt geladen werden können

-- ========================================
-- STEP 1: Check Total Users
-- ========================================
SELECT 
  '📊 Total Users in Database' as check_name,
  COUNT(*) as total_users
FROM users;

-- ========================================
-- STEP 2: Check Users by Role
-- ========================================
SELECT 
  '👥 Users by Role' as check_name,
  role,
  COUNT(*) as count,
  string_agg(first_name || ' ' || last_name, ', ') as user_names
FROM users
GROUP BY role
ORDER BY count DESC;

-- ========================================
-- STEP 3: Check if 'EMPLOYEE' role exists
-- ========================================
SELECT 
  '🔍 Users with EMPLOYEE role' as check_name,
  COUNT(*) as employee_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO USERS with EMPLOYEE role found! This is the problem!'
    ELSE '✅ EMPLOYEE users exist'
  END as status
FROM users
WHERE role = 'EMPLOYEE';

-- ========================================
-- STEP 4: Check Schedulable Users (Non-Admin)
-- ========================================
SELECT 
  '📅 Schedulable Users (excluding SUPERADMIN/ADMIN)' as check_name,
  role,
  COUNT(*) as count
FROM users
WHERE role NOT IN ('SUPERADMIN', 'ADMIN')
GROUP BY role
ORDER BY count DESC;

-- ========================================
-- STEP 5: List First 10 Schedulable Users
-- ========================================
SELECT 
  '👤 Sample Schedulable Users' as check_name,
  id,
  first_name,
  last_name,
  email,
  role,
  location_id,
  department,
  specialization
FROM users
WHERE role NOT IN ('SUPERADMIN', 'ADMIN')
ORDER BY last_name
LIMIT 10;

-- ========================================
-- STEP 6: Check Teams with Members
-- ========================================
SELECT 
  '👔 Teams with Member Count' as check_name,
  t.id,
  t.name,
  COUNT(tm.user_id) as member_count,
  string_agg(u.first_name || ' ' || u.last_name, ', ') as members
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN users u ON tm.user_id = u.id
GROUP BY t.id, t.name
ORDER BY t.name;

-- ========================================
-- STEP 7: Check Users WITHOUT Team Assignment
-- ========================================
SELECT 
  '🆓 Users WITHOUT Team Assignment' as check_name,
  u.id,
  u.first_name,
  u.last_name,
  u.role
FROM users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM team_members tm 
  WHERE tm.user_id = u.id
)
AND u.role NOT IN ('SUPERADMIN', 'ADMIN')
ORDER BY u.last_name;

-- ========================================
-- STEP 8: Check Locations
-- ========================================
SELECT 
  '📍 Locations' as check_name,
  id,
  name,
  address,
  (SELECT COUNT(*) FROM users WHERE location_id = locations.id) as user_count
FROM locations
ORDER BY name;

-- ========================================
-- STEP 9: Check Departments
-- ========================================
SELECT 
  '🏢 Departments' as check_name,
  id,
  name,
  (SELECT COUNT(*) FROM users WHERE department = departments.name) as user_count
FROM departments
ORDER BY name;

-- ========================================
-- STEP 10: Final Summary
-- ========================================
SELECT 
  '📋 SUMMARY' as check_name,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'EMPLOYEE') as employee_users,
  (SELECT COUNT(*) FROM users WHERE role NOT IN ('SUPERADMIN', 'ADMIN')) as schedulable_users,
  (SELECT COUNT(*) FROM teams) as total_teams,
  (SELECT COUNT(*) FROM locations) as total_locations,
  (SELECT COUNT(*) FROM departments) as total_departments,
  (SELECT COUNT(*) FROM shifts) as total_shifts;

-- ========================================
-- 🎯 EXPECTED RESULTS:
-- ========================================
-- 
-- ✅ GOOD:
-- - Total users > 0
-- - Schedulable users > 0
-- - At least 1 team exists
-- - At least 1 location exists
-- - At least 1 department exists
--
-- ⚠️ WARNING:
-- - employee_count = 0 (no users with EMPLOYEE role)
--   → This is OK if you use other roles (TEAMLEAD, HR, EXTERN, etc.)
--   → The fix loads ALL users regardless of role
--
-- ❌ PROBLEM:
-- - total_users = 0 → No users in database at all!
-- - schedulable_users = 0 → Only SUPERADMIN/ADMIN users exist
-- - No teams/locations/departments → Basic data missing
-- ========================================
