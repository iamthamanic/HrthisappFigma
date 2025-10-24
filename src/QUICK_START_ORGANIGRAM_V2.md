# 🚀 Quick Start: Organigram V2 (Draft/Live System)

## 📋 In 3 Schritten loslegen

### 1️⃣ **SQL Migration ausführen**

```bash
1. Öffne Supabase Dashboard → SQL Editor
2. Kopiere ALLES aus: /SUPABASE_SQL_MIGRATIONS.sql
3. Cmd+A → Cmd+C
4. Paste in SQL Editor
5. Run ▶️
6. Warte auf: "Success. No rows returned"
```

### 2️⃣ **App neu laden**

```bash
Drücke F5 oder Cmd+R
```

### 3️⃣ **Testen!**

**Als Admin:**
```
1. Gehe zu: /admin/organigram-canvas
2. Klicke: "Bearbeiten"
3. Erstelle ein paar Nodes
4. Verbinde sie
5. Klicke: "🚀 Push Live"
6. ✅ Fertig!
```

**Als User:**
```
1. Gehe zu: /organigram (in Navigation)
2. Klicke: "Anzeigen"
3. 👀 Sieh dir das published Organigram an
```

---

## 🎯 Key Features

### ✏️ Edit Mode
- **Button:** "Bearbeiten" → Aktiviert Editing
- **Button:** "Ansehen" → Deaktiviert Editing

### ⏪ Undo/Redo
- **Cmd+Z** (Mac) oder **Ctrl+Z** (Win): Rückgängig
- **Cmd+Shift+Z** oder **Ctrl+Y**: Wiederholen
- **Buttons:** ← und → in Toolbar

### 🚀 Push Live
- **Button:** "Push Live"
- Veröffentlicht Draft für alle User
- Warning Banner verschwindet

### ⚠️ Unsaved Changes
- **Banner:** Gelber Warning-Banner oben
- Text: "Du hast Änderungen, die noch nicht live sind"
- Action: Klicke "Push Live"

---

## 📍 URLs

| Route | Beschreibung | Wer |
|-------|--------------|-----|
| `/admin/organigram-canvas` | Editor (Draft/Live) | Admin |
| `/organigram` | View (Read-only) | Alle User |

---

## 🎨 Toolbar Buttons (Admin)

```
[Bearbeiten] [←] [→] [🚀 Push Live] [+ Node] [Zoom]
```

1. **Bearbeiten**: Toggle Edit Mode
2. **←**: Undo
3. **→**: Redo
4. **🚀 Push Live**: Veröffentlichen
5. **+ Node**: Neuen Node erstellen (nur im Edit Mode)
6. **Zoom**: Zoom Controls

---

## 💡 Workflow

```
Admin erstellt Node 
  → Auto-Save als Draft 
  → Klickt "Push Live" 
  → User sehen neue Version
```

---

## 🐛 Häufige Fehler

### ❌ "Column 'is_published' does not exist"

**Fix:**
```sql
-- Führe aus: /SUPABASE_SQL_MIGRATIONS.sql
```

### ❌ User sehen meine Änderungen nicht

**Fix:**
```
Hast du "Push Live" geklickt? 
Draft ist NICHT automatisch published!
```

### ❌ Undo funktioniert nicht

**Fix:**
```
Bist du im "Bearbeiten" Mode?
Undo/Redo nur im Edit Mode!
```

---

## ✅ Success!

Wenn alles funktioniert:
- ✅ Admin kann Organigram bearbeiten
- ✅ Undo/Redo funktioniert (Cmd+Z)
- ✅ Push Live veröffentlicht Changes
- ✅ User sehen published Version in /organigram
- ✅ User können nichts bearbeiten (read-only)

---

**Viel Erfolg! 🎉**

Bei Fragen: Siehe `/ORGANIGRAM_DRAFT_LIVE_SYSTEM.md`
