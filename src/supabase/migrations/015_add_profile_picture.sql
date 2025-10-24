-- ================================================
-- ADD PROFILE PICTURE TO USERS
-- ================================================
-- Adds profile_picture_url to users table for personal photo

-- Add profile_picture_url column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture_url) WHERE profile_picture_url IS NOT NULL;

-- Add personal info columns for Personalakte
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS private_email TEXT,
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bic TEXT,
ADD COLUMN IF NOT EXISTS shirt_size TEXT,
ADD COLUMN IF NOT EXISTS pants_size TEXT,
ADD COLUMN IF NOT EXISTS shoe_size TEXT,
ADD COLUMN IF NOT EXISTS jacket_size TEXT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✓ Profile picture and personal info columns added to users table';
END $$;