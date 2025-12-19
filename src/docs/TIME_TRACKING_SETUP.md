# 🕐 Time Tracking System - Setup Guide

## 📋 Übersicht

Das **Factorial-Style Time Tracking System** ist ein vollständiges Zeiterfassungssystem für die Browo Koordinator App.

### ✨ Features

- ✅ **Einstempeln/Ausstempeln** mit einem Klick
- ✅ **Live-Status** mit Echtzeit-Anzeige der Arbeitszeit
- ✅ **Mehrfaches Stempeln** pro Tag möglich
- ✅ **Automatische Pausenberechnung** nach Arbeitsrecht
- ✅ **Filter-Ansichten**: Heute, Diese Woche, Dieser Monat
- ✅ **Zusammenfassungen**: Gesamtzeit, Pausen, Anzahl Einträge
- ✅ **Work Type Tracking**: Office, Field, Extern

---

## 🗄️ Datenbank-Migration

### 1. Bestehende Tabelle erweitern

Die Tabelle `time_records_f659121d` muss um folgende Spalten erweitert werden:

```sql
-- Migration: Add Time Tracking Support
ALTER TABLE time_records_f659121d
ADD COLUMN IF NOT EXISTS work_type TEXT CHECK (work_type IN ('office', 'field', 'extern')) DEFAULT 'office',
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('running', 'completed')) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations_f659121d(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_time_records_status ON time_records_f659121d(user_id, date, status);
CREATE INDEX IF NOT EXISTS idx_time_records_work_type ON time_records_f659121d(work_type);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_time_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_records_updated_at_trigger
BEFORE UPDATE ON time_records_f659121d
FOR EACH ROW
EXECUTE FUNCTION update_time_records_updated_at();
```

### 2. Bestehende Daten migrieren (optional)

Falls bereits Daten in der Tabelle existieren:

```sql
-- Set default work_type and status for existing records
UPDATE time_records_f659121d
SET 
  work_type = 'office',
  status = CASE 
    WHEN time_out IS NULL THEN 'running'
    ELSE 'completed'
  END
WHERE work_type IS NULL OR status IS NULL;
```

---

## 🚀 Backend Deployment

### Edge Function deployen

Die Edge Function **BrowoKoordinator-time-tracking** muss über das Supabase Dashboard manuell deployed werden:

1. **Supabase Dashboard** öffnen: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`
2. **Edge Functions** → **Deploy new function**
3. **Function Name**: `BrowoKoordinator-time-tracking`
4. **Code** aus `/supabase/functions/BrowoKoordinator-time-tracking.tsx` kopieren
5. **Environment Variables** setzen:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. **Deploy** klicken

### API Endpoints

Die Function stellt folgende Endpoints bereit:

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/current-status` | GET | Aktuellen Einstempel-Status abrufen |
| `/clock-in` | POST | Einstempeln |
| `/clock-out` | POST | Ausstempeln |
| `/time-records` | GET | Zeitaufzeichnungen abrufen (mit Filter) |

### Beispiel Requests

#### Einstempeln
```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-time-tracking/clock-in \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "work_type": "office"
  }'
```

#### Status abrufen
```bash
curl -X GET \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-time-tracking/current-status \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🎨 Frontend Komponenten

### Komponenten-Übersicht

| Komponente | Pfad | Beschreibung |
|------------|------|--------------|
| `BrowoKo_TimeClockCard` | `/components/BrowoKo_TimeClockCard.tsx` | Hauptkomponente mit Ein-/Ausstempel-Button |
| `BrowoKo_TimeRecordsList` | `/components/BrowoKo_TimeRecordsList.tsx` | Liste der Stempelzeiten mit Filter |
| `useTimeClock` | `/hooks/BrowoKo_useTimeClock.tsx` | State Management Hook |

### Integration

Das System ist bereits im **FieldScreen** (`/arbeit`) integriert:

- **Office Tab**: Zeiterfassung für Büro-Arbeit
- **Field Tab**: Zeiterfassung für Außendienst
- **Extern Tab**: Zeiterfassung für externe Projekte

---

## 📊 Datenstruktur

### TimeRecord Interface

```typescript
interface TimeRecord {
  id: string;
  user_id: string;
  date: string;                    // YYYY-MM-DD
  time_in: string | null;          // HH:MM:SS
  time_out: string | null;         // HH:MM:SS
  break_minutes: number;
  total_hours: number | null;
  work_type: 'office' | 'field' | 'extern';
  location_id?: string | null;
  status: 'running' | 'completed';
  created_at?: string;
  updated_at?: string;
}
```

### Status-States

- **`running`**: Benutzer ist eingecheckt, `time_out` ist `null`
- **`completed`**: Benutzer hat ausgecheckt, `time_out` ist gesetzt

---

## 🔒 Berechtigungen

### Row Level Security (RLS)

Die Tabelle `time_records_f659121d` sollte folgende RLS-Policies haben:

```sql
-- Users can read their own records
CREATE POLICY "Users can view own time records"
ON time_records_f659121d
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can create own time records"
ON time_records_f659121d
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own time records"
ON time_records_f659121d
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all records
CREATE POLICY "Admins can view all time records"
ON time_records_f659121d
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles_f659121d
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'hr')
  )
);
```

---

## 🧪 Testing

### Manueller Test-Workflow

1. **Zur Arbeit-Seite navigieren**: `/arbeit`
2. **Office Tab öffnen**
3. **"Einstempeln" klicken**
   - ✅ Button wechselt zu "Ausstempeln"
   - ✅ Live-Timer zeigt "0h 0m" an
4. **1 Minute warten**
   - ✅ Timer zeigt "0h 1m" an
5. **"Ausstempeln" klicken**
   - ✅ Button wechselt zu "Einstempeln"
   - ✅ Neuer Eintrag erscheint in der Liste
6. **Filter testen**: "Diese Woche", "Dieser Monat"
   - ✅ Einträge werden korrekt gefiltert
7. **Tab wechseln**: Field, Extern
   - ✅ Gleiche Funktionalität

---

## 🐛 Troubleshooting

### Fehler: "Failed to clock in"

**Ursache**: Edge Function nicht deployed oder falsche URL

**Lösung**:
1. Edge Function im Supabase Dashboard prüfen
2. `projectId` in `/utils/supabase/info.tsx` prüfen
3. Browser Console auf API-Fehler prüfen

### Fehler: "Already clocked in"

**Ursache**: User hat bereits einen laufenden Eintrag

**Lösung**:
1. Erst ausstempeln
2. Oder manuell in DB korrigieren:
```sql
UPDATE time_records_f659121d
SET status = 'completed', time_out = time_in
WHERE user_id = 'USER_ID' AND status = 'running';
```

### Timer aktualisiert sich nicht

**Ursache**: Browser-Tab im Hintergrund, Interval pausiert

**Lösung**: 
- Tab wieder in den Vordergrund holen
- Seite neu laden

---

## 📈 Next Steps (Phase 2)

- [ ] **Wöchentliche/Monatliche Charts** mit Recharts
- [ ] **Admin-Bearbeitung** von Zeiteinträgen
- [ ] **Live-Status für Admins** im Team-Management
- [ ] **Auto-Ausstempeln** nach 12 Stunden
- [ ] **Push-Notifications** (wenn möglich)
- [ ] **GPS-Tracking** für Field-Workers (optional)
- [ ] **Export zu Lohnabrechnungssystemen**

---

## 📝 Changelog

### Version 1.0.0 (2024-12-18)
- ✅ Grundlegendes Time Tracking System
- ✅ Ein-/Ausstempeln mit Live-Status
- ✅ Zeitaufzeichnungen mit Filter
- ✅ Work Type Support (Office/Field/Extern)
- ✅ Automatische Pausenberechnung

---

**Entwickelt mit ❤️ für Browo Koordinator**
