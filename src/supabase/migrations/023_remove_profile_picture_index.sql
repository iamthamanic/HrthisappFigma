-- =====================================================
-- Migration: Remove profile_picture Index
-- =====================================================
-- Problem: B-Tree index has maximum size of 2704 bytes
-- Base64 images (even 200x200 @ 60%) exceed this limit
-- Solution: Drop the index - we don't need to search by profile_picture
-- =====================================================

-- Drop the problematic index if it exists
DROP INDEX IF EXISTS idx_users_profile_picture;

-- We don't need an index on profile_picture because:
-- 1. We never search/filter by profile_picture
-- 2. We only access it via user_id (which is already indexed as primary key)
-- 3. Base64 strings are too large for B-Tree indexes

-- Note: If full-text search on profile_picture is needed in the future,
-- use a functional index with MD5 hash instead:
-- CREATE INDEX idx_users_profile_picture_hash ON users (MD5(profile_picture));

-- Verify the index is removed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_profile_picture'
  ) THEN
    RAISE EXCEPTION 'Index idx_users_profile_picture still exists!';
  ELSE
    RAISE NOTICE '✅ Index idx_users_profile_picture successfully removed';
  END IF;
END $$;
