# 🚀 Quick Start: PostgreSQL Full-Text Search

## 3-Schritte-Anleitung

### Schritt 1: SQL Migration (2 Minuten)

1. **Öffne Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
   ```

2. **Kopiere SQL Code**
   - Datei: `/supabase/migrations/20241127_vehicles_fts.sql`
   - Kompletten Inhalt kopieren

3. **SQL ausführen**
   - Im Dashboard: "SQL Editor" → "+ New query"
   - Code einfügen
   - "RUN" klicken
   - ✅ Warte auf: "Success. No rows returned"

### Schritt 2: Edge Function deployen (3 Minuten)

1. **Öffne Edge Functions**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions
   ```

2. **Neue Function erstellen**
   - Name: `BrowoKoordinator-Fahrzeuge`
   - Code aus: `/supabase/functions/BrowoKoordinator-Fahrzeuge/index.tsx`
   - Deploy klicken

3. **Verifizieren**
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/health
   
   # Erwartete Antwort:
   {
     "status": "healthy",
     "service": "BrowoKoordinator-Fahrzeuge",
     "version": "2.0.0"
   }
   ```

### Schritt 3: Frontend testen (1 Minute)

1. **App öffnen**
   - Navigiere zu: Fieldverwaltung → Fahrzeuge Tab

2. **Fahrzeug hinzufügen**
   - Klicke "+ Fahrzeug hinzufügen"
   - Fülle Formular aus:
     - Kennzeichen: `B-KO 1234`
     - Modell: `Mercedes Sprinter`
     - Typ: `Lieferwagen`
     - Ladekapazität: `1500`
     - Standort: `Berlin Mitte`
     - Notizen: `Hauptfahrzeug`
   - Speichern

3. **FTS testen** 🔍
   - Im Suchfeld eingeben: `Mercedes`
   - Ergebnis sollte sofort erscheinen
   - Teste auch: `Berlin`, `Sprinter`, `1500`

## ✅ Fertig!

Deine Fahrzeugverwaltung nutzt jetzt:
- ✅ PostgreSQL statt localStorage
- ✅ Full-Text Search (FTS)
- ✅ Gewichtetes Ranking
- ✅ Deutsche Sprachunterstützung
- ✅ Skalierbare Architektur

## 🧪 Erweiterte Tests

### API direkt testen

```bash
# Variablen setzen
PROJECT_ID="your-project-id"
ANON_KEY="your-anon-key"

# Fahrzeug erstellen
curl -X POST \
  https://$PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kennzeichen": "B-TEST-999",
    "modell": "VW Caddy",
    "typ": "Kleintransporter",
    "ladekapazitaet": "800kg",
    "standort": "Berlin Kreuzberg"
  }'

# Suchen
curl "https://$PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/search?q=VW" \
  -H "Authorization: Bearer $ANON_KEY"

# Alle Fahrzeuge
curl "https://$PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles" \
  -H "Authorization: Bearer $ANON_KEY"
```

### Datenbank prüfen

```sql
-- Supabase Dashboard → SQL Editor

-- Alle Fahrzeuge anzeigen
SELECT * FROM vehicles;

-- FTS testen
SELECT 
  kennzeichen,
  modell,
  ts_rank(fts_vector, websearch_to_tsquery('german', 'Mercedes')) as rank
FROM vehicles
WHERE fts_vector @@ websearch_to_tsquery('german', 'Mercedes')
ORDER BY rank DESC;

-- Anzahl Fahrzeuge
SELECT COUNT(*) FROM vehicles;
```

## 🐛 Troubleshooting

### Problem: "Table vehicles does not exist"

**Lösung:** SQL Migration noch nicht ausgeführt
```bash
# Gehe zurück zu Schritt 1
```

### Problem: "Function not found"

**Lösung:** Edge Function noch nicht deployed
```bash
# Gehe zurück zu Schritt 2
```

### Problem: Suche findet nichts

**Lösung:** Keine Fahrzeuge in DB
```bash
# Füge Testdaten über Frontend hinzu (Schritt 3.2)
```

### Problem: CORS Error

**Lösung:** Edge Function URL prüfen
```bash
# Korrekt:
https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles

# Falsch:
https://YOUR_PROJECT_ID.supabase.co/functions/v1/api/vehicles
```

## 📊 Performance-Check

Nach dem Setup solltest du sehen:

| Metrik | Wert |
|--------|------|
| Search Response Time | < 50ms |
| API Response Time | < 100ms |
| Database Queries | < 20ms |

Prüfen im Supabase Dashboard:
- Database → Performance → Query Performance
- Edge Functions → Logs

## 🎯 Nächste Schritte

1. ✅ **Testdaten hinzufügen**
   - 5-10 Fahrzeuge über Frontend
   - Verschiedene Typen, Modelle, Standorte

2. ✅ **n8n Integration einrichten**
   - Siehe: `/supabase/functions/BrowoKoordinator-Fahrzeuge/README.md`
   - Webhook für automatische Statistiken

3. ✅ **Backup konfigurieren**
   - Supabase Dashboard → Database → Backups
   - Point-in-time Recovery aktivieren

4. ✅ **Monitoring aktivieren**
   - Supabase Dashboard → Logs
   - Alert-Regeln setzen

## 📖 Weiterführende Docs

- **Migration Guide**: `/MIGRATION_GUIDE_FTS.md`
- **API Docs**: `/supabase/functions/BrowoKoordinator-Fahrzeuge/README.md`
- **Supabase FTS**: https://supabase.com/docs/guides/database/full-text-search

## 💬 Support

Bei Fragen oder Problemen:
1. Prüfe die Logs im Supabase Dashboard
2. Teste mit `curl` (siehe Erweiterte Tests)
3. Überprüfe SQL-Schema in Database → Tables

---

**Setup-Zeit:** ~6 Minuten  
**Schwierigkeit:** Einfach ⭐  
**Status:** Production Ready ✅
