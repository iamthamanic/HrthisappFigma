-- ============================================================
-- FIX: Add missing 'calculated_hours' column to work_sessions table
-- ============================================================
-- Issue: Column work_sessions.calculated_hours does not exist
-- Date: 2025-11-03
-- Version: v4.12.2
-- ============================================================

-- Add 'calculated_hours' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'work_sessions' 
    AND column_name = 'calculated_hours'
  ) THEN
    -- Add calculated_hours column
    ALTER TABLE work_sessions 
    ADD COLUMN calculated_hours DECIMAL(10,2);
    
    RAISE NOTICE '✅ Column "calculated_hours" added to work_sessions table';
  ELSE
    RAISE NOTICE '⚠️  Column "calculated_hours" already exists';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN work_sessions.calculated_hours IS 
'Calculated work hours (in decimal format). Automatically computed from start_time, end_time, and breaks.';

-- ============================================================
-- Create or replace trigger to auto-calculate hours
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_work_session_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if end_time is set
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    -- Calculate hours in decimal format
    NEW.calculated_hours = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0;
    
    -- Subtract break time if available
    IF NEW.break_minutes IS NOT NULL AND NEW.break_minutes > 0 THEN
      NEW.calculated_hours = NEW.calculated_hours - (NEW.break_minutes / 60.0);
    END IF;
    
    -- Ensure non-negative
    IF NEW.calculated_hours < 0 THEN
      NEW.calculated_hours = 0;
    END IF;
    
    -- Round to 2 decimal places
    NEW.calculated_hours = ROUND(NEW.calculated_hours::numeric, 2);
  ELSE
    -- If session is not complete, set to NULL
    NEW.calculated_hours = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_calculate_work_hours ON work_sessions;

CREATE TRIGGER trigger_calculate_work_hours
  BEFORE INSERT OR UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_work_session_hours();

-- ============================================================
-- Backfill existing records
-- ============================================================

-- Update existing records that have start_time and end_time
UPDATE work_sessions
SET calculated_hours = CASE
  WHEN end_time IS NOT NULL AND start_time IS NOT NULL THEN
    ROUND(
      (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0) - 
      COALESCE(break_minutes / 60.0, 0)
    , 2)
  ELSE NULL
END
WHERE calculated_hours IS NULL;

-- ============================================================
-- Verification Query
-- ============================================================

-- Run this to verify the fix:
-- SELECT 
--   id, 
--   start_time, 
--   end_time, 
--   break_minutes,
--   calculated_hours,
--   ROUND((EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0) - COALESCE(break_minutes / 60.0, 0), 2) as expected_hours
-- FROM work_sessions
-- WHERE end_time IS NOT NULL
-- LIMIT 10;

RAISE NOTICE '✅ Migration complete! calculated_hours column added and populated.';
