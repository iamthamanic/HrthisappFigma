-- =====================================================================================
-- MIGRATION 064: ADD MISSING USER ADDRESS COLUMNS
-- =====================================================================================
-- Description: Adds missing address fields to users table
-- Version: 1.0.0
-- Date: 2025-10-17
-- =====================================================================================

-- Add house_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'house_number'
  ) THEN
    ALTER TABLE users ADD COLUMN house_number TEXT;
    COMMENT ON COLUMN users.house_number IS 'House number for user address';
  END IF;
END $$;

-- =====================================================================================
-- ✅ MIGRATION 064 COMPLETE
-- =====================================================================================

COMMENT ON TABLE users IS 'v1.0.0 - Users table with complete address fields including house_number';
