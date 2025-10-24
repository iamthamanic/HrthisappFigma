-- Migration: Add HR and TEAMLEAD roles
-- Description: Extends the user role CHECK constraint to include HR and TEAMLEAD roles
-- Date: 2025-01-XX
-- Version: 028

-- Drop the existing CHECK constraint on the role column
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new CHECK constraint with HR and TEAMLEAD roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('EMPLOYEE', 'HR', 'TEAMLEAD', 'ADMIN', 'SUPERADMIN'));

-- Update any existing NULL roles to EMPLOYEE (just in case)
UPDATE users SET role = 'EMPLOYEE' WHERE role IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: EMPLOYEE (standard user), HR (human resources with admin rights), TEAMLEAD (team lead with admin rights), ADMIN (administrator), SUPERADMIN (full access including role assignment)';