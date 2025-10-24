# Organigram Canvas - Debug Guide

## Problem: Verbindungen nicht sichtbar in User-View

### Häufige Ursachen

1. **Connections nicht published**
   - Admin hat Nodes & Connections erstellt
   - Admin hat NICHT auf "Push Live" geklickt
   - → User sehen nur published data (`is_published = true`)

2. **Node ID Mismatch**
   - Draft Nodes haben UUIDs wie `df2b8734-6d6d-4f2b-9e52-ab95906d8169`
   - Published Nodes haben NEUE UUIDs wie `a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6`
   - Connections müssen korrekte Node IDs referenzieren (automatisch gemappt)

3. **Performance Problem**
   - Zu viele einzelne DB-Calls
   - → Behoben durch Batch Inserts

---

## Debug Schritte

### 1. Console Logs checken

**In Admin View:**
```
🚀 Starting publish with X nodes and Y connections
✅ Inserted X draft nodes
✅ Inserted X published nodes  
✅ Inserted Y draft connections
✅ Inserted Y published connections
```

**In User View:**
```
📊 User View - Loaded X published nodes
Node IDs: [{ id: "...", title: "..." }, ...]
🔗 User View - Loaded Y published connections
Connection details: [{ id: "...", from: "...", to: "..." }]
```

### 2. Datenbank direkt checken

**Supabase SQL Editor:**

```sql
-- Check published nodes
SELECT id, title, is_published 
FROM org_nodes 
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY is_published DESC, created_at;

-- Check published connections
SELECT 
  id,
  source_node_id,
  target_node_id,
  is_published
FROM node_connections 
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY is_published DESC, created_at;

-- Check for orphaned connections (connections pointing to non-existent nodes)
SELECT 
  c.id as connection_id,
  c.source_node_id,
  c.target_node_id,
  c.is_published,
  n1.id as source_exists,
  n2.id as target_exists
FROM node_connections c
LEFT JOIN org_nodes n1 ON c.source_node_id = n1.id
LEFT JOIN org_nodes n2 ON c.target_node_id = n2.id
WHERE c.organization_id = 'YOUR_ORG_ID'
  AND c.is_published = true
  AND (n1.id IS NULL OR n2.id IS NULL);
```

### 3. Typische Probleme & Lösungen

#### Problem: "Noch kein Organigram verfügbar"
**Ursache:** Keine published nodes in der DB  
**Lösung:** 
1. Als Admin einloggen
2. Organigram Canvas öffnen
3. Im "Bearbeiten" Modus Nodes erstellen
4. Auf "Push Live" klicken

#### Problem: Nodes sichtbar, aber keine Verbindungen
**Ursache:** Node ID Mismatch oder connections nicht published  
**Lösung:**
1. Console logs checken (siehe oben)
2. Sicherstellen dass "Push Live" geklickt wurde
3. DB checken ob published connections existieren
4. Orphaned connections query ausführen

#### Problem: Sehr langsames Laden
**Ursache:** Alte Version mit einzelnen INSERT calls  
**Lösung:** 
- ✅ Bereits behoben durch Batch Inserts in dieser Version
- Falls immer noch langsam: Anzahl der Nodes/Connections reduzieren

---

## Workflow

### Admin Workflow
1. **Organigram Canvas** Tab öffnen
2. Auf **"Bearbeiten"** klicken
3. Nodes mit **"Node hinzufügen"** erstellen
4. Nodes per Drag & Drop positionieren
5. Connections erstellen:
   - Auf Pin Point hovern (erscheint beim Node-Hover)
   - Von Pin Point ziehen
   - Auf Ziel-Pin Point loslassen
6. **"Push Live"** klicken
7. Toast-Nachricht: "X Nodes & Y Verbindungen publiziert"

**Wichtig:** Jedes Mal wenn "Push Live" geklickt wird:
- Draft Nodes behalten ihre UUIDs
- Published Nodes bekommen NEUE UUIDs (für Versionierung)
- Connections werden automatisch auf die neuen UUIDs gemappt

### User Workflow
1. **Übersicht** Tab öffnen
2. **"Organigram"** Karte finden
3. Auf **"Anzeigen"** klicken
4. Organigram wird ausgeklappt
5. Read-only View: Nodes & Connections sichtbar

---

## Performance Optimierungen

### Problem 1: Zu viele DB Calls beim Publishing

**Vorher (Langsam):**
```typescript
// ❌ BAD: 100 Nodes = 200 DB calls
for (const node of nodes) {
  await supabase.from('org_nodes').insert({ ...node, is_published: false });
  await supabase.from('org_nodes').insert({ ...node, is_published: true });
}
```

**Nachher (Schnell):**
```typescript
// ✅ GOOD: 100 Nodes = 2 DB calls
const draftNodes = nodes.map(node => ({ ...node, is_published: false }));
const publishedNodes = nodes.map(node => ({ ...node, is_published: true }));

await supabase.from('org_nodes').insert(draftNodes);
await supabase.from('org_nodes').insert(publishedNodes);
```

**Speedup:** ~100x schneller bei 100 Nodes!

---

### Problem 2: Race Conditions beim Auto-Save

**Vorher (Fehleranfällig):**
```typescript
// ❌ BAD: Race condition möglich
await supabase.from('node_connections').delete().eq('is_published', false);
await supabase.from('node_connections').insert(connections);
// Wenn 2x schnell hintereinander aufgerufen → Duplicate Key Error!
```

**Nachher (Sicher):**
```typescript
// ✅ GOOD: UPSERT verhindert Duplicate Errors
await supabase.from('node_connections').upsert(connections, { 
  onConflict: 'id',
  ignoreDuplicates: false 
});
// Idempotent - kann mehrmals aufgerufen werden ohne Fehler
```

**Vorteile:**
- ✅ Keine Race Conditions
- ✅ Idempotent (wiederholbar)
- ✅ Automatisches Update bei Änderungen
- ✅ Insert bei neuen Einträgen

---

## Migration Check

Falls Fehler wie "column does not exist" auftreten:

```sql
-- Check if all required columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'org_nodes'
  AND column_name IN (
    'employee_ids',
    'primary_user_id', 
    'backup_user_id',
    'backup_backup_user_id',
    'team_lead_id',
    'is_published'
  );

-- Check node_connections table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'node_connections'
  AND column_name IN ('is_published');
```

Falls Spalten fehlen:
→ Führe Migration aus: `/supabase/migrations/034_add_draft_live_system.sql`

---

## UUID System Explained

### Draft vs Published UUIDs

**Das Problem:**
- PostgreSQL erwartet echte UUIDs, keine Strings wie `"uuid-published"`
- Wir brauchen separate Versionen für Draft und Published

**Die Lösung:**
```typescript
// VORHER (FALSCH):
const publishedId = `${node.id}-published`; // ❌ Nicht valid!

// NACHHER (RICHTIG):
const publishedId = crypto.randomUUID(); // ✅ Neue UUID
const nodeIdMapping = { [draftId]: publishedId }; // Mapping speichern
```

**Workflow:**
1. Admin erstellt Node → bekommt UUID `abc-123`
2. Node wird als Draft gespeichert (`is_published = false`)
3. Admin klickt "Push Live"
4. System generiert neue UUID `xyz-789` für published version
5. Mapping: `{ "abc-123": "xyz-789" }`
6. Connections werden gemappt: `source_node_id` von `abc-123` → `xyz-789`

**Beim zweiten Push:**
1. Draft Node behält UUID `abc-123`
2. NEUE UUID wird generiert: `def-456`
3. Alte published Version wird gelöscht
4. Neue published Version mit `def-456` wird erstellt

---

## Support

Bei Problemen:
1. Console Logs checken (Browser DevTools)
2. Datenbank direkt checken (Supabase Dashboard)
3. Orphaned connections query ausführen
4. Migration status überprüfen
5. UUID Fehler? Stelle sicher dass neueste Version läuft (crypto.randomUUID)
