# 📋 Document Audit System (v3.3.9)

## Übersicht
Vollständiges Audit-Logging-System für alle Dokument-Aktionen in HRthis.
Erfüllt Compliance-Anforderungen für Nachvollziehbarkeit und Datenschutz.

## Features

### ✅ Automatisches Logging
- **UPLOAD**: Dokument wurde hochgeladen (automatisch)
- **UPDATE**: Dokument-Metadaten wurden geändert (automatisch)
- **DELETE**: Dokument wurde gelöscht (automatisch)
- **DOWNLOAD**: Dokument wurde heruntergeladen (manuell)
- **VIEW**: Dokument wurde angesehen (manuell)

### ✅ Gespeicherte Informationen
- Document ID
- User ID (wer hat die Aktion durchgeführt)
- Action Type (UPLOAD, DOWNLOAD, etc.)
- Details (spezifische Informationen zur Aktion)
- IP-Adresse (optional)
- User-Agent (optional)
- Timestamp

## Installation

### 1️⃣ Datenbank-Setup

**Schritt 1: uploaded_by Spalte hinzufügen**
```sql
-- In Supabase SQL Editor ausführen
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
```

**Schritt 2: Audit-System erstellen**
```sql
-- In Supabase SQL Editor ausführen
-- Kopiere den Inhalt von DOCUMENT_AUDIT_SYSTEM.sql
```

### 2️⃣ Frontend-Integration

Der DocumentService ist bereits vorbereitet:
```typescript
import { DocumentService } from './services/HRTHIS_documentService';

const documentService = new DocumentService();
```

### 3️⃣ Audit-Logging verwenden

**Automatisches Logging** (bereits aktiv):
- Uploads werden automatisch geloggt (via Database Trigger)
- Updates werden automatisch geloggt (via Database Trigger)
- Deletes werden automatisch geloggt (via Database Trigger)

**Manuelles Logging** (für Downloads/Views):
```typescript
import { DocumentAuditService } from './services/HRTHIS_documentAuditService';

const auditService = new DocumentAuditService();

// Logge einen Download
await auditService.logDownload(documentId, userId);

// Logge einen View
await auditService.logView(documentId, userId);
```

## Verwendung

### Audit-Logs abrufen

```typescript
// Alle Logs für ein Dokument
const logs = await auditService.getDocumentAuditHistory(documentId);

// Alle Logs für einen User
const userLogs = await auditService.getUserAuditHistory(userId);

// Gefilterte Logs
const filteredLogs = await auditService.getAuditLogs({
  action: 'DOWNLOAD',
  start_date: '2025-01-01',
  end_date: '2025-01-31'
});
```

### Audit-Report erstellen

```typescript
// Detaillierter Report mit User- und Dokument-Informationen
const report = await auditService.getAuditReport({
  start_date: '2025-01-01',
  end_date: '2025-01-31'
});

// Report enthält:
// - action
// - created_at
// - document_title
// - document_category
// - user_name
// - user_email
// - details
```

### Statistiken abrufen

```typescript
const stats = await auditService.getAuditStats({
  start_date: '2025-01-01',
  end_date: '2025-01-31'
});

// Stats enthält:
// - total: Gesamtanzahl
// - by_action: Anzahl pro Action-Type
// - by_user: Anzahl pro User
```

## SQL-Abfragen

### Alle Audit-Logs anzeigen
```sql
SELECT * FROM document_audit_report
ORDER BY created_at DESC
LIMIT 100;
```

### Logs für ein bestimmtes Dokument
```sql
SELECT * FROM document_audit_report
WHERE document_id = 'YOUR-DOCUMENT-ID'
ORDER BY created_at DESC;
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

### Meistgeladene Dokumente
```sql
SELECT 
  d.title,
  d.category,
  COUNT(dal.id) as download_count
FROM documents d
LEFT JOIN document_audit_logs dal ON d.id = dal.document_id
WHERE dal.action = 'DOWNLOAD'
GROUP BY d.id, d.title, d.category
ORDER BY download_count DESC
LIMIT 10;
```

## Dateien

### SQL-Scripts
- ✅ `ADD_UPLOADED_BY_COLUMN.sql` - Fügt uploaded_by Spalte hinzu
- ✅ `DOCUMENT_AUDIT_SYSTEM.sql` - Erstellt Audit-System komplett

### TypeScript Services
- ✅ `/services/HRTHIS_documentService.ts` - Document Service mit Audit-Integration
- ✅ `/services/HRTHIS_documentAuditService.ts` - Audit Service

### Dokumentation
- ✅ `DOCUMENT_AUDIT_SYSTEM_README.md` - Diese Datei
- ✅ `DOCUMENTS_RELATIONSHIP_FIX.md` - Fix für uploaded_by Column

## Compliance

### DSGVO-konform
- ✅ Alle Dokument-Zugriffe werden geloggt
- ✅ User-Informationen sind nachvollziehbar
- ✅ Zeitstempel für alle Aktionen
- ✅ Löschungen werden dokumentiert

### Audit-Trail
- ✅ Vollständiger Verlauf für jedes Dokument
- ✅ Änderungshistorie (Alt- vs. Neuwerte)
- ✅ User-Attribution für alle Aktionen
- ✅ Unveränderliche Log-Einträge

## Nächste Schritte

### Sofort (erforderlich)
1. ✅ SQL-Scripts ausführen (`ADD_UPLOADED_BY_COLUMN.sql` + `DOCUMENT_AUDIT_SYSTEM.sql`)
2. ✅ Frontend-Code ist bereits vorbereitet

### Optional (später)
1. Audit-Report UI erstellen für Admins
2. Export-Funktion für Audit-Logs (CSV/PDF)
3. Automatische Benachrichtigungen bei kritischen Aktionen
4. Retention Policy für alte Logs (z.B. 2 Jahre aufbewahren)

## Testen

```sql
-- 1. Upload ein Dokument via Frontend
-- 2. Prüfe Audit-Log
SELECT * FROM document_audit_report
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ändere Dokument-Metadaten
-- 4. Prüfe Audit-Log erneut
SELECT * FROM document_audit_report
WHERE action = 'UPDATE'
ORDER BY created_at DESC
LIMIT 10;
```

## Version
- **Version:** 3.3.9
- **Datum:** 2025-01-12
- **Status:** ✅ Bereit zur Verwendung
