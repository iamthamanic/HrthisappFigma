# ⚡ Quick Setup - Team Management Features

## 🚀 5-Minuten Setup

### Step 1: SQL Migrationen (2 Min)

1. **Öffne Supabase Dashboard**
   - Gehe zu deinem Projekt
   - Klick auf "SQL Editor"

2. **Kopiere SQL Code**
   - Öffne `SQL_ALL_TEAM_FEATURES_MIGRATIONS.md`
   - Scroll zu "Komplette Migration in einem Durchlauf"
   - Kopiere den gesamten SQL-Code

3. **Ausführen**
   - Paste in SQL Editor
   - Klick "Run"
   - Warte auf ✅ Success

### Step 2: App neu laden (30 Sek)

1. **Browser Hard-Reload**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + F5`

2. **Gehe zu Team Management**
   - Navigate zu `/admin/team-management`

### Step 3: Features testen (2 Min)

1. **✅ Sortierung**
   - Klick auf "Sortieren:" Dropdown
   - Wähle "Nachname"
   - Klick Pfeil für Richtung

2. **✅ Export**
   - Klick "Exportieren" Button
   - Wähle Spalten
   - Klick "Exportieren"

3. **✅ Quick Actions**
   - Klick 3-Punkte-Menü bei User
   - Test: "Notiz hinzufügen"
   - Speichern

4. **✅ Saved Searches**
   - Filtere nach "Aktiv"
   - Klick "Gespeicherte Suchen"
   - "Aktuelle Suche speichern"

5. **✅ Bulk Actions**
   - Wähle 2-3 User (Checkbox)
   - Floating Bar erscheint
   - Test: "Standort ändern"

---

## 🎯 Was ist neu?

### 1. Erweiterte Sortierung
- 12 Sortier-Kriterien
- Aufsteigend/Absteigend
- Automatisch gespeichert

### 2. Export-Funktion
- CSV & Excel Export
- 22 Spalten wählbar
- Custom Dateinamen

### 3. Quick Actions
- E-Mail, Call, WhatsApp
- Notizen hinzufügen
- Dokumente hochladen
- Coins vergeben
- Schnellbearbeitung

### 4. Saved Searches
- Suchen speichern
- Global/Privat
- Schnellzugriff

### 5. Bulk Actions
- Multi-Select
- Massen-Aktivierung
- Standort/Abteilung ändern
- Sammel-E-Mail

---

## 📋 Checkliste

- [ ] SQL Migrationen ausgeführt
- [ ] App neu geladen
- [ ] Sortierung getestet
- [ ] Export getestet
- [ ] Quick Action getestet
- [ ] Saved Search erstellt
- [ ] Bulk Action durchgeführt

---

## 🐛 Probleme?

### "Tabelle user_notes existiert nicht"
→ SQL Migration nochmal ausführen

### "Keine Berechtigung"
→ Als Admin einloggen

### Features nicht sichtbar
→ Hard-Reload durchführen

---

## 📚 Ausführliche Docs

- `SQL_ALL_TEAM_FEATURES_MIGRATIONS.md` - SQL Details
- `TEAM_MANAGEMENT_FEATURES_COMPLETE.md` - Vollständige Doku
- `TEAM_MANAGEMENT_FEATURES_ROADMAP.md` - Original Roadmap

---

**Fertig! 🎉**

Viel Spaß mit den neuen Features!
