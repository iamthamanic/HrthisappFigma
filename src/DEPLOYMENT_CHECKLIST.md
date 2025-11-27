# ✅ Deployment Checklist: PostgreSQL FTS Migration

## Pre-Deployment

- [ ] **Backup erstellen**
  - [ ] Supabase Dashboard → Database → Backups → Create backup
  - [ ] Alte localStorage Daten exportieren (falls vorhanden)
  - [ ] Datum: ________________

- [ ] **Umgebung vorbereiten**
  - [ ] Supabase Project ID notiert: ________________
  - [ ] ANON Key verfügbar: ✅
  - [ ] SERVICE_ROLE Key verfügbar: ✅
  - [ ] Browser: Chrome/Firefox (aktuell)

## Deployment Steps

### 1️⃣ SQL Migration

- [ ] **Supabase Dashboard öffnen**
  - URL: `https://supabase.com/dashboard/project/{PROJECT_ID}/sql`

- [ ] **SQL Editor öffnen**
  - [ ] Linke Sidebar → "SQL Editor"
  - [ ] "+ New query" klicken

- [ ] **Migration Code kopieren**
  - [ ] Datei öffnen: `/supabase/migrations/20241127_vehicles_fts.sql`
  - [ ] Kompletten Inhalt kopieren (Ctrl+A, Ctrl+C)

- [ ] **SQL ausführen**
  - [ ] Code in Editor einfügen (Ctrl+V)
  - [ ] "RUN" Button klicken
  - [ ] Warten auf: "Success. No rows returned"
  - [ ] Timestamp: ________________

- [ ] **Verifizieren**
  ```sql
  SELECT tablename FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename LIKE 'vehicle%';
  ```
  - [ ] Tabellen vorhanden:
    - [ ] `vehicles`
    - [ ] `vehicle_documents`
    - [ ] `vehicle_maintenances`
    - [ ] `vehicle_statistics`
    - [ ] `vehicle_statistics_columns`

- [ ] **FTS Index prüfen**
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename = 'vehicles';
  ```
  - [ ] Index vorhanden: `vehicles_fts_idx`

### 2️⃣ Edge Function Deployment

- [ ] **Function Dashboard öffnen**
  - URL: `https://supabase.com/dashboard/project/{PROJECT_ID}/functions`

- [ ] **Neue Function erstellen**
  - [ ] Button: "+ New function" oder "Create a new function"
  - [ ] Name: `BrowoKoordinator-Fahrzeuge`
  - [ ] Region wählen (z.B. Frankfurt für Deutschland)

- [ ] **Code einfügen**
  - [ ] Datei öffnen: `/supabase/functions/BrowoKoordinator-Fahrzeuge/index.tsx`
  - [ ] Kompletten Code kopieren
  - [ ] In Function Editor einfügen

- [ ] **Deploy**
  - [ ] "Deploy" Button klicken
  - [ ] Warten auf: "Successfully deployed"
  - [ ] Deployment URL kopieren: ________________

- [ ] **Health Check**
  ```bash
  curl https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/health
  ```
  - [ ] Response Status: `200 OK`
  - [ ] Response Body enthält: `"status": "healthy"`
  - [ ] Version: `2.0.0`

### 3️⃣ Frontend Update

- [ ] **Code deployed**
  - [ ] Alle Änderungen committed
  - [ ] Build erfolgreich
  - [ ] Deployment auf Production

- [ ] **Smoke Test**
  - [ ] App öffnen
  - [ ] Zu Fieldverwaltung navigieren
  - [ ] Tab "Fahrzeuge" öffnen
  - [ ] Kein JavaScript Error in Console

### 4️⃣ Funktionalitäts-Tests

- [ ] **Fahrzeug erstellen**
  - [ ] "+ Fahrzeug hinzufügen" Button funktioniert
  - [ ] Formular öffnet sich
  - [ ] Testdaten eingeben:
    - Kennzeichen: `TEST-001`
    - Modell: `Test Vehicle`
    - Typ: `Transporter`
    - Ladekapazität: `1000`
    - Standort: `Test Location`
  - [ ] "Speichern" funktioniert
  - [ ] Success Toast erscheint
  - [ ] Fahrzeug erscheint in Liste

- [ ] **Full-Text Search testen**
  - [ ] Suchfeld eingeben: `TEST`
  - [ ] Fahrzeug erscheint (< 1 Sekunde)
  - [ ] Suchfeld eingeben: `Vehicle`
  - [ ] Fahrzeug erscheint
  - [ ] Suchfeld eingeben: `Location`
  - [ ] Fahrzeug erscheint
  - [ ] Loading Spinner funktioniert
  - [ ] "X" Button löscht Suche

- [ ] **Fahrzeug löschen**
  - [ ] Checkbox bei Test-Fahrzeug aktivieren
  - [ ] "Löschen" Button erscheint
  - [ ] "Löschen" klicken
  - [ ] Bestätigung erscheint
  - [ ] Bestätigen
  - [ ] Fahrzeug verschwindet
  - [ ] Success Toast erscheint

### 5️⃣ API Tests

- [ ] **GET /api/vehicles**
  ```bash
  curl https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles \
    -H "Authorization: Bearer {ANON_KEY}"
  ```
  - [ ] Status: `200`
  - [ ] Response enthält: `"success": true`

- [ ] **POST /api/vehicles**
  ```bash
  curl -X POST \
    https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles \
    -H "Authorization: Bearer {ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"kennzeichen":"API-TEST","modell":"API Vehicle","typ":"PKW","ladekapazitaet":"500kg"}'
  ```
  - [ ] Status: `201`
  - [ ] Response enthält: `"success": true`
  - [ ] Vehicle ID erhalten

- [ ] **GET /api/vehicles/search?q=API**
  ```bash
  curl "https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/search?q=API" \
    -H "Authorization: Bearer {ANON_KEY}"
  ```
  - [ ] Status: `200`
  - [ ] Findet API-TEST Fahrzeug

- [ ] **DELETE /api/vehicles/{id}**
  ```bash
  curl -X DELETE \
    https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/{VEHICLE_ID} \
    -H "Authorization: Bearer {ANON_KEY}"
  ```
  - [ ] Status: `200`
  - [ ] Fahrzeug gelöscht

### 6️⃣ Performance Tests

- [ ] **Suche Performance**
  - [ ] 10 Fahrzeuge erstellen
  - [ ] Suche ausführen: < 100ms
  - [ ] Browser DevTools → Network → Response Time prüfen

- [ ] **Database Performance**
  - [ ] Supabase Dashboard → Database → Performance
  - [ ] Query Time: < 20ms
  - [ ] Index Usage prüfen

- [ ] **Edge Function Logs**
  - [ ] Supabase Dashboard → Edge Functions → BrowoKoordinator-Fahrzeuge → Logs
  - [ ] Keine Errors
  - [ ] Alle Requests haben Status 200/201

### 7️⃣ Security Check

- [ ] **CORS funktioniert**
  - [ ] Frontend kann API aufrufen
  - [ ] Keine CORS Errors in Console

- [ ] **Authorization**
  - [ ] API ohne Bearer Token → 401/403
  - [ ] API mit ANON Key → Funktioniert
  - [ ] SERVICE_ROLE Key nicht im Frontend Code

- [ ] **SQL Injection Protection**
  - [ ] Supabase verwendet prepared statements
  - [ ] Parameterized queries in Edge Function

### 8️⃣ Data Migration (Optional)

- [ ] **Alte Daten vorhanden?**
  - [ ] localStorage Fahrzeuge exportieren
  - [ ] Migration Script ausführen (siehe MIGRATION_GUIDE_FTS.md)
  - [ ] Daten verifizieren
  - [ ] Anzahl Fahrzeuge stimmt überein

### 9️⃣ Monitoring Setup

- [ ] **Supabase Monitoring**
  - [ ] Dashboard → Logs → Auto-refresh aktivieren
  - [ ] Database → Performance → Charts prüfen
  - [ ] Edge Functions → Invocations → Charts prüfen

- [ ] **Alerts konfigurieren (Optional)**
  - [ ] Error Rate > 5%
  - [ ] Response Time > 500ms
  - [ ] Database CPU > 80%

### 🔟 Documentation

- [ ] **README aktualisiert**
  - [ ] Deployment-Datum eingetragen
  - [ ] Version auf 2.0.0 gesetzt
  - [ ] API Endpoints dokumentiert

- [ ] **Team informiert**
  - [ ] Deployment-Notes verschickt
  - [ ] Breaking Changes kommuniziert
  - [ ] Migration-Plan geteilt

## Post-Deployment

### Immediate (0-24h)

- [ ] **Monitoring**
  - [ ] Logs überwachen (erste 1h)
  - [ ] Error Rate prüfen (< 1%)
  - [ ] User Feedback sammeln

- [ ] **Quick Fixes bereit**
  - [ ] Rollback-Plan vorbereitet
  - [ ] Hotfix-Branch erstellt
  - [ ] On-call verfügbar

### Short-term (1-7 Tage)

- [ ] **Performance Monitoring**
  - [ ] Durchschnittliche Response Time: ____ms
  - [ ] Peak Response Time: ____ms
  - [ ] Database Load: ____%

- [ ] **User Acceptance**
  - [ ] Feedback: ________________
  - [ ] Issues: ________________
  - [ ] Feature Requests: ________________

### Long-term (1-4 Wochen)

- [ ] **Optimization**
  - [ ] Index tuning falls nötig
  - [ ] Query optimization
  - [ ] Cache-Strategie evaluieren

- [ ] **Feature Completion**
  - [ ] n8n Integration aufsetzen
  - [ ] Advanced Search Features
  - [ ] Export/Import Funktionen

## Rollback Plan

Falls kritische Probleme auftreten:

### Schneller Rollback (< 5 Minuten)

1. **Edge Function deaktivieren**
   - [ ] Supabase Dashboard → Functions → BrowoKoordinator-Fahrzeuge → Disable

2. **Frontend Rollback**
   - [ ] Git: `git revert HEAD`
   - [ ] Deploy previous version

3. **Daten sichern**
   - [ ] SQL Export: `pg_dump vehicles`

### Vollständiger Rollback (< 15 Minuten)

1. **Alle obigen Schritte**

2. **Tabellen löschen**
   ```sql
   DROP TABLE IF EXISTS vehicle_statistics CASCADE;
   DROP TABLE IF EXISTS vehicle_maintenances CASCADE;
   DROP TABLE IF EXISTS vehicle_documents CASCADE;
   DROP TABLE IF EXISTS vehicle_statistics_columns CASCADE;
   DROP TABLE IF EXISTS vehicles CASCADE;
   DROP FUNCTION IF EXISTS search_vehicles;
   ```

3. **Alte Version wiederherstellen**
   - [ ] Von Backup wiederherstellen

## Sign-off

- [ ] **Technical Lead**: ________________ Datum: ________
- [ ] **QA**: ________________ Datum: ________
- [ ] **Product Owner**: ________________ Datum: ________

## Notes

```
Deployment Notes:
_______________________________________________________
_______________________________________________________
_______________________________________________________

Issues/Bugs:
_______________________________________________________
_______________________________________________________
_______________________________________________________

Next Steps:
_______________________________________________________
_______________________________________________________
_______________________________________________________
```

---

**Deployment Version:** 2.0.0  
**PostgreSQL FTS Migration**  
**Geschätzte Dauer:** 30-45 Minuten  
**Risk Level:** Medium ⚠️  
**Rollback Time:** < 15 Minuten
