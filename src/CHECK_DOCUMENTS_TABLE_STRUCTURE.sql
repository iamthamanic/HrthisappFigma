-- ============================================================================
-- CHECK DOCUMENTS TABLE STRUCTURE
-- ============================================================================
-- Zeigt alle Spalten der documents Tabelle an

-- 1️⃣ Alle Spalten der documents Tabelle anzeigen
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- 2️⃣ Teste eine Query mit existierenden Spalten
SELECT 
  id,
  title,
  category,
  file_name,
  uploaded_at,
  organization_id
FROM documents
LIMIT 5;

-- 3️⃣ Prüfe, ob uploaded_by oder created_at Spalten existieren
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'uploaded_by'
    ) THEN '✅ uploaded_by existiert'
    ELSE '❌ uploaded_by existiert NICHT'
  END as uploaded_by_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'created_at'
    ) THEN '✅ created_at existiert'
    ELSE '❌ created_at existiert NICHT'
  END as created_at_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'uploaded_at'
    ) THEN '✅ uploaded_at existiert'
    ELSE '❌ uploaded_at existiert NICHT'
  END as uploaded_at_status;
