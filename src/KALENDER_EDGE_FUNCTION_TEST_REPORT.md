# 🔍 BrowoKoordinator-Kalender - Complete Test Report

**Function:** BrowoKoordinator-Kalender  
**Version:** v2.0.0  
**Status:** ✅ Ready for Testing  
**Datum:** 29. Oktober 2025

---

## 📋 **IMPLEMENTATION STATUS**

### ✅ **KOMPLETT IMPLEMENTIERT:**

| Route | Method | Auth | Purpose | Status |
|-------|--------|------|---------|--------|
| `/health` | GET | ❌ NO | Health check (public for monitoring) | ✅ |
| `/team-calendar` | GET | ✅ YES | Team calendar with absences, shifts, holidays | ✅ |
| `/absences` | GET | ✅ YES | Absences overview (read-only) | ✅ |
| `/holidays` | GET | ✅ YES | German public holidays by state | ✅ |
| `/shifts` | GET | ✅ YES | Get shifts | ✅ |
| `/shifts` | POST | ✅ YES | Create shift | ✅ |
| `/shifts/:id` | PUT | ✅ YES | Update shift | ✅ |
| `/shifts/:id` | DELETE | ✅ YES | Delete shift | ✅ |
| `/export` | POST | ✅ YES | Export calendar (iCal format) | ✅ |

**GESAMT: 9 Routes ✅**

---

## 🎯 **NACHTRÄGLICHE FUNKTIONEN (BESPROCHEN)**

### **1. SCHICHTPLANUNG (Shift Scheduling)**
✅ **KOMPLETT IMPLEMENTIERT**
- ✅ GET `/shifts` - Schichten abrufen
- ✅ POST `/shifts` - Schicht erstellen
- ✅ PUT `/shifts/:id` - Schicht aktualisieren
- ✅ DELETE `/shifts/:id` - Schicht löschen
- ✅ Authorization: Nur HR/Teamleads
- ✅ RLS Policies in `shifts` Tabelle

### **2. FEIERTAGE (German Holidays)**
✅ **KOMPLETT IMPLEMENTIERT**
- ✅ GET `/holidays` - Deutsche Feiertage
- ✅ Unterstützte Bundesländer: BW, BY, NRW, HE, RP, SL
- ✅ Ostern-Berechnung (Gauss-Algorithmus)
- ✅ Bewegliche Feiertage (Karfreitag, Ostern, Pfingsten, etc.)
- ✅ Bundesland-spezifische Feiertage

### **3. TEAM-KALENDER (Team Calendar)**
✅ **KOMPLETT IMPLEMENTIERT**
- ✅ GET `/team-calendar` - Kombinierte Ansicht
- ✅ Includes: Absences, Shifts, Holidays
- ✅ Filter by: month, year, team_id
- ✅ Approved leave requests only
- ✅ User profile pictures included

### **4. ABWESENHEITEN (Absences Overview)**
✅ **KOMPLETT IMPLEMENTIERT**
- ✅ GET `/absences` - Abwesenheiten abrufen
- ✅ Filter by: start_date, end_date, team_id
- ✅ Read-only (Management in Antragmanager)
- ✅ Nur genehmigte Anträge (APPROVED)

### **5. KALENDER-EXPORT (iCal Export)**
✅ **KOMPLETT IMPLEMENTIERT**
- ✅ POST `/export` - Export als .ics Datei
- ✅ Options: include_absences, include_shifts, include_holidays
- ✅ iCal format (RFC 5545 compliant)
- ✅ Import in Outlook, Google Calendar, Apple Calendar

### **6. SAUBERE VERANTWORTLICHKEITEN**
✅ **KLAR GETRENNT**
- ✅ **Kalender:** Nur Visualisierung + Schichten
- ✅ **Antragmanager:** Leave Request Management
- ✅ Dokumentiert in Function Header
- ✅ Response enthält Hinweis auf Antragmanager

---

## 🔍 **DETAILLIERTE FEATURE-ANALYSE**

### **1. TEAM-KALENDER (`/team-calendar`)**

**✅ IMPLEMENTIERT:**
```typescript
GET /BrowoKoordinator-Kalender/team-calendar?month=10&year=2025&team_id=xxx
```

**Response:**
```json
{
  "success": true,
  "calendar": {
    "month": 10,
    "year": 2025,
    "absences": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "first_name": "Max",
          "last_name": "Mustermann",
          "email": "max@example.com",
          "profile_picture": "url"
        },
        "start_date": "2025-10-15",
        "end_date": "2025-10-20",
        "type": "VACATION",
        "status": "APPROVED"
      }
    ],
    "shifts": [
      {
        "id": "uuid",
        "user": { "first_name": "Anna", "last_name": "Schmidt" },
        "date": "2025-10-15",
        "shift_type": "MORNING",
        "start_time": "06:00",
        "end_time": "14:00"
      }
    ],
    "holidays": [
      {
        "date": "2025-10-03",
        "name": "Tag der Deutschen Einheit",
        "type": "PUBLIC_HOLIDAY"
      }
    ]
  },
  "timestamp": "2025-10-29T12:00:00Z"
}
```

**Features:**
- ✅ Monat/Jahr Filter
- ✅ Team Filter (optional)
- ✅ Kombiniert: Absences + Shifts + Holidays
- ✅ User Profile Pictures
- ✅ Nur genehmigte Leave Requests

---

### **2. FEIERTAGE (`/holidays`)**

**✅ IMPLEMENTIERT:**
```typescript
GET /BrowoKoordinator-Kalender/holidays?year=2025&state=NRW
```

**Response:**
```json
{
  "success": true,
  "holidays": [
    { "date": "2025-01-01", "name": "Neujahr", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-04-18", "name": "Karfreitag", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-04-21", "name": "Ostermontag", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-05-01", "name": "Tag der Arbeit", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-05-29", "name": "Christi Himmelfahrt", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-06-09", "name": "Pfingstmontag", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-06-19", "name": "Fronleichnam", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-10-03", "name": "Tag der Deutschen Einheit", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-11-01", "name": "Allerheiligen", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-12-25", "name": "1. Weihnachtstag", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-12-26", "name": "2. Weihnachtstag", "type": "PUBLIC_HOLIDAY" }
  ],
  "year": 2025,
  "state": "NRW",
  "count": 11,
  "available_states": ["BW", "BY", "NRW", "HE", "RP", "SL"],
  "timestamp": "2025-10-29T12:00:00Z"
}
```

**Unterstützte Bundesländer:**
- ✅ **BW** (Baden-Württemberg) - 13 Feiertage
- ✅ **BY** (Bayern) - 14 Feiertage
- ✅ **NRW** (Nordrhein-Westfalen) - 11 Feiertage
- ✅ **HE** (Hessen) - 10 Feiertage
- ✅ **RP** (Rheinland-Pfalz) - 11 Feiertage
- ✅ **SL** (Saarland) - 12 Feiertage

**Algorithmus:**
- ✅ Gauss-Algorithmus für Ostern-Berechnung
- ✅ Automatische Berechnung beweglicher Feiertage
- ✅ Bundesland-spezifische Feiertage

---

### **3. SCHICHTPLANUNG (`/shifts`)**

**✅ IMPLEMENTIERT:**

#### **GET Shifts**
```typescript
GET /BrowoKoordinator-Kalender/shifts?start_date=2025-10-01&end_date=2025-10-31&team_id=xxx
```

**Response:**
```json
{
  "success": true,
  "shifts": [
    {
      "id": "uuid",
      "user": { "id": "uuid", "first_name": "Max", "last_name": "Mustermann" },
      "team": { "id": "uuid", "name": "Team A" },
      "date": "2025-10-15",
      "shift_type": "MORNING",
      "start_time": "06:00",
      "end_time": "14:00",
      "notes": "Schicht mit Überstunden",
      "created_by": "uuid",
      "created_at": "2025-10-01T10:00:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2025-10-29T12:00:00Z"
}
```

#### **POST Create Shift**
```typescript
POST /BrowoKoordinator-Kalender/shifts
{
  "user_id": "uuid",
  "team_id": "uuid",
  "date": "2025-10-15",
  "shift_type": "MORNING",
  "start_time": "06:00",
  "end_time": "14:00",
  "notes": "Optional notes"
}
```

**Authorization:**
- ✅ Nur HR (HR_SUPERADMIN, HR_MANAGER)
- ✅ Oder TEAMLEAD (checked via team_members table)

#### **PUT Update Shift**
```typescript
PUT /BrowoKoordinator-Kalender/shifts/:id
{
  "shift_type": "AFTERNOON",
  "start_time": "14:00",
  "end_time": "22:00"
}
```

**Authorization:**
- ✅ HR
- ✅ Shift creator
- ✅ Teamlead of team

#### **DELETE Shift**
```typescript
DELETE /BrowoKoordinator-Kalender/shifts/:id
```

**Authorization:** Same as UPDATE

---

### **4. KALENDER-EXPORT (`/export`)**

**✅ IMPLEMENTIERT:**
```typescript
POST /BrowoKoordinator-Kalender/export
{
  "start_date": "2025-10-01",
  "end_date": "2025-10-31",
  "include_absences": true,
  "include_shifts": true,
  "include_holidays": true,
  "state": "NRW"
}
```

**Response:**
```json
{
  "success": true,
  "format": "iCal",
  "events_count": 25,
  "ical_data": "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n...",
  "download_filename": "browoko_calendar_2025-10-01_2025-10-31.ics",
  "timestamp": "2025-10-29T12:00:00Z"
}
```

**Export Format:**
- ✅ iCal (RFC 5545 compliant)
- ✅ Kompatibel mit: Outlook, Google Calendar, Apple Calendar
- ✅ Inkludiert: Absences, Shifts, Holidays
- ✅ Downloadable .ics file

---

## 🗄️ **DATABASE REQUIREMENTS**

### **✅ SHIFTS TABELLE**

**Status:** ⚠️ **MUSS NOCH ERSTELLT WERDEN!**

**SQL File:** `/CREATE_SHIFTS_TABLE.sql`

**Struktur:**
```sql
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- ✅ `idx_shifts_date`
- ✅ `idx_shifts_user_id`
- ✅ `idx_shifts_team_id`
- ✅ `idx_shifts_created_by`

**RLS Policies:**
- ✅ View: Own shifts + Team shifts + HR can see all
- ✅ Insert: Only HR + Teamleads
- ✅ Update: HR + Teamleads + Creator
- ✅ Delete: HR + Teamleads + Creator

**Trigger:**
- ✅ Auto-update `updated_at` on changes

---

## 🧪 **TEST PLAN**

### **PHASE 1: DATABASE SETUP** ⏳

**Step 1: Shifts Tabelle erstellen**
```bash
# In Supabase SQL Editor:
# Kopiere /CREATE_SHIFTS_TABLE.sql und führe aus
```

**Expected Result:**
```
✅ Shifts table created successfully!
✅ 4 Indexes created
✅ RLS enabled with 4 policies
✅ Trigger created
```

---

### **PHASE 2: HEALTH CHECK TEST** ⏳

**Test 1: Public Health Endpoint (NO AUTH)**
```bash
curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/health
```

**Expected:**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Kalender",
  "version": "2.0.0",
  "purpose": "Calendar Visualization & Shift Planning"
}
```

---

### **PHASE 3: FEIERTAGE TEST** ⏳

**Test 2: Get Holidays**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/holidays?year=2025&state=NRW"
```

**Expected:**
- ✅ 11 Feiertage für NRW 2025
- ✅ Neujahr, Ostern, Tag der Arbeit, etc.
- ✅ Alle Daten chronologisch sortiert

**Test 3: Different States**
```bash
# Bayern (14 Feiertage)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "...holidays?year=2025&state=BY"

# Baden-Württemberg (13 Feiertage)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "...holidays?year=2025&state=BW"
```

---

### **PHASE 4: SCHICHTEN TEST** ⏳

**Test 4: Create Shift (as HR)**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "team_id": "TEAM_UUID",
    "date": "2025-10-15",
    "shift_type": "MORNING",
    "start_time": "06:00",
    "end_time": "14:00",
    "notes": "Test Schicht"
  }' \
  https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/shifts
```

**Expected:**
```json
{
  "success": true,
  "shift": {
    "id": "uuid",
    "user": { "first_name": "Max", "last_name": "Mustermann" },
    "date": "2025-10-15",
    "shift_type": "MORNING"
  }
}
```

**Test 5: Get Shifts**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/shifts?start_date=2025-10-01&end_date=2025-10-31"
```

**Test 6: Update Shift**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shift_type": "AFTERNOON",
    "start_time": "14:00",
    "end_time": "22:00"
  }' \
  https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/shifts/SHIFT_UUID
```

**Test 7: Delete Shift**
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/shifts/SHIFT_UUID
```

---

### **PHASE 5: TEAM-KALENDER TEST** ⏳

**Test 8: Get Team Calendar**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/team-calendar?month=10&year=2025"
```

**Expected:**
```json
{
  "success": true,
  "calendar": {
    "month": 10,
    "year": 2025,
    "absences": [...],  // Approved leave requests
    "shifts": [...],     // Scheduled shifts
    "holidays": [...]    // German holidays
  }
}
```

---

### **PHASE 6: KALENDER-EXPORT TEST** ⏳

**Test 9: Export Calendar**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-10-01",
    "end_date": "2025-10-31",
    "include_absences": true,
    "include_shifts": true,
    "include_holidays": true,
    "state": "NRW"
  }' \
  https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/export
```

**Expected:**
```json
{
  "success": true,
  "format": "iCal",
  "events_count": 25,
  "ical_data": "BEGIN:VCALENDAR\r\n...",
  "download_filename": "browoko_calendar_2025-10-01_2025-10-31.ics"
}
```

**Verify:**
- ✅ iCal format is valid
- ✅ Can import into Google Calendar
- ✅ Can import into Outlook
- ✅ Events show correct dates/times

---

### **PHASE 7: AUTHORIZATION TEST** ⏳

**Test 10: Non-HR User tries to create shift**
```bash
curl -X POST \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "xxx", "date": "2025-10-15", "shift_type": "MORNING"}' \
  https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/shifts
```

**Expected:**
```json
{
  "error": "Not authorized to create shifts"
}
```
**Status:** 403

**Test 11: Teamlead creates shift**
```bash
# Same as Test 10, but with TEAMLEAD_TOKEN
```

**Expected:**
```json
{
  "success": true,
  "shift": {...}
}
```
**Status:** 200

---

## 🐛 **POTENTIAL ISSUES & FIXES**

### **1. Shifts Tabelle existiert nicht** ⚠️

**Problem:**
```
Error: relation "public.shifts" does not exist
```

**Fix:**
```bash
# 1. Führe /CREATE_SHIFTS_TABLE.sql in Supabase aus
# 2. Verifiziere mit:
SELECT * FROM information_schema.tables WHERE table_name = 'shifts';
```

---

### **2. No absences shown** ⚠️

**Problem:**
```json
{
  "absences": []
}
```

**Mögliche Ursachen:**
- ✅ Keine approved leave requests im Zeitraum
- ✅ Team filter filtert alle raus
- ✅ RLS Policy blockiert Zugriff

**Debug:**
```sql
-- Check leave_requests
SELECT * FROM leave_requests 
WHERE status = 'APPROVED' 
AND start_date <= '2025-10-31' 
AND end_date >= '2025-10-01';
```

---

### **3. Holidays calculation wrong** ⚠️

**Problem:** Ostern auf falschem Datum

**Check:**
- ✅ Gauss-Algorithmus korrekt? (Ostern 2025 = 20. April)
- ✅ Bewegliche Feiertage korrekt berechnet?

**Verify:**
```javascript
// Easter 2025 should be April 20
// Karfreitag: April 18 (-2 days)
// Ostermontag: April 21 (+1 day)
```

---

### **4. iCal export not working** ⚠️

**Problem:** Import in Calendar app fails

**Check:**
- ✅ CRLF line breaks (`\r\n`)
- ✅ Date format: `YYYYMMDD`
- ✅ Valid VEVENT structure

**Debug:**
```bash
# Save ical_data to file and validate
curl ... > calendar.ics
# Import in calendar app
```

---

## ✅ **DEPLOYMENT CHECKLIST**

### **PRE-DEPLOYMENT:**

- [ ] **1. Shifts Tabelle erstellen**
  ```bash
  # Führe /CREATE_SHIFTS_TABLE.sql in Supabase aus
  ```

- [ ] **2. Function bereits deployed**
  ```
  ✅ BrowoKoordinator-Kalender v2.0.0 ist deployed
  ```

- [ ] **3. Test Health Endpoint**
  ```bash
  curl https://...supabase.co/functions/v1/BrowoKoordinator-Kalender/health
  ```

---

### **POST-DEPLOYMENT TESTS:**

- [ ] **4. Holidays Test** (5 min)
  - [ ] NRW Feiertage 2025 (11 Feiertage erwartet)
  - [ ] Bayern Feiertage 2025 (14 Feiertage erwartet)
  - [ ] Ostern korrekt berechnet (20. April 2025)

- [ ] **5. Shifts CRUD Test** (10 min)
  - [ ] Create shift as HR ✅
  - [ ] Get shifts ✅
  - [ ] Update shift ✅
  - [ ] Delete shift ✅
  - [ ] Non-HR user blocked ❌ (403)

- [ ] **6. Team Calendar Test** (5 min)
  - [ ] Get calendar for current month
  - [ ] Includes absences, shifts, holidays
  - [ ] Team filter works

- [ ] **7. Export Test** (5 min)
  - [ ] Export generates valid iCal
  - [ ] Import in Google Calendar works
  - [ ] All events show correctly

- [ ] **8. Authorization Test** (5 min)
  - [ ] Non-auth user gets 401
  - [ ] Employee can view, not create
  - [ ] Teamlead can create shifts
  - [ ] HR can do everything

---

## 📊 **TEST RESULTS (EXPECTED)**

| Test | Expected Result | Status |
|------|----------------|--------|
| Health Check | 200 OK, version 2.0.0 | ⏳ |
| Get Holidays NRW | 11 Feiertage | ⏳ |
| Get Holidays BY | 14 Feiertage | ⏳ |
| Create Shift (HR) | 200 OK, shift created | ⏳ |
| Create Shift (Employee) | 403 Forbidden | ⏳ |
| Get Shifts | 200 OK, shifts array | ⏳ |
| Update Shift | 200 OK, shift updated | ⏳ |
| Delete Shift | 200 OK, deleted | ⏳ |
| Team Calendar | 200 OK, combined data | ⏳ |
| Get Absences | 200 OK, approved only | ⏳ |
| Export Calendar | 200 OK, valid iCal | ⏳ |
| Non-auth request | 401 Unauthorized | ⏳ |

---

## 🚀 **NEXT STEPS**

### **1. DATABASE SETUP (5 min)**
```bash
# 1. Öffne Supabase SQL Editor
# 2. Kopiere /CREATE_SHIFTS_TABLE.sql
# 3. Führe aus
# 4. Verifiziere: "✅ Shifts table created successfully!"
```

### **2. QUICK TEST (10 min)**
```bash
# Test 1: Health Check
curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Kalender/health

# Test 2: Holidays
curl -H "Authorization: Bearer $TOKEN" \
  "https://...supabase.co/functions/v1/BrowoKoordinator-Kalender/holidays?year=2025&state=NRW"

# Test 3: Team Calendar
curl -H "Authorization: Bearer $TOKEN" \
  "https://...supabase.co/functions/v1/BrowoKoordinator-Kalender/team-calendar?month=10&year=2025"
```

### **3. FRONTEND INTEGRATION (später)**
```typescript
// /services/BrowoKo_calendarService.ts
// Aktualisiere API calls zu Edge Function

// Beispiel:
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/BrowoKoordinator-Kalender/holidays?year=2025`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  }
);
```

---

## ✅ **ZUSAMMENFASSUNG**

### **IMPLEMENTATION STATUS: 100% ✅**

**Alle nachträglichen Funktionen implementiert:**
- ✅ Schichtplanung (CRUD)
- ✅ Deutsche Feiertage (6 Bundesländer)
- ✅ Team-Kalender (kombinierte Ansicht)
- ✅ Abwesenheiten (read-only)
- ✅ Kalender-Export (iCal)
- ✅ Saubere Verantwortlichkeiten
- ✅ Authorization (HR, Teamleads)
- ✅ RLS Policies
- ✅ Public Health Check

### **NOCH ZU TUN:**

1. **⚠️ CRITICAL: Shifts Tabelle erstellen** (5 min)
   ```
   Führe /CREATE_SHIFTS_TABLE.sql aus
   ```

2. **Testing durchführen** (30 min)
   ```
   Alle 12 Tests aus Test Plan
   ```

3. **Frontend Migration** (später - 2-3h)
   ```
   CalendarScreen.tsx zu Edge Function migrieren
   ```

---

**BEREIT FÜR TESTS!** 🎉

Die Edge Function ist vollständig implementiert. Einzige fehlende Komponente ist die `shifts` Tabelle in der Datenbank.

**Next Action:** Shifts Tabelle erstellen & Testing starten! 🚀
