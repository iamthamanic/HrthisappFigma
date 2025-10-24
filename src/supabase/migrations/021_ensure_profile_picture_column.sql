-- ================================================
-- ENSURE PROFILE PICTURE AND PERSONAL INFO COLUMNS
-- ================================================
-- This migration safely adds profile_picture_url and personal info columns
-- Uses IF NOT EXISTS to avoid errors if columns already exist

-- Add profile_picture_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_picture_url TEXT;
    RAISE NOTICE '✓ Added profile_picture_url column to users table';
  ELSE
    RAISE NOTICE '→ profile_picture_url column already exists';
  END IF;
END $$;

-- Add personal info columns for Personalakte
DO $$ 
BEGIN
  -- private_email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'private_email'
  ) THEN
    ALTER TABLE users ADD COLUMN private_email TEXT;
    RAISE NOTICE '✓ Added private_email column';
  END IF;

  -- street_address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'street_address'
  ) THEN
    ALTER TABLE users ADD COLUMN street_address TEXT;
    RAISE NOTICE '✓ Added street_address column';
  END IF;

  -- postal_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE users ADD COLUMN postal_code TEXT;
    RAISE NOTICE '✓ Added postal_code column';
  END IF;

  -- city
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'city'
  ) THEN
    ALTER TABLE users ADD COLUMN city TEXT;
    RAISE NOTICE '✓ Added city column';
  END IF;

  -- iban
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'iban'
  ) THEN
    ALTER TABLE users ADD COLUMN iban TEXT;
    RAISE NOTICE '✓ Added iban column';
  END IF;

  -- bic
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'bic'
  ) THEN
    ALTER TABLE users ADD COLUMN bic TEXT;
    RAISE NOTICE '✓ Added bic column';
  END IF;

  -- shirt_size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'shirt_size'
  ) THEN
    ALTER TABLE users ADD COLUMN shirt_size TEXT;
    RAISE NOTICE '✓ Added shirt_size column';
  END IF;

  -- pants_size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'pants_size'
  ) THEN
    ALTER TABLE users ADD COLUMN pants_size TEXT;
    RAISE NOTICE '✓ Added pants_size column';
  END IF;

  -- shoe_size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'shoe_size'
  ) THEN
    ALTER TABLE users ADD COLUMN shoe_size TEXT;
    RAISE NOTICE '✓ Added shoe_size column';
  END IF;

  -- jacket_size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'jacket_size'
  ) THEN
    ALTER TABLE users ADD COLUMN jacket_size TEXT;
    RAISE NOTICE '✓ Added jacket_size column';
  END IF;
END $$;

-- Add index for faster queries on profile_picture_url
CREATE INDEX IF NOT EXISTS idx_users_profile_picture 
ON users(profile_picture_url) 
WHERE profile_picture_url IS NOT NULL;

-- Verify all columns exist
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name IN (
      'profile_picture_url', 'private_email', 'street_address', 
      'postal_code', 'city', 'iban', 'bic', 
      'shirt_size', 'pants_size', 'shoe_size', 'jacket_size'
    );
  
  IF column_count = 11 THEN
    RAISE NOTICE '✅ SUCCESS: All 11 personal info columns exist in users table';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Only % of 11 columns found in users table', column_count;
  END IF;
END $$;