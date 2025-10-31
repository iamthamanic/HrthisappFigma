# 🚀 Schichtplanung Backend Setup - MOCK-DATEN ENTFERNEN

## ✅ Was wurde gemacht?

### **1. Hook erstellt: `BrowoKo_useShiftPlanning.ts`**
- ✅ Lädt echte Daten aus Supabase:
  - `locations` (Standorte)
  - `departments` (Abteilungen)
  - `teams` (Teams mit Mitarbeitern)
  - `shifts` (Schichten für ausgewählte Woche)
  - `users` (Mitarbeiter mit Spezialisierungen)
- ✅ CRUD Operationen:
  - `createShift()` - Neue Schicht erstellen
  - `updateShift()` - Schicht bearbeiten
  - `deleteShift()` - Schicht löschen
  - `refetch()` - Daten neu laden
- ✅ Loading & Error States
- ✅ Automatisches Neuladen bei Wochenwechsel

### **2. Frontend Integration: `BrowoKo_ShiftPlanningTab.tsx`**
- ✅ Mock-Daten **KOMPLETT ENTFERNT**
- ✅ Hook integriert
- ✅ Loading State mit `<LoadingState />`
- ✅ Error State mit Retry-Button
- ✅ Dynamische Spezialisierungen aus echten User-Daten

---

## 📋 Setup-Schritte

### **SCHRITT 1: Shifts Table erstellen**
```bash
# In Supabase SQL Editor:
```

**SQL kopieren und ausführen:**
```sql
-- Aus: /CREATE_SHIFTS_TABLE.sql
```
Führe die **komplette SQL-Datei** aus, um die `shifts` Tabelle zu erstellen.

**Ergebnis:**
- ✅ `public.shifts` Tabelle
- ✅ RLS Policies (HR, Teamleads können verwalten)
- ✅ Indexes für Performance
- ✅ Auto-Update Trigger

---

### **SCHRITT 2: Migration für Spezialisierung**
```bash
# In Supabase SQL Editor:
```

**SQL kopieren und ausführen:**
```sql
-- Aus: /v4.12.0_SCHICHTPLANUNG_MIGRATION.sql
```

**Ergebnis:**
- ✅ `users.specialization` (TEXT) - Mitarbeiter-Spezialisierung
- ✅ `shifts.location_id` (FK → locations)
- ✅ `shifts.department_id` (FK → departments)
- ✅ `shifts.specialization` (TEXT)
- ✅ Trigger: Organigram → User Sync

---

### **SCHRITT 3: Verifizierung**
Prüfe in Supabase, ob die Tabellen existieren:

```sql
-- Check shifts table
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'shifts'
ORDER BY ordinal_position;

-- Check users.specialization
SELECT 
  id,
  first_name,
  last_name,
  specialization
FROM users
WHERE specialization IS NOT NULL
LIMIT 5;
```

---

## 🎯 Wie funktioniert es jetzt?

### **Vorher (Mock-Daten):**
```typescript
const teams: Team[] = [
  {
    id: '1',
    name: 'Bank 4',
    members: [/* hardcoded */]
  }
];
```

### **Nachher (Echte Daten):**
```typescript
const {
  locations,      // ← FROM Supabase locations
  departments,    // ← FROM Supabase departments
  teams,          // ← FROM Supabase teams + team_members
  shifts,         // ← FROM Supabase shifts (filtered by week)
  users,          // ← FROM Supabase users
  loading,        // ← Loading state
  createShift,    // ← Create new shift
} = BrowoKo_useShiftPlanning(selectedWeek);
```

---

## 📊 Datenfluss

```
┌─────────────────────────────────────────────────┐
│  BrowoKo_ShiftPlanningTab                       │
│  ┌───────────────────────────────────────────┐  │
│  │ selectedWeek = "2025-11-04"               │  │
│  └───────────────────────────────────────────┘  │
│              ↓                                   │
│  ┌───────────────────────────────────────────┐  │
│  │ BrowoKo_useShiftPlanning(selectedWeek)    │  │
│  └───────────────────────────────────────────┘  │
│              ↓                                   │
│  ┌───────────────────────────────────────────┐  │
│  │ Supabase Client                           │  │
│  │  - supabase.from('locations').select()    │  │
│  │  - supabase.from('departments').select()  │  │
│  │  - supabase.from('teams').select()        │  │
│  │  - supabase.from('shifts')                │  │
│  │    .gte('date', '2025-11-04')             │  │
│  │    .lte('date', '2025-11-10')             │  │
│  │  - supabase.from('users').select()        │  │
│  └───────────────────────────────────────────┘  │
│              ↓                                   │
│  ┌───────────────────────────────────────────┐  │
│  │ ECHTE DATEN im UI                         │  │
│  │  - Timeline mit Schichtblöcken            │  │
│  │  - Team Accordion                         │  │
│  │  - Mitarbeiter-Liste                      │  │
│  │  - Filter (Location, Dept, Spec)          │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Wie Schichten erstellen?

### **1. Manuell in Supabase (für Tests):**
```sql
INSERT INTO public.shifts (
  user_id,
  team_id,
  date,
  shift_type,
  start_time,
  end_time,
  specialization,
  location_id,
  department_id,
  notes
) VALUES (
  'USER-UUID-HIER',           -- Mitarbeiter ID
  'TEAM-UUID-HIER',           -- Team ID
  '2025-11-04',               -- Montag
  'MORNING',                  -- Schichttyp
  '08:00',                    -- Start
  '16:00',                    -- Ende
  'Baustelle',                -- Spezialisierung
  'LOCATION-UUID-HIER',       -- Standort
  'DEPARTMENT-UUID-HIER',     -- Abteilung
  'Erste Testschicht'         -- Notizen
);
```

### **2. Via Hook (im Code):**
```typescript
const { createShift } = BrowoKo_useShiftPlanning(selectedWeek);

await createShift({
  user_id: 'user-uuid',
  team_id: 'team-uuid',
  date: '2025-11-04',
  shift_type: 'MORNING',
  start_time: '08:00',
  end_time: '16:00',
  specialization: 'Baustelle',
  location_id: 'location-uuid',
  department_id: 'department-uuid',
  notes: 'Test'
});
```

---

## 🚀 Nächste Schritte (Optional)

### **1. CreateShiftDialog erstellen**
Erstelle einen Dialog, um Schichten per UI zu erstellen:
```typescript
<CreateShiftDialog
  users={users}
  teams={teams}
  locations={locations}
  onCreateShift={createShift}
/>
```

### **2. Drag & Drop aktivieren**
Sobald die Daten funktionieren, können wir react-dnd wieder aktivieren oder eine alternative Drag & Drop Lösung implementieren.

### **3. Edge Function (für komplexe Operationen)**
Falls du später Bulk-Operations brauchst, können wir eine Edge Function erstellen:
- `BrowoKoordinator-Schichtplanung`
- Endpoints: `/shifts`, `/bulk-create`, `/conflict-check`

---

## ✅ Checklist

- [ ] **SCHRITT 1:** `CREATE_SHIFTS_TABLE.sql` in Supabase ausführen
- [ ] **SCHRITT 2:** `v4.12.0_SCHICHTPLANUNG_MIGRATION.sql` ausführen
- [ ] **SCHRITT 3:** Verifizierung: `SELECT * FROM shifts LIMIT 1;`
- [ ] **SCHRITT 4:** Test-Schichten manuell erstellen
- [ ] **SCHRITT 5:** Field Verwaltung → Einsatzplanung → Schichtplanung öffnen
- [ ] **SCHRITT 6:** Prüfen ob echte Daten geladen werden (statt Mock)

---

## 🎉 Fertig!

Nach diesen Schritten sind **KEINE MOCK-DATEN** mehr im Schichtplanungssystem!

**Alle Daten kommen jetzt aus Supabase:**
- ✅ Teams aus `teams` + `team_members`
- ✅ Mitarbeiter aus `users`
- ✅ Schichten aus `shifts`
- ✅ Standorte aus `locations`
- ✅ Abteilungen aus `departments`

**Ready für Production!** 🚀
