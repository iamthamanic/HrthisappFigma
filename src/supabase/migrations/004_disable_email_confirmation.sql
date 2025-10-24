-- ============================================
-- HRthis: Disable Email Confirmation
-- Allows users to login immediately after registration
-- ============================================

-- This is handled in Supabase Dashboard, not via SQL
-- But we can auto-confirm existing users

-- Auto-confirm all existing users
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ EMAIL CONFIRMATION FIX';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All existing users have been confirmed.';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT: For new registrations to work without email confirmation:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Go to Supabase Dashboard';
  RAISE NOTICE '2. Authentication → Settings';
  RAISE NOTICE '3. Find "Enable email confirmations"';
  RAISE NOTICE '4. DISABLE it (turn OFF)';
  RAISE NOTICE '';
  RAISE NOTICE 'This allows users to login immediately after registration!';
  RAISE NOTICE '';
END $$;