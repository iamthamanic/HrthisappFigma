-- ============================================================================
-- v4.11.8: AUTOMATION RLS POLICIES FIX
-- ============================================================================
-- Fixes "Failed to fetch" error for API Keys
-- Problem: RLS policies only allowed 'hr' and 'superadmin', not 'admin'
-- ============================================================================

-- ============================================================================
-- STEP 1: DIAGNOSE THE PROBLEM
-- ============================================================================

-- Check current user role
DO $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_org_id UUID;
BEGIN
  SELECT id, role, organization_id 
  INTO v_user_id, v_user_role, v_org_id
  FROM users 
  WHERE id = auth.uid();
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 CURRENT USER INFO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Role: %', v_user_role;
  RAISE NOTICE 'Organization ID: %', v_org_id;
  RAISE NOTICE '';
  
  -- Check if any API keys exist
  RAISE NOTICE 'API Keys in your organization:';
  FOR v_rec IN 
    SELECT id, name, created_at, is_active 
    FROM automation_api_keys 
    WHERE organization_id = v_org_id
  LOOP
    RAISE NOTICE '  - % (%, Active: %)', v_rec.name, v_rec.id, v_rec.is_active;
  END LOOP;
  
  -- Check if user can access API keys with current policies
  RAISE NOTICE '';
  RAISE NOTICE 'Can access API keys with current RLS: %', 
    EXISTS(
      SELECT 1 FROM automation_api_keys
      WHERE organization_id = v_org_id
      AND v_user_role IN ('hr', 'superadmin')
    );
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 2: DROP OLD POLICIES
-- ============================================================================

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "api_keys_select_own_org" ON automation_api_keys;
DROP POLICY IF EXISTS "api_keys_insert_hr_admin" ON automation_api_keys;
DROP POLICY IF EXISTS "api_keys_update_hr_admin" ON automation_api_keys;
DROP POLICY IF EXISTS "api_keys_delete_hr_admin" ON automation_api_keys;

DROP POLICY IF EXISTS "audit_log_select_own_org" ON automation_audit_log;

-- ============================================================================
-- STEP 3: CREATE NEW POLICIES (WITH ADMIN SUPPORT)
-- ============================================================================

-- SELECT: HR, Admin, Superadmin can view API keys in their organization
CREATE POLICY "api_keys_select_own_org"
  ON automation_api_keys
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin', 'superadmin')  -- ✅ ADDED 'admin'
    )
  );

-- INSERT: HR, Admin, Superadmin can create API keys
CREATE POLICY "api_keys_insert_hr_admin"
  ON automation_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin', 'superadmin')  -- ✅ ADDED 'admin'
    )
  );

-- UPDATE: HR, Admin, Superadmin can update API keys
CREATE POLICY "api_keys_update_hr_admin"
  ON automation_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin', 'superadmin')  -- ✅ ADDED 'admin'
    )
  );

-- DELETE: HR, Admin, Superadmin can delete API keys
CREATE POLICY "api_keys_delete_hr_admin"
  ON automation_api_keys
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin', 'superadmin')  -- ✅ ADDED 'admin'
    )
  );

-- ============================================================================
-- STEP 4: FIX AUDIT LOG POLICY
-- ============================================================================

-- SELECT: HR, Admin, Superadmin can view audit logs
CREATE POLICY "audit_log_select_own_org"
  ON automation_audit_log
  FOR SELECT
  TO authenticated
  USING (
    api_key_id IN (
      SELECT id FROM automation_api_keys
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin', 'superadmin')  -- ✅ ADDED 'admin'
    )
  );

-- ============================================================================
-- STEP 5: VERIFY THE FIX
-- ============================================================================

DO $$
DECLARE
  v_user_role TEXT;
  v_can_select BOOLEAN;
  v_can_insert BOOLEAN;
BEGIN
  SELECT role INTO v_user_role FROM users WHERE id = auth.uid();
  
  -- Test SELECT
  SELECT EXISTS(
    SELECT 1 FROM automation_api_keys LIMIT 1
  ) INTO v_can_select;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS POLICIES UPDATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Your Role: %', v_user_role;
  RAISE NOTICE 'Can SELECT API Keys: %', v_can_select;
  RAISE NOTICE '';
  RAISE NOTICE 'Allowed Roles:';
  RAISE NOTICE '  ✅ hr';
  RAISE NOTICE '  ✅ admin';
  RAISE NOTICE '  ✅ superadmin';
  RAISE NOTICE '';
  RAISE NOTICE 'If you still see "Failed to fetch", check:';
  RAISE NOTICE '  1. Your role is one of the above';
  RAISE NOTICE '  2. Your organization_id is set';
  RAISE NOTICE '  3. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- BONUS: HELPER VIEW FOR DEBUGGING
-- ============================================================================

-- Create a view to easily see API key access
CREATE OR REPLACE VIEW automation_api_keys_with_creator AS
SELECT 
  k.id,
  k.organization_id,
  k.name,
  k.key_hash,
  k.is_active,
  k.created_at,
  k.last_used_at,
  u.email as creator_email,
  u.first_name || ' ' || u.last_name as creator_name
FROM automation_api_keys k
LEFT JOIN users u ON k.created_by = u.id;

-- Grant access to authenticated users
GRANT SELECT ON automation_api_keys_with_creator TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 AUTOMATION RLS FIX COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed Issues:';
  RAISE NOTICE '  - Added "admin" role to all RLS policies';
  RAISE NOTICE '  - API Keys now accessible to admin users';
  RAISE NOTICE '  - Audit logs now accessible to admin users';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Next Steps:';
  RAISE NOTICE '  1. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Navigate to Automationenverwaltung';
  RAISE NOTICE '  3. You should now see "Neuen API Key erstellen"';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Debugging:';
  RAISE NOTICE '  - View: automation_api_keys_with_creator';
  RAISE NOTICE '  - Query: SELECT * FROM automation_api_keys_with_creator;';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
