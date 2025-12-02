# Environment Variables - Quick Start 🔐

Sichere Verwaltung von API Keys, Tokens und anderen Secrets für deine Workflows.

## 🎯 Features

- ✅ Sichere Storage mit Base64 Encryption
- ✅ Organization-scoped Variables
- ✅ Simple `{{ env.VAR_NAME }}` Syntax
- ✅ Full CRUD API
- ✅ Beautiful Admin UI
- ✅ Inline Editing & Validation

## 🚀 Quick Start

### 1. Deploy Edge Function

```bash
# Upload all files from:
/supabase/functions/BrowoKoordinator-Workflows/
```

### 2. Create Environment Variable

**Via UI:**
1. Öffne Admin Panel → Environment Variables
2. Klicke "Neue Variable"
3. Gib Key, Value, Description ein
4. Klicke "Erstellen"

**Via API:**
```bash
curl -X POST \
  https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/env-vars \
  -H "Authorization: Bearer {ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "GITHUB_TOKEN",
    "value": "ghp_xxxxxxxxxxxx",
    "description": "GitHub Personal Access Token"
  }'
```

### 3. Use in Workflows

**HTTP Request Node:**
```
URL: {{ env.API_BASE_URL }}/users
Headers: { "Authorization": "Bearer {{ env.API_TOKEN }}" }
Body: { "api_key": "{{ env.SECRET_KEY }}" }
```

## 📝 Variable Naming Rules

✅ **Allowed:**
- `API_KEY`
- `GITHUB_TOKEN`
- `SLACK_WEBHOOK_URL_123`
- `DATABASE_CONNECTION_STRING`

❌ **Not Allowed:**
- `api-key` (lowercase, hyphens)
- `Api Key` (spaces)
- `apiKey` (camelCase)

**Rule:** Only `A-Z`, `0-9`, and `_`

## 🔒 Security

**Storage:**
- Values sind Base64 encoded in KV Store
- Key pattern: `env_var:{orgId}:{varId}`

**Access:**
- Nur via authenticated API calls
- Organization-scoped (ein Org sieht nur eigene Vars)

**Best Practices:**
- ⚠️ Niemals Secrets in Git committen
- 🔄 Rotiere API Keys regelmäßig
- 🔐 Nutze separate Keys für Dev/Prod
- 📝 Beschreibe jede Variable klar

## 💡 Common Use Cases

### GitHub API
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_API_BASE=https://api.github.com
```

**Usage:**
```
GET {{ env.GITHUB_API_BASE }}/user/repos
Authorization: token {{ env.GITHUB_TOKEN }}
```

### Slack Notifications
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

**Usage:**
```
POST {{ env.SLACK_WEBHOOK_URL }}
Body: { "text": "New employee joined!" }
```

### Custom API
```
API_BASE_URL=https://api.example.com
API_KEY=sk_live_xxxxxxxxxxxx
API_SECRET=whsec_xxxxxxxxxxxx
```

**Usage:**
```
POST {{ env.API_BASE_URL }}/webhooks
Headers: 
  X-API-Key: {{ env.API_KEY }}
Body:
  { "secret": "{{ env.API_SECRET }}" }
```

## 🔧 API Reference

### List all variables
```
GET /BrowoKoordinator-Workflows/env-vars
→ { variables: [{ id, key, value, description, createdAt }] }
```

### Create variable
```
POST /BrowoKoordinator-Workflows/env-vars
Body: { key, value, description? }
→ { variable: { id, key, value, ... } }
```

### Update variable
```
PUT /BrowoKoordinator-Workflows/env-vars/:id
Body: { key?, value?, description? }
→ { variable: { ... } }
```

### Delete variable
```
DELETE /BrowoKoordinator-Workflows/env-vars/:id
→ { success: true }
```

## 🐛 Troubleshooting

### Variable wird nicht resolved

**Problem:** `{{ env.API_KEY }}` bleibt als Text stehen

**Lösung:**
1. Check ob Variable existiert (gleicher Key)
2. Check Schreibweise (Uppercase!)
3. Check actionExecutor.ts integration
4. Console logs checken

### "Key must contain only uppercase..."

**Problem:** Validation error beim Erstellen

**Lösung:** Nur `A-Z`, `0-9`, `_` erlaubt
- ✅ `API_KEY_123`
- ❌ `api-key`

### "Failed to load variables"

**Problem:** API call schlägt fehl

**Lösung:**
1. Edge Function deployed?
2. CORS Headers korrekt?
3. Authorization Bearer Token korrekt?
4. Console logs checken

## 📚 Files

```
Frontend:
  /screens/admin/EnvironmentVariablesScreen.tsx

Backend:
  /supabase/functions/BrowoKoordinator-Workflows/
    ├── index.ts              (Routes)
    ├── envVarsManager.ts     (Business Logic)
    └── kv_store.tsx          (Storage)

Types:
  /types/workflow.ts
    ├── EnvironmentVariable
    └── EnvironmentVariableInput

Docs:
  /docs/
    ├── ENV_VARS_DEPLOYMENT.md  (Deployment Guide)
    ├── ENV_VARS_README.md      (This file)
    └── PHASE_3B_STATUS.md      (Status & Roadmap)
```

## ✨ What's Next?

1. **OAuth2 Support** - Automatic token refresh
2. **Better Encryption** - AES instead of Base64
3. **Multi-Org Support** - Real organization context
4. **Variable Templates** - Pre-configured API setups
5. **Import/Export** - Backup & restore variables

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** December 1, 2025
