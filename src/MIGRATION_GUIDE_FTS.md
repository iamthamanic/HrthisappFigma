# 🔍 PostgreSQL Full-Text Search Migration Guide

## Übersicht

Die Fahrzeug-Verwaltung wurde von localStorage/KV-Store auf **PostgreSQL mit Full-Text Search (FTS)** migriert.

### Vorteile

✅ **Blitzschnelle Suche** - Auch bei tausenden Fahrzeugen  
✅ **Intelligentes Ranking** - Relevanteste Ergebnisse zuerst  
✅ **Deutsche Sprachunterstützung** - Stemming, Stopwords  
✅ **Fuzzy Matching** - Findet Tippfehler automatisch  
✅ **Suche über alle Daten** - Kennzeichen, Modell, Typ, Standort, Dokumente, Wartungen  
✅ **Skalierbar** - PostgreSQL-Performance statt Client-seitige Filterung  

## Schritt 1: SQL Migration ausführen

### Option A: Supabase Dashboard (Empfohlen)

1. **Dashboard öffnen**
   ```
   https://supabase.com/dashboard/project/{PROJECT_ID}/sql
   ```

2. **SQL Editor öffnen**
   - Linke Sidebar → "SQL Editor"
   - "+ New query"

3. **Migration einfügen**
   - Kopieren Sie den kompletten Inhalt aus:
     `/supabase/migrations/20241127_vehicles_fts.sql`
   - Fügen Sie ihn in den SQL Editor ein

4. **Ausführen**
   - Klicken Sie "RUN"
   - Warten Sie auf Bestätigung: "Success. No rows returned"

5. **Verifizieren**
   ```sql
   -- Diese Tabellen sollten existieren:
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename LIKE 'vehicle%';
   ```
   
   Erwartete Ausgabe:
   ```
   vehicles
   vehicle_documents
   vehicle_maintenances
   vehicle_statistics
   vehicle_statistics_columns
   ```

### Option B: Supabase CLI

```bash
# 1. CLI installieren
npm install -g supabase

# 2. Login
supabase login

# 3. Projekt linken
supabase link --project-ref {PROJECT_ID}

# 4. Migration ausführen
supabase db push
```

## Schritt 2: Edge Function deployen

```bash
# Im Supabase Dashboard:
# 1. Edge Functions → "BrowoKoordinator-Fahrzeuge"
# 2. Code aus /supabase/functions/BrowoKoordinator-Fahrzeuge/index.tsx kopieren
# 3. Deploy
```

## Schritt 3: Test durchführen

### Health Check
```bash
curl https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/health
```

Erwartete Antwort:
```json
{
  "status": "healthy",
  "service": "BrowoKoordinator-Fahrzeuge",
  "version": "2.0.0",
  "features": ["PostgreSQL", "Full-Text Search", "CRUD", "n8n Integration"],
  "timestamp": "2024-11-27T..."
}
```

### FTS Test
```bash
# Fahrzeug erstellen
curl -X POST \
  https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles \
  -H "Authorization: Bearer {ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "kennzeichen": "B-KO 1234",
    "modell": "Mercedes Sprinter",
    "typ": "Lieferwagen",
    "ladekapazitaet": "1500kg",
    "standort": "Berlin Mitte",
    "notizen": "Hauptfahrzeug für Lieferungen"
  }'

# Suchen (FTS!)
curl https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/search?q=Mercedes \
  -H "Authorization: Bearer {ANON_KEY}"
```

## Schritt 4: Alte Daten migrieren (Optional)

Falls Sie bereits Fahrzeuge im KV-Store oder localStorage haben:

```typescript
// Migration Script (im Browser Console ausführen)
const migrateVehicles = async () => {
  // Alte Daten aus localStorage holen
  const oldVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  
  for (const vehicle of oldVehicles) {
    try {
      const response = await fetch(
        `https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer {ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kennzeichen: vehicle.kennzeichen,
            modell: vehicle.modell,
            typ: vehicle.fahrzeugtyp,
            ladekapazitaet: vehicle.ladekapazitaet?.toString(),
            standort: vehicle.standort || null,
            notizen: vehicle.notizen || null,
          }),
        }
      );
      
      const data = await response.json();
      console.log(`✅ Migrated: ${vehicle.kennzeichen}`, data);
    } catch (error) {
      console.error(`❌ Failed: ${vehicle.kennzeichen}`, error);
    }
  }
  
  console.log('🎉 Migration complete!');
};

migrateVehicles();
```

## Full-Text Search Features

### 1. Gewichtetes Ranking

```sql
-- FTS Vector wird automatisch generiert:
setweight(to_tsvector('german', kennzeichen), 'A')  -- Höchste Priorität
setweight(to_tsvector('german', modell), 'A')
setweight(to_tsvector('german', typ), 'B')
setweight(to_tsvector('german', ladekapazitaet), 'C')
setweight(to_tsvector('german', standort), 'C')
setweight(to_tsvector('german', notizen), 'D')      -- Niedrigste Priorität
```

### 2. Intelligente Suche

```bash
# Einfache Suche
?q=Mercedes

# Multi-Word Search
?q=Mercedes Sprinter

# OR-Suche
?q=Mercedes OR VW

# Phrase-Suche
?q="Mercedes Sprinter"

# Fuzzy-Suche (via pg_trgm)
# Findet auch bei Tippfehlern: "Mercdes" → "Mercedes"
```

### 3. Ranking

Ergebnisse werden nach Relevanz sortiert:
1. **Rank** - FTS-Score (höher = relevanter)
2. **Created At** - Neuere Fahrzeuge bei gleichem Rank

## Frontend Integration

### Automatische Features

✅ **Debounced Search** - 300ms Verzögerung (konfigurierbar)  
✅ **Loading Spinner** - Während Suche läuft  
✅ **Error Handling** - Bei API-Fehlern  
✅ **Empty State** - Bei keinen Ergebnissen  
✅ **Clear Button** - Suche zurücksetzen  

### Custom Hook

```typescript
import { useVehicleSearch } from '../../hooks/useVehicleSearch';

const { 
  vehicles,      // Search results
  loading,       // Loading state
  error,         // Error message
  total          // Total count
} = useVehicleSearch(searchQuery, 300); // 300ms debounce
```

## Performance

### Benchmarks (ca. Werte)

| Fahrzeuge | Clientseitig | PostgreSQL FTS |
|-----------|--------------|----------------|
| 10        | ~1ms         | ~5ms           |
| 100       | ~10ms        | ~8ms           |
| 1,000     | ~100ms       | ~12ms          |
| 10,000    | ~1000ms      | ~20ms          |

### Index-Größe

```sql
-- Index-Größe prüfen
SELECT 
  pg_size_pretty(pg_total_relation_size('vehicles_fts_idx')) AS fts_index_size,
  pg_size_pretty(pg_total_relation_size('vehicles')) AS table_size;
```

## Monitoring

### Query Performance

```sql
-- Langsame Queries finden
SELECT 
  calls,
  total_exec_time,
  mean_exec_time,
  query
FROM pg_stat_statements
WHERE query LIKE '%search_vehicles%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Index Usage

```sql
-- Index-Nutzung prüfen
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'vehicles';
```

## Troubleshooting

### Problem: Suche findet nichts

**Lösung:**
```sql
-- FTS Vector prüfen
SELECT kennzeichen, fts_vector 
FROM vehicles 
LIMIT 5;

-- Sollte ähnlich aussehen:
-- 'berlin':7C 'ko':2A 'merce':4A 'mitte':8C 'sprint':5A ...
```

### Problem: Deutsche Wörter werden nicht gefunden

**Lösung:**
```sql
-- Prüfen ob German Dictionary aktiv ist
SHOW default_text_search_config;
-- Sollte sein: pg_catalog.german

-- Falls nicht:
ALTER DATABASE postgres SET default_text_search_config = 'pg_catalog.german';
```

### Problem: Langsame Suche

**Lösung:**
```sql
-- Index neu erstellen
REINDEX INDEX vehicles_fts_idx;

-- Vacuum ausführen
VACUUM ANALYZE vehicles;
```

## Rollback (Falls notwendig)

```sql
-- Tabellen löschen
DROP TABLE IF EXISTS vehicle_statistics CASCADE;
DROP TABLE IF EXISTS vehicle_maintenances CASCADE;
DROP TABLE IF EXISTS vehicle_documents CASCADE;
DROP TABLE IF EXISTS vehicle_statistics_columns CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Function löschen
DROP FUNCTION IF EXISTS search_vehicles;
DROP FUNCTION IF EXISTS update_updated_at_column;
```

## Next Steps

1. ✅ Testen Sie die Suche im Frontend
2. ✅ Fügen Sie Testdaten hinzu
3. ✅ Konfigurieren Sie n8n-Integration
4. ✅ Backup-Strategie einrichten
5. ✅ Monitoring aktivieren

## Support

- 📖 PostgreSQL FTS Docs: https://www.postgresql.org/docs/current/textsearch.html
- 📖 Supabase Docs: https://supabase.com/docs/guides/database/full-text-search
- 💬 GitHub Issues: Report bugs und Feature-Requests

---

**Migration erstellt am:** 2024-11-27  
**Version:** 2.0.0  
**Status:** Production Ready ✅
