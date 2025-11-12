-- =====================================================
-- FIX: TEST_BLOCKS TABLE RLS POLICY
-- =====================================================
-- Problem: "Admins can manage test blocks" policy hat keine WITH CHECK für INSERT
-- Solution: Policy neu erstellen mit korrekter WITH CHECK Klausel
-- =====================================================

-- Drop alte Policy
DROP POLICY IF EXISTS "Admins can manage test blocks" ON test_blocks;

-- Separate Policies für jede Operation

-- View Policy (schon vorhanden)
DROP POLICY IF EXISTS "Admins can view test blocks" ON test_blocks;
CREATE POLICY "Admins can view test blocks"
  ON test_blocks FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM tests 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
      )
    )
  );

-- Insert Policy
DROP POLICY IF EXISTS "Admins can create test blocks" ON test_blocks;
CREATE POLICY "Admins can create test blocks"
  ON test_blocks FOR INSERT
  WITH CHECK (
    test_id IN (
      SELECT id FROM tests 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
      )
    )
  );

-- Update Policy
DROP POLICY IF EXISTS "Admins can update test blocks" ON test_blocks;
CREATE POLICY "Admins can update test blocks"
  ON test_blocks FOR UPDATE
  USING (
    test_id IN (
      SELECT id FROM tests 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
      )
    )
  );

-- Delete Policy
DROP POLICY IF EXISTS "Admins can delete test blocks" ON test_blocks;
CREATE POLICY "Admins can delete test blocks"
  ON test_blocks FOR DELETE
  USING (
    test_id IN (
      SELECT id FROM tests 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
      )
    )
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Test Blocks RLS Policies Fixed!';
  RAISE NOTICE '🔒 Admins can now create, read, update, and delete test blocks';
END $$;
