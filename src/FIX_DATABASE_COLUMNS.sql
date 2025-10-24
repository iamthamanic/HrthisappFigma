-- ============================================
-- QUICK FIX: Database Column Errors
-- Copy & Paste this into Supabase SQL Editor
-- ============================================

-- Error 1: column learning_progress.created_at does not exist
-- Fix: Add created_at column to learning_progress
ALTER TABLE public.learning_progress
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_progress_created_at 
ON public.learning_progress(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id 
ON public.learning_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_video_id 
ON public.learning_progress(video_id);

-- Error 2: column leave_requests.leave_type does not exist
-- Note: The column is already named 'type' in the database - code has been fixed
-- But we add total_days column which may be useful
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS total_days INTEGER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database columns fixed successfully!';
  RAISE NOTICE '   - learning_progress.created_at added';
  RAISE NOTICE '   - leave_requests.total_days added';
  RAISE NOTICE '   - Code references to leave_type changed to type';
END $$;
