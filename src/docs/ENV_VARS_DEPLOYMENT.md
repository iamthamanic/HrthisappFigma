# Environment Variables - Deployment Guide

## 📦 Deployment Schritte

### 1. Edge Function Deployment

Die Environment Variables sind Teil der **BrowoKoordinator-Workflows** Edge Function.

**Dateien die deployed werden müssen:**
```
/supabase/functions/BrowoKoordinator-Workflows/
├── index.ts                 ← Main Entry Point (enthält Env Vars Routes)
├── envVarsManager.ts        ← Business Logic für Env Vars
├── kv_store.tsx             ← KV Store Interface
└── actionExecutor.ts        ← Workflow Action Executor
```

**Deployment Command:**
```bash
# Im Supabase Dashboard:
# Functions → Deploy Function
# Wähle: BrowoKoordinator-Workflows
# Upload alle Dateien aus dem Ordner
```

### 2. API Endpoints

Nach dem Deployment sind folgende Endpoints verfügbar:

#### Base URL
```
https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows
```

#### Endpoints

**GET /env-vars**
```bash
curl -X GET \
  https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/env-vars \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}"
```

**POST /env-vars**
```bash
curl -X POST \
  https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/env-vars \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "GITHUB_TOKEN",
    "value": "ghp_xxxxxxxxxxxx",
    "description": "GitHub Personal Access Token"
  }'
```

**PUT /env-vars/:id**
```bash
curl -X PUT \
  https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/env-vars/{id} \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "new_secret_value"
  }'
```

**DELETE /env-vars/:id**
```bash
curl -X DELETE \
  https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/env-vars/{id} \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}"
```

### 3. KV Store Setup

Die Environment Variables nutzen die **kv_store_f659121d** Tabelle.

**Storage Key Pattern:**
```
env_var:{organizationId}:{variableId}
```

**Beispiel:**
```
env_var:default-org:550e8400-e29b-41d4-a716-446655440000
```

**Keine Migration nötig!** Die kv_store Tabelle existiert bereits.

### 4. Frontend Integration

Der Environment Variables Screen ist bereits implementiert:

**Datei:** `/screens/admin/EnvironmentVariablesScreen.tsx`

**Features:**
- ✅ Create Environment Variables
- ✅ Read/List Environment Variables
- ✅ Update Environment Variables
- ✅ Delete Environment Variables
- ✅ Show/Hide Values
- ✅ Inline Editing
- ✅ Validation (Uppercase, Underscores, Numbers only)
- ✅ Base64 Encryption

### 5. Verwendung in Workflows

**Syntax:**
```
{{ env.VARIABLE_NAME }}
```

**Beispiele:**

**In HTTP Request URL:**
```
{{ env.API_BASE_URL }}/users/{{ employeeId }}
```

**In HTTP Request Headers:**
```json
{
  "Authorization": "Bearer {{ env.API_TOKEN }}",
  "X-API-Key": "{{ env.X_API_KEY }}"
}
```

**In HTTP Request Body:**
```json
{
  "api_key": "{{ env.SLACK_API_KEY }}",
  "employee_email": "{{ employeeEmail }}",
  "message": "Welcome!"
}
```

### 6. Security

**Encryption:**
- Values werden mit Base64 encoded (Simple Encryption)
- **TODO für Production:** Proper AES encryption mit Secret Key verwenden

**Access Control:**
- Aktuell: `organizationId = 'default-org'` (hardcoded)
- **TODO:** Organization ID aus authenticated user context holen

**Best Practices:**
- Niemals Env Vars in Git committen
- Rotiere API Keys regelmäßig
- Nutze separate Keys für Dev/Prod

### 7. Testing

**Test 1: Create Variable**
```bash
# Im Environment Variables Screen:
# 1. Klicke "Neue Variable"
# 2. Key: GITHUB_TOKEN
# 3. Value: ghp_xxxxxxxxxxxx
# 4. Description: GitHub API Token
# 5. Klicke "Erstellen"
```

**Test 2: Use in Workflow**
```
# HTTP Request Node Config:
URL: {{ env.GITHUB_API_BASE }}/user
Headers: { "Authorization": "token {{ env.GITHUB_TOKEN }}" }
```

**Test 3: Verify Encryption**
```bash
# In Supabase Dashboard → Database → kv_store_f659121d
# Suche nach key: env_var:default-org:xxx
# Value sollte base64 encoded sein
```

### 8. Troubleshooting

**Problem:** "Failed to load variables"
- **Lösung:** Edge Function deployen und CORS Headers checken

**Problem:** "Key must contain only uppercase..."
- **Lösung:** Nur A-Z, 0-9, _ erlaubt (z.B. GITHUB_TOKEN, API_KEY_123)

**Problem:** Variable wird nicht resolved in HTTP Request
- **Lösung:** actionExecutor.ts muss `resolveEnvVarsInObject` callen (siehe nächster Schritt)

### 9. Next Steps

1. ✅ Deploy BrowoKoordinator-Workflows Edge Function
2. ⏳ Integration in actionExecutor.ts (für HTTP Request Node)
3. ⏳ OAuth2 Support (Phase 3B nächster Schritt)
4. ⏳ Proper Encryption (AES statt Base64)
5. ⏳ Multi-Organization Support

---

**Status:** ✅ READY FOR DEPLOYMENT  
**Version:** 1.0.0  
**Date:** December 1, 2025
