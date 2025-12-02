# Phase 3A: HTTP Request Node - Quick Start Guide 🚀

## Was wurde implementiert?

Die **HTTP Request Node** macht dein Workflow-System zu einem vollwertigen n8n-Äquivalent! Du kannst jetzt externe APIs aufrufen, Webhooks triggern und mit jedem externen System integrieren.

## Features im Überblick

✅ **5 HTTP-Methoden** - GET, POST, PUT, PATCH, DELETE  
✅ **4 Auth-Typen** - API Key, Bearer Token, Basic Auth, Keine  
✅ **Custom Headers** - JSON-Format mit Variablen-Support  
✅ **Query Parameter** - Dynamisch hinzufügen  
✅ **Request Body** - JSON, Form Data, Raw Text  
✅ **Variablen-Support** - `{{ employeeName }}`, `{{ employeeEmail }}`, etc.  
✅ **Timeout & Retries** - Konfigurierbar (1-300s, 0-5 Retries)  
✅ **Error Handling** - Continue on Error Option  
✅ **Response Variables** - API-Antworten für spätere Nodes speichern  
✅ **Exponential Backoff** - Intelligentes Retry-System  

## Schnellstart in 3 Schritten

### Schritt 1: Node hinzufügen
1. Öffne einen Workflow in Admin → Workflows
2. Ziehe die **HTTP Request** Node (🌐) aus der Action Library
3. Platziere sie im Canvas

### Schritt 2: Konfigurieren
1. Klicke auf die Node
2. Wähle HTTP-Methode (z.B. POST)
3. Gib die URL ein (z.B. `https://hooks.slack.com/...`)
4. Optional: Authentication hinzufügen
5. Bei POST/PUT: Body konfigurieren
6. Speichern

### Schritt 3: Testen
1. Verbinde die Node mit anderen Nodes
2. Speichere den Workflow
3. Klicke auf "Test Run"
4. Prüfe die Execution Logs

## Beispiel: Slack Integration in 2 Minuten

```
1. HTTP Request Node hinzufügen
2. Konfiguration:
   - Methode: POST
   - URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   - Auth: Keine
   - Body:
     {
       "text": "Neuer Mitarbeiter: {{ employeeName }} ({{ employeeEmail }})"
     }
3. Speichern & Testen
```

**Fertig!** Jeder neue Mitarbeiter wird jetzt automatisch in Slack gemeldet. 🎉

## Verfügbare Variablen

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `{{ employeeId }}` | Mitarbeiter-ID | "550e8400-e29b-41d4-a716-446655440000" |
| `{{ employeeName }}` | Vollständiger Name | "Max Mustermann" |
| `{{ employeeEmail }}` | Email-Adresse | "max.mustermann@company.com" |
| `{{ startDate }}` | Startdatum | "2025-12-01" |
| `{{ endDate }}` | Enddatum | "2026-11-30" |
| `{{ organizationId }}` | Organization ID | "org_123456" |

## Häufige Use Cases

### 1. Slack/Teams Benachrichtigungen
- Team über neue Mitarbeiter informieren
- Onboarding-Status Updates
- Reminder an Vorgesetzte

### 2. Project Management
- GitHub Issues automatisch erstellen
- Jira Tickets für HR/IT Tasks
- Asana/Trello Cards erstellen

### 3. Automation Platforms
- n8n Workflows triggern
- Zapier Zaps starten
- Make.com Scenarios ausführen

### 4. Custom Integrations
- Eigene Microservices aufrufen
- Legacy-Systeme integrieren
- Datenbank-Webhooks triggern

### 5. Analytics & Monitoring
- Events an Mixpanel/Segment senden
- Logging-Systeme aktualisieren
- Metrics tracken

## Advanced Features

### Response Variables
Speichere API-Antworten und verwende sie in späteren Nodes:

```
Node 1 (HTTP Request):
- URL: https://api.github.com/repos/owner/repo/issues
- Response Variable: githubIssue

Node 2 (Email):
- Subject: "Issue erstellt: #{{ githubIssue.number }}"
- Body: "{{ githubIssue.html_url }}"
```

### Error Handling
Robuste Workflows mit Retry-Logic:

```
Config:
- Timeout: 30 Sekunden
- Retries: 3
- Continue on Error: true

→ Bei Fehler: 3 Versuche, dann Workflow fortsetzen
```

### Authentication Patterns

**API Key in Header:**
```
Auth Type: API Key
Key Name: X-API-Key
Key Value: abc123xyz
Add To: Header
```

**Bearer Token:**
```
Auth Type: Bearer Token
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Basic Auth:**
```
Auth Type: Basic Auth
Username: admin@company.com
Password: YOUR_PASSWORD
```

## Debugging Tipps

### 1. Logs prüfen
Gehe zu Workflow → Executions → Klicke auf Execution → Logs Tab

### 2. Häufige Fehler

**401 Unauthorized**
→ Prüfe Authentication (API Key, Token, etc.)

**404 Not Found**
→ Prüfe URL (Tippfehler? Variablen korrekt?)

**Timeout**
→ Erhöhe Timeout oder prüfe Server-Verfügbarkeit

**500 Server Error**
→ Prüfe Request Body Format (JSON valid?)

### 3. Test-Tools
- Verwende [RequestBin](https://requestbin.com) zum Testen
- [Webhook.site](https://webhook.site) für Webhook-Debugging
- Postman/Insomnia für API-Tests

## Best Practices

1. **✅ Timeouts setzen** - Verhindert hängende Workflows (Standard: 30s)
2. **✅ Retries konfigurieren** - 2-3 Retries für robuste Workflows
3. **✅ HTTPS verwenden** - Niemals HTTP für sensitive Daten
4. **✅ Continue on Error** - Nur bei optionalen API-Calls aktivieren
5. **✅ Response Variables** - Daten weiterverwenden statt erneut abfragen
6. **✅ Variablen testen** - Prüfe ob `{{ var }}` korrekt ersetzt wird
7. **⚠️ API Keys** - Niemals in Screenshots/Logs teilen

## Nächste Schritte

1. **Teste die Beispiele** - Siehe `/docs/HTTP_REQUEST_EXAMPLES.json`
2. **Erstelle eigene Integrationen** - Verbinde mit deinen Tools
3. **Kombiniere mit anderen Nodes** - Email + HTTP Request + Delay
4. **Dokumentiere Workflows** - Füge Beschreibungen hinzu

## Support & Ressourcen

- **Dokumentation:** `/docs/HTTP_REQUEST_NODE.md`
- **Beispiele:** `/docs/HTTP_REQUEST_EXAMPLES.json`
- **Code:** `/components/workflows/nodes/HttpRequestNode.tsx`
- **Executor:** `/supabase/functions/BrowoKoordinator-Workflows/actionExecutor.ts`

## Roadmap (Kommende Features)

Phase 3B:
- [ ] OAuth2 Flow Support
- [ ] File Upload (Multipart)
- [ ] GraphQL Support
- [ ] Response Validation

Phase 3C:
- [ ] Rate Limiting
- [ ] Request Caching
- [ ] Webhook Response Handling
- [ ] Environment Variables für API Keys

---

**Version:** 1.0.0 (Phase 3A Complete)  
**Status:** ✅ Production Ready  
**Erstellt:** November 30, 2025

**Happy Automating! 🚀**
