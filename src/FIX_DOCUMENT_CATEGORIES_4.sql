-- ============================================================================
-- FIX DOCUMENT CATEGORIES - ADD ZERTIFIKAT
-- ============================================================================
-- Erweitert die documents.category CHECK constraint um ZERTIFIKAT
-- WICHTIG: Dieses Script MUSS in Supabase SQL Editor ausgeführt werden!

-- 1️⃣ Drop old constraint
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_category_check;

-- 2️⃣ Add new constraint with 4 categories
ALTER TABLE documents
ADD CONSTRAINT documents_category_check 
CHECK (category IN ('VERTRAG', 'ZERTIFIKAT', 'LOHN', 'SONSTIGES'));

-- 3️⃣ Verify constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'documents_category_check';

-- ✅ FERTIG! Die 4 Kategorien sind jetzt erlaubt:
-- - VERTRAG
-- - ZERTIFIKAT (NEU!)
-- - LOHN
-- - SONSTIGES

-- 🧪 TEST: Versuche ein Test-Dokument einzufügen (optional)
/*
INSERT INTO documents (
  user_id,
  title,
  category,
  file_url
) VALUES (
  (SELECT id FROM users LIMIT 1),
  'Test Zertifikat',
  'ZERTIFIKAT',
  'https://example.com/test.pdf'
);

-- Cleanup test
DELETE FROM documents WHERE title = 'Test Zertifikat';
*/
