-- =================================
-- PHASE 1 - DOCUMENTS STORAGE BUCKET
-- =================================
-- Erstellt Storage Bucket für Documents mit RLS Policies

-- Check ob Bucket bereits existiert
DO $$
BEGIN
  -- Bucket erstellen falls nicht existiert
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'make-f659121d-documents',
    'make-f659121d-documents',
    true, -- Public bucket (für einfachen Zugriff)
    20971520, -- 20MB max
    ARRAY[
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/jpg',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Storage bucket created or already exists';
END $$;

-- RLS Policies für Documents Bucket
-- Policy 1: Anyone can upload documents
CREATE POLICY IF NOT EXISTS "Anyone can upload documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'make-f659121d-documents');

-- Policy 2: Anyone can read documents
CREATE POLICY IF NOT EXISTS "Anyone can read documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'make-f659121d-documents');

-- Policy 3: Anyone can update documents
CREATE POLICY IF NOT EXISTS "Anyone can update documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'make-f659121d-documents')
WITH CHECK (bucket_id = 'make-f659121d-documents');

-- Policy 4: Anyone can delete documents
CREATE POLICY IF NOT EXISTS "Anyone can delete documents"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'make-f659121d-documents');

-- Verify
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE name = 'make-f659121d-documents';

-- Success Message
DO $$
BEGIN
  RAISE NOTICE '✅ PHASE 1 STORAGE BUCKET COMPLETE!';
  RAISE NOTICE '📦 Bucket: make-f659121d-documents';
  RAISE NOTICE '🔓 Public: true';
  RAISE NOTICE '📏 Max Size: 20MB';
  RAISE NOTICE '🔒 RLS Policies: 4 policies active';
END $$;
