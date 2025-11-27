# 🚀 Deployment-Guide: BrowoKoordinator-Fahrzeuge

## Architektur-Entscheidung
Die Fahrzeug-Statistik-Funktionalität wurde in eine **separate Edge Function** ausgelagert, um:
- ✅ BrowoKoordinator-Server schlank zu halten
- ✅ Bessere Microservice-Architektur
- ✅ Unabhängiges Deployment und Skalierung
- ✅ Klare Separation of Concerns

## Pre-Deployment Checklist
- [ ] Supabase Projekt ist erstellt
- [ ] Supabase CLI ist installiert (optional, wenn manuell deployed)
- [ ] Zugriff auf Supabase Dashboard

## Deployment Schritte

### Option 1: Manuelles Deployment (Empfohlen)

1. **Navigieren Sie zum Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/{YOUR_PROJECT_ID}
   ```

2. **Öffnen Sie Edge Functions**
   - Linke Sidebar → "Edge Functions"

3. **Neue Function erstellen**
   - Klicken Sie auf "Create Function"
   - Name: `BrowoKoordinator-Fahrzeuge`

4. **Code kopieren**
   - Kopieren Sie den kompletten Inhalt aus:
     `/supabase/functions/BrowoKoordinator-Fahrzeuge/index.tsx`
   - Fügen Sie ihn in den Editor ein

5. **Deployen**
   - Klicken Sie auf "Deploy"
   - Warten Sie auf erfolgreichen Deployment (grüner Status)

6. **Testen**
   ```bash
   curl https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/health
   ```
   
   Erwartete Antwort:
   ```json
   {
     "status": "healthy",
     "service": "BrowoKoordinator-Fahrzeuge",
     "timestamp": "2024-11-27T..."
   }
   ```

### Option 2: CLI Deployment

```bash
# 1. Supabase CLI installieren (falls noch nicht geschehen)
npm install -g supabase

# 2. Login
supabase login

# 3. Link Projekt
supabase link --project-ref YOUR_PROJECT_ID

# 4. Deploy
supabase functions deploy BrowoKoordinator-Fahrzeuge
```

## Verification

### 1. Health Check
```bash
curl https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/health
```

### 2. Test Statistik erstellen
```bash
curl -X POST \
  https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/test-123/statistics \
  -H "Authorization: Bearer {ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "month": "2024-11",
    "verbrauchskosten": 250,
    "wartungskosten": 180,
    "sonstige_kosten": 50
  }'
```

### 3. Frontend Check
- Öffnen Sie die Fahrzeug-Detail-Seite
- Wechseln Sie zum "Statistiken" Tab
- Der "API Disconnected" Banner sollte **verschwinden**
- Die Default-Tabelle mit 12 Monaten sollte erscheinen

## Troubleshooting

### Problem: "API Disconnected" Banner bleibt
**Lösung:**
1. Prüfen Sie, ob die Edge Function erfolgreich deployed wurde
2. Checken Sie die Browser Console auf Fehler
3. Verifizieren Sie den Health-Endpoint

### Problem: CORS Fehler
**Lösung:**
- Die Edge Function hat bereits CORS konfiguriert
- Prüfen Sie, ob die URL korrekt ist:
  ```
  https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/...
  ```

### Problem: 404 Not Found
**Lösung:**
- Stellen Sie sicher, dass der Function-Name exakt `BrowoKoordinator-Fahrzeuge` ist
- Prüfen Sie die URL-Struktur

### Problem: Unauthorized
**Lösung:**
- Prüfen Sie, ob der `publicAnonKey` korrekt ist
- Checken Sie die Authorization Header

## Environment Variables
Die Function verwendet automatisch:
- `SUPABASE_URL` - Automatisch von Supabase bereitgestellt
- `SUPABASE_SERVICE_ROLE_KEY` - Automatisch von Supabase bereitgestellt

**Keine manuellen Environment Variables erforderlich! ✅**

## Integration mit n8n

### Webhook Setup
1. Erstellen Sie einen Webhook-Node in n8n
2. Konfigurieren Sie HTTP Request:
   ```
   Method: POST
   URL: https://{PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/{vehicleId}/statistics
   Headers:
     Authorization: Bearer {ANON_KEY}
     Content-Type: application/json
   Body:
     {
       "month": "{{ $now.format('yyyy-MM') }}",
       "verbrauchskosten": {{ $json.fuelCosts }},
       "wartungskosten": {{ $json.maintenanceCosts }},
       "sonstige_kosten": {{ $json.otherCosts }}
     }
   ```

## Monitoring

### Logs anzeigen
1. Supabase Dashboard → Edge Functions
2. Wählen Sie "BrowoKoordinator-Fahrzeuge"
3. Tab "Logs"

### Metriken
- Anzahl Requests
- Error Rate
- Response Time
- Active Connections

## Rollback

Falls Probleme auftreten:
1. Supabase Dashboard → Edge Functions
2. BrowoKoordinator-Fahrzeuge → "Deployments"
3. Wählen Sie eine vorherige Version
4. Klicken Sie "Redeploy"

## Next Steps
Nach erfolgreichem Deployment:
1. ✅ Testen Sie alle CRUD-Operationen
2. ✅ Richten Sie n8n-Workflows ein
3. ✅ Erstellen Sie Backup-Strategie für KV Store
4. ✅ Konfigurieren Sie Monitoring & Alerts

## Support
Bei Problemen:
- 📖 Supabase Docs: https://supabase.com/docs/guides/functions
- 💬 Community: https://github.com/supabase/supabase/discussions
