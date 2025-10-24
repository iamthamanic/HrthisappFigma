# 📄 HRthis - Dokumente System Dokumentation

## Übersicht

Das Dokumente-System ermöglicht es Mitarbeitern, ihre persönlichen Dokumente hochzuladen, zu verwalten und herunterzuladen. Alle Dateien werden in Supabase Storage gespeichert, während Metadaten in der PostgreSQL-Datenbank liegen.

## ✅ Status: Mock-Daten entfernt

Alle Mock-Daten wurden aus dem System entfernt:

- ✅ **Frontend:** Keine hardcodierten Dokumente mehr
- ✅ **Datenbank:** SQL-Script zum Löschen von Demo-Daten verfügbar
- ✅ **Empty States:** Zeigen hilfreiche Nachrichten bei leeren Daten
- ✅ **Voll funktionsfähig:** Alle CRUD-Operationen implementiert

## 🗂️ System-Architektur

### Datenbank-Struktur

Die `documents` Tabelle enthält:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `user_id` | UUID | Referenz zu `users` |
| `title` | TEXT | Dokumententitel (z.B. "Arbeitsvertrag.pdf") |
| `category` | TEXT | Kategorie: LOHN, VERTRAG, SONSTIGES |
| `file_url` | TEXT | Public URL in Supabase Storage |
| `mime_type` | TEXT | MIME-Type (z.B. "application/pdf") |
| `file_size` | INTEGER | Dateigröße in Bytes |
| `assigned_by` | UUID | Optional: Admin der das Dokument zugewiesen hat |
| `uploaded_at` | TIMESTAMP | Upload-Zeitstempel |

### Storage-Struktur

Dateien werden in Supabase Storage gespeichert:

```
Bucket: documents
├── {user_id}/
│   ├── {timestamp}_{random}.pdf
│   ├── {timestamp}_{random}.docx
│   └── ...
```

## 🎨 Features

### 1. Dokumente hochladen

- **Upload-Dialog** mit Titel, Kategorie und Datei-Auswahl
- **Kategorien:**
  - 📄 Verträge (VERTRAG)
  - 💰 Gehaltsabrechnungen (LOHN)
  - 📁 Sonstiges (SONSTIGES)
- **Automatische Speicherung** in Supabase Storage
- **Metadaten-Speicherung** in PostgreSQL

### 2. Dokumente anzeigen

- **Alle Dokumente:** Vollständige Liste aller Dokumente
- **Zuletzt hinzugefügt:** Dokumente der letzten 7 Tage
- **Wichtig:** (Coming Soon) Markierte wichtige Dokumente

### 3. Dokumente durchsuchen

- **Suche nach:**
  - Dokumententitel
  - Kategorie
- **Echtzeit-Filterung** während der Eingabe

### 4. Dokumente herunterladen

- **One-Click Download** mit Browser-Download-Dialog
- **Originaler Dateiname** wird beibehalten

### 5. Dokumente löschen

- **Bestätigungs-Dialog** vor dem Löschen
- **Vollständige Löschung:**
  - Datei aus Supabase Storage
  - Metadaten aus Datenbank
- **Fehlerbehandlung** bei Storage-Problemen

### 6. Kategorie-Übersicht

- **Dashboard-Karten** mit Anzahl pro Kategorie
- **Farbcodierung:**
  - 🔵 Blau: Verträge
  - 🟢 Grün: Gehaltsabrechnungen
  - ⚫ Grau: Sonstiges

## 📱 Empty States

Wenn keine Dokumente vorhanden sind, zeigt das System hilfreiche Empty States:

### Alle Dokumente leer
```
📄 Noch keine Dokumente vorhanden
Lade dein erstes Dokument hoch, um zu beginnen
[Dokument hochladen Button]
```

### Suche ohne Ergebnis
```
🔍 Keine Dokumente gefunden
Versuche es mit anderen Suchbegriffen
```

### Zuletzt hinzugefügt leer
```
📅 Keine neuen Dokumente
In den letzten 7 Tagen wurden keine Dokumente hochgeladen
```

## 🔧 Verwendung

### Frontend-Integration

```typescript
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';

const { 
  documents, 
  loading, 
  loadDocuments, 
  uploadDocument, 
  deleteDocument 
} = useDocumentStore();

const { user } = useAuthStore();

// Dokumente laden
useEffect(() => {
  if (user?.id) {
    loadDocuments(user.id);
  }
}, [user?.id]);

// Dokument hochladen
const handleUpload = async (file: File, title: string, category: string) => {
  await uploadDocument(user.id, file, title, category);
};

// Dokument löschen
const handleDelete = async (documentId: string) => {
  await deleteDocument(documentId);
};
```

### Store-Funktionen

#### `loadDocuments(userId: string)`
Lädt alle Dokumente eines Users

```typescript
await loadDocuments(user.id);
```

#### `uploadDocument(userId, file, title, category)`
Lädt ein neues Dokument hoch

```typescript
await uploadDocument(
  user.id, 
  file, 
  'Arbeitsvertrag.pdf', 
  'VERTRAG'
);
```

#### `deleteDocument(documentId)`
Löscht ein Dokument (Storage + DB)

```typescript
await deleteDocument(documentId);
```

#### `downloadDocument(document)`
Lädt ein Dokument herunter

```typescript
await downloadDocument(document);
```

## 🚀 Setup & Deployment

### 1. Demo-Daten entfernen

Falls du Demo-Daten in der Datenbank hast, führe das SQL-Script aus:

```bash
# In Supabase SQL Editor ausführen:
/REMOVE_ALL_DOCUMENT_DEMO_DATA.sql
```

### 2. Storage Bucket erstellen

Der Storage Bucket wird automatisch vom Server erstellt. Falls manuell nötig:

```sql
-- In Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);
```

### 3. Storage Policies konfigurieren

```sql
-- Users können ihre eigenen Dokumente hochladen
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users können ihre eigenen Dokumente ansehen
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users können ihre eigenen Dokumente löschen
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 🔒 Sicherheit

### Row Level Security (RLS)

Die `documents` Tabelle sollte RLS-Policies haben:

```sql
-- Users können nur ihre eigenen Dokumente sehen
CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users können nur ihre eigenen Dokumente erstellen
CREATE POLICY "Users can create own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users können nur ihre eigenen Dokumente löschen
CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

### Admin-Zugriff

Admins können Dokumente für andere User hochladen:

```typescript
await assignDocument(file, userId, title, category, adminUserId);
```

## 📊 Daten-Migration

### Von Mock-Daten zu echten Daten

1. **SQL-Script ausführen:**
   ```bash
   /REMOVE_ALL_DOCUMENT_DEMO_DATA.sql
   ```

2. **Storage aufräumen:**
   - Gehe zu Supabase Dashboard → Storage
   - Wähle "documents" bucket
   - Lösche alle Test-Dateien

3. **Verifizierung:**
   ```sql
   SELECT COUNT(*) FROM documents;
   -- Sollte 0 sein
   ```

## 🧪 Testing

### Test-Szenarien

#### 1. Upload Test
```
1. Gehe zu /documents
2. Klicke "Dokument hochladen"
3. Wähle Datei (PDF, DOCX, etc.)
4. Gib Titel ein: "Test Dokument"
5. Wähle Kategorie: "Sonstiges"
6. Klicke "Hochladen"
7. ✅ Dokument erscheint in der Liste
```

#### 2. Download Test
```
1. Klicke auf Download-Icon
2. ✅ Browser startet Download
3. ✅ Datei hat korrekten Namen
```

#### 3. Delete Test
```
1. Klicke auf Löschen-Icon
2. Bestätige im Dialog
3. ✅ Dokument verschwindet aus Liste
4. ✅ Datei wird aus Storage gelöscht
```

#### 4. Search Test
```
1. Gebe Suchbegriff ein
2. ✅ Liste filtert in Echtzeit
3. Lösche Suchbegriff
4. ✅ Alle Dokumente werden wieder angezeigt
```

#### 5. Empty State Test
```
1. Lösche alle Dokumente
2. ✅ Empty State wird angezeigt
3. ✅ Upload-Button ist sichtbar
```

## 📈 Zukünftige Features

### Geplante Erweiterungen

- [ ] **Wichtige Dokumente:** Markierung von wichtigen Dokumenten
- [ ] **Dokumenten-Vorschau:** In-App Preview für PDFs
- [ ] **Versionierung:** Mehrere Versionen eines Dokuments
- [ ] **Ablaufdatum:** Warnung bei auslaufenden Dokumenten
- [ ] **Benachrichtigungen:** Bei neuen Dokumenten
- [ ] **Bulk-Upload:** Mehrere Dateien gleichzeitig
- [ ] **Ordner-Struktur:** Hierarchische Organisation
- [ ] **Dokument-Sharing:** Mit anderen Mitarbeitern teilen
- [ ] **OCR:** Text-Erkennung in gescannten Dokumenten
- [ ] **E-Signatur:** Dokumente digital signieren

## 🐛 Troubleshooting

### Problem: Upload schlägt fehl

**Lösung:**
```typescript
// Prüfe Storage Bucket Existenz
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);

// Prüfe RLS Policies
// In Supabase Dashboard → Storage → Policies
```

### Problem: Dokumente werden nicht angezeigt

**Lösung:**
```typescript
// Prüfe User-ID
console.log('User ID:', user?.id);

// Prüfe Datenbank
const { data, error } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', user.id);
console.log('Documents:', data, error);
```

### Problem: Download funktioniert nicht

**Lösung:**
```typescript
// Prüfe File URL
console.log('File URL:', document.file_url);

// Teste URL direkt im Browser
// Sollte Datei herunterladen
```

## 📚 Verwandte Dokumentation

- `/stores/documentStore.ts` - Store-Implementierung
- `/screens/DocumentsScreen.tsx` - UI-Komponente
- `/types/database.ts` - Type-Definitionen
- `/REMOVE_ALL_DOCUMENT_DEMO_DATA.sql` - Demo-Daten löschen

## 🎯 Best Practices

### 1. Datei-Validierung
```typescript
// Prüfe Dateigröße (max 5MB)
if (file.size > 5 * 1024 * 1024) {
  throw new Error('Datei zu groß (max 5MB)');
}

// Prüfe Dateityp
const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Dateityp nicht erlaubt');
}
```

### 2. Fehlerbehandlung
```typescript
try {
  await uploadDocument(...);
  toast.success('Upload erfolgreich!');
} catch (error) {
  console.error('Upload error:', error);
  toast.error(error.message || 'Upload fehlgeschlagen');
}
```

### 3. Loading States
```typescript
{loading ? (
  <LoadingSpinner />
) : documents.length === 0 ? (
  <EmptyState />
) : (
  <DocumentList />
)}
```

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Letzte Aktualisierung:** 2025-01-04