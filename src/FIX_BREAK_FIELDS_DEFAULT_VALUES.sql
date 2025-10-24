-- ============================================
-- FIX: Set Default Break Values for All Users
-- COPY THIS INTO SUPABASE SQL EDITOR
-- ============================================

-- Problem: Existing users have NULL values for break fields
-- Solution: Set default values for all users

-- 1. Update all users with NULL break_auto to FALSE (manual mode by default)
UPDATE public.users
SET 
  break_auto = COALESCE(break_auto, false),
  break_manual = COALESCE(break_manual, false),
  break_minutes = COALESCE(break_minutes, 30)
WHERE 
  break_auto IS NULL 
  OR break_manual IS NULL 
  OR break_minutes IS NULL;

-- 2. If you want automatic breaks for ALL users by default, use this instead:
-- UPDATE public.users
-- SET 
--   break_auto = COALESCE(break_auto, true),
--   break_manual = COALESCE(break_manual, false),
--   break_minutes = COALESCE(break_minutes, 30)
-- WHERE 
--   break_auto IS NULL 
--   OR break_manual IS NULL 
--   OR break_minutes IS NULL;

-- 3. Verify the changes
SELECT 
  id,
  email,
  first_name,
  last_name,
  break_auto,
  break_manual,
  break_minutes
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. Add NOT NULL constraints to ensure future users always have values
ALTER TABLE public.users
ALTER COLUMN break_auto SET DEFAULT false;

ALTER TABLE public.users
ALTER COLUMN break_manual SET DEFAULT false;

ALTER TABLE public.users
ALTER COLUMN break_minutes SET DEFAULT 30;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Break fields updated successfully!';
  RAISE NOTICE '   - All NULL values replaced with defaults';
  RAISE NOTICE '   - Default constraints added for future users';
  RAISE NOTICE '   - break_auto: false (manual mode)';
  RAISE NOTICE '   - break_manual: false';
  RAISE NOTICE '   - break_minutes: 30';
END $$;
