-- ============================================================================
-- FIX: AUTOMATION RLS POLICIES - CASE INSENSITIVE ROLE CHECK
-- ============================================================================
-- Problem: RLS Policies check for lowercase 'hr'/'superadmin' but DB has 'HR'/'SUPERADMIN'
-- Solution: Use LOWER(role) in all RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "api_keys_select_own_org" ON automation_api_keys;
DROP POLICY IF EXISTS "api_keys_insert_hr_admin" ON automation_api_keys;
DROP POLICY IF EXISTS "api_keys_update_hr_admin" ON automation_api_keys;
DROP POLICY IF EXISTS "api_keys_delete_hr_admin" ON automation_api_keys;

-- Recreate with case-insensitive role check
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
      AND LOWER(role) IN ('hr', 'superadmin')
    )
  );

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
      AND LOWER(role) IN ('hr', 'superadmin')
    )
  );

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
      AND LOWER(role) IN ('hr', 'superadmin')
    )
  );

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
      AND LOWER(role) IN ('hr', 'superadmin')
    )
  );

-- ============================================================================
-- TEST QUERY
-- ============================================================================
-- After running this migration, test with:
-- SELECT * FROM automation_api_keys WHERE is_active = true;
-- You should now see your API keys!

-- ============================================================================
-- SUCCESS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AUTOMATION RLS FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed 4 RLS policies with LOWER(role)';
  RAISE NOTICE '';
  RAISE NOTICE 'Now supports both:';
  RAISE NOTICE '  - HR / hr';
  RAISE NOTICE '  - SUPERADMIN / superadmin';
  RAISE NOTICE '========================================';
END $$;
