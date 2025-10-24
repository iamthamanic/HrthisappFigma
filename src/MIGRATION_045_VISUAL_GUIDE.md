# 🎨 Migration 045 - Visual Guide

## 📊 Vorher vs. Nachher

### ❌ **VORHER (Migration 043 - FALSCH)**

```
┌─────────────────────────────────────────────┐
│           Team "Büro 2" ERSTELLEN           │
└─────────────────────────────────────────────┘
                    ↓
         AUTOMATISCH hinzugefügt:
┌─────────────────────────────────────────────┐
│  👤 Hans (ADMIN) → TEAMLEAD                 │
│  👤 Lisa (ADMIN) → TEAMLEAD                 │
│  👤 Max (ADMIN) → TEAMLEAD                  │
│  🔄 Maria (HR) → TEAMLEAD                   │
│  🔄 Stefan (SUPERADMIN) → TEAMLEAD          │
└─────────────────────────────────────────────┘
           ❌ PROBLEM: Alle ADMINs
           in allen Teams!
```

### ✅ **NACHHER (Migration 045 - RICHTIG)**

```
┌─────────────────────────────────────────────┐
│           Team "Büro 2" ERSTELLEN           │
└─────────────────────────────────────────────┘
                    ↓
         AUTOMATISCH hinzugefügt:
┌─────────────────────────────────────────────┐
│  🔄 Maria (HR) → TEAMLEAD (BACKUP)          │
│  🔄 Stefan (SUPERADMIN) → TEAMLEAD (BACKUP_BACKUP) │
└─────────────────────────────────────────────┘
                    ↓
         MANUELL hinzufügen:
┌─────────────────────────────────────────────┐
│  👑 Hans (ADMIN) → TEAMLEAD (PRIMARY)       │
└─────────────────────────────────────────────┘
           ✅ KORREKT: Nur designierte
           ADMINs in spezifischen Teams!
```

---

## 🔄 Team Struktur Flow

### **Beispiel: 3 Teams mit unterschiedlichen ADMINs**

```
┌────────────────────────────────────────────────────────────┐
│                     TEAM "BÜRO"                            │
├────────────────────────────────────────────────────────────┤
│  👑 Hans (ADMIN) → TEAMLEAD (PRIMARY) [manuell]           │
│  🔄 Maria (HR) → TEAMLEAD (BACKUP) [auto]                 │
│  🔄 Stefan (SUPERADMIN) → TEAMLEAD (BACKUP_BACKUP) [auto] │
│  👤 Anna, Tom, Lisa → MEMBER                               │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    TEAM "FAHRER"                           │
├────────────────────────────────────────────────────────────┤
│  👑 Max (ADMIN) → TEAMLEAD (PRIMARY) [manuell]            │
│  🔄 Maria (HR) → TEAMLEAD (BACKUP) [auto]                 │
│  🔄 Stefan (SUPERADMIN) → TEAMLEAD (BACKUP_BACKUP) [auto] ��
│  👤 Peter, Klaus, Jens → MEMBER                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                      TEAM "IT"                             │
├────────────────────────────────────────────────────────────┤
│  (Kein PRIMARY - nicht zugewiesen)                        │
│  🔄 Maria (HR) → TEAMLEAD (BACKUP) [auto]                 │
│  🔄 Stefan (SUPERADMIN) → TEAMLEAD (BACKUP_BACKUP) [auto] │
│  👤 Sarah, Mike → MEMBER                                   │
└────────────────────────────────────────────────────────────┘
```

**Legende:**
- 👑 = PRIMARY Teamlead (manuell zugewiesen)
- 🔄 = BACKUP Teamlead (automatisch)
- 👤 = Normales Mitglied

---

## 📈 Approval Hierarchy Flow

### **Wer kann welche Anträge genehmigen?**

```
┌───────────────────────────────────────────────────────────┐
│  TINA (USER) reicht Urlaubsantrag ein in "Büro 2"        │
└───────────────────────────────────────────────────────────┘
                           ↓
┌───────────────────────────────────────────────────────────┐
│  canUserApproveRequest(approverId, requesterId)           │
│                                                            │
│  CHECK 1: ✅ Approver.role != 'USER'                      │
│           (muss ADMIN/HR/SUPERADMIN sein)                 │
│                                                            │
│  CHECK 2: ✅ Approver ist TEAMLEAD in Tinas Team          │
│           (team_members.role = 'TEAMLEAD')                │
│                                                            │
│  BEIDE Bedingungen erforderlich!                          │
└───────────────────────────────────────────────────────────┘
                           ↓
                ┌──────────────────────┐
                │  Wer kann approven?  │
                └──────────────────────┘
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
┌─────────────────┐                  ┌─────────────────┐
│  ✅ HANS        │                  │  ❌ MAX         │
│  (ADMIN)        │                  │  (ADMIN)        │
│                 │                  │                 │
│  Global: ADMIN  │                  │  Global: ADMIN  │
│  Team: TEAMLEAD │                  │  Team: -        │
│  in "Büro 2"    │                  │  in "Fahrer"    │
│                 │                  │                 │
│  KANN APPROVEN! │                  │  KANN NICHT!    │
└─────────────────┘                  └─────────────────┘
```

---

## 🎯 Priority Tag System

### **Approval Reihenfolge**

```
┌────────────────────────────────────────────────┐
│  TINAS URLAUBSANTRAG                           │
│  Status: PENDING                               │
│  Zuständig: ?                                  │
└────────────────────────────────────────────────┘
                    ↓
         System sucht Approver:
                    ↓
┌────────────────────────────────────────────────┐
│  1️⃣ PRIMARY (ADMIN)                           │
│     👑 Hans - verfügbar? → ✅ ZUSTÄNDIG!      │
│                                                │
│     Falls nicht verfügbar:                     │
│        ↓                                       │
│  2️⃣ BACKUP (HR)                               │
│     🔄 Maria - verfügbar? → ✅ ÜBERNIMMT!     │
│                                                │
│     Falls nicht verfügbar:                     │
│        ↓                                       │
│  3️⃣ BACKUP_BACKUP (SUPERADMIN)                │
│     🔄 Stefan - verfügbar? → ✅ ÜBERNIMMT!    │
└────────────────────────────────────────────────┘
```

**Availability Check:**
- User hat heute APPROVED Leave Request → nicht verfügbar
- Sonst → verfügbar

---

## 🔄 Migration 045 Flow

### **Was passiert in Migration 045?**

```
┌───────────────────────────────────────────────┐
│  STEP 1: Update Trigger Functions            │
│  ├─ auto_add_hr_superadmin_to_team()         │
│  │  └─ Entferne ADMIN aus WHERE clause       │
│  └─ auto_add_user_to_all_teams_on_promotion()│
│     └─ Entferne ADMIN aus IF condition       │
└───────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────┐
│  STEP 2: Remove Auto-Added ADMINs            │
│  DELETE FROM team_members                    │
│  WHERE user.role = 'ADMIN'                   │
│    AND tm.role = 'TEAMLEAD'                  │
│    AND tm.priority_tag IS NULL  ← key!       │
└───────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────┐
│  STEP 3: Set Priority Tags                  │
│  UPDATE team_members                         │
│  SET priority_tag = 'BACKUP'                 │
│  WHERE user.role = 'HR'                      │
│                                              │
│  UPDATE team_members                         │
│  SET priority_tag = 'BACKUP_BACKUP'          │
│  WHERE user.role = 'SUPERADMIN'              │
└───────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────┐
│  RESULT: ✅ Clean State                      │
│  ✅ HR & SUPERADMIN auto-added (BACKUP)      │
│  ❌ ADMIN removed (unless manually assigned) │
└───────────────────────────────────────────────┘
```

---

## 🛠️ Manual ADMIN Assignment Flow

### **Wie füge ich einen ADMIN zu einem Team hinzu?**

```
┌───────────────────────────────────────────────┐
│  INSERT INTO team_members                    │
│  (team_id, user_id, role, priority_tag)      │
│  SELECT                                      │
│    t.id,                                     │
│    u.id,                                     │
│    'TEAMLEAD',                               │
│    'PRIMARY'  ← Wichtig!                     │
│  FROM teams t, users u                       │
│  WHERE t.name = 'Büro 2'                     │
│    AND u.email = 'admin@...'                 │
└───────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────┐
│  RESULT:                                     │
│  ✅ Admin is TEAMLEAD in "Büro 2"           │
│  ✅ priority_tag = 'PRIMARY'                 │
│  ✅ Can approve requests from "Büro 2"      │
└───────────────────────────────────────────────┘
```

---

## 📊 Database Schema (relevant tables)

```
┌──────────────────────────────────────────────────────────┐
│                      USERS TABLE                         │
├──────────────────────────────────────────────────────────┤
│  id (uuid) PK                                            │
│  email (text)                                            │
│  role (text) ← Global Role                               │
│    ├─ 'USER'                                             │
│    ├─ 'ADMIN'                                            │
│    ├─ 'HR'                                               │
│    └─ 'SUPERADMIN'                                       │
└──────────────────────────────────────────────────────────┘
                           │
                           │ 1:N
                           ↓
┌──────────────────────────────────────────────────────────┐
│                  TEAM_MEMBERS TABLE                      │
├──────────────────────────────────────────────────────────┤
│  id (uuid) PK                                            │
│  team_id (uuid) FK → teams                               │
│  user_id (uuid) FK → users                               │
│  role (text) ← Team Role                                 │
│    ├─ 'MEMBER'                                           │
│    └─ 'TEAMLEAD'                                         │
│  priority_tag (text) ← NEW!                              │
│    ├─ 'PRIMARY'                                          │
│    ├─ 'BACKUP'                                           │
│    └─ 'BACKUP_BACKUP'                                    │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

### **Nach Migration 045 sollte gelten:**

```
✅ HR & SUPERADMIN:
   - In allen Teams als TEAMLEAD
   - priority_tag = 'BACKUP' / 'BACKUP_BACKUP'
   - Automatisch hinzugefügt

✅ ADMIN:
   - NICHT automatisch in Teams
   - Muss manuell hinzugefügt werden
   - priority_tag = 'PRIMARY' (empfohlen)

✅ Trigger:
   - Nur HR & SUPERADMIN werden bei Team-Erstellung hinzugefügt
   - Nur HR & SUPERADMIN werden bei User-Promotion hinzugefügt

✅ Approval Logic:
   - Funktioniert weiterhin (2-Level Check)
   - ADMIN kann nur in ihren Teams approven
   - HR & SUPERADMIN können in allen Teams approven
```

---

**Next Step:** Führe `/STEP2_ADD_ANNA_TO_BUERO2.sql` aus! 🚀
