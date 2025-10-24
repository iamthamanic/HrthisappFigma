-- ============================================================================
-- ADD uploaded_by COLUMN TO documents TABLE
-- ============================================================================
-- Fügt die uploaded_by Spalte zur documents Tabelle hinzu für Audit-Logging
-- WICHTIG: Dies ist ERFORDERLICH für vollständiges Audit-Logging!

-- 1️⃣ Füge uploaded_by Spalte hinzu
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2️⃣ Erstelle Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- 3️⃣ Teste die neue Spalte
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- ✅ Fertig! Die uploaded_by Spalte wurde hinzugefügt
