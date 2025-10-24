-- ================================================
-- REMOVE ALL LEARNING DEMO DATA
-- ================================================
-- This script removes all demo/test data from learning tables
-- Run this in Supabase SQL Editor to clean your database

-- ================================================
-- 1. DELETE ALL DEMO QUIZZES
-- ================================================

DELETE FROM quiz_content;

-- ================================================
-- 2. DELETE ALL DEMO VIDEOS
-- ================================================

DELETE FROM video_content;

-- ================================================
-- 3. DELETE ALL SHOP ITEMS (if any demo items exist)
-- ================================================
-- Skip this - shop_items table doesn't exist yet
-- Will be created when shop feature is implemented

-- ================================================
-- 4. CLEAN UP PROGRESS DATA (optional)
-- ================================================
-- Uncomment if you want to also remove all learning progress

-- DELETE FROM learning_progress;

-- ================================================
-- 5. VERIFICATION
-- ================================================

-- Check if all data has been removed
SELECT 
  'quiz_content' as table_name,
  COUNT(*) as remaining_rows
FROM quiz_content
UNION ALL
SELECT 
  'video_content' as table_name,
  COUNT(*) as remaining_rows
FROM video_content
UNION ALL
SELECT 
  'learning_progress' as table_name,
  COUNT(*) as remaining_rows
FROM learning_progress;

-- ================================================
-- FINAL MESSAGE
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All demo learning data has been removed!';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Next Steps:';
  RAISE NOTICE '   1. Go to /learning/admin to create your first content';
  RAISE NOTICE '   2. Create videos in the "Videos" tab';
  RAISE NOTICE '   3. Create quizzes in the "Tests" tab';
  RAISE NOTICE '';
  RAISE NOTICE '💡 The learning system is now ready for your real content!';
END $$;
