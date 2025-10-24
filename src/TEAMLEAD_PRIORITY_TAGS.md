# 🏷️ Teamlead Priority Tags - Dokumentation

## Übersicht

Das Priority-Tag-System ermöglicht es, Teamleads zu priorisieren und ihre Verantwortlichkeit innerhalb eines Teams klar zu kennzeichnen. Dies hilft bei der Urlaubsgenehmigung und macht die Hierarchie transparent.

## 🎯 Tags

### PRIMARY (Haupt-Teamlead)
- **Default für:** ADMIN-Benutzer
- **Farbe:** Blau (default Badge)
- **Bedeutung:** Hauptverantwortlicher Teamlead, erste Anlaufstelle für Genehmigungen
- **Beispiel:** Anna Admin (Abteilungsleiterin)

### BACKUP (Stellvertretung)
- **Default für:** HR-Benutzer
- **Farbe:** Grau (secondary Badge)
- **Bedeutung:** Backup-Teamlead, springt ein wenn Primary nicht verfügbar ist
- **Beispiel:** Harry HR (HR-Manager)

### BACKUP_BACKUP (Zweite Stellvertretung)
- **Default für:** SUPERADMIN-Benutzer
- **Farbe:** Outline Badge
- **Bedeutung:** Letzte Eskalationsstufe, greift bei Abwesenheit von Primary und Backup
- **Beispiel:** Samson SuperAdmin (Geschäftsführer)

---

## 💾 Datenbank-Schema

### Migration: 044_add_teamlead_priority_tags.sql

```sql
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS priority_tag TEXT DEFAULT NULL 
CHECK (priority_tag IN ('PRIMARY', 'BACKUP', 'BACKUP_BACKUP') OR priority_tag IS NULL);
```

### Spalte: `team_members.priority_tag`
- **Typ:** TEXT
- **Nullable:** Ja (NULL für reguläre MEMBER)
- **Check Constraint:** Nur 'PRIMARY', 'BACKUP', 'BACKUP_BACKUP' oder NULL erlaubt
- **Index:** `idx_team_members_priority_tag ON team_members(team_id, priority_tag)`

---

## 🔄 Automatische Tag-Vergabe

### Bei Team-Erstellung

Wenn ein neues Team erstellt wird:

1. **HR-Benutzer** werden automatisch als Teamleads vorausgewählt → Tag: **BACKUP**
2. **SUPERADMIN-Benutzer** werden automatisch als Teamleads vorausgewählt → Tag: **BACKUP_BACKUP**
3. **ADMIN-Benutzer** werden NICHT automatisch vorausgewählt (müssen manuell hinzugefügt werden)

### Beim Hinzufügen eines Teamleads

Wenn ein Benutzer manuell als Teamlead hinzugefügt wird:

```typescript
if (user.role === 'ADMIN') {
  tag = 'PRIMARY';
} else if (user.role === 'HR') {
  tag = 'BACKUP';
} else if (user.role === 'SUPERADMIN') {
  tag = 'BACKUP_BACKUP';
}
```

---

## 🎨 UI-Darstellung

### Team bearbeiten Dialog

```
☐ Anna Admin                                [Primary]
  anna.admin@company.de · ADMIN
  [Primary] [Backup] [Backup Backup]        ← Buttons zum Ändern
  
☑ Harry HR                                  [Backup]
  harry.hr@company.de · HR
  [Primary] [Backup] [Backup Backup]
  
☑ Samson SuperAdmin                         [Backup Backup]
  samson@company.de · SUPERADMIN
  [Primary] [Backup] [Backup Backup]
```

### Badge-Farben

- **Primary:** `bg-blue-600 text-white` (aktiver Button) / `variant="default"` (Badge)
- **Backup:** `bg-blue-600 text-white` (aktiver Button) / `variant="secondary"` (Badge)
- **Backup Backup:** `bg-blue-600 text-white` (aktiver Button) / `variant="outline"` (Badge)

---

## 🔧 Technische Implementierung

### Frontend State

```typescript
const [teamLeadTags, setTeamLeadTags] = useState<
  Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>
>({});
```

### Beim Öffnen des Dialogs (Bearbeiten)

```typescript
const { data: members } = await supabase
  .from('team_members')
  .select('user_id, role, priority_tag, users!inner(role)')
  .eq('team_id', team.id);

const tags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'> = {};
members.forEach(m => {
  if (m.role === 'TEAMLEAD' && m.priority_tag) {
    tags[m.user_id] = m.priority_tag;
  }
});
setTeamLeadTags(tags);
```

### Beim Speichern

```typescript
const leadInserts = selectedTeamLeads.map(userId => ({
  team_id: teamId,
  user_id: userId,
  role: 'TEAMLEAD',
  is_lead: true,
  priority_tag: teamLeadTags[userId] || null,
  joined_at: new Date().toISOString()
}));
```

---

## 📝 Anwendungsfälle

### Use Case 1: Kleines Team mit einem Abteilungsleiter

**Team:** "Marketing"
- Anna Admin (ADMIN) → **PRIMARY** ✅
- Harry HR (HR) → **BACKUP** ✅
- Samson SuperAdmin (SUPERADMIN) → **BACKUP_BACKUP** ✅

**Genehmigungslogik:**
1. Tina Test stellt Urlaubsantrag
2. "Zuständig" zeigt: Anna Admin (PRIMARY)
3. Falls Anna abwesend → Harry HR (BACKUP)
4. Falls beide abwesend → Samson SuperAdmin (BACKUP_BACKUP)

### Use Case 2: Großes Team mit mehreren Teamleads

**Team:** "Development"
- Anna Admin (ADMIN) → **PRIMARY** ✅
- Bob Admin (ADMIN) → **PRIMARY** ✅ (zweiter Hauptverantwortlicher)
- Harry HR (HR) → **BACKUP** ✅
- Samson SuperAdmin (SUPERADMIN) → **BACKUP_BACKUP** ✅

**Genehmigungslogik:**
1. Developer stellt Urlaubsantrag
2. "Zuständig" zeigt: Anna Admin oder Bob Admin (beide PRIMARY)
3. Falls beide abwesend → Harry HR (BACKUP)
4. Falls alle abwesend → Samson SuperAdmin (BACKUP_BACKUP)

### Use Case 3: Team ohne ADMIN (nur HR-geführt)

**Team:** "HR"
- Harry HR (HR) → **PRIMARY** ✅ (manuell geändert von BACKUP)
- Hanna HR (HR) → **BACKUP** ✅
- Samson SuperAdmin (SUPERADMIN) → **BACKUP_BACKUP** ✅

**Hinweis:** HR kann die Tags manuell ändern, um einen HR-Mitarbeiter als PRIMARY zu markieren.

---

## ✅ Vorteile

1. **Klare Hierarchie:** Sofort erkennbar, wer hauptverantwortlich ist
2. **Flexible Anpassung:** Tags können jederzeit geändert werden
3. **Automatische Defaults:** Intelligente Vorauswahl basierend auf globaler Rolle
4. **Visuelle Klarheit:** Badges machen Priorität sofort sichtbar
5. **Backup-Strategie:** Klare Eskalationskette bei Abwesenheit

---

## 🔄 Migration durchführen

### Schritt 1: SQL ausführen

Öffne Supabase Dashboard → SQL Editor → Füge ein:

```sql
-- Migration 044
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS priority_tag TEXT DEFAULT NULL 
CHECK (priority_tag IN ('PRIMARY', 'BACKUP', 'BACKUP_BACKUP') OR priority_tag IS NULL);

COMMENT ON COLUMN team_members.priority_tag IS 'Priority tag for team leads (PRIMARY=main approver, BACKUP=HR coverage, BACKUP_BACKUP=superadmin coverage). Only applies when role=TEAMLEAD.';

CREATE INDEX IF NOT EXISTS idx_team_members_priority_tag ON team_members(team_id, priority_tag) WHERE priority_tag IS NOT NULL;
```

### Schritt 2: Frontend aktualisieren

✅ Bereits implementiert in `/screens/admin/TeamManagementScreen.tsx`

### Schritt 3: Bestehende Teams aktualisieren (Optional)

Falls du bestehende Teams hast, kannst du die Tags manuell setzen:

```sql
-- Set PRIMARY for all ADMIN teamleads
UPDATE team_members tm
SET priority_tag = 'PRIMARY'
FROM users u
WHERE tm.user_id = u.id
  AND tm.role = 'TEAMLEAD'
  AND u.role = 'ADMIN';

-- Set BACKUP for all HR teamleads
UPDATE team_members tm
SET priority_tag = 'BACKUP'
FROM users u
WHERE tm.user_id = u.id
  AND tm.role = 'TEAMLEAD'
  AND u.role = 'HR';

-- Set BACKUP_BACKUP for all SUPERADMIN teamleads
UPDATE team_members tm
SET priority_tag = 'BACKUP_BACKUP'
FROM users u
WHERE tm.user_id = u.id
  AND tm.role = 'TEAMLEAD'
  AND u.role = 'SUPERADMIN';
```

---

## 🧪 Testing

### Test 1: Tag wird automatisch gesetzt

1. Öffne Admin → Team & Mitarbeiterverwaltung → Teams
2. Klicke "Team erstellen"
3. Wähle Anna Admin (ADMIN) als Teamlead aus
4. ✅ Badge "Primary" erscheint automatisch
5. Wähle Harry HR (HR) als Teamlead aus
6. ✅ Badge "Backup" erscheint automatisch

### Test 2: Tag kann manuell geändert werden

1. Öffne Team-Dialog
2. Wähle Harry HR aus
3. Klicke auf "Primary" Button
4. ✅ Badge ändert sich von "Backup" zu "Primary"
5. Button wird blau hervorgehoben

### Test 3: Tag wird gespeichert

1. Erstelle ein Team mit Tags
2. Speichere das Team
3. Öffne das Team erneut zum Bearbeiten
4. ✅ Tags sind korrekt geladen

### Test 4: Tag in Datenbank prüfen

```sql
SELECT 
  t.name as team,
  u.first_name || ' ' || u.last_name as teamlead,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE tm.role = 'TEAMLEAD'
ORDER BY t.name, tm.priority_tag NULLS LAST;
```

**Erwartetes Ergebnis:**
```
team          | teamlead         | global_role | team_role | priority_tag
--------------|------------------|-------------|-----------|----------------
Marketing     | Anna Admin       | ADMIN       | TEAMLEAD  | PRIMARY
Marketing     | Harry HR         | HR          | TEAMLEAD  | BACKUP
Marketing     | Samson SuperAdmin| SUPERADMIN  | TEAMLEAD  | BACKUP_BACKUP
```

---

## 📋 Zusammenfassung

✅ **Migration 044** erstellt die `priority_tag` Spalte
✅ **TeamManagementScreen** implementiert die UI
✅ **Automatische Tag-Vergabe** basierend auf globaler Rolle
✅ **Manuelle Änderung** jederzeit möglich
✅ **Badges** zeigen Priorität visuell an
✅ **Flexible Hierarchie** für alle Team-Szenarien

---

**Status:** ✅ Fertig implementiert und ready to use!
**Version:** 1.0.0
**Datum:** 2025-01-08
