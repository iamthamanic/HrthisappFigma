/**
 * ============================================
 * MIGRATION 054: ADD EXTERN ROLE
 * ============================================
 * Version: 4.0.6
 * Description: Adds EXTERN role with limited access
 * Access: Dashboard, Field, Documents only
 * ============================================
 */

-- Add EXTERN to user_role enum
DO $$ 
BEGIN
    -- Check if EXTERN value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'EXTERN' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'user_role'
        )
    ) THEN
        ALTER TYPE user_role ADD VALUE 'EXTERN';
        RAISE NOTICE '✅ Added EXTERN to user_role enum';
    ELSE
        RAISE NOTICE 'ℹ️ EXTERN already exists in user_role enum';
    END IF;
END $$;

-- Update users table check constraint to allow EXTERN role
-- Drop old constraint if exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with EXTERN
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('USER', 'TEAMLEAD', 'HR', 'ADMIN', 'SUPERADMIN', 'EXTERN'));

-- Add comment
COMMENT ON CONSTRAINT users_role_check ON users IS 
'Allowed roles: USER, TEAMLEAD, HR, ADMIN, SUPERADMIN, EXTERN. EXTERN has limited access to Dashboard, Field, and Documents only.';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ MIGRATION 054 COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'EXTERN role added successfully';
    RAISE NOTICE 'Access: Dashboard, Field, Documents only';
    RAISE NOTICE '============================================';
END $$;
