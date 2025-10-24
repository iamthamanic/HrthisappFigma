-- ============================================
-- FIX: Add missing database columns
-- COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- ============================================

-- 1. Add created_at to learning_progress
ALTER TABLE public.learning_progress
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add indexes for learning_progress
CREATE INDEX IF NOT EXISTS idx_learning_progress_created_at 
ON public.learning_progress(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id 
ON public.learning_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_video_id 
ON public.learning_progress(video_id);

-- 3. Add total_days to leave_requests
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS total_days INTEGER;

-- 4. Verify the changes
SELECT 
  'learning_progress.created_at' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'learning_progress' 
    AND column_name = 'created_at'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'leave_requests.total_days' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' 
    AND column_name = 'total_days'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;
