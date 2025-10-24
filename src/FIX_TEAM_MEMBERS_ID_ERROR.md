# 🔧 Fix: team_members.id Error

## ❌ Error

```
column team_members.id does not exist
```

**Wo:** `/utils/HRTHIS_leaveApproverLogic.ts` Zeile 357

---

## ✅ Problem

Die `team_members` Tabelle hat **KEINE `id` Spalte**!

**Schema:**
```sql
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  role TEXT,
  priority_tag TEXT,
  PRIMARY KEY (team_id, user_id)  -- Composite Key!
);
```

**Falsch:**
```typescript
.select('id, team_id, role')  // ❌ id existiert nicht!
```

**Richtig:**
```typescript
.select('team_id, role')  // ✅ nur team_id und role
```

---

## ✅ Fix Applied

**Datei:** `/utils/HRTHIS_leaveApproverLogic.ts`

**Vorher:**
```typescript
const { data: membership, error: membershipError } = await supabase
  .from('team_members')
  .select('id, team_id, role')  // ❌ ERROR
  .eq('user_id', approverId)
  .in('team_id', teamIds)
  .eq('role', 'TEAMLEAD')
  .limit(1);
```

**Nachher:**
```typescript
const { data: membership, error: membershipError } = await supabase
  .from('team_members')
  .select('team_id, role')  // ✅ FIXED
  .eq('user_id', approverId)
  .in('team_id', teamIds)
  .eq('role', 'TEAMLEAD')
  .limit(1);
```

---

## 🧪 Jetzt testen!

### Frontend Test:

1. **Als Anna einloggen** (`admin@halterverbot123.de`)
2. **Zu "Zeit & Urlaub" → "Anträge" navigieren**
3. **Browser Console öffnen (F12)**
4. **Auf "Genehmigen" klicken bei Tinas Antrag**

**Du solltest JETZT sehen:**
```
🔍 canUserApproveRequest called: { approverId: '...', requesterId: '...' }
👤 Approver: { email: 'admin@...', name: 'Anna Admin', role: 'ADMIN' }
👤 Requester: { email: 'social@...', name: 'Tina Test', role: 'USER' }
✅ RULE 2 PASS: Approver has admin-level role: ADMIN
📋 Requester is in teams: [...]
✅ RULE 3 PASS: Approver is TEAMLEAD in team: ...
✅ SUCCESS: All rules passed - approval allowed!
```

**Kein Error mehr!** ✅

---

## 📋 Checkliste

- [x] Error identifiziert
- [x] Fix applied (`.select('team_id, role')`)
- [ ] **DU:** Frontend testen
- [ ] **DU:** Genehmigung sollte funktionieren!

---

## 🎯 Expected Result

**Vorher:**
```
❌ Error checking team membership: {
  "code": "42703",
  "message": "column team_members.id does not exist"
}
```

**Jetzt:**
```
✅ RULE 3 PASS: Approver is TEAMLEAD in team: abc-123-...
✅ SUCCESS: All rules passed - approval allowed!
🎉 Toast: "Antrag wurde genehmigt"
```

---

**Der Fix ist LIVE! Teste es jetzt!** 🚀
