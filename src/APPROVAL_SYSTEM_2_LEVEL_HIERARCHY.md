# ✅ Approval System - 2-Level Hierarchy

## Übersicht

HRthis nutzt ein **2-Level Rollen-System** für Urlaubs-Genehmigungen:

1. **Global Role** (in `users.role`) - Basis-Berechtigung
2. **Team Role** (in `team_members.role`) - Team-spezifische Berechtigung

**Wichtig:** Um Anträge genehmigen zu können, braucht man **BEIDE Ebenen**!

---

## 🆕 Update: Migration 045 (Auto-Add Logic geändert)

**NEU ab Migration 045:**
- ✅ HR & SUPERADMIN werden automatisch als TEAMLEAD zu allen Teams hinzugefügt (BACKUP)
- ❌ ADMIN wird NICHT mehr automatisch hinzugefügt - muss manuell als TEAMLEAD zugewiesen werden (PRIMARY)

**Siehe:** `/MIGRATION_045_SUMMARY.md` für Details

---

## Level 1: Global Roles

Diese Rollen sind in der `users` Tabelle gespeichert:

| Role | Beschreibung | Admin-Rechte |
|------|--------------|--------------|
| **USER** | Normaler Mitarbeiter | ❌ Keine |
| **ADMIN** | Administrator | ✅ Ja |
| **HR** | Personalabteilung | ✅ Ja |
| **SUPERADMIN** | Super-Administrator | ✅ Ja |

---

## Level 2: Team Roles

Diese Rollen sind in der `team_members` Tabelle gespeichert:

| Role | Beschreibung | Kann genehmigen? |
|------|--------------|------------------|
| **MEMBER** | Team-Mitglied | ❌ Nein |
| **TEAMLEAD** | Team-Lead | ✅ Ja (wenn auch Global Admin) |

---

## Approval-Regeln

### ✅ Wer kann Anträge genehmigen?

Ein User kann einen Antrag genehmigen wenn:

1. **Global Role:** ADMIN, HR oder SUPERADMIN
2. **Team Role:** TEAMLEAD im Team des Antragstellers
3. **Beide Bedingungen erfüllt!**

### ❌ Wer kann NICHT genehmigen?

- USER (keine Global Admin-Rechte)
- ADMIN/HR/SUPERADMIN die NICHT TEAMLEAD des Teams sind
- Jeder ohne Team-Mitgliedschaft

### 🔒 Spezialregel: HR/SUPERADMIN Anträge

Wenn der Antragsteller **HR** oder **SUPERADMIN** ist:
- Nur **SUPERADMIN** kann genehmigen
- Der SUPERADMIN muss trotzdem **TEAMLEAD** im Team sein

---

## Beispiele

### ✅ Beispiel 1: Anna Admin (funktioniert)

**Setup:**
- Anna: Global Role = `ADMIN`, Team Role = `TEAMLEAD` in "Büro 2"
- Tina: Global Role = `USER`, Team = "Büro 2"

**Ergebnis:** ✅ Anna kann Tinas Antrag genehmigen
- Grund: Anna hat ADMIN + TEAMLEAD in Tinas Team

---

### ❌ Beispiel 2: Anna Admin ohne Team Role (funktioniert NICHT)

**Setup:**
- Anna: Global Role = `ADMIN`, KEINE Team Role
- Tina: Global Role = `USER`, Team = "Büro 2"

**Ergebnis:** ❌ Anna kann Tinas Antrag NICHT genehmigen
- Grund: Anna ist nicht TEAMLEAD in Tinas Team

---

### ✅ Beispiel 3: HR mit automatischer Team-Zuweisung

**Setup:**
- HR-User: Global Role = `HR`, Team Role = `TEAMLEAD` (BACKUP) in "Büro 2" (automatisch)
- Tina: Global Role = `USER`, Team = "Büro 2"

**Ergebnis:** ✅ HR kann Tinas Antrag genehmigen
- Grund: HR hat HR + TEAMLEAD in Tinas Team

---

### ❌ Beispiel 4: HR ohne automatische Zuweisung (altes Team)

**Setup:**
- HR-User: Global Role = `HR`, NICHT in "Altes Team" (vor automatischer Zuweisung erstellt)
- Max: Global Role = `USER`, Team = "Altes Team"

**Ergebnis:** ❌ HR kann Max' Antrag NICHT genehmigen
- Grund: HR ist nicht TEAMLEAD in Max' Team
- **Lösung:** HR manuell als TEAMLEAD zu "Altes Team" hinzufügen

---

## Automatische Team-Zuweisung

### Trigger-System

Wenn ein **neues Team** erstellt wird:
- **SUPERADMIN** wird automatisch als TEAMLEAD (BACKUP_BACKUP) hinzugefügt
- **HR** wird automatisch als TEAMLEAD (BACKUP) hinzugefügt
- **ADMIN** wird automatisch als TEAMLEAD (PRIMARY) hinzugefügt (falls konfiguriert)

### Migration: 043_add_admin_to_auto_teamlead.sql

```sql
CREATE OR REPLACE FUNCTION auto_add_hr_superadmin_admin_to_team()
RETURNS TRIGGER AS $$
DECLARE
  v_hr_user RECORD;
  v_superadmin_user RECORD;
  v_admin_user RECORD;
BEGIN
  -- Add SUPERADMIN as BACKUP_BACKUP
  FOR v_superadmin_user IN 
    SELECT id FROM users WHERE role = 'SUPERADMIN'
  LOOP
    INSERT INTO team_members (team_id, user_id, role, priority_tag)
    VALUES (NEW.id, v_superadmin_user.id, 'TEAMLEAD', 'BACKUP_BACKUP')
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END LOOP;

  -- Add HR as BACKUP
  FOR v_hr_user IN 
    SELECT id FROM users WHERE role = 'HR'
  LOOP
    INSERT INTO team_members (team_id, user_id, role, priority_tag)
    VALUES (NEW.id, v_hr_user.id, 'TEAMLEAD', 'BACKUP')
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END LOOP;

  -- Add ADMIN as PRIMARY
  FOR v_admin_user IN 
    SELECT id FROM users WHERE role = 'ADMIN'
  LOOP
    INSERT INTO team_members (team_id, user_id, role, priority_tag)
    VALUES (NEW.id, v_admin_user.id, 'TEAMLEAD', 'PRIMARY')
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Priority Tags

TEAMLEADs können Priority Tags haben:

| Tag | Bedeutung | Reihenfolge |
|-----|-----------|-------------|
| **PRIMARY** | Haupt-Teamlead | 1. (erste Wahl) |
| **BACKUP** | Backup-Teamlead | 2. (zweite Wahl) |
| **BACKUP_BACKUP** | Backup-Backup | 3. (dritte Wahl) |

Diese bestimmen die **Zuständigkeit** (wer zuerst angezeigt wird), aber **alle TEAMLEADs können genehmigen**.

---

## Code-Locations

### 1. Approval-Logik
**File:** `/utils/HRTHIS_leaveApproverLogic.ts`

```typescript
export async function canUserApproveRequest(
  approverId: string,
  requesterId: string
): Promise<boolean> {
  // 1. Check Global Role
  if (approver.role === 'USER') return false;
  
  // 2. Check if requester is HR/SUPERADMIN → only SUPERADMIN can approve
  if (requester.role === 'HR' || requester.role === 'SUPERADMIN') {
    if (approver.role !== 'SUPERADMIN') return false;
  }
  
  // 3. Check Team Role - must be TEAMLEAD in requester's team
  const isTeamLead = await checkIfTeamLeadInTeam(approverId, requesterId);
  return isTeamLead;
}
```

### 2. Request-Laden
**File:** `/hooks/HRTHIS_useLeaveRequestsList.ts`

```typescript
// ALL admin roles load only requests from teams where they are TEAMLEAD
if (userRole === 'ADMIN' || userRole === 'HR' || userRole === 'SUPERADMIN') {
  // Get teams where user is TEAMLEAD
  const teamIds = await getTeamLeadTeams(userId);
  
  if (teamIds.length === 0) {
    // Not TEAMLEAD of any team → show only own requests
    return loadOwnRequests(userId);
  }
  
  // Load requests from team members
  return loadTeamRequests(teamIds);
}
```

### 3. UI-Anzeige
**File:** `/screens/TimeAndLeaveScreen.tsx`

```typescript
// Check if user can approve requests (has admin role)
const isAdmin = profile?.role === 'ADMIN' || 
                profile?.role === 'SUPERADMIN' || 
                profile?.role === 'HR';

// Pass to LeaveRequestsList
<LeaveRequestsList
  canApprove={isAdmin}  // Shows buttons if admin role
  onApprove={approveRequest}  // Calls canUserApproveRequest() internally
/>
```

---

## Troubleshooting

### Problem: "Sie haben keine Berechtigung, diesen Antrag zu genehmigen"

**Ursachen:**
1. ❌ User ist nicht TEAMLEAD im Team des Antragstellers
2. ❌ User hat keine Global Admin-Rolle (ADMIN/HR/SUPERADMIN)
3. ❌ Antragsteller ist HR/SUPERADMIN, aber User ist nicht SUPERADMIN

**Lösung: Check mit SQL**

```sql
-- Zeige Anna und Tinas Teams
SELECT 
  'ANNA' as person,
  u.email,
  u.role as global_role,
  t.name as team,
  tm.role as team_role,
  tm.priority_tag
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.email = 'admin@halterverbot123.de'

UNION ALL

SELECT 
  'TINA' as person,
  u.email,
  u.role as global_role,
  t.name as team,
  tm.role as team_role,
  tm.priority_tag
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.email = 'social@halterverbot123.de';
```

**Expected Output:**
```
ANNA | admin@... | ADMIN | Büro 2 | TEAMLEAD | PRIMARY
TINA | social@... | USER | Büro 2 | MEMBER | null
```

Wenn Anna **NICHT** TEAMLEAD in Tinas Team ist:

```sql
-- Fix: Anna als TEAMLEAD zu Tinas Team hinzufügen
INSERT INTO team_members (team_id, user_id, role, priority_tag)
SELECT 
  (SELECT team_id FROM team_members WHERE user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de') LIMIT 1),
  (SELECT id FROM users WHERE email = 'admin@halterverbot123.de'),
  'TEAMLEAD',
  'PRIMARY'
ON CONFLICT (team_id, user_id) 
DO UPDATE SET role = 'TEAMLEAD', priority_tag = 'PRIMARY';
```

---

## Benefits des 2-Level Systems

### ✅ Vorteile

1. **Flexibilität:** HR/SUPERADMIN können auf bestimmte Teams beschränkt werden
2. **Skalierbarkeit:** Große Firmen können viele Admins haben, jeder nur für seine Teams zuständig
3. **Sicherheit:** Keine automatischen "Approve All" Rechte
4. **Audit-Trail:** Klar nachvollziehbar wer warum genehmigen kann

### 🔄 Migration von alten Teams

Teams die **vor** dem automatischen System erstellt wurden:

```sql
-- Alle HR/SUPERADMIN/ADMIN zu bestehenden Teams hinzufügen
INSERT INTO team_members (team_id, user_id, role, priority_tag)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role,
  CASE 
    WHEN u.role = 'SUPERADMIN' THEN 'BACKUP_BACKUP'
    WHEN u.role = 'HR' THEN 'BACKUP'
    WHEN u.role = 'ADMIN' THEN 'PRIMARY'
  END as priority_tag
FROM teams t
CROSS JOIN users u
WHERE u.role IN ('ADMIN', 'HR', 'SUPERADMIN')
ON CONFLICT (team_id, user_id) DO NOTHING;
```

---

## Zusammenfassung

| Rolle | Global Role | Team Role | Kann genehmigen? |
|-------|-------------|-----------|------------------|
| Normal User | USER | MEMBER | ❌ Nein |
| Admin (falsch) | ADMIN | - | ❌ Nein (kein TEAMLEAD) |
| Admin (richtig) | ADMIN | TEAMLEAD | ✅ Ja |
| HR (auto) | HR | TEAMLEAD (BACKUP) | ✅ Ja |
| SUPERADMIN (auto) | SUPERADMIN | TEAMLEAD (BACKUP_BACKUP) | ✅ Ja |

**Golden Rule:** Global Role (ADMIN/HR/SUPERADMIN) + Team Role (TEAMLEAD) = ✅ Approval Permission
