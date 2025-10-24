# 🔧 Anna als TEAMLEAD setzen - Anleitung

## Problem
Anna Admin kann Tina Tests Urlaubs-Antrag nicht genehmigen, weil sie zwar die Global Role **ADMIN** hat, aber noch keine Team Role **TEAMLEAD** in Tinas Team.

## Warum das Problem besteht
HRthis nutzt eine **2-Level Rollen-Hierarchie**:

### Level 1: Global Role (in `users.role`)
- ❌ **USER** - Keine Admin-Rechte
- ✅ **ADMIN** - Admin-Rechte im System
- ✅ **HR** - Kann ALLE Urlaubs-Anträge genehmigen
- ✅ **SUPERADMIN** - Kann ALLES genehmigen

### Level 2: Team Role (in `team_members.role`)
- **MEMBER** - Normales Team-Mitglied
- **TEAMLEAD** - Kann Urlaubs-Anträge von Team-Mitgliedern genehmigen

## Approval-Regeln (aus `/utils/HRTHIS_leaveApproverLogic.ts`)

```typescript
// SUPERADMIN kann ALLE Anträge genehmigen
if (approver.role === 'SUPERADMIN') return true;

// HR kann ALLE Anträge genehmigen (außer HR/SUPERADMIN)
if (approver.role === 'HR') return true;

// ADMIN kann nur genehmigen wenn TEAMLEAD
if (approver.role === 'ADMIN') {
  // Muss TEAMLEAD in dem Team sein!
  return isTeamleadInTeam();
}
```

## Anna's aktueller Status
- ✅ Global Role: **ADMIN** (hat sie)
- ❌ Team Role: **NICHT TEAMLEAD** (fehlt noch!)

## Lösung: 3 Schritte

### Schritt 1: Status überprüfen
Führe dieses SQL in Supabase SQL Editor aus:

```bash
📄 CHECK_TEAM_ROLES_NOW.sql
```

Das zeigt dir:
- Welche Global Roles alle User haben
- Welche Team-Mitgliedschaften existieren
- Wer aktuell Tinas Anträge genehmigen kann

### Schritt 2: Anna als TEAMLEAD setzen
Führe dieses SQL aus:

```bash
📄 FIX_ANNA_AS_TEAMLEAD.sql
```

Das macht:
1. Findet Tinas Team
2. Fügt Anna als TEAMLEAD mit PRIMARY priority tag hinzu
3. Zeigt zur Bestätigung alle Team-Mitglieder

### Schritt 3: Testen
1. Lade die HRthis App neu (Hard Refresh: Cmd+Shift+R)
2. Login als Anna Admin
3. Gehe zu "Anträge"
4. Klicke auf Tinas Antrag
5. ✅ Jetzt sollte der Button "Genehmigen" funktionieren!

## Alternative: Anna zu HR hochstufen

Wenn du willst, dass Anna **ALLE** Anträge genehmigen kann (nicht nur von ihrem Team), kannst du sie zu HR hochstufen:

```sql
UPDATE users 
SET role = 'HR' 
WHERE email = 'admin@halterverbot123.de';
```

Dann braucht sie keine Team Role TEAMLEAD mehr!

## Warum gibt es zwei Systeme?

Das ermöglicht flexible Hierarchien:

**Szenario 1: Kleine Firma**
- 1 HR Person (kann alle Anträge genehmigen)
- Alle anderen sind USER

**Szenario 2: Mittlere Firma**
- 1 HR Person für finale Eskalation
- 5 ADMINs die jeweils TEAMLEAD ihrer Teams sind
- ADMINs können nur Anträge ihrer Teams genehmigen

**Szenario 3: Große Firma**
- 1 SUPERADMIN (kann alles)
- 3 HR (können fast alles)
- 10 ADMINs als TEAMLEAD (können nur ihre Teams)

## Debug: Warum funktioniert es nicht?

Falls es nach dem Fix immer noch nicht funktioniert, überprüfe:

### 1. Anna hat wirklich TEAMLEAD Role
```sql
SELECT u.email, tm.role, tm.priority_tag
FROM team_members tm
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'admin@halterverbot123.de';

-- Sollte zeigen: role = 'TEAMLEAD', priority_tag = 'PRIMARY'
```

### 2. Anna ist im SELBEN Team wie Tina
```sql
-- Tinas Team
SELECT team_id FROM team_members WHERE user_id = (
  SELECT id FROM users WHERE email = 'social@halterverbot123.de'
);

-- Annas Team(s)
SELECT team_id FROM team_members WHERE user_id = (
  SELECT id FROM users WHERE email = 'admin@halterverbot123.de'
);

-- MÜSSEN das gleiche team_id haben!
```

### 3. Hard Refresh der App
Die App cached Daten! Nach DB-Änderungen:
- Cmd+Shift+R (Mac) oder Ctrl+Shift+R (Windows)
- Oder: DevTools → Application → Clear Storage → Clear site data

## Zusammenfassung

✅ **ADMIN + TEAMLEAD** = Kann Anträge des Teams genehmigen  
✅ **HR** = Kann ALLE Anträge genehmigen (außer HR/SUPERADMIN)  
✅ **SUPERADMIN** = Kann ALLES genehmigen

Anna braucht: **ADMIN (Global) + TEAMLEAD (Team)**
