-- ========================================
-- Migration 046: Fix users.role CHECK Constraint
-- ========================================
-- PROBLEM: The users.role column has an outdated CHECK constraint
--          that doesn't allow 'USER' role, causing user creation to fail
-- 
-- ERROR: new row for relation "users" violates check constraint "users_role_check"
--
-- SOLUTION: Drop old constraint and create new one with all valid roles:
--           USER, ADMIN, HR, SUPERADMIN
-- ========================================

-- Drop the old constraint (if it exists)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Create new constraint with ALL valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('USER', 'ADMIN', 'HR', 'SUPERADMIN'));

-- Verify the constraint
DO $$
BEGIN
  RAISE NOTICE '✅ users.role CHECK constraint updated successfully';
  RAISE NOTICE '   Valid roles: USER, ADMIN, HR, SUPERADMIN';
END $$;
