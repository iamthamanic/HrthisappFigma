-- =====================================================
-- SCHICHTPLANUNG ULTRA DIAGNOSTICS
-- =====================================================
-- This will tell us EXACTLY what's wrong
-- =====================================================

-- STEP 1: Check if user is authenticated
DO $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  current_user_role TEXT;
BEGIN
  current_user_id := auth.uid();
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 STEP 1: USER AUTHENTICATION CHECK';
  RAISE NOTICE '========================================';
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '❌ ERROR: auth.uid() is NULL!';
    RAISE NOTICE 'You are NOT authenticated!';
    RAISE NOTICE 'Please log in to your app first.';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  This is likely the problem!';
    RAISE NOTICE 'RLS policies require authentication.';
  ELSE
    RAISE NOTICE '✅ User is authenticated';
    RAISE NOTICE 'User ID: %', current_user_id;
    
    -- Get user details
    SELECT email, role INTO current_user_email, current_user_role
    FROM public.users
    WHERE id = current_user_id;
    
    IF current_user_email IS NULL THEN
      RAISE NOTICE '⚠️  WARNING: User not found in users table!';
    ELSE
      RAISE NOTICE 'Email: %', current_user_email;
      RAISE NOTICE 'Role: %', current_user_role;
    END IF;
  END IF;
END $$;

-- STEP 2: Check if shifts table exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 STEP 2: SHIFTS TABLE CHECK';
  RAISE NOTICE '========================================';
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shifts'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ shifts table exists';
  ELSE
    RAISE NOTICE '❌ ERROR: shifts table does NOT exist!';
    RAISE NOTICE 'You need to create the table first.';
  END IF;
END $$;

-- STEP 3: Show table structure
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 STEP 3: SHIFTS TABLE STRUCTURE';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'created_by' THEN '⚠️  IMPORTANT'
    WHEN column_name = 'user_id' THEN '⚠️  IMPORTANT'
    ELSE ''
  END as notes
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'shifts'
ORDER BY ordinal_position;

-- STEP 4: Check foreign key constraints
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 STEP 4: FOREIGN KEY CONSTRAINTS';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'shifts';

-- STEP 5: Check RLS status
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 STEP 5: RLS STATUS';
  RAISE NOTICE '========================================';
  
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'shifts'
  AND relnamespace = 'public'::regnamespace;
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is ENABLED on shifts table';
    RAISE NOTICE 'This means policies are being enforced.';
  ELSE
    RAISE NOTICE '⚠️  RLS is DISABLED on shifts table';
    RAISE NOTICE 'This means anyone can insert data.';
  END IF;
END $$;

-- STEP 6: List all policies
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 STEP 6: ALL POLICIES ON SHIFTS TABLE';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  permissive as "Permissive",
  roles as "Roles",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'shifts'
ORDER BY cmd, policyname;

-- STEP 7: Check if created_by column exists
DO $$
DECLARE
  created_by_exists BOOLEAN;
  created_by_nullable TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 STEP 7: CREATED_BY COLUMN CHECK';
  RAISE NOTICE '========================================';
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'shifts'
    AND column_name = 'created_by'
  ) INTO created_by_exists;
  
  IF created_by_exists THEN
    SELECT is_nullable INTO created_by_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'shifts'
    AND column_name = 'created_by';
    
    RAISE NOTICE '✅ created_by column exists';
    RAISE NOTICE 'Nullable: %', created_by_nullable;
    
    IF created_by_nullable = 'NO' THEN
      RAISE NOTICE '⚠️  WARNING: created_by is NOT NULL';
      RAISE NOTICE 'You MUST provide created_by when inserting.';
    END IF;
  ELSE
    RAISE NOTICE '❌ created_by column does NOT exist';
    RAISE NOTICE 'This might be okay, depending on your setup.';
  END IF;
END $$;

-- STEP 8: Try to insert a test row (if authenticated)
DO $$
DECLARE
  current_user_id UUID;
  test_shift_id UUID;
  test_date TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 STEP 8: TEST INSERT';
  RAISE NOTICE '========================================';
  
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⏭️  SKIPPING: No authenticated user';
    RAISE NOTICE 'Please log in and run this again.';
    RETURN;
  END IF;
  
  -- Use tomorrow's date to avoid conflicts
  test_date := (CURRENT_DATE + INTERVAL '1 day')::TEXT;
  
  RAISE NOTICE 'Attempting test insert...';
  RAISE NOTICE 'User ID: %', current_user_id;
  RAISE NOTICE 'Date: %', test_date;
  
  BEGIN
    -- Try INSERT with minimal data
    INSERT INTO public.shifts (
      user_id,
      date,
      shift_type,
      start_time,
      end_time
    ) VALUES (
      current_user_id,
      test_date,
      'MORNING',
      '08:00',
      '16:00'
    )
    RETURNING id INTO test_shift_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ ✅ ✅ SUCCESS! ✅ ✅ ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Test shift created with ID: %', test_shift_id;
    RAISE NOTICE '';
    RAISE NOTICE 'The policies work! The problem is in your frontend code.';
    
    -- Clean up
    DELETE FROM public.shifts WHERE id = test_shift_id;
    RAISE NOTICE '✅ Test shift deleted (cleanup)';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ ❌ ❌ INSERT FAILED! ❌ ❌ ❌';
    RAISE NOTICE '';
    RAISE NOTICE 'Error Code: %', SQLSTATE;
    RAISE NOTICE 'Error Message: %', SQLERRM;
    RAISE NOTICE '';
    
    -- Specific error diagnostics
    IF SQLSTATE = '23502' THEN
      RAISE NOTICE '🔍 DIAGNOSIS: NOT NULL CONSTRAINT VIOLATION';
      RAISE NOTICE 'One of the required columns is missing.';
      RAISE NOTICE 'Check: created_by, shift_type, or other required fields.';
    ELSIF SQLSTATE = '23503' THEN
      RAISE NOTICE '🔍 DIAGNOSIS: FOREIGN KEY CONSTRAINT VIOLATION';
      RAISE NOTICE 'user_id or another foreign key is invalid.';
      RAISE NOTICE 'The user_id might not exist in users table.';
    ELSIF SQLSTATE = '42501' THEN
      RAISE NOTICE '🔍 DIAGNOSIS: RLS POLICY VIOLATION';
      RAISE NOTICE 'Even with permissive policies, INSERT is blocked.';
      RAISE NOTICE '';
      RAISE NOTICE '🔧 SOLUTION: Try disabling RLS temporarily:';
      RAISE NOTICE '   ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;';
    ELSIF SQLSTATE = '23505' THEN
      RAISE NOTICE '🔍 DIAGNOSIS: UNIQUE CONSTRAINT VIOLATION';
      RAISE NOTICE 'A shift with these values already exists.';
    ELSE
      RAISE NOTICE '🔍 DIAGNOSIS: UNKNOWN ERROR';
      RAISE NOTICE 'See error message above for details.';
    END IF;
  END;
END $$;

-- STEP 9: Final Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 DIAGNOSTIC SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What to check:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Are you logged in? (Step 1)';
  RAISE NOTICE '2. Does shifts table exist? (Step 2)';
  RAISE NOTICE '3. Check table structure (Step 3)';
  RAISE NOTICE '4. Check foreign keys (Step 4)';
  RAISE NOTICE '5. Is RLS enabled? (Step 5)';
  RAISE NOTICE '6. Check policies (Step 6)';
  RAISE NOTICE '7. Does created_by exist? (Step 7)';
  RAISE NOTICE '8. Did test insert work? (Step 8)';
  RAISE NOTICE '';
  RAISE NOTICE 'Based on Step 8 results:';
  RAISE NOTICE '  - If SUCCESS: Problem is in frontend code';
  RAISE NOTICE '  - If FAILED: Problem is in database setup';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- STEP 10: Show potential solutions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '💡 POTENTIAL SOLUTIONS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If test insert failed with code 42501:';
  RAISE NOTICE '  Option 1: Disable RLS temporarily';
  RAISE NOTICE '    ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;';
  RAISE NOTICE '';
  RAISE NOTICE '  Option 2: Drop created_by constraint if it exists';
  RAISE NOTICE '    ALTER TABLE public.shifts ALTER COLUMN created_by DROP NOT NULL;';
  RAISE NOTICE '';
  RAISE NOTICE '  Option 3: Make created_by column nullable';
  RAISE NOTICE '    Already covered in Option 2';
  RAISE NOTICE '';
  RAISE NOTICE 'If foreign key error (23503):';
  RAISE NOTICE '  Your user_id does not exist in users table';
  RAISE NOTICE '  Check: SELECT id, email FROM users WHERE id = auth.uid();';
  RAISE NOTICE '';
  RAISE NOTICE 'If test insert succeeded:';
  RAISE NOTICE '  Problem is in your frontend code';
  RAISE NOTICE '  Check BrowoKo_useShiftPlanning.ts';
  RAISE NOTICE '  Make sure you are passing correct data';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
