-- ============================================================================
-- FIX DOCUMENTS - ADD UPLOADED_BY COLUMN (OPTIONAL)
-- ============================================================================
-- Fügt die uploaded_by Spalte zur documents Tabelle hinzu
-- Dies ermöglicht es, Uploader-Informationen zu tracken
--
-- ⚠️ WICHTIG: Die App funktioniert OHNE dieses Script!
-- ⚠️ Dieses Script ist komplett OPTIONAL und nur für zukünftiges Uploader-Tracking

-- 1️⃣ Füge uploaded_by Spalte hinzu
-- PostgreSQL 9.6+ unterstützt IF NOT EXISTS
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2️⃣ Teste die neue Spalte
SELECT 
  d.id,
  d.title,
  d.uploaded_by,
  d.uploaded_at,
  d.category
FROM documents d
LIMIT 5;

-- 3️⃣ Optional: Teste die Relationship mit users
SELECT 
  d.id,
  d.title,
  d.uploaded_by,
  u.first_name,
  u.last_name,
  u.email
FROM documents d
LEFT JOIN users u ON d.uploaded_by = u.id
LIMIT 5;

-- ✅ Fertig! Die uploaded_by Spalte wurde hinzugefügt (falls sie nicht existierte)
