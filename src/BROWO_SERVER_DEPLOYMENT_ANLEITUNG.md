# BrowoKoordinator-Server Deployment Anleitung

## Status
✅ Alle 12 Dateien sind korrekt in der flachen Struktur vorhanden
✅ index.ts hat Root Route Handler und Health Check
⏳ Jetzt muss deployed werden im Supabase Dashboard

## Was du jetzt machen musst:

### 1. Supabase Dashboard öffnen
- Gehe zu: https://supabase.com/dashboard
- Wähle dein Projekt aus
- Gehe zu "Edge Functions"

### 2. Edge Function "BrowoKoordinator-Server" deployen

**WICHTIG:** Alle 12 Dateien müssen im gleichen Ordner sein:

```
BrowoKoordinator-Server/
├── index.ts
├── core-buckets.ts
├── core-kv.ts
├── core-supabaseClient.ts
├── core-workflows.ts
├── routes-entities.ts
├── routes-itEquipment.ts
├── routes-storage.ts
├── routes-tests.ts
├── routes-users.ts
├── routes-workflows.ts
└── README.md
```

### 3. Nach dem Deployment testen

**Health Check:**
```
https://<dein-project-ref>.supabase.co/functions/v1/BrowoKoordinator-Server/health
```

Erwartete Antwort:
```json
{
  "status": "ok"
}
```

**Root Route (Service Info):**
```
https://<dein-project-ref>.supabase.co/functions/v1/BrowoKoordinator-Server/
```

Erwartete Antwort:
```json
{
  "service": "BrowoKoordinator-Server",
  "status": "running",
  "version": "1.0.0",
  "routes": {
    "health": "/health",
    "api": {
      "departments": "/api/departments",
      "locations": "/api/locations",
      "roles": "/api/roles",
      "seed": "POST /api/seed-entities"
    },
    "users": {
      "create": "POST /users/create"
    },
    "itEquipment": {
      "list": "/it-equipment",
      "create": "POST /it-equipment",
      "delete": "DELETE /it-equipment/:id"
    },
    "storage": {
      "status": "/storage/status",
      "documents": "/documents/upload"
    },
    "tests": "/tests/*"
  }
}
```

## Logs überprüfen

Nach dem Deployment im Supabase Dashboard unter "Logs" schauen:
- Sollte `🚀 Starting BrowoKoordinator-Server...` zeigen
- Sollte `🚀 Initializing storage buckets...` beim ersten Request zeigen
- Sollte `✅ Buckets initialized` zeigen

## Wenn Fehler auftreten:

1. **404 Error** = Edge Function nicht korrekt deployed oder falscher Pfad
2. **500 Error** = Schau in die Logs im Supabase Dashboard
3. **CORS Error** = Sollte nicht passieren, da CORS auf "*" gesetzt ist

## Nächste Schritte nach erfolgreichem Deployment:

1. ✅ Health Check funktioniert
2. ✅ Root Route zeigt Service Info
3. ✅ Logs zeigen erfolgreichen Start
4. ⏭️ Dann können wir mit n8n-Integration weitermachen

---

**Tipp:** Kopiere diese Datei und öffne sie in einem Texteditor, dann kannst du alles einfach kopieren!
