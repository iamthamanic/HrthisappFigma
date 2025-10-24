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

CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document_id ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user_id ON document_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_created_at ON document_audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION log_document_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS document_audit_trigger ON documents;
CREATE TRIGGER document_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION log_document_changes();

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
  d.title as document_title,
  d.category as document_category,
  d.file_url as document_file_url,
  CONCAT(u.first_name, ' ', u.last_name) as user_name,
  u.email as user_email
FROM 
  document_audit_logs dal
  LEFT JOIN documents d ON dal.document_id = d.id
  LEFT JOIN users u ON dal.user_id = u.id
ORDER BY 
  dal.created_at DESC;

GRANT SELECT ON document_audit_logs TO authenticated;
GRANT SELECT ON document_audit_report TO authenticated;
