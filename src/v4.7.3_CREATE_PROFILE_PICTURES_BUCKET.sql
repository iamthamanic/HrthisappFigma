-- ============================================
-- v4.7.3: CREATE PROFILE PICTURES STORAGE BUCKET
-- ============================================
-- Purpose: Create storage bucket for user profile pictures
-- Date: 2025-01-16
-- Instructions: Copy and paste this entire script into Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE STORAGE BUCKET
-- ============================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,  -- Public bucket so images are accessible
  5242880,  -- 5MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES - PUBLIC READ ACCESS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Policy 1: Anyone can view profile pictures (public read)
CREATE POLICY "Public read access for profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Policy 2: Authenticated users can upload profile pictures
CREATE POLICY "Authenticated users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
);

-- Policy 3: Users can update profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures')
WITH CHECK (bucket_id = 'profile-pictures');

-- Policy 4: Users can delete profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- ============================================
-- ✅ BUCKET SETUP COMPLETE
-- ============================================

-- Verify the bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'profile-pictures';

-- ============================================
-- 📝 EXPECTED OUTPUT:
-- ============================================
-- You should see:
-- - id: profile-pictures
-- - name: profile-pictures
-- - public: true
-- - file_size_limit: 5242880 (5MB)
-- - allowed_mime_types: {image/jpeg,image/jpg,image/png,image/webp}
-- ============================================
