# 🚀 Quick Start: Teamlead Priority Tags

## ✅ Was wurde implementiert?

Das **Priority-Tag-System** ermöglicht es, Teamleads nach ihrer Priorität zu organisieren:
- **PRIMARY** (Blau) → Haupt-Teamlead, erste Anlaufstelle
- **BACKUP** (Grau) → Stellvertretung
- **BACKUP_BACKUP** (Outline) → Eskalation bei Abwesenheit

---

## 📋 Setup-Schritte

### Schritt 1: Migration ausführen

Öffne **Supabase Dashboard** → **SQL Editor** → Füge ein:

```sql
-- Migration 044: Add priority_tag column
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS priority_tag TEXT DEFAULT NULL 
CHECK (priority_tag IN ('PRIMARY', 'BACKUP', 'BACKUP_BACKUP') OR priority_tag IS NULL);

COMMENT ON COLUMN team_members.priority_tag IS 'Priority tag for team leads (PRIMARY=main approver, BACKUP=HR coverage, BACKUP_BACKUP=superadmin coverage). Only applies when role=TEAMLEAD.';

CREATE INDEX IF NOT EXISTS idx_team_members_priority_tag ON team_members(team_id, priority_tag) WHERE priority_tag IS NOT NULL;
```

✅ Klicke **RUN**

---

### Schritt 2: Bestehende Teams aktualisieren (Optional)

Falls du bereits Teams hast, führe aus:

```sql
-- Set default tags for existing teamleads
UPDATE team_members tm
SET priority_tag = 
  CASE u.role
    WHEN 'ADMIN' THEN 'PRIMARY'
    WHEN 'HR' THEN 'BACKUP'
    WHEN 'SUPERADMIN' THEN 'BACKUP_BACKUP'
  END
FROM users u
WHERE tm.user_id = u.id
  AND tm.role = 'TEAMLEAD'
  AND tm.priority_tag IS NULL;
```

✅ Klicke **RUN**

---

### Schritt 3: Browser-Refresh

1. Öffne deine HRthis App
2. Drücke **Strg+Shift+R** (Hard Refresh)
3. Gehe zu **Admin** → **Team & Mitarbeiterverwaltung** → **Teams**

---

## 🧪 Testen

### Test 1: Neues Team erstellen

1. Klicke **"Team erstellen"**
2. Gib einen Namen ein (z.B. "Test Team")
3. ✅ Harry HR ist automatisch ausgewählt mit **Badge "Backup"**
4. ✅ Samson SuperAdmin ist automatisch ausgewählt mit **Badge "Backup Backup"**
5. Wähle **Anna Admin** aus
6. ✅ Badge "Primary" erscheint automatisch
7. **Speichern**

### Test 2: Tag manuell ändern

1. Öffne ein bestehendes Team
2. Wähle **Harry HR** aus
3. Klicke auf **"Primary"** Button (unter dem Namen)
4. ✅ Badge ändert sich von "Backup" zu "Primary"
5. ✅ Button wird blau hervorgehoben
6. **Speichern**

### Test 3: Tag-Priorität in Datenbank prüfen

```sql
SELECT 
  t.name as team,
  u.first_name || ' ' || u.last_name as teamlead,
  u.role as global_role,
  tm.priority_tag
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE tm.role = 'TEAMLEAD'
ORDER BY t.name, 
  CASE tm.priority_tag
    WHEN 'PRIMARY' THEN 1
    WHEN 'BACKUP' THEN 2
    WHEN 'BACKUP_BACKUP' THEN 3
  END;
```

**Erwartetes Ergebnis:**
```
team       | teamlead         | global_role | priority_tag
-----------|------------------|-------------|----------------
Test Team  | Anna Admin       | ADMIN       | PRIMARY
Test Team  | Harry HR         | HR          | BACKUP
Test Team  | Samson SuperAdmin| SUPERADMIN  | BACKUP_BACKUP
```

### Test 4: Approval-Logik testen

1. Gehe zu **Zeit & Urlaub**
2. **Anna Admin** logged sich ein
3. Stelle einen **Urlaubsantrag** für Tina Test (USER)
4. ✅ "Zuständig" zeigt: Anna Admin (Primary Teamlead)
5. Falls Anna abwesend ist → Zeigt Harry HR (Backup)

---

## 🎨 UI-Features

### Im Team-Dialog

Für jeden ausgewählten Teamlead siehst du:

```
☑ Anna Admin                    [Primary]
  anna.admin@company.de · ADMIN
  [Primary] [Backup] [Backup Backup]  ← Klickbare Buttons
```

- **Checkbox** → Teamlead auswählen/abwählen
- **Badge** → Aktueller Priority-Tag
- **Buttons** → Tag ändern (blau = aktiv, grau = inaktiv)

### Automatische Tag-Vergabe

Beim Auswählen eines Teamleads wird automatisch das Tag gesetzt:
- **ADMIN** → PRIMARY
- **HR** → BACKUP
- **SUPERADMIN** → BACKUP_BACKUP

---

## 🔧 Wie es funktioniert

### Frontend (TeamManagementScreen.tsx)

1. **State:** `teamLeadTags` speichert die Tags für jeden Teamlead
2. **Beim Öffnen:** Tags werden aus der Datenbank geladen
3. **Beim Auswählen:** Automatisches Tag basierend auf globaler Rolle
4. **Beim Klicken:** Manuelles Ändern des Tags
5. **Beim Speichern:** Tags werden in `team_members.priority_tag` gespeichert

### Backend (leaveApproverLogic.ts)

1. **Sortierung:** Approver werden nach `priority_tag` sortiert:
   - PRIMARY → 1
   - BACKUP → 2
   - BACKUP_BACKUP → 3
2. **Anzeige:** "Zuständig" zeigt den ersten verfügbaren PRIMARY-Teamlead
3. **Fallback:** Falls PRIMARY abwesend → BACKUP → BACKUP_BACKUP

---

## 📊 Beispiel-Szenarien

### Szenario 1: Normaler Betrieb
- **Primary:** Anna Admin (verfügbar) ✅
- **Backup:** Harry HR (verfügbar)
- **Backup Backup:** Samson SuperAdmin (verfügbar)
- **Ergebnis:** Anna Admin wird als "Zuständig" angezeigt

### Szenario 2: Primary im Urlaub
- **Primary:** Anna Admin (abwesend) ❌
- **Backup:** Harry HR (verfügbar) ✅
- **Backup Backup:** Samson SuperAdmin (verfügbar)
- **Ergebnis:** Harry HR wird als "Zuständig" angezeigt

### Szenario 3: Primary und Backup abwesend
- **Primary:** Anna Admin (abwesend) ❌
- **Backup:** Harry HR (abwesend) ❌
- **Backup Backup:** Samson SuperAdmin (verfügbar) ✅
- **Ergebnis:** Samson SuperAdmin wird als "Zuständig" angezeigt

---

## ✅ Checkliste

- [ ] Migration 044 in Supabase ausgeführt
- [ ] Bestehende Teams aktualisiert (falls vorhanden)
- [ ] Browser-Refresh durchgeführt
- [ ] Neues Team erstellt → Tags werden automatisch gesetzt
- [ ] Tags manuell geändert → Änderungen werden gespeichert
- [ ] Datenbank-Query ausgeführt → Tags sind korrekt

---

## 🐛 Troubleshooting

### Problem: Tags werden nicht angezeigt

**Lösung:**
1. Prüfe ob Migration ausgeführt wurde:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'team_members' AND column_name = 'priority_tag';
   ```
2. Falls leer → Migration erneut ausführen

### Problem: Tags werden nicht gespeichert

**Lösung:**
1. Öffne Browser-Konsole (F12)
2. Schau nach Fehlermeldungen
3. Prüfe ob `priority_tag` in der Datenbank existiert

### Problem: Falsche Sortierung in "Zuständig"

**Lösung:**
1. Prüfe ob Tags korrekt gesetzt sind:
   ```sql
   SELECT user_id, priority_tag FROM team_members WHERE role = 'TEAMLEAD';
   ```
2. Falls NULL → Führe Update-SQL aus (Schritt 2)

---

## 📚 Weitere Informationen

- **Vollständige Dokumentation:** `/TEAMLEAD_PRIORITY_TAGS.md`
- **Migration-Datei:** `/supabase/migrations/044_add_teamlead_priority_tags.sql`
- **Update-SQL:** `/UPDATE_EXISTING_TEAMS_PRIORITY_TAGS.sql`
- **Approval-Hierarchie:** `/LEAVE_APPROVAL_HIERARCHY.md`

---

**Status:** ✅ Fertig implementiert und bereit zu nutzen!
**Version:** 1.0.0
**Datum:** 2025-01-08
