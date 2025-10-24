-- =============================================
-- QUICK FIX: USER AVATARS RLS POLICY
-- =============================================
-- Fixes: "new row violates row-level security policy for table user_avatars"
-- 
-- Problem: Users cannot create/update their own avatar data
-- Solution: Add proper RLS policies for user_avatars table
--
-- COPY & PASTE THIS INTO SUPABASE SQL EDITOR
-- =============================================

-- First, check if table exists and create if needed
CREATE TABLE IF NOT EXISTS public.user_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Avatar customization
  skin_tone TEXT DEFAULT 'light',
  hair_style TEXT DEFAULT 'short',
  hair_color TEXT DEFAULT 'brown',
  facial_hair TEXT DEFAULT 'none',
  glasses BOOLEAN DEFAULT false,
  hat TEXT DEFAULT 'none',
  outfit TEXT DEFAULT 'casual',
  background_color TEXT DEFAULT '#f0f0f0',
  -- Emoji fallback (legacy)
  emoji TEXT DEFAULT '👤',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one avatar per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own avatar" ON public.user_avatars;
DROP POLICY IF EXISTS "Users can insert their own avatar" ON public.user_avatars;
DROP POLICY IF EXISTS "Users can update their own avatar" ON public.user_avatars;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON public.user_avatars;

-- Create new policies
-- 1. SELECT: Users can view their own avatar
CREATE POLICY "Users can view their own avatar"
  ON public.user_avatars
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. INSERT: Users can create their own avatar
CREATE POLICY "Users can insert their own avatar"
  ON public.user_avatars
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
  ON public.user_avatars
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. DELETE: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON public.user_avatars
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_user_avatars_updated_at ON public.user_avatars;

-- Create trigger for updated_at
CREATE TRIGGER update_user_avatars_updated_at
  BEFORE UPDATE ON public.user_avatars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.user_avatars TO authenticated;
GRANT ALL ON public.user_avatars TO service_role;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_avatars_user_id ON public.user_avatars(user_id);

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this to verify the policies are created:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_avatars'
ORDER BY policyname;

-- =============================================
-- SUCCESS!
-- =============================================
-- ✅ user_avatars table created/updated
-- ✅ RLS enabled
-- ✅ Policies created (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Trigger for updated_at created
-- ✅ Indexes created
-- 
-- Users can now:
-- - View their own avatar
-- - Create their own avatar
-- - Update their own avatar
-- - Delete their own avatar
-- =============================================
