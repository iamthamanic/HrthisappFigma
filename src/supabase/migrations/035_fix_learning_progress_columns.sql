-- ============================================
-- FIX: Add missing columns
-- ============================================

-- 1. Add created_at column to learning_progress table
ALTER TABLE public.learning_progress
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_progress_created_at 
ON public.learning_progress(created_at DESC);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id 
ON public.learning_progress(user_id);

-- Add index for video lookups
CREATE INDEX IF NOT EXISTS idx_learning_progress_video_id 
ON public.learning_progress(video_id);

COMMENT ON COLUMN public.learning_progress.created_at IS 'Timestamp when the progress entry was first created';

-- 2. Add total_days column to leave_requests table (optional but helpful)
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS total_days INTEGER;

COMMENT ON COLUMN public.leave_requests.total_days IS 'Total number of days for the leave request';
