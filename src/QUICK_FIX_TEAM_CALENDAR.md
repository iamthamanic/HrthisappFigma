# 🚨 QUICK FIX: Team-Kalender Migration Error

## ❌ **FEHLER:**
```
ERROR: 42704: type "leave_type" does not exist
CONTEXT: SQL statement "ALTER TYPE leave_type ADD VALUE 'UNPAID_LEAVE'"
```

## ✅ **LÖSUNG (2 Minuten):**

### **Schritt 1: Öffne Supabase SQL Editor**
```
1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Linke Sidebar: SQL Editor
4. Klicke: New Query
```

---

### **Schritt 2: Kopiere & Führe aus**

**Option A: Vollständiger Fix (EMPFOHLEN)**
```sql
1. Öffne Datei: /FIX_LEAVE_TYPE_ENUM.sql
2. Kopiere ALLES (Cmd+A / Ctrl+A)
3. Paste in SQL Editor (Cmd+V / Ctrl+V)
4. Klicke: RUN
5. ✅ Erwarte: "✅ LEAVE TYPE ENUM FIX COMPLETED"
```

**Option B: Alternative Migration**
```sql
1. Falls Option A nicht funktioniert
2. Öffne: /supabase/migrations/037_add_unpaid_leave_type.sql
3. Kopiere & Paste
4. RUN
```

---

### **Schritt 3: Browser Refresh**
```
Hard Refresh:
- Mac: Cmd + Shift + R
- Windows: Ctrl + Shift + R
```

---

### **Schritt 4: Testen**
```
1. Gehe zu: /calendar
2. Klicke: "Urlaub/Abwesenheit"
3. Sieh 3 Buttons:
   ☂️  Urlaub
   ❤️  Krankmeldung
   📅 Unbezahlte Abwesenheit  ← NEU!
4. ✅ Funktioniert!
```

---

## 🔍 **WAS WAR DAS PROBLEM?**

### **Root Cause:**
Der PostgreSQL ENUM Type `leave_type` existierte noch nicht in deiner Datenbank.

### **Warum?**
Mögliche Gründe:
1. ❌ Migration 036 wurde nie ausgeführt
2. ❌ Database wurde neu erstellt
3. ❌ Type wurde manuell gelöscht

### **Die Lösung:**
`/FIX_LEAVE_TYPE_ENUM.sql` macht folgendes:

```sql
-- 1. Prüft ob leave_type ENUM existiert
IF NOT EXISTS (leave_type) THEN
  -- Erstellt ENUM mit base values
  CREATE TYPE leave_type AS ENUM ('VACATION', 'SICK');
END IF;

-- 2. Fügt UNPAID_LEAVE hinzu
ALTER TYPE leave_type ADD VALUE 'UNPAID_LEAVE';

-- 3. Stellt sicher dass leave_requests.type Spalte existiert
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS type leave_type;

-- 4. Fügt affects_payroll flag hinzu
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS affects_payroll BOOLEAN;
```

---

## 📊 **ERWARTETE AUSGABE (nach RUN):**

```
========================================
✅ LEAVE TYPE ENUM FIX COMPLETED
========================================

📊 Leave Types verfügbar: SICK, UNPAID_LEAVE, VACATION
📝 Gesamt Leave Requests: 12

🎨 Farb-Schema:
   🟢 VACATION = Grün (Genehmigt)
   🔵 SICK = Blau (Krankmeldung)
   🟣 UNPAID_LEAVE = Lila (Unbezahlt)
   🔴 REJECTED Status = Rot
   🟡 PENDING Status = Gelb

🔴 TEAM-KALENDER (Privacy-First):
   Alle Abwesenheiten = ROTER RING
   (Kein Grund sichtbar - Datenschutz)

💡 Nächster Schritt:
   1. Browser refreshen (Cmd+R / Ctrl+R)
   2. Gehe zu /calendar
   3. Teste "Urlaub/Abwesenheit" Button
   4. Wähle "Unbezahlte Abwesenheit"

========================================
```

---

## 🐛 **TROUBLESHOOTING**

### **Problem 1: "permission denied for type leave_type"**
**Lösung:**
```sql
-- Run als Superuser:
GRANT USAGE ON TYPE leave_type TO authenticated;
GRANT USAGE ON TYPE leave_type TO anon;
```

---

### **Problem 2: "column 'type' already exists"**
**Lösung:**
```
Das ist OK! Der Fix prüft mit IF NOT EXISTS.
Ignore die Warnung, Migration sollte trotzdem funktionieren.
```

---

### **Problem 3: "leave_requests table does not exist"**
**Lösung:**
```sql
-- Du musst erst die Basis-Migration ausführen:
1. Öffne: /supabase/migrations/036_extend_leave_requests.sql
2. Führe aus
3. Dann nochmal: /FIX_LEAVE_TYPE_ENUM.sql
```

---

### **Problem 4: "Still getting errors after migration"**
**Lösung:**
```
1. Check Console (F12) für Errors
2. Verifiziere Migration:
   SELECT enumlabel FROM pg_enum 
   WHERE enumtypid = (
     SELECT oid FROM pg_type WHERE typname = 'leave_type'
   );
   
   Erwarte: VACATION, SICK, UNPAID_LEAVE

3. Hard Refresh Browser (Cmd+Shift+R)
4. Clear Cache
5. Restart Development Server (falls lokal)
```

---

## ✅ **VERIFY SUCCESS**

### **Test 1: SQL Query**
```sql
-- Run in SQL Editor:
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'leave_type'
)
ORDER BY enumlabel;
```

**Erwartetes Ergebnis:**
```
SICK
UNPAID_LEAVE
VACATION
```

---

### **Test 2: UI Check**
```
1. Öffne: /calendar
2. Klicke: "Urlaub/Abwesenheit"
3. Sieh 3 Buttons (nicht 2!)
4. ✅ UNPAID_LEAVE Button sichtbar
```

---

### **Test 3: Create Leave Request**
```
1. Klicke: 📅 Unbezahlte Abwesenheit
2. Wähle Datum: Morgen bis +2 Tage
3. Kommentar: "Test Unbezahlte Abwesenheit"
4. Klicke: "Antrag stellen"
5. ✅ Toast: "Urlaubsantrag wurde eingereicht"
6. Check Calendar: 🟣 Lila Block erscheint
```

---

## 🎯 **ALTERNATIVE LÖSUNG (falls SQL nicht funktioniert)**

### **Option: TypeScript Migration erstellen**
Falls SQL-Zugriff nicht möglich ist, kannst du den Type auch via Supabase Client erstellen:

```typescript
// In einer temporären Migration-Datei
import { supabase } from './utils/supabase/client';

async function fixLeaveType() {
  // Diese Lösung funktioniert NICHT!
  // ENUMs können nur via SQL erstellt werden
  console.error('❌ ENUMs müssen via SQL erstellt werden');
  console.log('👉 Nutze /FIX_LEAVE_TYPE_ENUM.sql in Supabase Dashboard');
}
```

**❌ Fazit:** TypeScript kann **keine** PostgreSQL ENUMs erstellen. 
**✅ Lösung:** SQL Migration in Supabase Dashboard ausführen.

---

## 📝 **ZUSAMMENFASSUNG**

| Schritt | Action | Status |
|---------|--------|--------|
| 1 | SQL Editor öffnen | ⏳ |
| 2 | /FIX_LEAVE_TYPE_ENUM.sql kopieren | ⏳ |
| 3 | Paste & RUN | ⏳ |
| 4 | Erwarte "✅ COMPLETED" | ⏳ |
| 5 | Browser Hard Refresh | ⏳ |
| 6 | Test /calendar | ⏳ |
| 7 | Test UNPAID_LEAVE Button | ⏳ |
| 8 | ✅ **FERTIG!** | 🎉 |

---

## 🚀 **NACH DEM FIX**

### **Was jetzt funktioniert:**

✅ **1. Drei Leave Types:**
- 🟢 Urlaub (VACATION)
- 🔵 Krankmeldung (SICK)
- 🟣 Unbezahlte Abwesenheit (UNPAID_LEAVE)

✅ **2. Team-Kalender mit Profilbildern:**
- Roter Ring für alle Abwesenheiten
- Privacy-First (kein Grund sichtbar)
- Hover zeigt Vertretungs-Infos

✅ **3. Request Leave Dialog:**
- Nur für dich selbst
- Kein User-Selector mehr
- Info-Box erklärt Admin-Funktion

✅ **4. Admin Request Dialog:**
- Für andere Mitarbeiter
- Auto-Approve Option
- User-Selector Dropdown

---

## 🎨 **VISUAL GUIDE**

### **VORHER (Error):**
```
❌ ERROR: type "leave_type" does not exist
❌ UNPAID_LEAVE Button fehlt
❌ Team-Kalender zeigt alte Blöcke
```

### **NACHHER (Fixed):**
```
✅ Leave Type ENUM existiert
✅ UNPAID_LEAVE verfügbar
✅ Team-Kalender mit Profilbildern
✅ Hover-Infos funktionieren
```

---

## 💡 **NEXT STEPS (Optional)**

### **1. Federal State aus Location laden**
```typescript
// In useLeaveManagement Hook
const location = await supabase
  .from('locations')
  .select('federal_state')
  .eq('id', user.location_id)
  .single();
```

### **2. Payroll Integration vorbereiten**
```sql
-- affects_payroll Flag nutzen
SELECT * FROM leave_requests
WHERE affects_payroll = false; -- Paid leaves

SELECT * FROM leave_requests
WHERE affects_payroll = true; -- Unpaid leaves
```

### **3. Reporting erweitern**
```sql
-- Unbezahlte Tage pro User
SELECT 
  user_id,
  COUNT(*) as unpaid_days
FROM leave_requests
WHERE type = 'UNPAID_LEAVE'
  AND status = 'APPROVED'
GROUP BY user_id;
```

---

## ✨ **FERTIG!**

**Die Migration ist jetzt komplett!**

Gehe zu `/calendar` und teste:
1. "Urlaub/Abwesenheit" Button
2. Wähle "Unbezahlte Abwesenheit"
3. Erstelle Test-Antrag
4. Check Team-Kalender
5. Hover über Profilbild

**Viel Erfolg! 🚀**
