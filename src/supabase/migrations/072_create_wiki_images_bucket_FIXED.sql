-- =====================================================
-- WIKI IMAGES BUCKET - FIXED VERSION
-- Version: 4.12.31
-- =====================================================
-- Erstellt den wiki-images Bucket für Wiki-Artikel Bilder
-- WICHTIG: Diese Version funktioniert ohne IF NOT EXISTS
-- =====================================================

-- Bucket erstellen (nur wenn nicht existiert)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wiki-images',
  'wiki-images',
  true, -- Public bucket für Bilder in Wiki-Artikeln
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies: Alte löschen, neue erstellen
-- (Vermeidet "IF NOT EXISTS" Syntax-Fehler)

-- Policy 1: Public Access (Lesen)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'wiki-images' );

-- Policy 2: Authenticated Upload
DROP POLICY IF EXISTS "Authenticated users can upload wiki images" ON storage.objects;
CREATE POLICY "Authenticated users can upload wiki images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wiki-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Authenticated Delete
DROP POLICY IF EXISTS "Authenticated users can delete wiki images" ON storage.objects;
CREATE POLICY "Authenticated users can delete wiki images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wiki-images' 
  AND auth.role() = 'authenticated'
);

-- Bestätigung
DO $$
BEGIN
  RAISE NOTICE '✅ wiki-images Bucket erfolgreich erstellt!';
  RAISE NOTICE 'Bucket ist public, 5MB Limit, erlaubt: JPG, PNG, GIF, WebP';
  RAISE NOTICE '🔒 RLS Policies: Public Read, Authenticated Upload/Delete';
END $$;
