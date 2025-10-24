# 🔐 Leave Approval Hierarchy - Security Rules

## Neue Sicherheitsregeln (ab jetzt implementiert)

### Regel 1: SUPERADMIN-Anträge
**Nur SUPERADMIN kann SUPERADMIN-Anträge genehmigen**

- ✅ SUPERADMIN → kann SUPERADMIN-Anträge genehmigen
- ❌ HR → kann KEINE SUPERADMIN-Anträge genehmigen
- ❌ ADMIN → kann KEINE SUPERADMIN-Anträge genehmigen

### Regel 2: HR-Anträge
**Nur SUPERADMIN kann HR-Anträge genehmigen**

- ✅ SUPERADMIN → kann HR-Anträge genehmigen
- ❌ HR → kann KEINE HR-Anträge genehmigen (auch nicht gegenseitig!)
- ❌ ADMIN → kann KEINE HR-Anträge genehmigen

### Regel 3: ADMIN-Anträge
**SUPERADMIN, HR, oder TEAMLEAD-ADMIN können ADMIN-Anträge genehmigen**

- ✅ SUPERADMIN → kann ADMIN-Anträge genehmigen
- ✅ HR → kann ADMIN-Anträge genehmigen
- ✅ ADMIN (als TEAMLEAD im selben Team) → kann ADMIN-Anträge genehmigen
- ❌ ADMIN (nicht TEAMLEAD) → kann KEINE ADMIN-Anträge genehmigen

### Regel 4: USER-Anträge
**SUPERADMIN, HR, oder TEAMLEAD können USER-Anträge genehmigen**

- ✅ SUPERADMIN → kann USER-Anträge genehmigen
- ✅ HR → kann USER-Anträge genehmigen
- ✅ ADMIN (als TEAMLEAD im selben Team) → kann USER-Anträge genehmigen
- ❌ ADMIN (nicht TEAMLEAD) → kann KEINE USER-Anträge genehmigen

---

## Approval Matrix

| Antragsteller ↓ / Genehmiger → | SUPERADMIN | HR  | ADMIN (TEAMLEAD) | ADMIN (kein TEAMLEAD) | USER |
|-------------------------------|-----------|-----|------------------|-----------------------|------|
| **SUPERADMIN**                | ✅        | ❌  | ❌               | ❌                    | ❌   |
| **HR**                        | ✅        | ❌  | ❌               | ❌                    | ❌   |
| **ADMIN**                     | ✅        | ✅  | ✅               | ❌                    | ❌   |
| **USER**                      | ✅        | ✅  | ✅               | ❌                    | ❌   |

---

## Zuständiger Approver ("Zuständig" in UI)

### Für SUPERADMIN und HR Anträge:
- **Angezeigt:** Nur andere SUPERADMIN-Benutzer
- **Hinweis:** "Superadmin (Required for HR/SUPERADMIN)"
- **Kein HR wird angezeigt** - auch nicht als Coverage

### Für ADMIN und USER Anträge:
- **Primary:** Erster verfügbarer TEAMLEAD im Team
- **Priorität:** 
  1. ADMIN (TEAMLEAD, verfügbar)
  2. HR (TEAMLEAD, verfügbar)
  3. SUPERADMIN (TEAMLEAD, verfügbar)
- **Coverage:** HR oder SUPERADMIN als Backup

---

## Implementierte Logik

### `canUserApproveRequest(approverId, requesterId)`

```typescript
// Schritt 1: Hole Requester-Rolle
const requester = await getUser(requesterId);

// Schritt 2: SPECIAL RULE für HR/SUPERADMIN
if (requester.role === 'HR' || requester.role === 'SUPERADMIN') {
  return approver.role === 'SUPERADMIN';
}

// Schritt 3: SUPERADMIN kann alle anderen genehmigen
if (approver.role === 'SUPERADMIN') {
  return true;
}

// Schritt 4: HR kann alle anderen genehmigen
if (approver.role === 'HR') {
  return true;
}

// Schritt 5: ADMIN kann genehmigen, wenn TEAMLEAD
if (approver.role === 'ADMIN') {
  return isTeamleadInSameTeam(approverId, requesterId);
}

// Schritt 6: USER kann nicht genehmigen
return false;
```

### `getApproversForUser(userId)`

```typescript
// Schritt 1: Hole User-Rolle
const user = await getUser(userId);

// Schritt 2: SPECIAL RULE für HR/SUPERADMIN
if (user.role === 'HR' || user.role === 'SUPERADMIN') {
  // Nur andere SUPERADMIN als Approver
  return getSuperadminsExcept(userId);
}

// Schritt 3: Normale Logik für andere Benutzer
return getTeamLeadsAndGlobalApprovers(userId);
```

---

## UI-Anzeige Beispiele

### Beispiel 1: Tina Test (USER) stellt Antrag
**Zuständig:** Anna Admin (ADMIN, TEAMLEAD in Team 3)
- ✅ Anna Admin kann genehmigen
- ✅ Jeder HR kann genehmigen
- ✅ Jeder SUPERADMIN kann genehmigen

### Beispiel 2: Anna Admin (ADMIN) stellt Antrag
**Zuständig:** HR-Person oder SUPERADMIN
- ❌ Andere ADMIN können NICHT genehmigen (außer sie sind TEAMLEAD im selben Team)
- ✅ HR kann genehmigen
- ✅ SUPERADMIN kann genehmigen

### Beispiel 3: HR-Person stellt Antrag
**Zuständig:** Nur SUPERADMIN
- ❌ Andere HR können NICHT genehmigen
- ❌ ADMIN können NICHT genehmigen
- ✅ Nur SUPERADMIN kann genehmigen

### Beispiel 4: SUPERADMIN stellt Antrag
**Zuständig:** Nur andere SUPERADMIN
- ❌ HR können NICHT genehmigen
- ❌ ADMIN können NICHT genehmigen
- ✅ Nur andere SUPERADMIN können genehmigen

---

## Warum diese Regeln?

### Sicherheit & Compliance
1. **Vier-Augen-Prinzip:** HR und SUPERADMIN können ihre eigenen Anträge nicht genehmigen
2. **Hierarchie:** Höhere Rollen brauchen höhere Genehmigung
3. **Transparenz:** Klare Zuständigkeiten für jeden Antrag
4. **Audit-Trail:** Nachvollziehbar wer was genehmigt hat

### Praktische Beispiele
- **Urlaubsantrag vom CEO (SUPERADMIN):** Muss vom Aufsichtsrat (anderer SUPERADMIN) genehmigt werden
- **Urlaubsantrag von HR-Manager:** Muss vom SUPERADMIN genehmigt werden
- **Urlaubsantrag von Abteilungsleiter (ADMIN):** Kann von HR oder SUPERADMIN genehmigt werden
- **Urlaubsantrag von Mitarbeiter (USER):** Kann von Teamlead, HR oder SUPERADMIN genehmigt werden

---

## Testing

### Test 1: HR kann KEINE HR-Anträge genehmigen
```sql
-- Setup
-- User A: HR
-- User B: HR
-- User B stellt Urlaubsantrag

-- Expected:
-- ❌ User A sieht KEINEN "Genehmigen" Button
-- ✅ Nur SUPERADMIN sieht "Genehmigen" Button
```

### Test 2: SUPERADMIN kann HR-Anträge genehmigen
```sql
-- Setup
-- User A: SUPERADMIN
-- User B: HR
-- User B stellt Urlaubsantrag

-- Expected:
-- ✅ User A sieht "Genehmigen" Button
-- ✅ User A kann erfolgreich genehmigen
```

### Test 3: HR kann USER-Anträge genehmigen
```sql
-- Setup
-- User A: HR
-- User B: USER
-- User B stellt Urlaubsantrag

-- Expected:
-- ✅ User A sieht "Genehmigen" Button
-- ✅ User A kann erfolgreich genehmigen
```

---

## Betroffene Dateien

### Frontend
- ✅ `/utils/leaveApproverLogic.ts` - Haupt-Logik
- ✅ `/hooks/useLeaveRequestsList.ts` - Verwendet `canUserApproveRequest()`
- ✅ `/components/LeaveRequestsList.tsx` - Zeigt "Zuständig" und Buttons an

### Backend
- Keine Änderungen nötig - RLS policies bleiben gleich
- Permissions werden im Frontend geprüft

---

## Migration History

- **Migration 040:** Auto-add HR/SUPERADMIN als TEAMLEAD
- **Migration 043:** Auto-add ADMIN als TEAMLEAD
- **Heute:** Approval-Hierarchie-Regeln implementiert

---

**Status:** ✅ Implementiert und bereit für Testing
**Version:** 1.0.0
**Datum:** 2025-01-08
