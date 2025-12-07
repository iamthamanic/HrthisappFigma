# BrowoKoordinator-Server Deployment Test

## Quick Test Checklist

### 1. Health Check Test

Öffne im Browser oder curl:
```
https://<dein-project-ref>.supabase.co/functions/v1/BrowoKoordinator-Server/health
```

**Erwartetes Ergebnis:**
```json
{
  "status": "ok"
}
```

---

### 2. Root Route Test

```
https://<dein-project-ref>.supabase.co/functions/v1/BrowoKoordinator-Server/
```

**Erwartetes Ergebnis:**
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

---

### 3. Logs Check

Im Supabase Dashboard → Edge Functions → BrowoKoordinator-Server → Logs

**Sollte zeigen:**
```
✅ 🚀 Starting BrowoKoordinator-Server...
✅ Request zu /health oder /
✅ Keine roten Errors
```

---

### 4. API Endpoints Test

**Departments:**
```
GET https://<dein-project-ref>.supabase.co/functions/v1/BrowoKoordinator-Server/api/departments
```

**Locations:**
```
GET https://<dein-project-ref>.supabase.co/functions/v1/BrowoKoordinator-Server/api/locations
```

**Roles:**
```
GET https://<dein-project-ref>.supabase.co/functions/v1/BrowoKoordinator-Server/api/roles
```

---

## Wie hast du deployed?

- [ ] Mit Supabase CLI
- [ ] Mit Single-File im Dashboard
- [ ] Anders (wie?)

---

## Was ist das Ergebnis?

### ✅ Funktioniert perfekt
→ Zeig mir den JSON Response vom Health Check!

### ❌ Immer noch Fehler
→ Kopiere die Fehlermeldung aus den Logs!

### ⚠️ Teilweise funktioniert
→ Was funktioniert, was nicht?

---

**Schick mir das Ergebnis!** 🎯
