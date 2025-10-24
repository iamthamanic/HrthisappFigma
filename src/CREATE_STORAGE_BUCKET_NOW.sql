-- =====================================================
-- STORAGE BUCKET FIX - KOPIERE DAS JETZT!
-- =====================================================
-- 
-- Problem: Storage Bucket existiert nicht!
-- Lösung: Bucket manuell erstellen (SQL kann das nicht!)
--
-- =====================================================

-- ❌ SQL KANN KEINEN BUCKET ERSTELLEN!
-- ❌ Das MUSS im Supabase UI gemacht werden!

-- =====================================================
-- SCHRITT-FÜR-SCHRITT ANLEITUNG:
-- =====================================================

-- 1️⃣ Gehe zu Supabase Dashboard:
--    https://supabase.com/dashboard/project/DEIN_PROJECT_ID

-- 2️⃣ Klicke in der linken Sidebar auf "Storage"

-- 3️⃣ Klicke "New bucket" (oben rechts)

-- 4️⃣ Fülle die Felder aus:
--    
--    Name: make-f659121d-announcements
--    Public bucket: ✅ JA (aktivieren!)
--    
-- 5️⃣ Klicke "Create bucket"

-- 6️⃣ JETZT kannst du die Policies erstellen:

-- =====================================================
-- BUCKET POLICIES (NUR WENN BUCKET EXISTIERT!)
-- =====================================================

-- Policy 1: Upload erlauben (INSERT)
CREATE POLICY "Allow authenticated users to upload announcements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'make-f659121d-announcements');

-- Policy 2: Lesen erlauben (SELECT)
CREATE POLICY "Allow public read access to announcements"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'make-f659121d-announcements');

-- Policy 3: Update erlauben (UPDATE)
CREATE POLICY "Allow authenticated users to update announcements"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'make-f659121d-announcements');

-- Policy 4: Delete erlauben (DELETE)
CREATE POLICY "Allow authenticated users to delete announcements"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'make-f659121d-announcements');

-- =====================================================
-- VERIFY (nach dem Erstellen):
-- =====================================================

-- Prüfe ob Bucket existiert:
SELECT 
  name,
  public,
  created_at
FROM storage.buckets
WHERE name = 'make-f659121d-announcements';

-- Erwartetes Ergebnis:
-- name                            | public | created_at
-- make-f659121d-announcements    | true   | 2025-01-12 ...

-- =====================================================
-- WICHTIG:
-- =====================================================
-- 
-- ⚠️ Der Bucket heißt "make-f659121d-announcements"
-- ⚠️ NICHT "hrthis-uploads"!
-- ⚠️ SQL kann KEINEN Bucket erstellen - nur im UI!
-- ⚠️ Policies erst NACH Bucket-Erstellung ausführen!
--
-- =====================================================
