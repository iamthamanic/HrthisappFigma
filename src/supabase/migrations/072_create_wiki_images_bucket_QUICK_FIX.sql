-- =====================================================
-- WIKI IMAGES BUCKET - QUICK FIX
-- Version: 4.12.30
-- =====================================================
-- Erstellt den wiki-images Bucket für Wiki-Artikel Bilder
-- WICHTIG: NUR AUSFÜHREN wenn Bild-Upload fehlschlägt!
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

-- RLS Policy: Jeder kann lesen (public bucket)
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'wiki-images' );

-- RLS Policy: Authenticated users können hochladen
CREATE POLICY IF NOT EXISTS "Authenticated users can upload wiki images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wiki-images' 
  AND auth.role() = 'authenticated'
);

-- RLS Policy: Authenticated users können ihre eigenen Bilder löschen
CREATE POLICY IF NOT EXISTS "Authenticated users can delete wiki images"
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
END $$;
