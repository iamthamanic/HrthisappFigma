# 🚀 Quick Start: Team-Kalender mit Profilbildern

## ✅ **Sofort loslegen - in 3 Schritten!**

### **Schritt 1: Migration ausführen** ⚡
```bash
1. Öffne: Supabase Dashboard → SQL Editor
2. Kopiere: /QUICK_COPY_UNPAID_LEAVE.sql
3. Führe aus: RUN
4. ✅ Erwartete Ausgabe: "Migration 037 completed"
```

### **Schritt 2: Browser refreshen** 🔄
```
Cmd+R (Mac) oder Ctrl+R (Windows)
```

### **Schritt 3: Testen!** 🎉
```
1. Gehe zu: /calendar
2. Wechsle zu: "Team" Tab (nur für Admins sichtbar)
3. Sieh Profilbilder statt farbiger Blöcke
4. Hover über Profilbild → Vertretungs-Infos
```

---

## 🎯 **HAUPT-FEATURES**

### **1. Team-Kalender = Privacy-First** 🔴
- Alle Abwesenheiten = **ROTER RING**
- Team sieht nur "Person ist weg"
- **KEIN Grund** sichtbar (Datenschutz)

### **2. Personal-Kalender = Detailliert** 🌈
- 🟢 Urlaub genehmigt
- 🔵 Krankmeldung
- 🟣 Unbezahlte Abwesenheit
- 🔴 Abgelehnt
- 🟡 Ausstehend

### **3. Hover = Vertretungs-Infos** 📋
- Großes Profilbild
- Name + Position
- **Vertretung** (aus Organigram)
- **Backup-Vertretung**
- Alle Departments

---

## 📱 **USAGE**

### **1️⃣ Eigenen Urlaub beantragen**
```
Gehe zu: /calendar
Klicke: "Urlaub/Abwesenheit"
→ Dialog öffnet sich (nur für DICH)
→ Wähle Type, Datum, Kommentar
→ "Antrag stellen"
```

**Info-Box:**
```
ℹ️ Sie stellen einen Antrag für sich selbst.
   Als Admin/HR können Sie Anträge für andere 
   Mitarbeiter erstellen.
```

---

### **2️⃣ Admin: Urlaub für Mitarbeiter erstellen**
```
Gehe zu: /calendar
Klicke: "Für Mitarbeiter" (nur für Admins)
→ Mitarbeiter auswählen
→ Type, Datum, Kommentar
→ ☑️ "Sofort genehmigen" (optional)
→ "Genehmigen & Erstellen"
```

**Auto-Approve:**
```
✅ AN:  Direkt als APPROVED erstellen
❌ AUS: Als PENDING erstellen (normale Genehmigung)
```

---

### **3️⃣ Team-Kalender anzeigen**
```
Gehe zu: /calendar
Wechsle zu: "Team" Tab
→ Profilbilder mit rotem Ring werden angezeigt
→ Hover über Profilbild für Details
```

**Legende:**
```
🔴 Abwesenheit (Urlaub / Krank / Unbezahlt)
ℹ️  Hover über Profilbild für Details & Vertretung
```

---

## 🎨 **VISUAL GUIDE**

### **Team-Kalender (vorher vs. nachher)**

**VORHER:**
```
15. Oktober
┌─────────────┐
│ 🟢 Urlaub   │
│ Max M.      │
└─────────────┘
```

**NACHHER:**
```
15. Oktober
┌─────────────┐
│ 👤 👤 👤 +2 │  ← Profilbilder mit ROTEM Ring
└─────────────┘
```

---

### **Hover-Card Beispiel**

**Hover über Profilbild:**
```
┌──────────────────────────────┐
│  [Großes Profilbild]         │
│  🔴 Ring (Abwesend)          │
│                              │
│  Max Mustermann              │
│  Senior Developer            │
│  🔴 Abwesend                 │
│                              │
│  ─────────────────────────   │
│  🏢 Abteilungen              │
│  [IT] [Marketing]            │
│                              │
│  ─────────────────────────   │
│  👥 Vertretung               │
│  👤 Anna Schmidt             │
│     Hauptvertretung          │
│  👤 Tom Meyer                │
│     Backup-Vertretung        │
└──────────────────────────────┘
```

---

### **Admin Leave Dialog**

**Button-Layout:**
```
/calendar
┌─────────────────────────────────────┐
│ [Persönlich] [Team]                 │
│                                     │
│ [Urlaub/Abwesenheit] [Für Mitarbeiter] ← Nur Admins
└─────────────────────────────────────┘
```

**Dialog:**
```
┌────────────────────────────────────┐
│ 👤 Urlaubsantrag für Mitarbeiter  │
├────────────────────────────────────┤
│ Mitarbeiter *                      │
│ [Max Mustermann ▼]                 │
│                                    │
│ Art der Abwesenheit                │
│ [☂️ Urlaub] [❤️ Krank] [📅 Unbez.]│
│                                    │
│ ☑️ Sofort genehmigen               │
│                                    │
│ [Genehmigen & Erstellen]           │
└────────────────────────────────────┘
```

---

## 🧪 **TEST-SZENARIEN**

### **Test 1: Team-Kalender sehen**
1. Login als **ADMIN/HR/TEAMLEAD**
2. Gehe zu `/calendar`
3. Wechsle zu "Team" Tab
4. ✅ Profilbilder mit rotem Ring sichtbar
5. ✅ Hover zeigt Vertretungs-Infos

**Erwartetes Ergebnis:**
- Profilbilder statt farbiger Blöcke
- Roter Ring um alle Avatare
- HoverCard funktioniert

---

### **Test 2: Eigenen Urlaub beantragen**
1. Gehe zu `/calendar`
2. Klicke "Urlaub/Abwesenheit"
3. ✅ Info-Box: "Sie stellen einen Antrag für sich selbst"
4. ✅ KEIN User-Selector sichtbar
5. Wähle Type, Datum
6. Klicke "Antrag stellen"
7. ✅ Toast: "Urlaubsantrag wurde eingereicht"

**Erwartetes Ergebnis:**
- Antrag wird für aktuellen User erstellt
- Status = PENDING

---

### **Test 3: Admin erstellt Urlaub für Mitarbeiter**
1. Login als **ADMIN/HR/TEAMLEAD**
2. Gehe zu `/calendar`
3. Klicke "Für Mitarbeiter"
4. ✅ User-Selector erscheint
5. Wähle: Max Mustermann
6. ✅ Auto-Approve: AN
7. Klicke "Genehmigen & Erstellen"
8. ✅ Toast: "Urlaubsantrag wurde genehmigt und erstellt"

**Erwartetes Ergebnis:**
- Antrag für Max Mustermann erstellt
- Status = APPROVED (wegen Auto-Approve)
- Erscheint sofort im Team-Kalender

---

### **Test 4: Vertretungs-Infos Hover**
1. Gehe zu `/calendar` → "Team"
2. Hover über Profilbild
3. ✅ Großes Profilbild sichtbar
4. ✅ Name + Position sichtbar
5. ✅ "Abwesend" Badge sichtbar
6. ✅ Vertretung angezeigt (falls vorhanden)

**Erwartetes Ergebnis:**
- HoverCard öffnet sich
- Alle Infos korrekt
- Vertretung aus Organigram geladen

---

## 🔧 **TROUBLESHOOTING**

### **Problem 1: "Keine Vertretung im Organigram hinterlegt"**
**Ursache:** User ist in keinem Department eingetragen
**Lösung:**
```
1. Gehe zu: /admin/organigram-canvas
2. Wähle Department
3. Setze "Primär": [User]
4. Setze "Backup": [anderer User]
5. Speichern
```

---

### **Problem 2: "Für Mitarbeiter" Button nicht sichtbar**
**Ursache:** User ist kein Admin/HR/Teamlead
**Lösung:**
```
1. Check Role in Supabase:
   SELECT role FROM users WHERE id = 'user-id';
   
2. Erwartete Roles:
   - ADMIN
   - SUPERADMIN
   - HR
   - TEAMLEAD
```

---

### **Problem 3: Profilbilder nicht sichtbar im Team-Kalender**
**Ursache:** Migration nicht ausgeführt oder alte Daten im Cache
**Lösung:**
```
1. Migration ausführen: /QUICK_COPY_UNPAID_LEAVE.sql
2. Hard Refresh: Cmd+Shift+R (Mac) oder Ctrl+Shift+R (Windows)
3. Browser-Cache leeren
```

---

### **Problem 4: Auto-Approve funktioniert nicht**
**Ursache:** Logik-Fehler oder Rechte-Problem
**Lösung:**
```
1. Check Console (F12) für Errors
2. Verifiziere:
   - User ist Admin/HR/Teamlead
   - AdminRequestLeaveDialog wird genutzt (nicht RequestLeaveDialog)
   - Auto-Approve Toggle ist AN
```

---

## 📊 **DATABASE QUERIES (für Debugging)**

### **1. Check User Department**
```sql
SELECT 
  d.name AS department,
  u1.first_name || ' ' || u1.last_name AS primary_user,
  u2.first_name || ' ' || u2.last_name AS backup_user
FROM departments d
LEFT JOIN users u1 ON d.primary_user_id = u1.id
LEFT JOIN users u2 ON d.backup_user_id = u2.id
WHERE d.is_active = true
ORDER BY d.sort_order;
```

### **2. Check Team Leaves**
```sql
SELECT 
  lr.id,
  lr.type,
  lr.status,
  lr.start_date,
  lr.end_date,
  u.first_name || ' ' || u.last_name AS user_name,
  u.profile_picture_url
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
WHERE lr.status = 'APPROVED'
  AND lr.start_date >= CURRENT_DATE
ORDER BY lr.start_date;
```

### **3. Check User Coverage**
```sql
SELECT 
  u.first_name || ' ' || u.last_name AS user_name,
  d.name AS department,
  u_backup.first_name || ' ' || u_backup.last_name AS backup_user
FROM users u
JOIN departments d ON d.primary_user_id = u.id
LEFT JOIN users u_backup ON d.backup_user_id = u_backup.id
WHERE u.id = 'USER_ID_HERE'
  AND d.is_active = true;
```

---

## ✨ **ZUSAMMENFASSUNG**

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| **Team-Kalender** | ✅ Live | Profilbilder mit rotem Ring |
| **Privacy-First** | ✅ Live | Kein Grund sichtbar |
| **Hover-Infos** | ✅ Live | Vertretung + Departments |
| **Eigener Urlaub** | ✅ Live | Nur für sich selbst |
| **Admin-Urlaub** | ✅ Live | Für Mitarbeiter erstellen |
| **Auto-Approve** | ✅ Live | Direkt genehmigen |

**Alles funktioniert! 🎉**

---

## 🎯 **NEXT STEPS (Optional)**

1. **Federal State aus Location laden**
   ```typescript
   // In hooks/useLeaveManagement.ts
   const location = await supabase
     .from('locations')
     .select('federal_state')
     .eq('id', user.location_id)
     .single();
   ```

2. **Bulk-Urlaub für mehrere User**
   ```tsx
   <AdminBulkLeaveDialog
     selectedUserIds={[...]}
   />
   ```

3. **Export mit Vertretungs-Infos**
   ```typescript
   exportLeaveCalendarWithCoverage();
   ```

**Happy Coding! 🚀**
