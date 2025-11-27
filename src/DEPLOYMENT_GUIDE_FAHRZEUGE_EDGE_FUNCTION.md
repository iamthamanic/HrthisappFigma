# 🚗 Deployment Guide: BrowoKoordinator-Fahrzeuge Edge Function

## ✅ Voraussetzungen

1. **SQL-Migration erfolgreich** ausgeführt ✓
   - Datei: `/supabase/migrations/20241127_vehicles_fts.sql`
   - 5 Tabellen erstellt (vehicles, vehicle_documents, vehicle_maintenances, vehicle_statistics, vehicle_statistics_columns)
   - Full-Text Search Trigger aktiviert

2. **Edge Function Code** bereit ✓
   - Datei: `/supabase/functions/BrowoKoordinator-Fahrzeuge/index.tsx`
   - Version: 2.0.0 mit PostgreSQL FTS

## 🚀 Deployment Schritte

### 1. Supabase CLI Login

```bash
# Terminal öffnen
supabase login
```

### 2. Projekt verknüpfen

```bash
# Ersetze <project-ref> mit deiner Supabase Project Reference
supabase link --project-ref <project-ref>
```

### 3. Edge Function deployen

```bash
# Ins Projekt-Verzeichnis wechseln
cd /path/to/browo-koordinator

# Edge Function deployen
supabase functions deploy BrowoKoordinator-Fahrzeuge
```

**Erwartete Ausgabe:**
```
Deploying Function BrowoKoordinator-Fahrzeuge...
✓ Function deployed successfully
Function URL: https://<project-ref>.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge
```

## 🧪 Nach dem Deployment testen

### Test 1: Health Check

```bash
curl https://<project-ref>.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/health
```

**Erwartete Antwort:**
```json
{
  "status": "healthy",
  "service": "BrowoKoordinator-Fahrzeuge",
  "version": "2.0.0",
  "features": ["PostgreSQL", "Full-Text Search", "CRUD", "n8n Integration"],
  "timestamp": "2024-11-27T..."
}
```

### Test 2: Alle Fahrzeuge abrufen

```bash
curl -H "Authorization: Bearer <YOUR_ANON_KEY>" \
  https://<project-ref>.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "vehicles": [
    {
      "id": "...",
      "kennzeichen": "B-KO-1234",
      "modell": "Mercedes Sprinter 316 CDI",
      "typ": "Transporter",
      "ladekapazitaet": "1500 kg",
      "standort": "Berlin Mitte",
      "notizen": "Hauptfahrzeug für Lieferungen",
      "status": "active",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "total": 3
}
```

### Test 3: Full-Text Search

```bash
curl -H "Authorization: Bearer <YOUR_ANON_KEY>" \
  "https://<project-ref>.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/search?q=Mercedes"
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "vehicles": [
    {
      "id": "...",
      "kennzeichen": "B-KO-1234",
      "modell": "Mercedes Sprinter 316 CDI",
      "typ": "Transporter",
      "rank": 0.607927
    }
  ],
  "total": 1,
  "query": "Mercedes"
}
```

## 🎯 Frontend Integration testen

1. **App öffnen**: `http://localhost:5173/admin/feld`
2. **Fahrzeuge-Tab** auswählen
3. **Suchfeld nutzen**: Probiere "Mercedes", "Sprinter", "Berlin"
4. **Neues Fahrzeug hinzufügen**: Button "Neues Fahrzeug" klicken

### Erwartetes Verhalten:
- ✅ Fahrzeuge werden geladen
- ✅ Suche funktioniert in Echtzeit
- ✅ Neue Fahrzeuge können hinzugefügt werden
- ✅ Keine 404-Fehler in der Console

## ❌ Fehlerbehebung

### Fehler: "HTTP 404"

**Problem:** Edge Function nicht deployed

**Lösung:**
```bash
# Prüfen ob Function existiert
supabase functions list

# Neu deployen
supabase functions deploy BrowoKoordinator-Fahrzeuge
```

### Fehler: "search_vehicles does not exist"

**Problem:** SQL-Migration nicht ausgeführt

**Lösung:**
1. Supabase Dashboard öffnen
2. SQL Editor
3. `/supabase/migrations/20241127_vehicles_fts.sql` ausführen

### Fehler: "Permission denied"

**Problem:** RLS-Policies fehlen oder SERVICE_ROLE_KEY nicht gesetzt

**Lösung:**
```sql
-- In Supabase SQL Editor ausführen
-- RLS für vehicles Tabelle deaktivieren (nur für Edge Functions)
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenances DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_statistics DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_statistics_columns DISABLE ROW LEVEL SECURITY;
```

## 📊 API Endpoints Übersicht

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/health` | GET | Health Check |
| `/api/vehicles` | GET | Alle Fahrzeuge |
| `/api/vehicles/search?q=...` | GET | Full-Text Search |
| `/api/vehicles` | POST | Neues Fahrzeug erstellen |
| `/api/vehicles/:id` | GET | Fahrzeug abrufen |
| `/api/vehicles/:id` | PUT | Fahrzeug aktualisieren |
| `/api/vehicles/:id` | DELETE | Fahrzeug löschen |
| `/api/vehicles/:id/statistics` | GET | Statistiken abrufen |
| `/api/vehicles/:id/statistics` | POST | Statistik erstellen/aktualisieren |
| `/api/vehicles/:id/documents` | GET | Dokumente abrufen |
| `/api/vehicles/:id/documents` | POST | Dokument hochladen |
| `/api/vehicles/:id/maintenances` | GET | Wartungen abrufen |
| `/api/vehicles/:id/maintenances` | POST | Wartung erstellen |
| `/api/statistics/columns` | GET | Custom Columns abrufen |
| `/api/statistics/columns` | POST | Custom Column erstellen |

## 🎉 Deployment erfolgreich!

Nach erfolgreichem Deployment solltest du:

1. ✅ 3 Sample-Fahrzeuge sehen
2. ✅ Volltext-Suche nutzen können
3. ✅ Neue Fahrzeuge hinzufügen können
4. ✅ Statistiken-Tab (später) nutzen können

## 📝 Nächste Schritte

1. **Statistiken-Tab implementieren** - Filterbare Tabelle mit dynamischen Spalten
2. **n8n Integration** - Automatische Befüllung via Webhooks
3. **CSV Export** - Export-Funktion für Statistiken
4. **Wartungs-Verwaltung** - Wartungstermine tracken

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 2024-11-27  
**Status:** ✅ Ready for Deployment
