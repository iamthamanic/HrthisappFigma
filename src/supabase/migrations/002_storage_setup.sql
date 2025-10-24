-- HRthis Storage Setup
-- Create buckets and policies for file storage

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create videos bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'videos',
  'videos',
  false,
  104857600 -- 100MB limit for videos
)
ON CONFLICT (id) DO NOTHING;

-- Create profile-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES - DOCUMENTS
-- ============================================

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can access all documents
CREATE POLICY "Admins can access all documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- STORAGE POLICIES - VIDEOS
-- ============================================

-- Everyone authenticated can view videos
CREATE POLICY "Authenticated users can view videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos' AND
  auth.uid() IS NOT NULL
);

-- Only admins can upload videos
CREATE POLICY "Admins can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- Only admins can update videos
CREATE POLICY "Admins can update videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- Only admins can delete videos
CREATE POLICY "Admins can delete videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- STORAGE POLICIES - PROFILE IMAGES
-- ============================================

-- Everyone can view profile images (public bucket)
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Users can upload their own profile image
CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own profile image
CREATE POLICY "Users can update own profile image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile image
CREATE POLICY "Users can delete own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get file extension
CREATE OR REPLACE FUNCTION get_file_extension(filename TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(SUBSTRING(filename FROM '\.([^.]*)$'));
END;
$$ LANGUAGE plpgsql;

-- Function to validate file size
CREATE OR REPLACE FUNCTION validate_file_size(file_size BIGINT, max_size BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN file_size <= max_size;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS FOR FILE METADATA
-- ============================================

-- Automatically delete storage object when document record is deleted
CREATE OR REPLACE FUNCTION delete_storage_object()
RETURNS TRIGGER AS $$
DECLARE
  file_path TEXT;
BEGIN
  -- Extract file path from URL
  file_path := SUBSTRING(OLD.file_url FROM 'documents/(.*)$');
  
  -- Delete from storage
  PERFORM storage.delete_object('documents', file_path);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_document_delete
  BEFORE DELETE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION delete_storage_object();

-- ============================================
-- SEED TEST DATA (Optional for development)
-- ============================================

-- Uncomment to add test notifications
/*
INSERT INTO public.notifications (user_id, title, message, type) VALUES
(
  (SELECT id FROM public.users WHERE email = 'max.mustermann@hrthis.de'),
  'Willkommen bei HRthis!',
  'Dein Account wurde erfolgreich erstellt. Viel Erfolg!',
  'SUCCESS'
);
*/
