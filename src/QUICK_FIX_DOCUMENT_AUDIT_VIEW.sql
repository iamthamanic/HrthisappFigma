-- ================================================
-- QUICK FIX: DOCUMENT AUDIT REPORT VIEW
-- ================================================
-- FEHLER: Could not find table 'document_audit_report'
-- LÖSUNG: Diese SQL View erstellen
--
-- WIE:
-- 1. Kopiere dieses komplette SQL
-- 2. Öffne Supabase SQL Editor
-- 3. Paste & Run
-- 4. Hard Refresh im Browser
-- ================================================

-- Drop view if exists (safe to run multiple times)
DROP VIEW IF EXISTS document_audit_report;

-- Create document_audit_report view
-- Joins document_audit_logs with documents and users for enriched reporting
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
  d.file_path as document_file_path,
  -- User information
  CONCAT(u.first_name, ' ', u.last_name) as user_name,
  u.email as user_email
FROM 
  document_audit_logs dal
  LEFT JOIN documents d ON dal.document_id = d.id
  LEFT JOIN users u ON dal.user_id = u.id
ORDER BY 
  dal.created_at DESC;

-- Grant access to authenticated users
GRANT SELECT ON document_audit_report TO authenticated;

-- Add comment
COMMENT ON VIEW document_audit_report IS 
'Enriched document audit logs with user and document information for reporting';

-- ================================================
-- VERIFY: Test the view
-- ================================================
-- Uncomment and run to verify:
-- SELECT * FROM document_audit_report LIMIT 5;

-- ================================================
-- SUCCESS!
-- ================================================
-- ✅ View created
-- ✅ Logs-Tab should now work
-- ✅ Do a Hard Refresh (Ctrl+Shift+R)
-- ================================================
