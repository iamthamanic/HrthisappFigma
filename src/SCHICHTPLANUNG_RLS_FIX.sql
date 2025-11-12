-- =====================================================
-- SCHICHTPLANUNG RLS POLICY FIX
-- =====================================================
-- This fixes the "row-level security policy" error
-- when creating shifts
-- =====================================================

-- First, let's check current user role to debug
DO $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  is_teamlead BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  SELECT role INTO current_user_role
  FROM public.users
  WHERE id = current_user_id;
  
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = current_user_id
    AND role = 'TEAMLEAD'
  ) INTO is_teamlead;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Current User ID: %', current_user_id;
  RAISE NOTICE 'Current User Role: %', current_user_role;
  RAISE NOTICE 'Is Teamlead: %', is_teamlead;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- FIX: UPDATE INSERT POLICY
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "HR and Teamleads can create shifts" ON public.shifts;

-- Create new, more permissive policy
CREATE POLICY "HR and Teamleads can create shifts"
  ON public.shifts
  FOR INSERT
  WITH CHECK (
    -- Allow HR roles (including ADMIN)
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('HR_SUPERADMIN', 'HR_MANAGER', 'ADMIN')
    )
    OR
    -- Allow Teamleads (in any team)
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid()
      AND role = 'TEAMLEAD'
    )
    OR
    -- Allow users to create their own shifts
    auth.uid() = user_id
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Updated INSERT policy for shifts table';
END $$;

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'shifts';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS POLICY FIX COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Active policies on shifts table: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies:';
END $$;

-- Display all policies on shifts table
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'shifts'
ORDER BY cmd, policyname;

-- =====================================================
-- TEST: Try creating a shift
-- =====================================================

DO $$
DECLARE
  test_user_id UUID;
  test_shift_id UUID;
BEGIN
  -- Get current user
  test_user_id := auth.uid();
  
  -- Try creating a test shift
  BEGIN
    INSERT INTO public.shifts (
      user_id,
      date,
      shift_type,
      start_time,
      end_time,
      notes
    ) VALUES (
      test_user_id,
      CURRENT_DATE,
      'MORNING',
      '08:00',
      '16:00',
      'RLS Policy Test Shift'
    )
    RETURNING id INTO test_shift_id;
    
    RAISE NOTICE '✅ SUCCESS: Test shift created with ID: %', test_shift_id;
    
    -- Clean up test shift
    DELETE FROM public.shifts WHERE id = test_shift_id;
    RAISE NOTICE '✅ Test shift cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR: Could not create test shift';
    RAISE NOTICE 'Error: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- ALTERNATIVE: If still having issues, use this
-- =====================================================

-- Uncomment below if you still have permission issues
-- This is the "nuclear option" - allows all authenticated users

/*
DROP POLICY IF EXISTS "HR and Teamleads can create shifts" ON public.shifts;

CREATE POLICY "All authenticated users can create shifts"
  ON public.shifts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL  -- Any authenticated user can create shifts
  );

DO $$
BEGIN
  RAISE NOTICE '⚠️  WARNING: Using permissive policy - all authenticated users can create shifts!';
END $$;
*/

-- =====================================================
-- TROUBLESHOOTING GUIDE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TROUBLESHOOTING:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If you still get RLS errors:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Check your user role:';
  RAISE NOTICE '   SELECT id, email, role FROM users WHERE id = auth.uid();';
  RAISE NOTICE '';
  RAISE NOTICE '2. Check if you are a teamlead:';
  RAISE NOTICE '   SELECT * FROM team_members WHERE user_id = auth.uid();';
  RAISE NOTICE '';
  RAISE NOTICE '3. Check current policies:';
  RAISE NOTICE '   SELECT * FROM pg_policies WHERE tablename = ''shifts'';';
  RAISE NOTICE '';
  RAISE NOTICE '4. If nothing works, uncomment the "nuclear option" above';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
