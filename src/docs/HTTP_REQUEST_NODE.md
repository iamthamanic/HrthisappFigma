# HTTP Request Node - Dokumentation

## Übersicht
Die **HTTP Request Node** ermöglicht es, externe APIs direkt aus Workflows aufzurufen - genau wie in n8n! Du kannst damit Webhooks triggern, Daten von externen Services abrufen oder Daten an externe Systeme senden.

## Features ✨

### 1. HTTP-Methoden
- **GET** - Daten abrufen
- **POST** - Daten erstellen
- **PUT** - Daten vollständig aktualisieren
- **PATCH** - Daten teilweise aktualisieren
- **DELETE** - Daten löschen

### 2. Authentication
- **Keine Authentication** - Für öffentliche APIs
- **API Key** - Header oder Query Parameter
- **Bearer Token** - OAuth2 / JWT Tokens
- **Basic Auth** - Username/Password

### 3. Erweiterte Features
- **Custom Headers** - JSON-Format
- **Request Body** - JSON mit Variablen-Support
- **Timeout** - 1-300 Sekunden
- **Retries** - 0-5 Wiederholungen bei Fehler
- **Continue on Error** - Workflow fortsetzen bei Fehler
- **Response Variables** - API-Antwort in Variable speichern

## Verwendung 🚀

### Beispiel 1: Slack Webhook
```
Methode: POST
URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
Auth: Keine
Body:
{
  "text": "Neuer Mitarbeiter: {{ employeeName }}",
  "channel": "#onboarding"
}
```

### Beispiel 2: GitHub Issue erstellen
```
Methode: POST
URL: https://api.github.com/repos/YOUR_ORG/YOUR_REPO/issues
Auth: Bearer Token
Token: ghp_YOUR_TOKEN

Body:
{
  "title": "Onboarding für {{ employeeName }}",
  "body": "Bitte Zugang erstellen für {{ employeeEmail }}",
  "labels": ["onboarding"]
}
```

### Beispiel 3: Externe Daten abrufen
```
Methode: GET
URL: https://api.example.com/employees/{{ employeeId }}
Auth: API Key
Header Name: X-API-Key
Key Value: YOUR_API_KEY

Response Variable: employeeData
```

### Beispiel 4: n8n Webhook triggern
```
Methode: POST
URL: https://YOUR_N8N_INSTANCE.com/webhook/onboarding
Auth: Keine
Body:
{
  "event": "employee_created",
  "employee": {
    "id": "{{ employeeId }}",
    "name": "{{ employeeName }}",
    "email": "{{ employeeEmail }}",
    "startDate": "{{ startDate }}"
  }
}
```

## Variablen 📝

Alle Config-Felder unterstützen Variablen im Format `{{ variableName }}`:

**Standard-Variablen:**
- `{{ employeeId }}` - Mitarbeiter-ID
- `{{ employeeName }}` - Mitarbeiter Name
- `{{ employeeEmail }}` - Mitarbeiter Email
- `{{ startDate }}` - Startdatum
- `{{ endDate }}` - Enddatum
- `{{ organizationId }}` - Organization ID

**Custom-Variablen:**
- Verwende Response Variables aus vorherigen HTTP Request Nodes
- Beispiel: `{{ apiResponse.userId }}`

## Error Handling 🛡️

### Retries
Bei Netzwerkfehlern wird automatisch retry mit Exponential Backoff:
- Versuch 1: Sofort
- Versuch 2: Nach 1s
- Versuch 3: Nach 2s
- Versuch 4: Nach 4s
- Versuch 5: Nach 8s

### Continue on Error
Wenn aktiviert, wird der Workflow auch bei HTTP-Fehlern fortgesetzt.
Nützlich für optionale API-Calls.

## Integration mit n8n 🔄

### n8n Webhook als Trigger
1. In n8n: Webhook Node erstellen
2. URL kopieren
3. In Browo Koordinator: HTTP Request Node mit POST zu dieser URL

### n8n Workflow aufrufen
```
POST https://YOUR_N8N.com/webhook/YOUR_HOOK
Body: { "data": "{{ employeeName }}" }
```

### Daten von n8n empfangen
```
GET https://YOUR_N8N.com/webhook-response/YOUR_HOOK
Response Variable: n8nData
```

## Security Best Practices 🔒

1. **API Keys niemals hardcoden** - In Zukunft Environment Variables verwenden
2. **HTTPS verwenden** - Niemals sensitive Daten über HTTP
3. **Timeouts setzen** - Verhindert hängende Workflows
4. **Retries begrenzen** - Nicht zu viele Wiederholungen
5. **Continue on Error** - Nur bei nicht-kritischen Calls

## Debugging 💡

### Logs ansehen
Alle HTTP Requests werden in den Workflow Execution Logs dokumentiert:
```
🌐 HTTP POST https://api.example.com/endpoint (Attempt 1/1)
✅ HTTP Request successful (234ms)
   Status: 200
   Response: {"success": true, ...}
   💾 Response stored in variable: apiResponse
```

### Häufige Fehler
- **HTTP 401**: Authentication fehlt oder falsch
- **HTTP 403**: Keine Berechtigung
- **HTTP 404**: URL nicht gefunden
- **HTTP 500**: Server-Fehler
- **Timeout**: Server antwortet nicht rechtzeitig

## Use Cases 🎯

1. **Slack/Teams Notifications** - Team über Onboarding informieren
2. **GitHub Issues** - Automatisch Tickets erstellen
3. **Jira Integration** - Tasks in externen Systemen
4. **Zapier/Make Webhooks** - Andere Automatisierungen triggern
5. **Custom APIs** - Eigene Microservices aufrufen
6. **Datenbank-Webhooks** - Externe Datenbanken aktualisieren
7. **Analytics** - Events an Tracking-Systeme senden

## Roadmap 🗺️

- [ ] OAuth2 Support
- [ ] Form Data / Multipart Support
- [ ] File Upload Support
- [ ] Response Validation (JSON Schema)
- [ ] Rate Limiting
- [ ] Request Caching
- [ ] GraphQL Support

---

**Version:** 1.0.0 (Phase 3A)  
**Erstellt:** November 2025  
**Status:** ✅ Production Ready
