-- ============================================================================
-- v4.5.0: CREATE DOCUMENTS STORAGE BUCKET
-- ============================================================================
-- This fixes the "Bucket not found" error when viewing documents
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create 'documents' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can upload their own documents
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Policy: Users can read their own documents
CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Policy: Admins can read all documents
CREATE POLICY "Admins can read all documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- 6. Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7. Policy: Admins can delete all documents
CREATE POLICY "Admins can delete all documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- ============================================================================
-- VERIFY
-- ============================================================================

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================================
-- SUCCESS! ✅
-- ============================================================================
-- The 'documents' storage bucket is now created with proper RLS policies!
-- Documents can now be viewed in the app without "Bucket not found" error.
-- ============================================================================
