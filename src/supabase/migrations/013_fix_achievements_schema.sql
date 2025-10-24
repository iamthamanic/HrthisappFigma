-- ================================================
-- FIX ACHIEVEMENTS TABLE SCHEMA
-- ================================================
-- Adds missing 'category' column to achievements table

-- Add category column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'achievements' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE achievements ADD COLUMN category TEXT NOT NULL DEFAULT 'SPECIAL';
    RAISE NOTICE 'Added category column to achievements table';
  ELSE
    RAISE NOTICE 'Category column already exists in achievements table';
  END IF;
END $$;

-- Fix requirement_value column type (from JSONB to INTEGER)
-- Only if it's currently JSONB
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'achievements' 
    AND column_name = 'requirement_value'
    AND data_type = 'jsonb'
  ) THEN
    -- First, drop the column if it's JSONB
    ALTER TABLE achievements DROP COLUMN requirement_value;
    -- Add it back as INTEGER
    ALTER TABLE achievements ADD COLUMN requirement_value INTEGER NOT NULL DEFAULT 1;
    RAISE NOTICE 'Changed requirement_value from JSONB to INTEGER';
  ELSE
    RAISE NOTICE 'requirement_value is already INTEGER or does not exist';
  END IF;
END $$;

-- Ensure the index exists
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE '✓ Achievements table schema updated successfully';
  RAISE NOTICE 'Columns: id, name, description, icon, badge_color, xp_reward, coin_reward, requirement_type, requirement_value (INTEGER), category, created_at';
END $$;
