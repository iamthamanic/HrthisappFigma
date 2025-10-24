# 🔧 Quick Fix: UUID Error beim Organigram

## Problem

Wenn Sie diesen Fehler sehen:
```
❌ Error auto-saving draft nodes: {
  "code": "22P02",
  "message": "invalid input syntax for type uuid: \"node-1759743884280\""
}
```

## Ursache

Alte Canvas-Nodes wurden mit String-IDs gespeichert (`"node-1759743884280"`), aber die Datenbank erwartet UUID-Format (`"550e8400-e29b-41d4-a716-446655440000"`).

## ✅ Lösung (3 Schritte)

### Schritt 1: Code-Fix ist bereits implementiert ✅

Der Code wurde bereits korrigiert:
- Datei: `/components/canvas/hr_CanvasHandlers.ts`
- Alle neuen Nodes verwenden jetzt `crypto.randomUUID()`

### Schritt 2: Alte fehlerhafte Nodes löschen

**Option A - Supabase SQL Editor:**

1. Gehe zu Supabase Dashboard
2. SQL Editor öffnen
3. Folgenden Code ausführen:

```sql
-- Zeige betroffene Nodes (zur Kontrolle)
SELECT id, title, node_type, is_published 
FROM org_nodes 
WHERE id::text LIKE 'node-%';

-- Lösche fehlerhafte Connections
DELETE FROM node_connections
WHERE source_node_id::text LIKE 'node-%' 
   OR target_node_id::text LIKE 'node-%';

-- Lösche fehlerhafte Nodes
DELETE FROM org_nodes
WHERE id::text LIKE 'node-%';

-- Verifiziere (sollte 0 anzeigen)
SELECT COUNT(*) as remaining_bad_nodes
FROM org_nodes
WHERE id::text LIKE 'node-%';
```

**Option B - Komplettes Script:**

Führe die Datei `/FIX_UUID_NODES.sql` aus (enthält dieselben Befehle + Dokumentation).

### Schritt 3: Neue Nodes erstellen

1. Gehe zu Admin → Organigram Canvas
2. Klicke "Edit Mode"
3. Erstelle neue Nodes mit dem Plus (+) Button
4. Diese verwenden jetzt automatisch echte UUIDs ✅
5. Auto-Save funktioniert ohne Fehler! 🎉

## Warum passiert das?

### Alte Version (FALSCH):
```typescript
const newNode = {
  id: `node-${Date.now()}`, // ❌ String-ID
  // ...
};
```

### Neue Version (RICHTIG):
```typescript
const newNode = {
  id: crypto.randomUUID(), // ✅ Echte UUID
  // ...
};
```

## Verifizierung

Nach dem Fix sollten alle Nodes UUIDs im richtigen Format haben:

```sql
-- Alle Nodes anzeigen
SELECT id, title, node_type, created_at
FROM org_nodes
ORDER BY created_at DESC
LIMIT 10;

-- Beispiel für gültige UUID:
-- id: 550e8400-e29b-41d4-a716-446655440000
-- title: "Geschäftsführung"
```

## Zusammenfassung

✅ Code-Fix: Bereits implementiert  
✅ Cleanup: SQL ausführen (siehe Schritt 2)  
✅ Testen: Neue Nodes erstellen  
✅ Verifizieren: Keine UUID-Fehler mehr!

**Geschätzte Dauer**: 2-3 Minuten

---

**Erstellt**: 2025-01-06  
**Datei**: `/FIX_UUID_ERROR_QUICKSTART.md`  
**Verwandte Files**: 
- `/FIX_UUID_NODES.sql` (Cleanup-Script)
- `/components/canvas/hr_CanvasHandlers.ts` (Code-Fix)
- `/PERFORMANCE_OPTIMIZATIONS_APPLIED.md` (Dokumentation)
