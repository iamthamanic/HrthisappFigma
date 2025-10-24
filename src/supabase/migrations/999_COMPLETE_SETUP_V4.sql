-- ================================================
-- COMPLETE SETUP V4 - ALL TABLES
-- ================================================
-- Run this in Supabase SQL Editor if tables are missing

-- ================================================
-- 1. QUIZ CONTENT TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS quiz_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'SKILLS',
  is_mandatory BOOLEAN DEFAULT false,
  duration INTEGER DEFAULT 10,
  passing_score INTEGER DEFAULT 80,
  questions JSONB DEFAULT '[]'::jsonb,
  xp_reward INTEGER DEFAULT 50,
  coin_reward INTEGER DEFAULT 25,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quiz_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read quiz_content" ON quiz_content;
DROP POLICY IF EXISTS "Only admins can modify quiz_content" ON quiz_content;

-- Policy: Everyone can read quizzes
CREATE POLICY "Anyone can read quiz_content"
  ON quiz_content
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Only admins can modify quiz_content"
  ON quiz_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- No demo quizzes inserted - use Learning Admin to create quizzes

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quiz_content_category ON quiz_content(category);
CREATE INDEX IF NOT EXISTS idx_quiz_content_order ON quiz_content(order_index);

-- ================================================
-- 2. VERIFY ALL TABLES EXIST
-- ================================================

-- Check if all required tables exist
DO $$
BEGIN
  -- List of required tables
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    RAISE NOTICE 'WARNING: users table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'time_records') THEN
    RAISE NOTICE 'WARNING: time_records table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leave_requests') THEN
    RAISE NOTICE 'WARNING: leave_requests table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'video_content') THEN
    RAISE NOTICE 'WARNING: video_content table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'quiz_content') THEN
    RAISE NOTICE 'WARNING: quiz_content table missing!';
  ELSE
    RAISE NOTICE 'SUCCESS: quiz_content table exists!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'learning_progress') THEN
    RAISE NOTICE 'WARNING: learning_progress table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'achievements') THEN
    RAISE NOTICE 'WARNING: achievements table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_achievements') THEN
    RAISE NOTICE 'WARNING: user_achievements table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coin_transactions') THEN
    RAISE NOTICE 'WARNING: coin_transactions table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'activity_feed') THEN
    RAISE NOTICE 'WARNING: activity_feed table missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications') THEN
    RAISE NOTICE 'WARNING: notifications table missing!';
  END IF;
END $$;

-- ================================================
-- 3. FINAL VERIFICATION
-- ================================================

-- Show all tables
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show quiz_content count
SELECT 
  'quiz_content' as table_name,
  COUNT(*) as row_count
FROM quiz_content;
