-- =====================================================
-- v4.13.2 - COMPLETE RLS FIX FOR LEARNING TESTS
-- =====================================================
-- Fixes RLS policies for all learning test tables
-- Copy & Paste this into Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FIX: TESTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage tests" ON tests;
DROP POLICY IF EXISTS "Admins can view tests" ON tests;
DROP POLICY IF EXISTS "Admins can create tests" ON tests;
DROP POLICY IF EXISTS "Admins can update tests" ON tests;
DROP POLICY IF EXISTS "Admins can delete tests" ON tests;

-- View Policy
CREATE POLICY "Admins can view tests"
  ON tests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Insert Policy (✅ DER WICHTIGSTE FIX!)
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
-- 2. FIX: TEST_BLOCKS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage test blocks" ON test_blocks;
DROP POLICY IF EXISTS "Admins can view test blocks" ON test_blocks;
DROP POLICY IF EXISTS "Admins can create test blocks" ON test_blocks;
DROP POLICY IF EXISTS "Admins can update test blocks" ON test_blocks;
DROP POLICY IF EXISTS "Admins can delete test blocks" ON test_blocks;

-- View Policy
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
-- 3. FIX: TEST_VIDEO_ASSIGNMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage test-video assignments" ON test_video_assignments;
DROP POLICY IF EXISTS "Admins can view test-video assignments" ON test_video_assignments;
DROP POLICY IF EXISTS "Admins can create test-video assignments" ON test_video_assignments;
DROP POLICY IF EXISTS "Admins can update test-video assignments" ON test_video_assignments;
DROP POLICY IF EXISTS "Admins can delete test-video assignments" ON test_video_assignments;

-- View Policy
CREATE POLICY "Admins can view test-video assignments"
  ON test_video_assignments FOR SELECT
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
CREATE POLICY "Admins can create test-video assignments"
  ON test_video_assignments FOR INSERT
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
CREATE POLICY "Admins can update test-video assignments"
  ON test_video_assignments FOR UPDATE
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
CREATE POLICY "Admins can delete test-video assignments"
  ON test_video_assignments FOR DELETE
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
-- 4. VERIFICATION
-- =====================================================

-- Check all policies
DO $$
DECLARE
  test_policies INTEGER;
  test_blocks_policies INTEGER;
  test_video_policies INTEGER;
BEGIN
  -- Count policies
  SELECT COUNT(*) INTO test_policies 
  FROM pg_policies 
  WHERE tablename = 'tests' AND policyname LIKE 'Admins can%';
  
  SELECT COUNT(*) INTO test_blocks_policies 
  FROM pg_policies 
  WHERE tablename = 'test_blocks' AND policyname LIKE 'Admins can%';
  
  SELECT COUNT(*) INTO test_video_policies 
  FROM pg_policies 
  WHERE tablename = 'test_video_assignments' AND policyname LIKE 'Admins can%';
  
  -- Report
  RAISE NOTICE '✅ RLS Policies Fixed!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 tests table: % admin policies', test_policies;
  RAISE NOTICE '📋 test_blocks table: % admin policies', test_blocks_policies;
  RAISE NOTICE '📋 test_video_assignments table: % admin policies', test_video_policies;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '';
  
  IF test_policies = 4 AND test_blocks_policies = 4 AND test_video_policies = 4 THEN
    RAISE NOTICE '✅ ALL POLICIES CORRECT! Test creation should now work!';
  ELSE
    RAISE WARNING '⚠️ Some policies missing! Check output above.';
  END IF;
END $$;

-- Display all policies
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ Has WITH CHECK'
    WHEN cmd = 'INSERT' THEN '❌ Missing WITH CHECK'
    ELSE ''
  END as check_status
FROM pg_policies
WHERE tablename IN ('tests', 'test_blocks', 'test_video_assignments')
  AND policyname LIKE 'Admins can%'
ORDER BY tablename, cmd;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 COMPLETE RLS FIX APPLIED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tests können jetzt erstellt werden';
  RAISE NOTICE '✅ Test Blocks können hinzugefügt werden';
  RAISE NOTICE '✅ Test-Video Assignments können erstellt werden';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 NEXT: App neu laden und "Test erstellen" probieren!';
END $$;
