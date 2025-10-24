-- ================================================
-- REMOVE DEMO QUIZZES
-- ================================================
-- Removes all demo quiz data from the database

-- Delete all existing quiz content
DELETE FROM quiz_content;

-- Reset sequence if needed
-- (This ensures new quizzes start from a clean slate)

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ All demo quizzes have been removed';
  RAISE NOTICE 'ℹ️  Use Learning Admin (/learning/admin) to create new quizzes';
END $$;
