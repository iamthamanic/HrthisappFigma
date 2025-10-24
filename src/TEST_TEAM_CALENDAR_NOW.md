# ✅ ALLES READY - JETZT TESTEN!

## 🎉 **Implementation Complete!**

Alle Komponenten sind erstellt und integriert:

✅ **Komponenten:**
- `/components/TeamAbsenceAvatar.tsx` - Profilbild mit rotem Ring + Hover-Infos
- `/components/AdminRequestLeaveDialog.tsx` - Admin erstellt Urlaub für andere

✅ **Hooks:**
- `/hooks/useOrganigramUserInfo.ts` - Holt Vertretungs-Infos aus Organigram
- `/hooks/useTeamLeaves.ts` - Lädt Team-Leaves mit User-Daten
- `/hooks/useCoverageChain.ts` - Berechnet Vertretungs-Kette

✅ **Integration:**
- `/screens/CalendarScreen.tsx` - Team-View mit Profilbildern
- `/components/RequestLeaveDialog.tsx` - Nur für sich selbst (kein Admin-Selector)

✅ **Migration:**
- `leave_type` ENUM erstellt ✅
- `UNPAID_LEAVE` hinzugefügt ✅
- `affects_payroll` Spalte hinzugefügt ✅

---

## 🚀 **JETZT TESTEN (5 Minuten)**

### **Test 1: Browser Refresh** (30 Sekunden)
```
1. Hard Refresh: Cmd+Shift+R (Mac) oder Ctrl+Shift+R (Windows)
2. Warte bis Seite vollständig geladen ist
```

---

### **Test 2: Eigenen Urlaub beantragen** (2 Minuten)

**Schritt 1: Gehe zu Kalender**
```
URL: /calendar
```

**Schritt 2: Klicke "Urlaub/Abwesenheit"**
```
Button: [+ Urlaub/Abwesenheit]
```

**Erwartung:**
```
✅ Dialog öffnet sich
✅ Info-Box sichtbar:
   "Sie stellen einen Antrag für sich selbst. 
    Als Admin/HR können Sie Anträge für andere 
    Mitarbeiter im Admin-Bereich erstellen."
✅ KEIN User-Selector sichtbar
✅ 3 Buttons sichtbar:
   ☂️  Urlaub
   ❤️  Krankmeldung
   📅 Unbezahlte Abwesenheit
```

**Schritt 3: Erstelle Test-Antrag**
```
1. Klicke: 📅 Unbezahlte Abwesenheit
2. Startdatum: Morgen
3. Enddatum: Morgen + 2 Tage
4. Kommentar: "Test Unbezahlte Abwesenheit"
5. Klicke: "Antrag stellen"
```

**Erwartung:**
```
✅ Toast: "Urlaubsantrag wurde eingereicht"
✅ Dialog schließt sich
✅ Kalender zeigt neuen Antrag (🟡 Ausstehend)
```

---

### **Test 3: Admin - Urlaub für Mitarbeiter erstellen** (2 Minuten)

**Nur für: ADMIN, HR, TEAMLEAD**

**Schritt 1: Klicke Admin-Button**
```
Button: [👤 Für Mitarbeiter]
(Rechts neben "Urlaub/Abwesenheit")
```

**Erwartung:**
```
✅ Admin-Dialog öffnet sich
✅ User-Selector sichtbar
✅ "Mitarbeiter *" Dropdown
✅ "Sofort genehmigen" Toggle sichtbar
```

**Schritt 2: Erstelle Antrag für Mitarbeiter**
```
1. Mitarbeiter auswählen: [Wähle einen User]
2. Klicke: ☂️ Urlaub
3. Startdatum: Nächste Woche Montag
4. Enddatum: Nächste Woche Freitag
5. ☑️ "Sofort genehmigen": AN
6. Klicke: "Genehmigen & Erstellen"
```

**Erwartung:**
```
✅ Toast: "Urlaubsantrag wurde genehmigt und erstellt"
✅ Dialog schließt sich
✅ Kalender zeigt neuen Antrag (🟢 Genehmigt)
```

---

### **Test 4: Team-Kalender anzeigen** (2 Minuten)

**Nur für: ADMIN, HR, TEAMLEAD**

**Schritt 1: Wechsle zu Team-View**
```
Klicke Tab: [Team]
(Links oben im Kalender)
```

**Erwartung:**
```
✅ Kalender wechselt zu Team-View
✅ Statt farbiger Blöcke: Profilbilder
✅ Alle Profilbilder haben ROTEN RING
✅ Legende zeigt:
   🔴 Abwesenheit (Urlaub / Krank / Unbezahlt)
   ℹ️  Hover über Profilbild für Details
```

**Schritt 2: Hover über Profilbild**
```
Bewege Maus über ein Profilbild
```

**Erwartung:**
```
✅ HoverCard öffnet sich
✅ Sichtbar:
   - Großes Profilbild (64px) mit rotem Ring
   - Name: "Max Mustermann"
   - Position: "Senior Developer" (falls eingetragen)
   - 🔴 "Abwesend" Badge
   - Abteilungen: [IT] [Marketing] (falls eingetragen)
   - Vertretung:
     👤 Anna Schmidt - Hauptvertretung
     👤 Tom Meyer - Backup-Vertretung
     (falls im Organigram eingetragen)
```

---

### **Test 5: Profilbilder-Anzeige im Kalender** (1 Minute)

**Schritt 1: Finde Tag mit Abwesenheiten**
```
Gehe zu Tag mit mehreren Abwesenheiten
```

**Erwartung:**
```
✅ Bis zu 3 Profilbilder sichtbar
✅ Alle mit rotem Ring
✅ Bei >3 Personen: "+X" Badge
   Beispiel: 👤 👤 👤 +2
```

**Schritt 2: Wechsle zu Personal-View**
```
Klicke Tab: [Persönlich]
```

**Erwartung:**
```
✅ Kalender zeigt wieder farbige Blöcke
✅ Farben:
   🟢 Grün = Urlaub (APPROVED)
   🔵 Blau = Krankmeldung (APPROVED)
   🟣 Lila = Unbezahlte Abwesenheit (APPROVED)
   🟡 Gelb = Ausstehend (PENDING)
   🔴 Rot = Abgelehnt (REJECTED)
```

---

## ❌ **BEKANNTE PROBLEME & LÖSUNGEN**

### **Problem 1: "Keine Vertretung im Organigram hinterlegt"**

**Symptom:**
```
Hover über Profilbild zeigt:
"Keine Vertretung im Organigram hinterlegt"
```

**Ursache:**
User ist in keinem Department als primary/backup eingetragen

**Lösung:**
```
1. Gehe zu: /admin/organigram-canvas
2. Öffne Department (Doppelklick)
3. Setze "Primär": [User auswählen]
4. Setze "Backup": [anderer User auswählen]
5. Speichern
6. Browser refreshen
7. Erneut testen
```

---

### **Problem 2: Profilbilder nicht sichtbar**

**Symptom:**
```
Team-Kalender zeigt alte farbige Blöcke statt Profilbilder
```

**Ursache:**
- Browser-Cache
- Migration nicht ausgeführt
- Hard Refresh fehlt

**Lösung:**
```
1. Hard Refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
2. Cache leeren: Entwicklertools (F12) → Network → "Disable cache"
3. Falls Problem bleibt:
   - Verifiziere Migration in Supabase SQL Editor:
     SELECT enumlabel FROM pg_enum 
     WHERE enumtypid = (
       SELECT oid FROM pg_type WHERE typname = 'leave_type'
     );
   - Erwarte: SICK, UNPAID_LEAVE, VACATION
```

---

### **Problem 3: "Für Mitarbeiter" Button nicht sichtbar**

**Symptom:**
```
Admin-Button fehlt neben "Urlaub/Abwesenheit"
```

**Ursache:**
User ist kein Admin/HR/Teamlead

**Lösung:**
```
1. Check Role in Supabase:
   SELECT id, email, role FROM users 
   WHERE email = 'deine-email@example.com';

2. Erwartete Roles:
   - ADMIN
   - SUPERADMIN
   - HR
   - TEAMLEAD

3. Falls Role falsch, update:
   UPDATE users 
   SET role = 'HR' 
   WHERE email = 'deine-email@example.com';

4. Logout + Login
5. Browser Refresh
```

---

### **Problem 4: Position fehlt im Hover**

**Symptom:**
```
Hover zeigt nur Name, keine Position
```

**Ursache:**
`users.position` ist NULL

**Lösung:**
```
1. Gehe zu: /admin/team-management
2. Klicke auf User
3. Scrolle zu "Position"
4. Trage ein: z.B. "Senior Developer"
5. Speichern
6. Browser refreshen
7. Erneut hovern
```

---

### **Problem 5: Auto-Approve funktioniert nicht**

**Symptom:**
```
Admin erstellt Antrag mit "Sofort genehmigen" AN
Aber Antrag bleibt PENDING
```

**Ursache:**
- JavaScript Error in Console
- Rechte-Problem

**Lösung:**
```
1. Öffne Console (F12)
2. Check für Errors beim Erstellen
3. Verifiziere:
   - AdminRequestLeaveDialog wird genutzt (nicht RequestLeaveDialog)
   - Toggle "Sofort genehmigen" ist AN
   - User ist Admin/HR/Teamlead

4. Check in Supabase:
   SELECT status FROM leave_requests 
   ORDER BY created_at DESC LIMIT 5;
   
   Erwarte: APPROVED (nicht PENDING)
```

---

## 🎨 **ERWARTETE VISUALS**

### **Personal View (Unchanged):**
```
15. Oktober
┌─────────────┐
│ 🟢 Urlaub   │  ← Grüner Block
│ Max M.      │
└─────────────┘
```

### **Team View (NEW):**
```
15. Oktober
┌─────────────┐
│ 👤 👤 👤 +2 │  ← Profilbilder mit ROTEM Ring
└─────────────┘
```

### **Hover-Card:**
```
┌──────────────────────────────┐
│  [Großes Profilbild 🔴]      │
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

### **Admin Leave Dialog:**
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
│ Startdatum        Enddatum         │
│ [15.10.2025]     [17.10.2025]      │
│                                    │
│ ☑️ Sofort genehmigen               │
│    Antrag wird direkt als          │
│    genehmigt erstellt              │
│                                    │
│ [Abbrechen] [Genehmigen & Erstellen]│
└────────────────────────────────────┘
```

---

## ✅ **SUCCESS CHECKLIST**

Nach allen Tests solltest du folgende Results haben:

- [ ] ✅ Browser refreshed (Hard Refresh)
- [ ] ✅ Eigener Urlaub beantragt (UNPAID_LEAVE sichtbar)
- [ ] ✅ Admin-Button "Für Mitarbeiter" sichtbar (nur Admins)
- [ ] ✅ Admin-Dialog funktioniert (User-Selector + Auto-Approve)
- [ ] ✅ Team-Kalender zeigt Profilbilder (roter Ring)
- [ ] ✅ Hover zeigt Vertretungs-Infos
- [ ] ✅ Personal-View behält farbige Blöcke
- [ ] ✅ Legende korrekt angepasst
- [ ] ✅ Keine Console-Errors (F12)

---

## 🎯 **NÄCHSTE SCHRITTE (Optional)**

### **1. Organigram vervollständigen**
```
Damit Vertretungs-Infos angezeigt werden:
1. Gehe zu: /admin/organigram-canvas
2. Erstelle Departments (falls noch nicht vorhanden)
3. Setze Primary + Backup Users
4. Speichern
```

### **2. Federal State aus Location**
```
Aktuell: Hardcoded "NW" (Nordrhein-Westfalen)
TODO: Location-Tabelle mit federal_state Spalte

Migration:
ALTER TABLE locations 
  ADD COLUMN federal_state VARCHAR(2) DEFAULT 'NW';

Update in useLeaveManagement Hook
```

### **3. Payroll Integration vorbereiten**
```
affects_payroll Flag nutzen:

-- Bezahlte Abwesenheiten
SELECT * FROM leave_requests
WHERE affects_payroll = false;

-- Unbezahlte Abwesenheiten (reduziert Gehalt)
SELECT * FROM leave_requests
WHERE affects_payroll = true 
  AND type = 'UNPAID_LEAVE';
```

### **4. Reporting erweitern**
```sql
-- Unbezahlte Tage pro User
SELECT 
  u.first_name || ' ' || u.last_name AS user_name,
  COUNT(*) as unpaid_days
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
WHERE lr.type = 'UNPAID_LEAVE'
  AND lr.status = 'APPROVED'
GROUP BY u.id, u.first_name, u.last_name
ORDER BY unpaid_days DESC;
```

---

## 🎉 **FERTIG!**

**Alle Features sind live und ready to use!**

Gehe zu `/calendar` und teste alle 5 Szenarien durch.

Bei Problemen: Check Console (F12) für Errors und nutze die Troubleshooting-Section oben.

**Viel Erfolg! 🚀**
