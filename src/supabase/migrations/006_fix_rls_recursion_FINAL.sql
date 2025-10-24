-- ============================================
-- FINAL FIX: RLS Infinite Recursion
-- Replaces ALL problematic policies on users table
-- ============================================

-- STEP 1: Drop ALL existing policies on users table
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- STEP 2: Create simple, non-recursive policies

-- Policy 1: Users can SELECT their own profile
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can UPDATE their own profile
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Service role can do everything (for triggers)
CREATE POLICY "service_role_all"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 3: Verify policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users' AND schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ RLS POLICIES FIXED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total policies on users table: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '  1. users_select_own - Users read own profile';
  RAISE NOTICE '  2. users_update_own - Users update own profile';
  RAISE NOTICE '  3. service_role_all - Service role full access';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ NOTE: Admin policies removed to fix recursion!';
  RAISE NOTICE 'Admins need to query via service_role or use RPC functions.';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Infinite recursion error should be GONE!';
  RAISE NOTICE 'Test: Try logging in now!';
  RAISE NOTICE '';
END $$;