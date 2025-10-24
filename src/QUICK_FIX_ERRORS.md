# 🚨 Schnelle Fehlerbehebung

## Alle Fehler auf einmal beheben! 🔧

### Kopiere und führe diesen SQL-Code aus:

1. Öffne **Supabase Dashboard** → **SQL Editor**
2. Klicke auf **"New Query"**
3. **Kopiere folgenden Code** und füge ihn ein:

```sql
-- =====================================================
-- KOMPLETTE FEHLERBEHEBUNG FÜR ORGANIGRAM
-- =====================================================
-- Behebt alle Fehler:
-- ✅ "backup_backup_user_id column not found"
-- ✅ "full_name column does not exist" 
-- ✅ Fehlende Indizes
-- =====================================================

-- Migration 032: Employee Assignments
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS employee_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Migration 033: Team Lead
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_org_nodes_primary_user 
ON org_nodes(primary_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_user 
ON org_nodes(backup_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_backup_user 
ON org_nodes(backup_backup_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_team_lead 
ON org_nodes(team_lead_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_employee_ids 
ON org_nodes USING GIN(employee_ids);

-- Kommentare für Dokumentation
COMMENT ON COLUMN org_nodes.employee_ids IS 'Array of user IDs assigned to this node';
COMMENT ON COLUMN org_nodes.primary_user_id IS 'Primary responsible person (Hauptverantwortlicher)';
COMMENT ON COLUMN org_nodes.backup_user_id IS 'Standard backup/Vertretung';
COMMENT ON COLUMN org_nodes.backup_backup_user_id IS 'Backup of backup/Vertretung der Vertretung';
COMMENT ON COLUMN org_nodes.team_lead_id IS 'Team Lead (Abteilungsleiter) for Department/Specialization nodes';

-- =====================================================
-- ✅ FERTIG! Alle Spalten wurden hinzugefügt.
-- =====================================================
```

4. Klicke auf **"Run"** (oder Cmd/Ctrl + Enter)
5. Warte auf: **"Success. No rows returned"**
6. **Lade die Seite neu** (F5)

---

## ✅ Überprüfung

Nach der Ausführung solltest du sehen:

```
✅ Success. No rows returned
```

Wenn du einen Fehler siehst:
- **"column already exists"** → Alles OK! Die Spalte war schon da.
- **"relation org_nodes does not exist"** → Führe **zuerst** Migration 031 aus (siehe `/MIGRATION_INSTRUCTIONS.md`)

---

## 🐛 Alle Fehler erklärt:

### ❌ Fehler 1: "Could not find the 'backup_backup_user_id' column"

**Ursache:** Migration 032 wurde noch nicht ausgeführt  
**Lösung:** ✅ Wird durch obigen SQL-Code behoben

---

### ❌ Fehler 2: "column users.full_name does not exist"

**Ursache:** Code verwendete `full_name`, aber Datenbank hat `first_name` + `last_name`  
**Lösung:** ✅ **Bereits im Code behoben!** Keine weitere Aktion nötig.

---

### ⚠️ Warnung: "Skipping connection with temporary node ID"

**Ist das ein Fehler?** Nein! Das ist **normal**.

**Warum?** 
- Beim Erstellen eines neuen Nodes bekommt er temporär eine ID wie `node-1759732478901`
- Beim Speichern wird diese durch eine echte UUID ersetzt
- Verbindungen mit temporären IDs werden automatisch übersprungen

**Was tun?**
- Nichts! Einfach ignorieren.
- Sobald du den Node speicherst, wird die Verbindung korrekt gespeichert.

---

## 🎯 Nach der Migration

### Was jetzt funktioniert:

✅ **Mitarbeiter zuweisen**
- Primary User (Hauptverantwortlicher)
- Backup User (Standard-Vertretung)
- Backup Backup User (Vertretung der Vertretung)

✅ **Team Leads zuweisen**
- Für Department & Specialization Nodes
- Benutzer muss TEAMLEAD-Rolle haben

✅ **Verbindungen umhängen**
- Einzelne Verbindungen verschieben
- Grüne Pins beim Hover
- Keine automatische Löschung

---

## 📋 Checkliste

Nach SQL-Ausführung:

- [ ] SQL-Code ausgeführt
- [ ] "Success" Meldung gesehen
- [ ] Seite neu geladen (F5)
- [ ] Keine Fehlermeldungen mehr
- [ ] Mitarbeiter-Zuweisung funktioniert
- [ ] (Optional) Mindestens ein TEAMLEAD-Benutzer erstellt

---

## 🆘 Immer noch Probleme?

### Problem: "relation org_nodes does not exist"

**Lösung:** Du musst **zuerst** Migration 031 ausführen:

```sql
-- Öffne und führe aus:
/supabase/migrations/031_canva_style_organigram.sql
```

Siehe `/MIGRATION_INSTRUCTIONS.md` für Details.

---

### Problem: Keine Team Leads im Dropdown

**Lösung:** Erstelle einen TEAMLEAD-Benutzer:

1. Gehe zu **Admin → Team Management**
2. Wähle einen Benutzer aus
3. Klicke auf **Bearbeiten**
4. Setze **Rolle** auf **"TEAMLEAD"**
5. Speichern
6. Zurück zum Organigram

---

**Datum:** 06.10.2025  
**Version:** 1.0.0  
**Status:** ✅ **Alle Fixes implementiert**
