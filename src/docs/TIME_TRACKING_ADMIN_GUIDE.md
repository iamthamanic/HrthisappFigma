# 👨‍💼 Zeiterfassung - Admin Guide

## 📋 Übersicht

Als Admin oder HR-Mitarbeiter hast du erweiterte Rechte zur Verwaltung der Zeiterfassung.

---

## 🔧 Admin-Aufgaben

### 1. Zeiteinträge korrigieren

#### Via Supabase Dashboard

1. **Supabase Dashboard** öffnen
2. **Table Editor** → `time_records_f659121d`
3. **Filter setzen**: 
   - `user_id` = Mitarbeiter-ID
   - `date` = Datum (YYYY-MM-DD)
4. **Eintrag bearbeiten**:
   - `time_in`: Einstempelzeit (HH:MM:SS)
   - `time_out`: Ausstempelzeit (HH:MM:SS)
   - `break_minutes`: Pausenzeit in Minuten
   - `total_hours`: Wird automatisch neu berechnet
5. **Save** klicken

#### Häufige Korrekturen

**Fall 1: Mitarbeiter hat vergessen auszustempeln**

```sql
-- Finde laufende Einträge
SELECT * FROM time_records_f659121d
WHERE status = 'running'
AND user_id = 'USER_ID_HIER';

-- Korrigiere Ausstempelzeit
UPDATE time_records_f659121d
SET 
  time_out = '17:00:00',
  total_hours = 8.0,
  break_minutes = 30,
  status = 'completed',
  updated_at = NOW()
WHERE id = 'RECORD_ID_HIER';
```

**Fall 2: Falsche Stempelzeit**

```sql
-- Korrigiere Einstempelzeit
UPDATE time_records_f659121d
SET 
  time_in = '08:00:00',
  updated_at = NOW()
WHERE id = 'RECORD_ID_HIER';

-- Neu berechnen der total_hours (manuell)
-- Beispiel: 8:00 - 17:00 = 9h, minus 30 Min Pause = 8.5h
UPDATE time_records_f659121d
SET total_hours = 8.5
WHERE id = 'RECORD_ID_HIER';
```

**Fall 3: Eintrag löschen (falsch gestempelt)**

```sql
DELETE FROM time_records_f659121d
WHERE id = 'RECORD_ID_HIER'
AND user_id = 'USER_ID_HIER';
```

---

### 2. Pauseneinstellungen verwalten

#### Automatische Pausen konfigurieren

In `profiles_f659121d`:

```sql
-- Automatische Pausen aktivieren
UPDATE profiles_f659121d
SET 
  break_auto = true,
  break_minutes = 30  -- Standardpause in Minuten
WHERE user_id = 'USER_ID_HIER';

-- Automatische Pausen deaktivieren
UPDATE profiles_f659121d
SET break_auto = false
WHERE user_id = 'USER_ID_HIER';
```

#### Pausenregeln nach Arbeitsrecht

| Arbeitszeit | Pausenpflicht | break_minutes |
|-------------|--------------|---------------|
| < 6 Stunden | Keine | 0 |
| 6-9 Stunden | 30 Minuten | 30 |
| > 9 Stunden | 45 Minuten | 45 |

---

### 3. Reports & Auswertungen

#### Arbeitszeiten pro Mitarbeiter (Monat)

```sql
SELECT 
  p.first_name,
  p.last_name,
  COUNT(tr.id) as eintraege,
  SUM(tr.total_hours) as gesamt_stunden,
  SUM(tr.break_minutes) as gesamt_pausen_min,
  AVG(tr.total_hours) as durchschnitt_stunden
FROM time_records_f659121d tr
JOIN profiles_f659121d p ON tr.user_id = p.user_id
WHERE tr.date >= DATE_TRUNC('month', CURRENT_DATE)
  AND tr.status = 'completed'
GROUP BY p.user_id, p.first_name, p.last_name
ORDER BY gesamt_stunden DESC;
```

#### Offene Stempel (nicht ausgestempelt)

```sql
SELECT 
  p.first_name,
  p.last_name,
  tr.date,
  tr.time_in,
  tr.work_type,
  (NOW() - (tr.date || ' ' || tr.time_in)::timestamp) as dauer
FROM time_records_f659121d tr
JOIN profiles_f659121d p ON tr.user_id = p.user_id
WHERE tr.status = 'running'
ORDER BY tr.date DESC, tr.time_in DESC;
```

#### Work Type Verteilung

```sql
SELECT 
  work_type,
  COUNT(*) as anzahl,
  SUM(total_hours) as gesamt_stunden,
  ROUND(AVG(total_hours), 2) as durchschnitt_stunden
FROM time_records_f659121d
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'completed'
GROUP BY work_type
ORDER BY gesamt_stunden DESC;
```

#### Tägliche Statistik

```sql
SELECT 
  date,
  COUNT(DISTINCT user_id) as mitarbeiter,
  COUNT(*) as eintraege,
  SUM(total_hours) as gesamt_stunden,
  ROUND(AVG(total_hours), 2) as durchschnitt_stunden
FROM time_records_f659121d
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  AND status = 'completed'
GROUP BY date
ORDER BY date DESC;
```

---

### 4. Bulk-Operationen

#### Alle laufenden Stempel schließen (Notfall)

```sql
-- VORSICHT: Schließt ALLE laufenden Stempel!
UPDATE time_records_f659121d
SET 
  time_out = time_in,  -- Setzt Ausstempel = Einstempel (0 Stunden)
  total_hours = 0,
  status = 'completed',
  updated_at = NOW()
WHERE status = 'running';
```

#### Alle Einträge eines Tages löschen

```sql
-- VORSICHT: Löscht ALLE Einträge eines Tages!
DELETE FROM time_records_f659121d
WHERE date = '2024-12-18';
```

---

### 5. Monitoring & Alerts

#### Alert: Stempel über 12 Stunden

```sql
SELECT 
  p.first_name,
  p.last_name,
  tr.date,
  tr.time_in,
  (NOW() - (tr.date || ' ' || tr.time_in)::timestamp) as dauer
FROM time_records_f659121d tr
JOIN profiles_f659121d p ON tr.user_id = p.user_id
WHERE tr.status = 'running'
  AND (NOW() - (tr.date || ' ' || tr.time_in)::timestamp) > INTERVAL '12 hours';
```

#### Alert: Ungewöhnlich lange Arbeitszeiten

```sql
SELECT 
  p.first_name,
  p.last_name,
  tr.date,
  tr.time_in,
  tr.time_out,
  tr.total_hours
FROM time_records_f659121d tr
JOIN profiles_f659121d p ON tr.user_id = p.user_id
WHERE tr.total_hours > 12
  AND tr.date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY tr.total_hours DESC;
```

---

### 6. Datenexport

#### Export als CSV (via Supabase)

1. **Table Editor** → `time_records_f659121d`
2. **Filter setzen** (z.B. Monat)
3. **Export** → **CSV** klicken

#### Export als JSON (API)

```bash
curl -X GET \
  "https://YOUR_PROJECT_ID.supabase.co/rest/v1/time_records_f659121d?select=*&date=gte.2024-12-01&date=lte.2024-12-31" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## 🔐 Sicherheit & Datenschutz

### Row Level Security (RLS)

Die RLS-Policies stellen sicher:

✅ User sehen nur ihre eigenen Daten  
✅ Admins/HR sehen alle Daten  
✅ User können nur eigene Einträge erstellen  
✅ User können nur eigene Einträge bearbeiten  

### Audit Trail

Alle Änderungen werden mit `updated_at` geloggt:

```sql
SELECT 
  id,
  user_id,
  date,
  time_in,
  time_out,
  created_at,
  updated_at,
  CASE 
    WHEN updated_at > created_at THEN 'Bearbeitet'
    ELSE 'Original'
  END as status
FROM time_records_f659121d
WHERE updated_at > created_at
ORDER BY updated_at DESC;
```

---

## 🐛 Troubleshooting

### Problem: Mitarbeiter kann nicht einstempeln

**Mögliche Ursachen:**

1. **Bereits eingecheckt**: Prüfe ob laufender Stempel existiert
   ```sql
   SELECT * FROM time_records_f659121d
   WHERE user_id = 'USER_ID' AND status = 'running';
   ```

2. **Permission fehlt**: Prüfe RLS-Policies

3. **Edge Function Fehler**: Prüfe Logs im Supabase Dashboard

### Problem: total_hours ist falsch

**Lösung**: Neu berechnen

```sql
-- Manuelle Neuberechnung
UPDATE time_records_f659121d
SET total_hours = (
  EXTRACT(EPOCH FROM (
    (date || ' ' || time_out)::timestamp - 
    (date || ' ' || time_in)::timestamp
  )) / 3600.0
) - (break_minutes / 60.0)
WHERE id = 'RECORD_ID';
```

---

## 📞 Support-Workflow

### Standard Support-Anfrage

1. **Mitarbeiter meldet Problem**
2. **User-ID herausfinden**:
   ```sql
   SELECT user_id, email FROM profiles_f659121d
   WHERE first_name ILIKE '%NAME%';
   ```
3. **Einträge prüfen**:
   ```sql
   SELECT * FROM time_records_f659121d
   WHERE user_id = 'USER_ID'
   ORDER BY date DESC, time_in DESC
   LIMIT 10;
   ```
4. **Korrektur durchführen** (siehe oben)
5. **Mitarbeiter informieren**

---

## 📊 KPIs & Metrics

### Wichtige Kennzahlen

- **Durchschnittliche Arbeitszeit pro Tag**: ~8 Stunden
- **Durchschnittliche Pause**: ~30-45 Minuten
- **Stempel-Rate**: % der Tage mit mindestens 1 Stempel
- **Offene Stempel**: Sollte immer 0 sein (am Ende des Tages)

### Dashboard-Queries

```sql
-- KPI Overview
SELECT 
  COUNT(DISTINCT user_id) as aktive_mitarbeiter,
  COUNT(*) as gesamt_eintraege,
  SUM(total_hours) as gesamt_stunden,
  AVG(total_hours) as durchschnitt_stunden,
  SUM(break_minutes) / 60.0 as gesamt_pausen_stunden
FROM time_records_f659121d
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'completed';
```

---

**Bei Fragen: IT-Support oder HR kontaktieren**
