-- =====================================================
-- WIKI IMAGES BUCKET - ULTRA SIMPLE VERSION
-- Copy & Paste direkt in Supabase SQL Editor
-- =====================================================

-- Step 1: Bucket erstellen (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wiki-images',
  'wiki-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Alte Policies löschen (falls vorhanden)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload wiki images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete wiki images" ON storage.objects;

-- Step 3: Neue Policies erstellen
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'wiki-images' );

CREATE POLICY "Authenticated users can upload wiki images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wiki-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete wiki images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wiki-images' 
  AND auth.role() = 'authenticated'
);

-- Step 4: Verifizieren
SELECT 
  'wiki-images Bucket erfolgreich erstellt! ✅' AS status,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'wiki-images') AS bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%wiki%') AS policies_count;
