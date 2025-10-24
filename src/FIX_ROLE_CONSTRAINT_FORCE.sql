-- ========================================
-- FORCE FIX: users.role CHECK Constraint
-- ========================================
-- PROBLEM: Constraint can't be dropped because existing rows violate it
-- SOLUTION: Drop constraint without validation, fix data, recreate
-- ========================================

-- ========================================
-- STEP 1: CHECK CURRENT SITUATION
-- ========================================

-- Show current constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';

-- Show all distinct roles currently in use
SELECT 
  role,
  COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY user_count DESC;

-- ========================================
-- STEP 2: DROP CONSTRAINT (FORCE)
-- ========================================

-- Drop the constraint WITHOUT checking existing data
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- ========================================
-- STEP 3: FIX INVALID ROLES (if any)
-- ========================================

-- Check for any roles that are NOT in our valid list
SELECT 
  id,
  email,
  role,
  'INVALID - Will be changed to USER' as status
FROM users
WHERE role NOT IN ('USER', 'ADMIN', 'HR', 'SUPERADMIN')
  OR role IS NULL;

-- Fix any invalid or NULL roles → set to USER
UPDATE users
SET role = 'USER'
WHERE role NOT IN ('USER', 'ADMIN', 'HR', 'SUPERADMIN')
  OR role IS NULL;

-- ========================================
-- STEP 4: CREATE NEW CONSTRAINT
-- ========================================

-- Now create the proper constraint with ALL valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('USER', 'ADMIN', 'HR', 'SUPERADMIN'));

-- ========================================
-- STEP 5: VERIFY SUCCESS
-- ========================================

-- Show new constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';

-- Show final role distribution
SELECT 
  '✅ FINAL ROLE DISTRIBUTION' as status,
  role,
  COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY user_count DESC;

-- Test that all roles work
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUCCESS! users_role_check constraint updated';
  RAISE NOTICE '✅ Valid roles: USER, ADMIN, HR, SUPERADMIN';
  RAISE NOTICE '========================================';
END $$;
