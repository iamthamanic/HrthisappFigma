# Environment Variables Guide

## 🔐 Sichere Verwaltung von Secrets in Workflows

Environment Variables ermöglichen die sichere Speicherung von API Keys, Tokens und anderen sensiblen Daten für Browo Koordinator Workflows.

---

## 📋 Was sind Environment Variables?

Environment Variables (Env Vars) sind **verschlüsselt gespeicherte** Key-Value-Paare, die in Workflows über die Syntax `{{ env.VAR_NAME }}` referenziert werden können.

### Vorteile:
- ✅ **Sicherheit:** Secrets werden verschlüsselt im KV Store gespeichert
- ✅ **Wiederverwendbarkeit:** Einmal definieren, überall nutzen
- ✅ **Organization-Scoped:** Jede Organization hat ihre eigenen Env Vars
- ✅ **Zentrale Verwaltung:** Alle Secrets an einem Ort
- ✅ **Keine Hardcoding:** API Keys nie direkt im Workflow speichern

---

## 🚀 Quick Start

### 1. Environment Variable erstellen

1. Navigiere zu **Admin → Workflows → Environment Variables**
2. Klicke auf **"Neue Variable"**
3. Gib folgende Daten ein:
   - **Key:** `MY_API_KEY` (nur Großbuchstaben, Zahlen, Unterstriche)
   - **Value:** `sk_live_abc123...` (dein Secret)
   - **Beschreibung:** `Stripe API Key für Payment-Workflows` (optional)
4. Klicke auf **"Erstellen"**

### 2. In Workflow verwenden

**In HTTP Request Node:**
```
URL: {{ env.API_BASE_URL }}/users
Headers: { "Authorization": "Bearer {{ env.API_TOKEN }}" }
Body: { "api_key": "{{ env.STRIPE_API_KEY }}" }
```

**In Email Template:**
```
Subject: API Status Update
Body: Der API Call zu {{ env.SERVICE_NAME }} war erfolgreich.
```

---

## 💡 Verwendungsbeispiele

### Beispiel 1: Slack Webhook

**Environment Variable:**
```
Key:   SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
Desc:  Slack Webhook für #general Channel
```

**Workflow Usage:**
```json
{
  "method": "POST",
  "url": "{{ env.SLACK_WEBHOOK_URL }}",
  "body": "{\"text\": \"Neuer Mitarbeiter: {{ employeeName }}\"}"
}
```

---

### Beispiel 2: GitHub API

**Environment Variables:**
```
Key:   GITHUB_TOKEN
Value: ghp_abc123xyz...
Desc:  GitHub Personal Access Token

Key:   GITHUB_ORG
Value: my-company
Desc:  GitHub Organization Name
```

**Workflow Usage:**
```json
{
  "method": "POST",
  "url": "https://api.github.com/orgs/{{ env.GITHUB_ORG }}/repos",
  "authType": "BEARER_TOKEN",
  "bearerToken": "{{ env.GITHUB_TOKEN }}",
  "body": "{\"name\": \"{{ employeeName }}-repo\"}"
}
```

---

### Beispiel 3: OAuth2 mit Spotify

**Environment Variables:**
```
Key:   SPOTIFY_CLIENT_ID
Value: abc123def456...
Desc:  Spotify App Client ID

Key:   SPOTIFY_CLIENT_SECRET
Value: xyz789uvw012...
Desc:  Spotify App Client Secret

Key:   SPOTIFY_TOKEN_URL
Value: https://accounts.spotify.com/api/token
Desc:  Spotify OAuth2 Token Endpoint
```

**Workflow Usage:**
```json
{
  "method": "GET",
  "url": "https://api.spotify.com/v1/me/playlists",
  "authType": "OAUTH2",
  "oauth2GrantType": "client_credentials",
  "oauth2ClientId": "{{ env.SPOTIFY_CLIENT_ID }}",
  "oauth2ClientSecret": "{{ env.SPOTIFY_CLIENT_SECRET }}",
  "oauth2TokenUrl": "{{ env.SPOTIFY_TOKEN_URL }}"
}
```

---

## 📝 Naming Conventions

### Best Practices für Variable-Namen:

✅ **DO:**
```
API_KEY
GITHUB_TOKEN
SLACK_WEBHOOK_URL
OAUTH_CLIENT_ID
DATABASE_CONNECTION_STRING
SENDGRID_API_KEY
STRIPE_SECRET_KEY
AWS_ACCESS_KEY_ID
```

❌ **DON'T:**
```
apiKey              // Kleinbuchstaben nicht erlaubt
my-api-key          // Bindestriche nicht erlaubt
API KEY             // Leerzeichen nicht erlaubt
123_API_KEY         // Darf nicht mit Zahl beginnen
```

### Naming Pattern:
```
{SERVICE}_{TYPE}_{SCOPE}

Beispiele:
GITHUB_TOKEN_READONLY
STRIPE_API_KEY_LIVE
SLACK_WEBHOOK_NOTIFICATIONS
SENDGRID_API_KEY_PRODUCTION
```

---

## 🔍 Variable Resolution Order

Wenn ein Workflow ausgeführt wird, werden Variablen in folgender Reihenfolge aufgelöst:

1. **Environment Variables** (`{{ env.VAR_NAME }}`)
2. **Context Variables** (`{{ employeeName }}`, `{{ organizationId }}`)
3. **Previous Node Outputs** (`{{ $json.responseData }}`)

### Beispiel:
```json
{
  "url": "{{ env.API_BASE_URL }}/users/{{ employeeId }}",
  "headers": {
    "Authorization": "Bearer {{ env.API_TOKEN }}",
    "X-Organization": "{{ organizationId }}"
  }
}
```

Wird zu:
```json
{
  "url": "https://api.example.com/users/emp_12345",
  "headers": {
    "Authorization": "Bearer sk_live_abc123...",
    "X-Organization": "org_67890"
  }
}
```

---

## 🔒 Sicherheit & Encryption

### Verschlüsselung

Alle Environment Variables werden **verschlüsselt** im KV Store gespeichert:

```typescript
// Backend: envVarsManager.ts
const encryptedValue = btoa(value); // Base64 encoding
// In Production: Nutze AES-256-GCM oder ähnliches
```

### Zugriffskontrolle

- ✅ **Organization-Scoped:** Jede Org sieht nur ihre eigenen Vars
- ✅ **Masked Display:** Values werden als `••••••••` angezeigt
- ✅ **Reveal on Demand:** Nur sichtbar wenn explizit aufgedeckt

### Best Practices:

1. ✅ Nutze starke, einzigartige API Keys
2. ✅ Rotiere Secrets regelmäßig (alle 90 Tage)
3. ✅ Verwende Read-Only Tokens wo möglich
4. ✅ Beschränke Scopes auf das Minimum
5. ✅ Lösche ungenutzte Variables
6. ✅ Dokumentiere Usage in Description Field

---

## 🛠️ API Endpoints

Die Environment Variables API ist Teil der `BrowoKoordinator-Workflows` Edge Function:

### GET `/env-vars`
Alle Env Vars der Organization abrufen

**Response:**
```json
{
  "variables": [
    {
      "id": "env_abc123",
      "organizationId": "org_67890",
      "key": "GITHUB_TOKEN",
      "value": "ghp_xyz...",
      "description": "GitHub API Token",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST `/env-vars`
Neue Env Var erstellen

**Request:**
```json
{
  "key": "SLACK_WEBHOOK_URL",
  "value": "https://hooks.slack.com/...",
  "description": "Slack Webhook für Notifications"
}
```

### PUT `/env-vars/:id`
Env Var aktualisieren

**Request:**
```json
{
  "key": "SLACK_WEBHOOK_URL",
  "value": "https://hooks.slack.com/...",
  "description": "Updated Webhook URL"
}
```

### DELETE `/env-vars/:id`
Env Var löschen

**Response:**
```json
{
  "success": true,
  "message": "Variable deleted"
}
```

---

## 📊 Use Cases

### 1. Multi-Environment Setup

**Development:**
```
API_BASE_URL = https://dev-api.example.com
STRIPE_KEY   = sk_test_abc123...
DEBUG_MODE   = true
```

**Production:**
```
API_BASE_URL = https://api.example.com
STRIPE_KEY   = sk_live_xyz789...
DEBUG_MODE   = false
```

### 2. Service Integration

**CRM Integration:**
```
SALESFORCE_CLIENT_ID     = abc123...
SALESFORCE_CLIENT_SECRET = xyz789...
SALESFORCE_INSTANCE_URL  = https://mycompany.salesforce.com
```

### 3. Notification Services

**Multi-Channel Notifications:**
```
SLACK_WEBHOOK_GENERAL    = https://hooks.slack.com/.../general
SLACK_WEBHOOK_HR         = https://hooks.slack.com/.../hr
TEAMS_WEBHOOK_URL        = https://outlook.office.com/webhook/...
SENDGRID_API_KEY         = SG.abc123...
```

---

## 🔄 Migration & Updates

### Updating Environment Variables

Wenn du eine Env Var aktualisierst (z.B. API Key rotation):

1. Erstelle neue Variable mit `_NEW` Suffix
2. Teste Workflows mit neuer Variable
3. Update alle Workflows auf neue Variable
4. Lösche alte Variable

**Beispiel:**
```
1. Erstelle: GITHUB_TOKEN_NEW
2. Teste Workflow
3. Update Workflows: {{ env.GITHUB_TOKEN }} → {{ env.GITHUB_TOKEN_NEW }}
4. Lösche: GITHUB_TOKEN (alt)
5. Rename: GITHUB_TOKEN_NEW → GITHUB_TOKEN
```

---

## 📈 Monitoring & Debugging

### Debug Logs

Environment Variable Resolution wird im Backend geloggt:

```
🔐 Environment variables resolved in HTTP config
✅ Resolved: {{ env.API_BASE_URL }} → https://api.example.com
✅ Resolved: {{ env.API_TOKEN }} → sk_live_***
```

### Validation

Wenn eine Env Var nicht gefunden wird:
```
⚠️ Environment variable not found: UNKNOWN_VAR
   Placeholder {{ env.UNKNOWN_VAR }} bleibt unverändert
```

---

## 🚨 Troubleshooting

### ❌ "Variable not found"

**Problem:** `{{ env.MY_VAR }}` wird nicht aufgelöst

**Lösung:**
1. Prüfe ob Variable existiert (Admin → Env Vars)
2. Verifiziere Schreibweise (Case-sensitive!)
3. Checke Organization-Scope
4. Reload Workflow-Editor

### ❌ "Invalid key format"

**Problem:** Key entspricht nicht dem Format `[A-Z0-9_]+`

**Lösung:**
- Nutze nur Großbuchstaben, Zahlen und Unterstriche
- Beispiel: `my-api-key` → `MY_API_KEY`

### ❌ "Encryption failed"

**Problem:** Value kann nicht gespeichert werden

**Lösung:**
- Prüfe Value-Länge (max. 10.000 Zeichen)
- Verifiziere keine Sonderzeichen die Probleme machen könnten

---

## 📚 Weitere Ressourcen

- [OAuth2 Setup Guide](/docs/OAUTH2_SETUP.md)
- [HTTP Request Node Docs](/docs/HTTP_REQUEST_NODE.md)
- [Workflow Best Practices](/docs/WORKFLOW_BEST_PRACTICES.md)

---

**Support:** Bei Fragen zu Environment Variables, checke die Backend-Logs oder kontaktiere das Dev-Team! 🚀
