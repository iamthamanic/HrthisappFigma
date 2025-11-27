# BrowoKoordinator-Fahrzeuge Edge Function

## Version 2.0.0 - PostgreSQL Full-Text Search

### Übersicht
Dedizierte Edge Function für **komplette Fahrzeug-Verwaltung** mit PostgreSQL Full-Text Search (FTS).

### Features
- ✅ **PostgreSQL Full-Text Search** - Blitzschnelle Suche mit Ranking
- ✅ **Deutsche Sprachunterstützung** - Stemming & Stopwords
- ✅ **Fuzzy Matching** - Tippfehler-tolerant via pg_trgm
- ✅ **Gewichtetes Ranking** - Relevanteste Ergebnisse zuerst
- ✅ **Complete CRUD** - Vehicles, Documents, Maintenances, Statistics
- ✅ **n8n Integration** - Auto-fill via webhooks
- ✅ **Custom Columns** - Dynamic statistics fields

## API Endpunkte

### 🔍 Full-Text Search

```bash
GET /api/vehicles/search?q={query}
```

**Beispiele:**
```bash
# Einfache Suche
/api/vehicles/search?q=Mercedes

# Multi-Word
/api/vehicles/search?q=Mercedes Sprinter

# Alle Fahrzeuge (kein Query-Parameter)
/api/vehicles/search
```

**Response:**
```json
{
  "success": true,
  "vehicles": [
    {
      "id": "uuid",
      "kennzeichen": "B-KO 1234",
      "modell": "Mercedes Sprinter",
      "typ": "Lieferwagen",
      "ladekapazitaet": "1500kg",
      "standort": "Berlin Mitte",
      "notizen": "Hauptfahrzeug",
      "status": "active",
      "rank": 0.987,
      "created_at": "2024-11-27T...",
      "updated_at": "2024-11-27T..."
    }
  ],
  "total": 1,
  "query": "Mercedes"
}
```

### 🚗 Vehicles CRUD

#### Get All Vehicles
```bash
GET /api/vehicles
```

#### Get Single Vehicle
```bash
GET /api/vehicles/{id}
```

#### Create Vehicle
```bash
POST /api/vehicles
Content-Type: application/json

{
  "kennzeichen": "B-KO 1234",
  "modell": "Mercedes Sprinter",
  "typ": "Lieferwagen",
  "ladekapazitaet": "1500kg",
  "standort": "Berlin Mitte",
  "notizen": "Hauptfahrzeug"
}
```

#### Update Vehicle
```bash
PUT /api/vehicles/{id}
Content-Type: application/json

{
  "standort": "Berlin Charlottenburg",
  "notizen": "Neue Notiz"
}
```

#### Delete Vehicle
```bash
DELETE /api/vehicles/{id}
```

### 📄 Documents API

#### Get Documents
```bash
GET /api/vehicles/{id}/documents
```

#### Create Document
```bash
POST /api/vehicles/{id}/documents
Content-Type: application/json

{
  "name": "Fahrzeugschein.pdf",
  "type": "pdf",
  "file_path": "path/to/file.pdf",
  "file_size": 123456,
  "uploaded_by": "admin"
}
```

#### Delete Document
```bash
DELETE /api/vehicles/{id}/documents/{docId}
```

### 🔧 Maintenances API

#### Get Maintenances
```bash
GET /api/vehicles/{id}/maintenances
```

#### Create Maintenance
```bash
POST /api/vehicles/{id}/maintenances
Content-Type: application/json

{
  "title": "Ölwechsel",
  "description": "Motoröl + Filter",
  "maintenance_date": "2024-12-01",
  "cost": 150.00,
  "status": "planned"
}
```

#### Update Maintenance
```bash
PUT /api/vehicles/{id}/maintenances/{maintId}
Content-Type: application/json

{
  "status": "completed"
}
```

#### Delete Maintenance
```bash
DELETE /api/vehicles/{id}/maintenances/{maintId}
```

### 📊 Statistics API

#### Get Statistics
```bash
# All statistics
GET /api/vehicles/{id}/statistics

# Filter by month
GET /api/vehicles/{id}/statistics?month=2024-11
```

#### Create/Update Statistic (Upsert)
```bash
POST /api/vehicles/{id}/statistics
Content-Type: application/json

{
  "month": "2024-11",
  "verbrauchskosten": 250.00,
  "wartungskosten": 180.00,
  "sonstige_kosten": 50.00,
  "custom_fields": {
    "versicherung": 120.00
  }
}
```

**Note:** Wenn ein Eintrag für den Monat existiert, wird er aktualisiert (UPSERT).

#### Update Statistic
```bash
PUT /api/vehicles/{id}/statistics/{statId}
Content-Type: application/json

{
  "verbrauchskosten": 280.00
}
```

#### Delete Statistic
```bash
DELETE /api/vehicles/{id}/statistics/{statId}
```

### 📋 Custom Columns API

#### Get Columns
```bash
GET /api/statistics/columns
```

#### Create Column
```bash
POST /api/statistics/columns
Content-Type: application/json

{
  "name": "Versicherung",
  "type": "currency"
}
```

Types: `currency`, `number`, `text`

#### Delete Column
```bash
DELETE /api/statistics/columns/{columnId}
```

### 🏥 Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "BrowoKoordinator-Fahrzeuge",
  "version": "2.0.0",
  "features": ["PostgreSQL", "Full-Text Search", "CRUD", "n8n Integration"],
  "timestamp": "2024-11-27T..."
}
```

## PostgreSQL Schema

### Tabellen

1. **vehicles** - Haupttabelle mit FTS
   - `id`, `kennzeichen`, `modell`, `typ`, `ladekapazitaet`, `standort`, `notizen`, `status`
   - `fts_vector` - Generated column für FTS

2. **vehicle_documents** - Dokumente
   - `id`, `vehicle_id`, `name`, `type`, `file_path`, `file_size`, `uploaded_at`

3. **vehicle_maintenances** - Wartungen
   - `id`, `vehicle_id`, `title`, `description`, `maintenance_date`, `cost`, `status`

4. **vehicle_statistics** - Statistiken
   - `id`, `vehicle_id`, `month`, `verbrauchskosten`, `wartungskosten`, `sonstige_kosten`, `custom_fields`

5. **vehicle_statistics_columns** - Benutzerdefinierte Spalten
   - `id`, `name`, `type`

### FTS-Gewichtung

```sql
-- Automatisch generierter FTS Vector:
setweight(to_tsvector('german', kennzeichen), 'A')     -- Höchste Priorität
setweight(to_tsvector('german', modell), 'A')
setweight(to_tsvector('german', typ), 'B')
setweight(to_tsvector('german', ladekapazitaet), 'C')
setweight(to_tsvector('german', standort), 'C')
setweight(to_tsvector('german', notizen), 'D')         -- Niedrigste Priorität
```

### Indizes

- `vehicles_fts_idx` - GIN index für FTS
- `vehicles_kennzeichen_idx` - Unique index
- `vehicles_kennzeichen_trgm_idx` - Trigram für Fuzzy matching
- `vehicles_modell_trgm_idx` - Trigram für Fuzzy matching

## n8n Integration

### Webhook-Beispiel (Statistik erstellen)

```javascript
// n8n HTTP Request Node
{
  "method": "POST",
  "url": "https://{{$env.PROJECT_ID}}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/{{$node['Vehicle ID'].json.id}}/statistics",
  "headers": {
    "Authorization": "Bearer {{$env.SUPABASE_ANON_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "month": "{{$now.format('yyyy-MM')}}",
    "verbrauchskosten": "{{$json.fuel_costs}}",
    "wartungskosten": "{{$json.maintenance_costs}}",
    "sonstige_kosten": "{{$json.other_costs}}"
  }
}
```

### Cron-Job für monatliche Statistiken

```javascript
// Jeden 1. des Monats um 00:00
// Cron: 0 0 1 * *

// 1. Alle Fahrzeuge holen
GET /api/vehicles

// 2. Für jedes Fahrzeug Statistik erstellen
POST /api/vehicles/{id}/statistics
{
  "month": "{{$now.format('yyyy-MM')}}",
  "verbrauchskosten": 0,
  "wartungskosten": 0,
  "sonstige_kosten": 0
}
```

## Error Handling

Alle Endpunkte returnen konsistente Error-Responses:

```json
{
  "success": false,
  "error": "Vehicle not found"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

## Deployment

```bash
# Supabase Dashboard:
1. Edge Functions → "BrowoKoordinator-Fahrzeuge"
2. Code einfügen
3. Deploy

# Verifizieren:
curl https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/health
```

## Environment Variables

Automatisch von Supabase bereitgestellt:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Performance

### Search Performance (ca. Werte)

| Datensätze | Query Zeit |
|------------|------------|
| 100        | ~8ms       |
| 1,000      | ~12ms      |
| 10,000     | ~20ms      |
| 100,000    | ~35ms      |

### Optimierungen

- ✅ GIN Index für FTS
- ✅ Generated column (fts_vector) - Kein Runtime-Overhead
- ✅ Trigram Indizes für Fuzzy Matching
- ✅ Connection Pooling via Supabase

## Migration von KV-Store

Siehe: `/MIGRATION_GUIDE_FTS.md`

## Monitoring

### Logs anzeigen
```
Supabase Dashboard → Edge Functions → BrowoKoordinator-Fahrzeuge → Logs
```

### Metriken
- Request Count
- Error Rate
- Avg Response Time
- Active Connections

## Support

- 📖 PostgreSQL FTS: https://www.postgresql.org/docs/current/textsearch.html
- 📖 Supabase FTS: https://supabase.com/docs/guides/database/full-text-search
- 📖 pg_trgm: https://www.postgresql.org/docs/current/pgtrgm.html

---

**Version:** 2.0.0  
**Last Updated:** 2024-11-27  
**Status:** Production Ready ✅
