# ✅ Time Tracking System - Deployment Checklist

## 📋 Pre-Deployment Checklist

Vor dem Deployment:

- [ ] **Backend Code geprüft**: `/supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts` (neue Routes hinzugefügt)
- [ ] **Frontend Komponenten geprüft**:
  - [ ] `BrowoKo_TimeClockCard.tsx`
  - [ ] `BrowoKo_TimeRecordsList.tsx`
  - [ ] `useTimeClock.tsx` Hook
- [ ] **FieldScreen Integration** geprüft
- [ ] **Icons importiert** (`Square`, `Play`, `Calendar`, etc.)
- [ ] **Migration bereit**: `/supabase/migrations/080_time_tracking.sql`
- [ ] **Dokumentation gelesen**

---

## 🗄️ Schritt 1: Datenbank Migration

### 1.1 SQL Migration ausführen

**WICHTIG**: Die Migration ist bereits als `/supabase/migrations/080_time_tracking.sql` vorbereitet und wird automatisch ausgeführt!

Falls du sie manuell ausführen musst:

1. **Supabase Dashboard** öffnen: `https://supabase.com/dashboard`
2. Dein Projekt auswählen
3. **SQL Editor** öffnen (Sidebar → SQL Editor)
4. **New Query** erstellen
5. **Komplettes SQL kopieren** aus `/supabase/migrations/080_time_tracking.sql`
6. **Run** klicken
7. **Erfolgsmeldung prüfen**: "Success. No rows returned"

### 1.2 Migration verifizieren

Führe diese Test-Query aus:

```sql
-- Test: Neue Spalten vorhanden?
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'time_records_f659121d'
AND column_name IN ('work_type', 'status', 'location_id', 'updated_at');
```

**Erwartetes Ergebnis**: 4 Zeilen

```
work_type     | text
status        | text  
location_id   | uuid
updated_at    | timestamp with time zone
```

### 1.3 RLS Policies prüfen

```sql
-- Test: RLS Policies vorhanden?
SELECT 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'time_records_f659121d';
```

**Erwartetes Ergebnis**: Mindestens 4 Policies

---

## 🚀 Schritt 2: Edge Function Deployment

### 2.1 Function erstellen

1. **Supabase Dashboard** → **Edge Functions**
2. **Deploy new function** klicken
3. **Function Name eingeben**: `BrowoKoordinator-time-tracking`
4. **Code kopieren** aus `/supabase/functions/BrowoKoordinator-time-tracking.tsx`
5. **Deploy** klicken

### 2.2 Environment Variables prüfen

Die folgenden Environment Variables müssen gesetzt sein:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_ANON_KEY` (für Frontend)

**WICHTIG**: Diese sind automatisch gesetzt, wenn du das Projekt korrekt aufgesetzt hast.

### 2.3 Function testen

**Test 1: Healthcheck**

```bash
curl -X GET \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-time-tracking/current-status \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Erwartetes Ergebnis**:
```json
{
  "is_clocked_in": false,
  "current_record": null
}
```

**Test 2: Clock In**

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-time-tracking/clock-in \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"work_type": "office"}'
```

**Erwartetes Ergebnis**:
```json
{
  "success": true,
  "record": { ... }
}
```

---

## 🎨 Schritt 3: Frontend Deployment

### 3.1 Änderungen prüfen

- [ ] `/screens/FieldScreen.tsx` aktualisiert
- [ ] `/components/BrowoKo_TimeClockCard.tsx` erstellt
- [ ] `/components/BrowoKo_TimeRecordsList.tsx` erstellt
- [ ] `/hooks/BrowoKo_useTimeClock.tsx` erstellt
- [ ] `/components/icons/BrowoKoIcons.tsx` erweitert (`Square` Icon)

### 3.2 Build testen (lokal)

```bash
# Entwicklungsserver starten
npm run dev

# oder
yarn dev
```

1. **Zur Arbeit-Seite navigieren**: `http://localhost:5173/arbeit`
2. **Office Tab prüfen**: Zeiterfassungs-Karte sichtbar?
3. **Einstempeln testen**: Button funktioniert?
4. **Timer prüfen**: Aktualisiert sich?
5. **Ausstempeln testen**: Eintrag erscheint in Liste?

### 3.3 Deployment

```bash
# Build erstellen
npm run build

# oder
yarn build
```

**Build erfolgreich?**
- [ ] Keine TypeScript Fehler
- [ ] Keine Build-Warnungen
- [ ] Bundle-Size ok (~2-3 MB)

---

## 🧪 Schritt 4: End-to-End Testing

### 4.1 User-Flow testen

Als **normaler User**:

1. [ ] Login funktioniert
2. [ ] Navigation zu `/arbeit` funktioniert
3. [ ] Alle 3 Tabs sichtbar (Office, Field, Extern)
4. [ ] **Office Tab**:
   - [ ] TimeClockCard lädt
   - [ ] "Einstempeln" Button sichtbar
   - [ ] Klick auf "Einstempeln" funktioniert
   - [ ] Button wechselt zu "Ausstempeln"
   - [ ] Timer zeigt "0h 0m"
   - [ ] Nach 1 Minute: Timer zeigt "0h 1m"
   - [ ] Klick auf "Ausstempeln" funktioniert
   - [ ] Eintrag erscheint in TimeRecordsList
   - [ ] Filter "Heute", "Diese Woche", "Dieser Monat" funktionieren
5. [ ] **Field Tab**: Gleicher Test wie Office
6. [ ] **Extern Tab**: Gleicher Test wie Office

### 4.2 Edge Cases testen

1. [ ] **Doppeltes Einstempeln**: Fehlermeldung erscheint
2. [ ] **Ausstempeln ohne Einstempeln**: Fehlermeldung erscheint
3. [ ] **Browser schließen**: Stempel läuft weiter (nach Reload prüfen)
4. [ ] **Mehrere Einträge am gleichen Tag**: Werden korrekt gruppiert
5. [ ] **Lange Arbeitszeit**: Timer funktioniert auch nach 8h+

### 4.3 Performance testen

1. [ ] **Ladezeit**: Seite lädt in < 2 Sekunden
2. [ ] **API-Calls**: Nicht mehr als nötig (Chrome DevTools → Network)
3. [ ] **Memory Leaks**: Timer wird beim Unmount gestoppt
4. [ ] **Mobile**: Responsive Design funktioniert

---

## 🔒 Schritt 5: Security Review

### 5.1 RLS prüfen

```sql
-- Test: User kann nur eigene Records sehen
-- Als User einloggen und testen:
SELECT * FROM time_records_f659121d;
-- Sollte nur eigene Records zurückgeben
```

### 5.2 API Authentication prüfen

```bash
# Test: Ohne Auth-Header
curl -X GET \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-time-tracking/current-status

# Erwartetes Ergebnis: 401 Unauthorized
```

### 5.3 SQL Injection prüfen

Die Edge Function verwendet **Supabase Client mit Prepared Statements** → Geschützt ✅

---

## 📊 Schritt 6: Monitoring Setup

### 6.1 Supabase Logs aktivieren

1. **Supabase Dashboard** → **Logs**
2. **Edge Functions** auswählen
3. Filter setzen: `BrowoKoordinator-time-tracking`

### 6.2 Error Tracking

Prüfe regelmäßig:

```sql
-- Offene Stempel (über 12h)
SELECT COUNT(*) FROM time_records_f659121d
WHERE status = 'running'
AND (NOW() - (date || ' ' || time_in)::timestamp) > INTERVAL '12 hours';
```

---

## 📝 Schritt 7: Dokumentation

### 7.1 Team informieren

- [ ] **User Guide** teilen: `/docs/TIME_TRACKING_USER_GUIDE.md`
- [ ] **Admin Guide** teilen: `/docs/TIME_TRACKING_ADMIN_GUIDE.md`
- [ ] **Setup Guide** teilen: `/docs/TIME_TRACKING_SETUP.md`

### 7.2 Change Log aktualisieren

Füge zu deinem Projekt-Changelog hinzu:

```markdown
## Version X.X.X - 2024-12-18

### ✨ Neue Features
- **Zeiterfassung (Factorial-Style)**: Ein-/Ausstempeln mit Live-Timer
- **Work Types**: Office, Field, Extern
- **Automatische Pausenberechnung**
- **Filter-Ansichten**: Heute, Woche, Monat

### 🗄️ Backend
- Neue Edge Function: `BrowoKoordinator-time-tracking`
- Erweiterte `time_records_f659121d` Tabelle

### 🎨 Frontend
- Neue Komponenten: TimeClockCard, TimeRecordsList
- Aktualisierter FieldScreen

### 📚 Dokumentation
- User Guide
- Admin Guide  
- Setup Guide
- Migration SQL
```

---

## ✅ Final Checklist

Vor dem Go-Live:

- [ ] **Datenbank Migration** erfolgreich
- [ ] **Edge Function** deployed und getestet
- [ ] **Frontend** deployed
- [ ] **End-to-End Tests** bestanden
- [ ] **Security Review** abgeschlossen
- [ ] **Monitoring** aktiv
- [ ] **Dokumentation** verteilt
- [ ] **Team informiert**

---

## 🎉 Deployment Complete!

Das Time Tracking System ist jetzt live! 🚀

### Support-Kontakte

- **Technical Issues**: [Your Tech Support Email]
- **HR Questions**: [Your HR Email]
- **Bug Reports**: [Your Issue Tracker]

---

**Letztes Update**: 2024-12-18  
**Version**: 1.0.0