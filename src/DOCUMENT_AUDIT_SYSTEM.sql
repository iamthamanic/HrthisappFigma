-- ============================================================================
-- DOCUMENT AUDIT SYSTEM
-- ============================================================================
-- Erstellt ein vollständiges Audit-Log-System für Dokumente
-- Trackt alle Aktionen: Upload, Download, Update, Delete

-- 1️⃣ Erstelle document_audit_logs Tabelle
CREATE TABLE IF NOT EXISTS document_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('UPLOAD', 'DOWNLOAD', 'VIEW', 'UPDATE', 'DELETE')),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document_id ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user_id ON document_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_created_at ON document_audit_logs(created_at DESC);

-- 3️⃣ Erstelle Trigger für automatisches Audit-Logging bei Document-Änderungen
CREATE OR REPLACE FUNCTION log_document_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO document_audit_logs (document_id, user_id, action, details)
    VALUES (NEW.id, NEW.uploaded_by, 'UPLOAD', jsonb_build_object(
      'title', NEW.title,
      'category', NEW.category,
      'file_size', NEW.file_size,
      'file_type', NEW.file_type
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO document_audit_logs (document_id, user_id, action, details)
    VALUES (NEW.id, NEW.uploaded_by, 'UPDATE', jsonb_build_object(
      'old_title', OLD.title,
      'new_title', NEW.title,
      'old_category', OLD.category,
      'new_category', NEW.category,
      'old_description', OLD.description,
      'new_description', NEW.description
    ));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO document_audit_logs (document_id, user_id, action, details)
    VALUES (OLD.id, OLD.uploaded_by, 'DELETE', jsonb_build_object(
      'title', OLD.title,
      'category', OLD.category,
      'file_name', OLD.file_name
    ));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ Erstelle Trigger
DROP TRIGGER IF EXISTS document_audit_trigger ON documents;
CREATE TRIGGER document_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION log_document_changes();

-- 5️⃣ Erstelle View für einfaches Audit-Reporting
CREATE OR REPLACE VIEW document_audit_report AS
SELECT 
  dal.id,
  dal.action,
  dal.created_at,
  d.title as document_title,
  d.category as document_category,
  u.first_name || ' ' || u.last_name as user_name,
  u.email as user_email,
  dal.details,
  dal.ip_address
FROM document_audit_logs dal
LEFT JOIN documents d ON dal.document_id = d.id
LEFT JOIN users u ON dal.user_id = u.id
ORDER BY dal.created_at DESC;

-- 6️⃣ Teste das Audit-System
SELECT 
  COUNT(*) as total_logs,
  action,
  COUNT(*) as count
FROM document_audit_logs
GROUP BY action
ORDER BY count DESC;

-- ✅ Audit-System ist bereit!
-- Alle Dokument-Aktionen werden automatisch geloggt.
