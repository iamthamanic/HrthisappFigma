# 📝 Organigram Draft/Live System

## 🎯 Übersicht

Das Organigram hat jetzt ein **Draft/Live System** mit **Undo/Redo** Funktionalität - genau wie professionelle Design-Tools!

---

## ✨ Features

### 1. **Edit Mode Toggle**
- **Ansehen-Modus**: Read-only, keine Bearbeitung möglich
- **Bearbeitungs-Modus**: Volle Bearbeitung mit Drag & Drop
- Button: "Ansehen" / "Bearbeiten"

### 2. **Draft vs. Live**
- **Draft**: Admin kann in Ruhe bearbeiten
- **Live**: Veröffentlichte Version, die alle User sehen
- Änderungen im Draft sind **nicht sofort** für User sichtbar

### 3. **Undo/Redo**
- **Cmd+Z** (Mac) / **Ctrl+Z** (Windows/Linux): Rückgängig
- **Cmd+Shift+Z** oder **Ctrl+Y**: Wiederholen
- Bis zu **50 Schritte** in der History
- Buttons in Toolbar: ← Undo | Redo →

### 4. **Push Live**
- Button "Push Live" veröffentlicht Draft
- Alle User sehen dann die neue Version
- Bestätigung: "✅ Änderungen sind jetzt live!"

### 5. **Unsaved Changes Warning**
- Gelbe Banner-Warnung: "Du hast Änderungen, die noch nicht live sind"
- Auto-Save für Draft (alle Änderungen werden als Draft gespeichert)
- Push Live erst nach expliziter Bestätigung

### 6. **User View**
- Normale User sehen Organigram in **Übersicht** (Navigation)
- **Eingeklappt** by default
- Button "Anzeigen" / "Einklappen"
- Read-only - keine Bearbeitung möglich
- Nur **veröffentlichte** Nodes/Connections sichtbar

---

## 🚀 Setup

### 1. **SQL Migration ausführen**

```bash
# Öffne Supabase SQL Editor
# Kopiere & Paste:
/SUPABASE_SQL_MIGRATIONS.sql
```

Die Migration fügt hinzu:
- `is_published` Spalte für Nodes
- `is_published` Spalte für Connections
- `version` Tracking
- Performance-Indizes

### 2. **Routes**

**Admin:**
```
/admin/organigram-canvas
```

**User:**
```
/organigram
```

---

## 🎨 Toolbar Buttons

```
┌─────────────────────────────────────────────────────────┐
│ [Bearbeiten] │ [←] [→] │ [Push Live] │ [+ Node] │ Zoom │
└─────────────────────────────────────────────────────────┘
```

**Von links nach rechts:**

1. **Bearbeiten** / **Ansehen**
   - Toggle zwischen Edit/View Mode
   - Grau = Ansehen, Blau = Bearbeiten

2. **← Undo**
   - Rückgängig machen
   - Cmd+Z / Ctrl+Z
   - Disabled wenn keine History

3. **→ Redo**
   - Wiederholen
   - Cmd+Shift+Z / Ctrl+Y
   - Disabled wenn keine Future History

4. **🚀 Push Live**
   - Veröffentlicht Draft
   - Nur aktiv wenn Änderungen vorhanden
   - Grün = Ready to publish

5. **+ Node hinzufügen**
   - Nur im Edit Mode sichtbar
   - Erstellt neue Nodes

6. **Zoom Controls**
   - Zoom In/Out/Reset
   - Prozent-Anzeige

---

## 🔄 Workflow

### Als **Admin**:

```mermaid
graph LR
    A[/admin/organigram-canvas] --> B{Edit Mode?}
    B -->|Nein| C[Ansehen - Read Only]
    B -->|Ja| D[Bearbeiten]
    D --> E[Änderungen machen]
    E --> F[Auto-Save als Draft]
    F --> G{Zufrieden?}
    G -->|Nein| H[Undo/Redo]
    H --> E
    G -->|Ja| I[Push Live]
    I --> J[User sehen neue Version]
```

### Als **User**:

```
/organigram → Eingeklappt → [Anzeigen] → Read-Only View
```

---

## 💾 Datenbank-Struktur

### **org_nodes**
```sql
CREATE TABLE org_nodes (
  id UUID PRIMARY KEY,
  organization_id UUID,
  node_type TEXT,
  title TEXT,
  position_x NUMERIC,
  position_y NUMERIC,
  is_published BOOLEAN DEFAULT false,  -- ← NEU
  version INTEGER DEFAULT 1,            -- ← NEU
  ...
);
```

### **node_connections**
```sql
CREATE TABLE node_connections (
  id UUID PRIMARY KEY,
  organization_id UUID,
  source_node_id UUID,
  target_node_id UUID,
  is_published BOOLEAN DEFAULT false,  -- ← NEU
  version INTEGER DEFAULT 1,            -- ← NEU
  ...
);
```

### **Queries**

**Draft laden** (Admin):
```sql
SELECT * FROM org_nodes 
WHERE organization_id = $1 
  AND is_published = false;
```

**Live laden** (User):
```sql
SELECT * FROM org_nodes 
WHERE organization_id = $1 
  AND is_published = true;
```

---

## 🎯 Keyboard Shortcuts

| Shortcut | Aktion | Plattform |
|----------|--------|-----------|
| `Cmd+Z` | Undo | Mac |
| `Ctrl+Z` | Undo | Windows/Linux |
| `Cmd+Shift+Z` | Redo | Mac |
| `Ctrl+Shift+Z` | Redo | Windows/Linux |
| `Ctrl+Y` | Redo | Windows/Linux |
| `Delete` | Node/Connection löschen | Alle |
| `Cmd/Ctrl +` | Zoom In | Alle |
| `Cmd/Ctrl -` | Zoom Out | Alle |
| `Cmd/Ctrl 0` | Zoom Reset | Alle |

---

## 🐛 Troubleshooting

### "Column 'is_published' does not exist"

**Lösung:**
1. Öffne `/SUPABASE_SQL_MIGRATIONS.sql`
2. Kopiere alles (Cmd+A)
3. Füge in Supabase SQL Editor ein
4. Run
5. Reload App

### "Unsaved Changes" verschwindet nicht

**Lösung:**
- Klicke "Push Live"
- Warte auf Bestätigung
- Reload Seite (F5)

### Undo/Redo funktioniert nicht

**Lösung:**
- Prüfe ob **Edit Mode** aktiviert ist
- Undo/Redo nur im Edit Mode verfügbar
- History wird erst nach 1. Änderung aufgebaut

### User sehen keine Änderungen

**Lösung:**
- Admin muss **"Push Live"** klicken!
- Draft ist nicht automatisch published
- Check: Banner "Du hast Änderungen..." → Push Live

---

## 📊 States

### Admin States

```typescript
- loading: boolean          // Initial load
- isEditMode: boolean       // Edit vs View
- hasUnsavedChanges: boolean // Draft ≠ Live
- isPublishing: boolean     // Publishing in progress
- history: HistoryState[]   // Undo/Redo stack
- historyIndex: number      // Current position in history
```

### User States

```typescript
- loading: boolean          // Initial load
- isExpanded: boolean       // Collapsed vs Expanded
- hasData: boolean          // Has published organigram
```

---

## ✅ Checkliste

Setup:
- [ ] Migration `034_add_draft_live_system.sql` ausgeführt
- [ ] Column `is_published` existiert in `org_nodes`
- [ ] Column `is_published` existiert in `node_connections`
- [ ] App neu geladen (F5)

Admin Testing:
- [ ] Edit Mode Toggle funktioniert
- [ ] Undo (Cmd+Z) funktioniert
- [ ] Redo (Cmd+Shift+Z) funktioniert
- [ ] Push Live funktioniert
- [ ] Warning Banner erscheint bei Changes

User Testing:
- [ ] Organigram in Navigation sichtbar
- [ ] Eingeklappt by default
- [ ] "Anzeigen" Button funktioniert
- [ ] Read-only (keine Edit-Buttons)
- [ ] Nur published Nodes sichtbar

---

## 🎨 UI Screenshots

### Admin View - Mit Änderungen
```
╔════════════════════════════════════════════════════════╗
║ ⚠️  Du hast Änderungen, die noch nicht live sind      ║
║                                        [🚀 Push Live]  ║
╚════════════════════════════════════════════════════════╝
┌────────────────────────────────────────────────────────┐
│ [Bearbeiten] │ [←] [→] │ [+ Node] │ Zoom 100%         │
└────────────────────────────────────────────────────────┘
```

### Admin View - Nach Push Live
```
┌────────────────────────────────────────────────────────┐
│ [Ansehen] │ [←] [→] │ [Push Live] │ [+ Node] │ Zoom   │
└────────────────────────────────────────────────────────┘
```

### User View - Eingeklappt
```
┌────────────────────────────────────────────────────────┐
│ 🔗 Organigram                          [▼ Anzeigen]    │
└────────────────────────────────────────────────────────┘
```

### User View - Erweitert
```
┌────────────────────────────────────────────────────────┐
│ 🔗 Organigram                          [▲ Einklappen]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│         [Organigram Canvas - Read Only]                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Nächste Schritte

Mögliche Erweiterungen:
- [ ] Version History (alle Versionen anzeigen)
- [ ] Scheduled Publishing (Zeitgesteuert veröffentlichen)
- [ ] Multi-Admin Collaboration (Konflikt-Erkennung)
- [ ] Comments System (Feedback zu Draft)
- [ ] Preview Mode (Draft Preview für andere Admins)
- [ ] Export/Import (Organigram Templates)

---

**Erstellt:** 2025-01-06  
**Version:** 2.0  
**Features:** Draft/Live System, Undo/Redo, Push Live
