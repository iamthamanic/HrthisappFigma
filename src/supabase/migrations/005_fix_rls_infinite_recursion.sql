-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- Problem: Users table policy references itself
-- ============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- Create simple, non-recursive policies

-- 1. Users can read their own profile (using auth.uid() directly)
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Users can update their own profile
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Admins can read all profiles (simple approach)
CREATE POLICY "admins_select_all"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Check if current user's role is ADMIN in auth.users metadata
  (auth.jwt() ->> 'role') IN ('ADMIN', 'SUPERADMIN')
  OR
  -- Or allow if user is reading their own profile
  id = auth.uid()
);

-- 4. Admins can update all profiles
CREATE POLICY "admins_update_all"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role') IN ('ADMIN', 'SUPERADMIN')
)
WITH CHECK (
  (auth.jwt() ->> 'role') IN ('ADMIN', 'SUPERADMIN')
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ RLS POLICIES FIXED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Infinite recursion error should be resolved.';
  RAISE NOTICE 'Users can now load their profiles without errors.';
  RAISE NOTICE '';
  RAISE NOTICE 'Test: Login should now work!';
  RAISE NOTICE '';
END $$;
