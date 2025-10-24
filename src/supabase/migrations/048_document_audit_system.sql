-- ============================================================================
-- MIGRATION 048: COMPLETE DOCUMENT AUDIT SYSTEM
-- ============================================================================
-- Erstellt ein vollständiges Audit-Log-System für Dokumente
-- Trackt alle Aktionen: Upload, Download, View, Update, Delete

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

-- 3️⃣ Erstelle Trigger-Funktion für automatisches Audit-Logging
CREATE OR REPLACE FUNCTION log_document_changes()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO document_audit_logs (document_id, user_id, action, details)
    VALUES (NEW.id, NEW.user_id, 'UPLOAD', jsonb_build_object(
      'title', NEW.title,
      'category', NEW.category,
      'file_size', NEW.file_size,
      'mime_type', NEW.mime_type,
      'file_url', NEW.file_url
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO document_audit_logs (document_id, user_id, action, details)
    VALUES (NEW.id, NEW.user_id, 'UPDATE', jsonb_build_object(
      'old_title', OLD.title,
      'new_title', NEW.title,
      'old_category', OLD.category,
      'new_category', NEW.category
    ));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO document_audit_logs (document_id, user_id, action, details)
    VALUES (OLD.id, OLD.user_id, 'DELETE', jsonb_build_object(
      'title', OLD.title,
      'category', OLD.category,
      'file_url', OLD.file_url
    ));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ Erstelle Trigger
DROP TRIGGER IF EXISTS document_audit_trigger ON documents;
CREATE TRIGGER document_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION log_document_changes();

-- 5️⃣ Erstelle View für Audit-Reporting mit enriched data
DROP VIEW IF EXISTS document_audit_report;
CREATE VIEW document_audit_report AS
SELECT 
  dal.id,
  dal.document_id,
  dal.user_id,
  dal.action,
  dal.details,
  dal.ip_address,
  dal.user_agent,
  dal.created_at,
  -- Document information
  d.title as document_title,
  d.category as document_category,
  d.file_url as document_file_url,
  -- User information
  CONCAT(u.first_name, ' ', u.last_name) as user_name,
  u.email as user_email
FROM 
  document_audit_logs dal
  LEFT JOIN documents d ON dal.document_id = d.id
  LEFT JOIN users u ON dal.user_id = u.id
ORDER BY 
  dal.created_at DESC;

-- 6️⃣ Grant permissions
GRANT SELECT ON document_audit_logs TO authenticated;
GRANT SELECT ON document_audit_report TO authenticated;

-- 7️⃣ Add comments
COMMENT ON TABLE document_audit_logs IS 
'Audit trail for all document actions (upload, download, view, update, delete)';

COMMENT ON VIEW document_audit_report IS 
'Enriched document audit logs with user and document information for reporting';

-- ✅ COMPLETE!
-- All document actions are now automatically logged
-- Use document_audit_report view for easy querying
