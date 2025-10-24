# 🔧 Datenbank-Migrationen ausführen

## ⚠️ WICHTIG: Folgende Migrationen müssen ausgeführt werden!

Die folgenden Datenbank-Migrationen wurden erstellt, aber **noch NICHT automatisch ausgeführt**.
Du musst sie **manuell im Supabase SQL Editor** ausführen.

---

## 1️⃣ Migration 032: Employee Assignments

**Datei:** `/supabase/migrations/032_add_employee_assignments_to_nodes.sql`

**Was macht sie:**
- Fügt Spalten für Mitarbeiter-Zuweisungen hinzu:
  - `employee_ids` (Array von User IDs)
  - `primary_user_id` (Hauptverantwortlicher)
  - `backup_user_id` (Standard-Vertretung)
  - `backup_backup_user_id` (Vertretung der Vertretung)
- Erstellt Indizes für bessere Performance

**So ausführen:**

1. Öffne **Supabase Dashboard**
2. Gehe zu **SQL Editor**
3. Klicke auf **New Query**
4. Kopiere den Inhalt von `/supabase/migrations/032_add_employee_assignments_to_nodes.sql`
5. Füge ihn ein und klicke auf **Run**

---

## 2️⃣ Migration 033: Team Lead

**Datei:** `/supabase/migrations/033_add_team_lead_to_nodes.sql`

**Was macht sie:**
- Fügt `team_lead_id` Spalte zur `org_nodes` Tabelle hinzu
- Erstellt Index für `team_lead_id`

**So ausführen:**

1. Öffne **Supabase Dashboard**
2. Gehe zu **SQL Editor**
3. Klicke auf **New Query**
4. Kopiere den Inhalt von `/supabase/migrations/033_add_team_lead_to_nodes.sql`
5. Füge ihn ein und klicke auf **Run**

---

## 🚀 Schnelle Ausführung (alle auf einmal)

Du kannst auch beide Migrationen **gleichzeitig** ausführen:

```sql
-- =====================================================
-- Migration 032: Add Employee Assignments to Org Nodes
-- =====================================================

ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS employee_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_org_nodes_primary_user 
ON org_nodes(primary_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_user 
ON org_nodes(backup_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_backup_user 
ON org_nodes(backup_backup_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_employee_ids 
ON org_nodes USING GIN(employee_ids);

COMMENT ON COLUMN org_nodes.employee_ids IS 'Array of user IDs assigned to this node';
COMMENT ON COLUMN org_nodes.primary_user_id IS 'Primary responsible person (Hauptverantwortlicher)';
COMMENT ON COLUMN org_nodes.backup_user_id IS 'Standard backup/Vertretung';
COMMENT ON COLUMN org_nodes.backup_backup_user_id IS 'Backup of backup/Vertretung der Vertretung';

-- =====================================================
-- Migration 033: Add Team Lead to Nodes
-- =====================================================

ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_org_nodes_team_lead 
ON org_nodes(team_lead_id);

COMMENT ON COLUMN org_nodes.team_lead_id IS 'Team Lead (Abteilungsleiter) for Department/Specialization nodes';

-- =====================================================
-- ✅ Migrations Complete!
-- =====================================================
```

**Kopiere diesen gesamten SQL-Code** und führe ihn im **Supabase SQL Editor** aus!

---

## ✅ Überprüfung

Nach der Ausführung solltest du folgende Spalten in der `org_nodes` Tabelle haben:

```
✅ employee_ids (text[])
✅ primary_user_id (uuid)
✅ backup_user_id (uuid)
✅ backup_backup_user_id (uuid)
✅ team_lead_id (uuid)
```

Du kannst dies überprüfen mit:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'org_nodes' 
  AND column_name IN (
    'employee_ids', 
    'primary_user_id', 
    'backup_user_id', 
    'backup_backup_user_id',
    'team_lead_id'
  );
```

---

## 🐛 Fehler beheben

### Fehler: "Could not find the 'backup_backup_user_id' column"

**Ursache:** Migration 032 wurde noch nicht ausgeführt

**Lösung:** Führe die Migration 032 aus (siehe oben)

---

### Fehler: "column users.full_name does not exist"

**Ursache:** Code verwendet `full_name`, aber die Tabelle hat `first_name` und `last_name`

**Lösung:** ✅ **Bereits behoben!** Der Code wurde aktualisiert und verwendet jetzt `first_name` + `last_name`

---

### Fehler: "Skipping connection with temporary node ID"

**Ursache:** Verbindungen wurden mit temporären Node IDs (z.B. `node-1759732478901`) erstellt

**Lösung:** Diese Warnung ist **normal** und wird ignoriert. Temporäre IDs werden beim Speichern nicht in die Datenbank geschrieben. Wenn du die Node speicherst, bekommt sie eine echte UUID und die Verbindung wird korrekt gespeichert.

---

## 📋 Checkliste

Bevor du das Organigram verwendest:

- [ ] Migration 032 ausgeführt (Employee Assignments)
- [ ] Migration 033 ausgeführt (Team Lead)
- [ ] Überprüfung durchgeführt (siehe oben)
- [ ] Mindestens ein Benutzer mit **TEAMLEAD-Rolle** erstellt (für Team Lead Funktion)

---

## 🎯 Nach der Migration

Nach erfolgreicher Ausführung der Migrationen kannst du:

1. **Mitarbeiter zu Nodes zuweisen**
   - Hover über Node → Users-Icon klicken
   - Primary, Backup, Backup-Backup zuweisen

2. **Team Leads zuweisen**
   - Nur für Department & Specialization Nodes
   - Benutzer muss TEAMLEAD-Rolle haben

3. **Verbindungen umhängen**
   - Hover über Verbindung → Grüne Pins erscheinen
   - Pin greifen und zu neuem Ziel ziehen

---

**Datum:** 06.10.2025  
**Version:** 1.0.0  
**Status:** ⚠️ **Migrationen erforderlich**
