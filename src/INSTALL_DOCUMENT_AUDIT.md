# 🚀 Document Audit System - Installation

## Schnellstart (5 Minuten)

### Schritt 1: Öffne Supabase SQL Editor
1. Gehe zu deinem Supabase Dashboard
2. Klicke auf "SQL Editor" in der linken Sidebar
3. Klicke auf "New Query"

### Schritt 2: uploaded_by Spalte hinzufügen
Kopiere und füge diesen Code ein, dann klicke auf **Run**:

```sql
-- Füge uploaded_by Spalte hinzu
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Erstelle Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
```

✅ Erwartete Ausgabe: `Success. No rows returned`

### Schritt 3: Audit-System erstellen
Kopiere und füge diesen kompletten Code ein, dann klicke auf **Run**:

```sql
-- ============================================================================
-- DOCUMENT AUDIT SYSTEM - COMPLETE SETUP
-- ============================================================================

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

-- 2️⃣ Erstelle Indizes
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document_id ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user_id ON document_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_created_at ON document_audit_logs(created_at DESC);

-- 3️⃣ Erstelle Trigger-Funktion
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
      'new_category', NEW.category
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

-- 5️⃣ Erstelle View für Reporting
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
```

✅ Erwartete Ausgabe: `Success. No rows returned`

### Schritt 4: Teste das System
Führe diese Test-Query aus:

```sql
-- Zeige alle Tabellen-Spalten
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name IN ('uploaded_by', 'uploaded_at', 'title')
ORDER BY column_name;
```

✅ Erwartete Ausgabe: Du solltest `uploaded_by`, `uploaded_at`, und `title` sehen

### Schritt 5: Fertig! 🎉

Das Audit-System ist jetzt aktiv:
- ✅ Alle Dokument-Uploads werden automatisch geloggt
- ✅ Alle Dokument-Updates werden automatisch geloggt
- ✅ Alle Dokument-Deletes werden automatisch geloggt
- ✅ Downloads und Views können manuell geloggt werden

## Teste das Audit-System

### Test 1: Upload ein Dokument
1. Gehe zur Documents-Seite in HRthis
2. Lade ein Dokument hoch
3. Führe diese Query aus:

```sql
SELECT * FROM document_audit_report
WHERE action = 'UPLOAD'
ORDER BY created_at DESC
LIMIT 5;
```

✅ Du solltest den Upload sehen!

### Test 2: Ändere ein Dokument
1. Ändere den Titel oder die Beschreibung eines Dokuments
2. Führe diese Query aus:

```sql
SELECT * FROM document_audit_report
WHERE action = 'UPDATE'
ORDER BY created_at DESC
LIMIT 5;
```

✅ Du solltest das Update sehen!

## Nützliche Queries

### Alle Audit-Logs anzeigen
```sql
SELECT * FROM document_audit_report
ORDER BY created_at DESC
LIMIT 50;
```

### Statistik pro Action
```sql
SELECT 
  action,
  COUNT(*) as count
FROM document_audit_logs
GROUP BY action
ORDER BY count DESC;
```

### Aktivste User
```sql
SELECT 
  user_name,
  user_email,
  COUNT(*) as actions
FROM document_audit_report
WHERE user_name IS NOT NULL
GROUP BY user_name, user_email
ORDER BY actions DESC
LIMIT 10;
```

## Troubleshooting

### Problem: "column uploaded_by does not exist"
**Lösung:** Führe Schritt 2 nochmal aus

### Problem: "relation document_audit_logs does not exist"
**Lösung:** Führe Schritt 3 nochmal aus

### Problem: "syntax error at or near $"
**Lösung:** Kopiere den Code GENAU wie oben (mit `$$` nicht nur `$`)

## Nächste Schritte

1. ✅ **Jetzt:** Audit-System ist aktiv und loggt automatisch
2. 📊 **Später:** Erstelle eine Admin-UI zum Anzeigen der Logs
3. 📧 **Optional:** Benachrichtigungen bei kritischen Aktionen

## Support

Bei Fragen oder Problemen:
1. Überprüfe die SQL-Output-Meldungen
2. Stelle sicher, dass alle Schritte ausgeführt wurden
3. Teste mit den Test-Queries oben

✅ **Status:** System bereit zur Verwendung!
