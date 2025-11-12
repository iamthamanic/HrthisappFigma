-- =====================================================
-- FIX: TESTS TABLE RLS POLICY
-- =====================================================
-- Problem: "Admins can manage tests" policy hat keine WITH CHECK für INSERT
-- Solution: Policy neu erstellen mit korrekter WITH CHECK Klausel
-- =====================================================

-- 1. Drop alte Policy
DROP POLICY IF EXISTS "Admins can manage tests" ON tests;

-- 2. Neue Policy mit WITH CHECK
CREATE POLICY "Admins can manage tests"
  ON tests FOR ALL
  USING (
    -- SELECT, UPDATE, DELETE: User muss Admin sein UND Test muss zur Org gehören
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  )
  WITH CHECK (
    -- INSERT: User muss Admin sein UND organization_id muss zur User-Org gehören
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- =====================================================
-- ALTERNATIVE: Separate Policies (cleaner)
-- =====================================================

-- Oder du kannst separate Policies für jede Operation erstellen:

-- Drop alte Policy falls sie existiert
DROP POLICY IF EXISTS "Admins can manage tests" ON tests;

-- View Policy (schon vorhanden, aber zur Sicherheit)
DROP POLICY IF EXISTS "Admins can view tests" ON tests;
CREATE POLICY "Admins can view tests"
  ON tests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Insert Policy
DROP POLICY IF EXISTS "Admins can create tests" ON tests;
CREATE POLICY "Admins can create tests"
  ON tests FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Update Policy
DROP POLICY IF EXISTS "Admins can update tests" ON tests;
CREATE POLICY "Admins can update tests"
  ON tests FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Delete Policy
DROP POLICY IF EXISTS "Admins can delete tests" ON tests;
CREATE POLICY "Admins can delete tests"
  ON tests FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all policies on tests table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tests'
ORDER BY policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tests RLS Policies Fixed!';
  RAISE NOTICE '🔒 Admins can now create, read, update, and delete tests';
  RAISE NOTICE '📋 Separate policies created for each operation';
END $$;
