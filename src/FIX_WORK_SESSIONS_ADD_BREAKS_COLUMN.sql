-- ============================================================
-- FIX: Add missing 'breaks' column to work_sessions table
-- ============================================================
-- Issue: Edge Function expects 'breaks' JSONB column but it doesn't exist
-- Test: TEST 10 failed with "Could not find the 'breaks' column"
-- Date: 2025-10-29
-- Version: Zeiterfassung v2.1.0 Schema Fix
-- ============================================================

-- Check if column exists (informational query - run separately)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'work_sessions' AND column_name = 'breaks';

-- Add 'breaks' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'work_sessions' 
    AND column_name = 'breaks'
  ) THEN
    ALTER TABLE work_sessions 
    ADD COLUMN breaks JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE '✅ Column "breaks" added to work_sessions table';
  ELSE
    RAISE NOTICE '⚠️  Column "breaks" already exists';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN work_sessions.breaks IS 
'Array of break periods: [{"start": "ISO8601", "end": "ISO8601" or null}]';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- 1. Check column exists
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'work_sessions' 
AND column_name = 'breaks';

-- 2. Check all work_sessions columns
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'work_sessions'
ORDER BY ordinal_position;

-- 3. Test data
-- Should show breaks column with '[]' default
SELECT 
  id, 
  user_id, 
  start_time, 
  end_time, 
  breaks
FROM work_sessions 
LIMIT 5;

-- ============================================================
-- COMPLETE! 🎉
-- ============================================================
-- After running this migration:
-- 1. Re-test TEST 10 (Break-Start)
-- 2. Re-test TEST 11 (Break-End)
-- 3. All break functionality should work!
-- ============================================================
