-- 🔍 STEP 1: Check ALL users and their roles
SELECT 
  id,
  first_name,
  last_name,
  email,
  role,
  location_id,
  department,
  specialization
FROM users
ORDER BY last_name
LIMIT 20;

-- 🔍 STEP 2: Count users by role
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- 🔍 STEP 3: Check if 'EMPLOYEE' role exists
SELECT COUNT(*) as employee_count
FROM users
WHERE role = 'EMPLOYEE';

-- 🔍 STEP 4: Check role constraint (what roles are allowed?)
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%role%'
  AND table_name = 'users';

-- 🔍 STEP 5: Alternative - Check users without SUPERADMIN/ADMIN role
SELECT 
  id,
  first_name,
  last_name,
  email,
  role
FROM users
WHERE role NOT IN ('SUPERADMIN', 'ADMIN')
ORDER BY last_name
LIMIT 10;
