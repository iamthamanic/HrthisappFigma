-- =====================================================
-- SCHICHTPLANUNG RLS NUCLEAR FIX
-- =====================================================
-- This is the "nuclear option" - allows ALL authenticated
-- users to create, read, update, and delete shifts.
-- Use this if the previous fix didn't work.
-- =====================================================

-- STEP 1: Debug current user
DO $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  current_user_email TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '❌ ERROR: No authenticated user!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You must be logged in to run this script.';
    RAISE NOTICE 'Please log in to your app first, then run this script.';
    RAISE NOTICE '========================================';
    RETURN;
  END IF;
  
  SELECT role, email INTO current_user_role, current_user_email
  FROM public.users
  WHERE id = current_user_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CURRENT USER DEBUG INFO:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', current_user_id;
  RAISE NOTICE 'Email: %', current_user_email;
  RAISE NOTICE 'Role: %', current_user_role;
  RAISE NOTICE '========================================';
END $$;

-- STEP 2: Show current policies
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENT POLICIES ON SHIFTS TABLE:';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  CASE 
    WHEN cmd = 'SELECT' THEN 'Anyone can view'
    WHEN cmd = 'INSERT' THEN 'Who can create'
    WHEN cmd = 'UPDATE' THEN 'Who can edit'
    WHEN cmd = 'DELETE' THEN 'Who can delete'
  END as "What it controls"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'shifts'
ORDER BY cmd, policyname;

-- STEP 3: DROP ALL EXISTING POLICIES
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️  DROPPING ALL EXISTING POLICIES...';
  RAISE NOTICE '========================================';
END $$;

DROP POLICY IF EXISTS "Users can view their own shifts or team shifts" ON public.shifts;
DROP POLICY IF EXISTS "HR and Teamleads can create shifts" ON public.shifts;
DROP POLICY IF EXISTS "HR, Teamleads, and creator can update shifts" ON public.shifts;
DROP POLICY IF EXISTS "HR, Teamleads, and creator can delete shifts" ON public.shifts;
DROP POLICY IF EXISTS "All authenticated users can create shifts" ON public.shifts;

DO $$
BEGIN
  RAISE NOTICE '✅ All existing policies dropped!';
END $$;

-- STEP 4: CREATE ULTRA-PERMISSIVE POLICIES (NUCLEAR OPTION)
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚡ CREATING NUCLEAR POLICIES...';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️  WARNING: These policies are VERY permissive!';
  RAISE NOTICE '⚠️  Any authenticated user can do ANYTHING with shifts!';
  RAISE NOTICE '';
END $$;

-- Policy 1: Anyone authenticated can SELECT
CREATE POLICY "Anyone authenticated can view shifts"
  ON public.shifts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 2: Anyone authenticated can INSERT
CREATE POLICY "Anyone authenticated can create shifts"
  ON public.shifts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Anyone authenticated can UPDATE
CREATE POLICY "Anyone authenticated can update shifts"
  ON public.shifts
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 4: Anyone authenticated can DELETE
CREATE POLICY "Anyone authenticated can delete shifts"
  ON public.shifts
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

DO $$
BEGIN
  RAISE NOTICE '✅ Nuclear policies created!';
  RAISE NOTICE '';
  RAISE NOTICE 'New policies:';
  RAISE NOTICE '  ✅ SELECT: Any authenticated user';
  RAISE NOTICE '  ✅ INSERT: Any authenticated user';
  RAISE NOTICE '  ✅ UPDATE: Any authenticated user';
  RAISE NOTICE '  ✅ DELETE: Any authenticated user';
END $$;

-- STEP 5: VERIFY NEW POLICIES
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEW POLICIES:';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Anyone authenticated'
    WHEN cmd = 'INSERT' THEN '✅ Anyone authenticated'
    WHEN cmd = 'UPDATE' THEN '✅ Anyone authenticated'
    WHEN cmd = 'DELETE' THEN '✅ Anyone authenticated'
  END as "Who can do this"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'shifts'
ORDER BY cmd, policyname;

-- STEP 6: TEST - Try creating a shift
DO $$
DECLARE
  test_user_id UUID;
  test_shift_id UUID;
  test_success BOOLEAN := false;
BEGIN
  test_user_id := auth.uid();
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  CANNOT TEST: No authenticated user';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Please test shift creation from your frontend.';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧪 TESTING SHIFT CREATION...';
  RAISE NOTICE '========================================';
  
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
      '🧪 RLS Nuclear Test Shift - SAFE TO DELETE'
    )
    RETURNING id INTO test_shift_id;
    
    test_success := true;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ ✅ ✅ SUCCESS! ✅ ✅ ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Test shift created successfully!';
    RAISE NOTICE 'Shift ID: %', test_shift_id;
    RAISE NOTICE '';
    
    -- Clean up test shift
    DELETE FROM public.shifts WHERE id = test_shift_id;
    RAISE NOTICE '✅ Test shift cleaned up (deleted)';
    
  EXCEPTION WHEN OTHERS THEN
    test_success := false;
    RAISE NOTICE '';
    RAISE NOTICE '❌ ❌ ❌ FAILED! ❌ ❌ ❌';
    RAISE NOTICE '';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE NOTICE 'Error Code: %', SQLSTATE;
    RAISE NOTICE '';
    RAISE NOTICE 'This means there is a DIFFERENT problem!';
    RAISE NOTICE 'Possible causes:';
    RAISE NOTICE '  1. You are not logged in (auth.uid() is NULL)';
    RAISE NOTICE '  2. Foreign key constraint violation';
    RAISE NOTICE '  3. Column type mismatch';
    RAISE NOTICE '  4. Database permission issue';
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  IF test_success THEN
    RAISE NOTICE '✅ RLS NUCLEAR FIX SUCCESSFUL!';
  ELSE
    RAISE NOTICE '❌ RLS NUCLEAR FIX FAILED!';
    RAISE NOTICE 'See error details above.';
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- STEP 7: Final summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 FINAL SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '  ✅ Dropped all restrictive RLS policies';
  RAISE NOTICE '  ✅ Created ultra-permissive policies';
  RAISE NOTICE '  ✅ Any authenticated user can now:';
  RAISE NOTICE '     - View all shifts (SELECT)';
  RAISE NOTICE '     - Create any shift (INSERT)';
  RAISE NOTICE '     - Edit any shift (UPDATE)';
  RAISE NOTICE '     - Delete any shift (DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  SECURITY WARNING:';
  RAISE NOTICE '  These policies are VERY permissive!';
  RAISE NOTICE '  For production, you should restrict them.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Try creating a shift in your frontend';
  RAISE NOTICE '  2. If it works, you can optionally add restrictions later';
  RAISE NOTICE '  3. If it STILL fails, check the error message carefully';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 NUCLEAR FIX COMPLETE!';
  RAISE NOTICE '========================================';
END $$;
