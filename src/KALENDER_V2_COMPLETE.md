# ✅ Edge Function #3: BrowoKoordinator-Kalender v2.0.0 - COMPLETE

## **🎉 STATUS: READY FOR DEPLOYMENT**

Die **BrowoKoordinator-Kalender** Edge Function wurde komplett überarbeitet!

---

## **🔄 WICHTIGE ÄNDERUNG: KLARE TRENNUNG DER VERANTWORTLICHKEITEN**

### **❌ WAS WURDE ENTFERNT (gehört zu Antragmanager):**
- ~~Create Leave Request~~
- ~~Update Leave Request~~
- ~~Delete Leave Request~~
- ~~Approve Leave Request~~
- ~~Reject Leave Request~~
- ~~Leave Statistics~~

### **✅ WAS IST JETZT DRIN (Visualisierung & Schichtplanung):**
- ✅ Team-Kalender Ansicht (Absences + Shifts + Holidays)
- ✅ Abwesenheitsübersicht (read-only von `leave_requests`)
- ✅ Deutsche Feiertage (nach Bundesland)
- ✅ Schichtplanung (Create/Update/Delete Shifts)
- ✅ Kalender-Export (iCal Format)

---

## **📦 NEUE ARCHITEKTUR:**

```
┌─────────────────────────────────────────────────┐
│  BrowoKoordinator-Kalender (Visualisierung)    │
├─────────────────────────────────────────────────┤
│  • Team-Kalender anzeigen                       │
│  • Abwesenheiten anzeigen (read-only)          │
│  • Schichtpläne verwalten                      │
│  • Feiertage berechnen                         │
│  • Kalender exportieren (iCal)                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BrowoKoordinator-Antragmanager (Management)   │
├─────────────────────────────────────────────────┤
│  • Leave Requests verwalten                    │
│  • Approve/Reject Workflow                     │
│  • Equipment Requests                          │
│  • Benefit Requests                            │
│  • Approval Queue                              │
└─────────────────────────────────────────────────┘
```

---

## **📍 ENDPOINTS (9 TOTAL)**

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | GET | `/health` | ❌ | Health check (Public) |
| 2 | GET | `/team-calendar` | ✅ | Team calendar view (absences + shifts + holidays) |
| 3 | GET | `/absences` | ✅ | Absences overview (read-only from leave_requests) |
| 4 | GET | `/holidays` | ✅ | German public holidays by state & year |
| 5 | GET | `/shifts` | ✅ | Get shifts for team/user |
| 6 | POST | `/shifts` | ✅ | Create shift (HR/Teamlead) |
| 7 | PUT | `/shifts/:id` | ✅ | Update shift (HR/Teamlead/Creator) |
| 8 | DELETE | `/shifts/:id` | ✅ | Delete shift (HR/Teamlead/Creator) |
| 9 | POST | `/export` | ✅ | Export calendar (iCal format) |

---

## **🎯 HAUPTFEATURES:**

### **1. Team-Kalender (`/team-calendar`)**
Zeigt eine vollständige Monatsansicht mit:
- ✅ Genehmigte Abwesenheiten (aus `leave_requests`)
- ✅ Schichtpläne (aus `shifts` Tabelle)
- ✅ Feiertage (automatisch berechnet)

**Query Parameters:**
- `month` - Monat (1-12)
- `year` - Jahr (z.B. 2025)
- `team_id` - Optional: Filter nach Team

---

### **2. Abwesenheitsübersicht (`/absences`)**
Read-only View auf genehmigte Urlaubsanträge

**Query Parameters:**
- `start_date` - Start-Datum
- `end_date` - End-Datum
- `team_id` - Optional: Filter nach Team

**WICHTIG:** Dies ist nur zum Anzeigen! Zum Verwalten → `BrowoKoordinator-Antragmanager`

---

### **3. Deutsche Feiertage (`/holidays`)**
Berechnet automatisch alle deutschen Feiertage

**Unterstützte Bundesländer:**
- `BW` - Baden-Württemberg
- `BY` - Bayern
- `NRW` - Nordrhein-Westfalen (Default)
- `HE` - Hessen
- `RP` - Rheinland-Pfalz
- `SL` - Saarland

**Features:**
- ✅ Automatische Berechnung von Ostern (Gauss-Algorithmus)
- ✅ Bewegliche Feiertage (Karfreitag, Pfingsten, etc.)
- ✅ Bundesland-spezifische Feiertage
- ✅ Korrekte Sortierung nach Datum

---

### **4. Schichtplanung (`/shifts`)**
Vollständige Schichtverwaltung

**Shift-Typen:**
- Frühschicht
- Spätschicht
- Nachtschicht
- Bereitschaft
- etc. (flexibel)

**Features:**
- ✅ Create, Update, Delete Shifts
- ✅ Nur HR/Teamlead können erstellen
- ✅ Filter nach Datum, User, Team
- ✅ Zeitangaben (start_time, end_time)

---

### **5. Kalender-Export (`/export`)**
Exportiert Kalender-Daten im iCal Format

**Optionen:**
- `include_absences` - Abwesenheiten einbeziehen
- `include_shifts` - Schichten einbeziehen
- `include_holidays` - Feiertage einbeziehen
- `state` - Bundesland für Feiertage

**Output:**
- `.ics` Datei (iCal Format)
- Kompatibel mit Outlook, Google Calendar, Apple Calendar, etc.

---

## **🗄️ DATENBANK-SCHEMA:**

### **Shifts Table (muss noch erstellt werden):**

```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL, -- 'MORNING', 'AFTERNOON', 'NIGHT', 'ON_CALL', etc.
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_team_id ON shifts(team_id);
```

---

## **🚀 DEPLOYMENT**

### **1. Erstelle Shifts Tabelle:**

```sql
-- Copy from above
```

### **2. Deploy Edge Function:**

```bash
cd supabase/functions/BrowoKoordinator-Kalender

supabase functions deploy BrowoKoordinator-Kalender \
  --no-verify-jwt \
  --project-ref azmtojgikubegzusvhra
```

---

## **🧪 TESTS**

### **Setup:**

```javascript
const projectId = 'azmtojgikubegzusvhra';
const baseUrl = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Kalender`;

const getToken = () => {
  const session = JSON.parse(localStorage.getItem(`sb-${projectId}-auth-token`));
  return session?.access_token;
};
```

### **TEST 1 - Health Check:**

```javascript
fetch(`${baseUrl}/health`)
  .then(r => r.json())
  .then(d => {
    console.log('✅ Health:', d);
    console.log('Version:', d.version);
    console.log('Purpose:', d.purpose);
  });
```

**Expected:**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "purpose": "Calendar Visualization & Shift Planning",
  "note": "Leave Request Management is handled by BrowoKoordinator-Antragmanager"
}
```

---

### **TEST 2 - Team Calendar:**

```javascript
const token = getToken();

fetch(`${baseUrl}/team-calendar?month=12&year=2025`, {
  method: 'GET',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ Team Calendar:', d);
    if (d.success) {
      console.log('Month:', d.calendar.month);
      console.log('Year:', d.calendar.year);
      console.log('Absences:', d.calendar.absences.length);
      console.log('Shifts:', d.calendar.shifts.length);
      console.log('Holidays:', d.calendar.holidays.length);
    }
  });
```

---

### **TEST 3 - Absences Overview:**

```javascript
const token = getToken();

fetch(`${baseUrl}/absences?start_date=2025-12-01&end_date=2025-12-31`, {
  method: 'GET',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ Absences:', d);
    if (d.success) {
      console.log('Total:', d.count);
      console.log('Note:', d.note);
      d.absences.forEach(absence => {
        console.log(`- ${absence.user.first_name}: ${absence.start_date} → ${absence.end_date}`);
      });
    }
  });
```

---

### **TEST 4 - German Holidays:**

```javascript
const token = getToken();

fetch(`${baseUrl}/holidays?year=2025&state=NRW`, {
  method: 'GET',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ Holidays:', d);
    if (d.success) {
      console.log('Year:', d.year);
      console.log('State:', d.state);
      console.log('Count:', d.count);
      console.log('');
      d.holidays.forEach(holiday => {
        console.log(`${holiday.date}: ${holiday.name}`);
      });
    }
  });
```

---

### **TEST 5 - Export Calendar:**

```javascript
const token = getToken();

fetch(`${baseUrl}/export`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    start_date: '2025-12-01',
    end_date: '2025-12-31',
    include_absences: true,
    include_shifts: true,
    include_holidays: true,
    state: 'NRW'
  })
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ Export:', d);
    if (d.success) {
      console.log('Format:', d.format);
      console.log('Events:', d.events_count);
      console.log('Filename:', d.download_filename);
      console.log('');
      console.log('iCal Data:');
      console.log(d.ical_data);
    }
  });
```

---

## **📊 RESPONSE STRUCTURES:**

### **Team Calendar Response:**
```json
{
  "success": true,
  "calendar": {
    "month": 12,
    "year": 2025,
    "absences": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "start_date": "2025-12-23",
        "end_date": "2025-12-27",
        "type": "VACATION",
        "user": {
          "first_name": "Max",
          "last_name": "Mustermann"
        }
      }
    ],
    "shifts": [
      {
        "id": "uuid",
        "date": "2025-12-15",
        "shift_type": "MORNING",
        "start_time": "06:00",
        "end_time": "14:00"
      }
    ],
    "holidays": [
      {
        "date": "2025-12-25",
        "name": "1. Weihnachtstag",
        "type": "PUBLIC_HOLIDAY"
      }
    ]
  }
}
```

### **Holidays Response:**
```json
{
  "success": true,
  "holidays": [
    { "date": "2025-01-01", "name": "Neujahr", "type": "PUBLIC_HOLIDAY" },
    { "date": "2025-04-18", "name": "Karfreitag", "type": "PUBLIC_HOLIDAY" },
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
  "count": 11
}
```

---

## **✅ VORTEILE DER NEUEN ARCHITEKTUR:**

1. **Klare Trennung:** Kalender = Visualisierung, Antragmanager = Management
2. **Keine Duplikation:** Leave Request Management nur an einer Stelle
3. **Feiertage-Feature:** Automatische Berechnung deutscher Feiertage ✨
4. **Schichtplanung:** Neue Funktionalität für Team-Koordination
5. **Export-Funktion:** iCal Export für externe Kalender

---

## **🎯 NÄCHSTE SCHRITTE:**

1. **✅ Shifts Tabelle erstellen** (SQL oben)
2. **✅ Kalender v2.0.0 deployen**
3. **✅ Tests durchführen**
4. **📋 Antragmanager implementieren** (Leave Request Management)

---

## **📈 EDGE FUNCTIONS STATUS:**

| # | Edge Function | Status | Version | Purpose |
|---|--------------|--------|---------|---------|
| 1 | BrowoKoordinator-Dokumente | ✅ Deployed | v2.1.0 | Document Management |
| 2 | BrowoKoordinator-Zeiterfassung | ✅ Deployed | v3.0.0 | Time Tracking |
| 3 | **BrowoKoordinator-Kalender** | ✅ **Ready** | **v2.0.0** | **Calendar Visualization** |
| 4 | BrowoKoordinator-Antragmanager | 📋 Next | - | Leave Request Management |

**Fortschritt: 3 von 14 (21.4%)** 🎯

---

## **🎉 ERFOLG!**

Die **BrowoKoordinator-Kalender** Edge Function ist komplett überarbeitet und fokussiert sich jetzt auf **Visualisierung & Schichtplanung**!

**Version:** 2.0.0  
**Endpoints:** 9  
**Purpose:** Calendar Visualization & Shift Planning  
**Next:** BrowoKoordinator-Antragmanager (Leave Request Management)

**Deploy jetzt!** 🚀
