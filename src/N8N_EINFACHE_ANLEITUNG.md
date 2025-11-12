# 🤖 n8n Integration - Super Einfache Anleitung

**Für:** Browo Koordinator  
**Ziel:** Automationen mit n8n erstellen

---

## 📝 **WAS MUSST DU TUN?**

Es gibt **3 einfache Schritte**:

1. ✅ **API Key generieren** (im Browo Koordinator Admin Panel)
2. ✅ **API Key in n8n eintragen** (als Header)
3. ✅ **API Calls machen** (mit HTTP Request Nodes)

---

## 🎯 **SCHRITT 1: API KEY GENERIEREN**

### **Option A: Im Admin Panel (EMPFOHLEN)**

1. **Öffne Browo Koordinator**
2. **Gehe zu:** Admin → Automation Management
3. **Klicke:** "Neuen API Key erstellen"
4. **Gib einen Namen ein:** z.B. "n8n Integration"
5. **Klicke:** "Erstellen"
6. **⚠️ WICHTIG:** Kopiere den API Key **SOFORT** und speichere ihn sicher!
   - Format: `browoko-abc123def456...`
   - Du siehst ihn **NIE WIEDER**!

### **Option B: Via HTTP Request (Falls Admin Panel nicht verfügbar)**

```bash
curl -X POST \
  'https://DEIN_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/api-keys/generate' \
  -H 'Authorization: Bearer DEIN_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "n8n Integration"
  }'
```

**Response:**
```json
{
  "success": true,
  "api_key": "browoko-abc123def456...",
  "name": "n8n Integration",
  "warning": "Save this key securely!"
}
```

---

## 🔧 **SCHRITT 2: API KEY IN N8N EINTRAGEN**

### **Methode 1: Header Auth (EINFACH - EMPFOHLEN)**

1. **Öffne n8n**
2. **Erstelle einen neuen Workflow**
3. **Füge "HTTP Request" Node hinzu**
4. **Konfiguriere:**
   
   ```
   Method: GET
   URL: https://DEIN_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions
   
   Authentication: None (wir machen es manuell)
   
   Headers:
     Add Header:
       Name: X-API-Key
       Value: browoko-abc123def456...  (DEIN API KEY!)
   ```

5. **Execute Node** → Du solltest alle verfügbaren Actions sehen! 🎉

### **Methode 2: Credential (PROFESSIONELL - für Wiederverwendung)**

1. **n8n → Credentials → Add Credential**
2. **Wähle:** "Header Auth"
3. **Credential Name:** "Browo Koordinator API"
4. **Configure:**
   ```
   Name: X-API-Key
   Value: browoko-abc123def456...
   ```
5. **Save**

**Dann in jedem HTTP Request Node:**
```
Authentication: Header Auth
Credential: Browo Koordinator API
```

---

## 🚀 **SCHRITT 3: API CALLS MACHEN**

### **Test 1: Alle verfügbaren Actions anzeigen**

**HTTP Request Node:**
```
Method: GET
URL: https://DEIN_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions

Headers:
  X-API-Key: browoko-abc123def456...
```

**Response:**
```json
{
  "modules": [
    "antragmanager",
    "personalakte",
    "dokumente",
    "lernen",
    "benefits",
    "zeiterfassung",
    "kalender",
    "organigram",
    "chat",
    "analytics",
    "notification",
    "tasks",
    "field"
  ],
  "total_actions": 186
}
```

---

### **Test 2: Urlaubsanträge abrufen**

**HTTP Request Node:**
```
Method: GET
URL: https://DEIN_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions/antragmanager/leave-requests

Headers:
  X-API-Key: browoko-abc123def456...
```

**Response:**
```json
{
  "leave_requests": [
    {
      "id": "123",
      "user_id": "456",
      "start_date": "2025-11-01",
      "end_date": "2025-11-05",
      "status": "pending",
      "type": "vacation"
    }
  ]
}
```

---

### **Test 3: Neuen Mitarbeiter anlegen**

**HTTP Request Node:**
```
Method: POST
URL: https://DEIN_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions/personalakte/users

Headers:
  X-API-Key: browoko-abc123def456...
  Content-Type: application/json

Body (JSON):
{
  "email": "max.mustermann@firma.de",
  "first_name": "Max",
  "last_name": "Mustermann",
  "role": "employee"
}
```

---

## 📋 **VERFÜGBARE API ENDPOINTS**

### **Base URL:**
```
https://DEIN_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d
```

### **Wichtigste Endpoints:**

| Was? | Endpoint |
|------|----------|
| **Alle Actions anzeigen** | `GET /automation/actions` |
| **OpenAPI Schema** | `GET /automation/schema` |
| **Urlaubsanträge** | `GET /automation/actions/antragmanager/leave-requests` |
| **Mitarbeiter** | `GET /automation/actions/personalakte/users` |
| **Dokumente** | `GET /automation/actions/dokumente/documents` |
| **Lernvideos** | `GET /automation/actions/lernen/videos` |
| **Coins verteilen** | `POST /automation/actions/benefits/coins/award` |
| **Zeiterfassung** | `GET /automation/actions/zeiterfassung/work-sessions` |
| **Kalender** | `GET /automation/actions/kalender/calendar` |

**➡️ Für ALLE 186+ Endpoints:** Siehe `N8N_INTEGRATION_COMPLETE_GUIDE.md`

---

## 🎯 **BEISPIEL WORKFLOWS**

### **Workflow 1: Tägliche Urlaubsantrags-Erinnerung**

```
┌─────────────────┐
│ Schedule Trigger│  ← Jeden Tag um 9:00 Uhr
│  (täglich 9:00) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ HTTP Request                        │
│ GET /automation/actions/            │
│     antragmanager/leave-requests/   │
│     pending                         │
│                                     │
│ Header: X-API-Key: browoko-xxx     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ IF Node         │  ← Wenn Count > 0
│ Count > 0?      │
└────────┬────────┘
         │ JA
         ▼
┌─────────────────┐
│ Slack Message   │
│ "Du hast {count}│
│  offene Anträge"│
└─────────────────┘
```

**n8n Setup:**

1. **Schedule Trigger:**
   - Interval: Days
   - Hour: 9
   - Minute: 0

2. **HTTP Request:**
   ```
   Method: GET
   URL: https://DEIN_PROJECT.supabase.co/.../automation/actions/antragmanager/leave-requests/pending
   Headers:
     X-API-Key: browoko-xxx
   ```

3. **IF Node:**
   ```
   Condition: {{ $json.leave_requests.length > 0 }}
   ```

4. **Slack Node:**
   ```
   Message: Du hast {{ $json.leave_requests.length }} offene Urlaubsanträge!
   ```

---

### **Workflow 2: Neuer Mitarbeiter aus Google Sheets**

```
┌─────────────────┐
│ Google Sheets   │  ← Neue Zeile erkannt
│ Trigger         │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ HTTP Request                        │
│ POST /automation/actions/           │
│      personalakte/users             │
│                                     │
│ Body: {                            │
│   "email": "{{$json.email}}",     │
│   "first_name": "{{$json.name}}"  │
│ }                                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Email Node      │
│ "Willkommen!"   │
└─────────────────┘
```

---

### **Workflow 3: Coins für abgeschlossene Tasks**

```
┌─────────────────┐
│ Webhook         │  ← Von externem System
│ Trigger         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ IF Node         │  ← Wenn Task = "completed"
│ Status check    │
└────────┬────────┘
         │ JA
         ▼
┌─────────────────────────────────────┐
│ HTTP Request                        │
│ POST /automation/actions/           │
│      benefits/coins/award           │
│                                     │
│ Body: {                            │
│   "user_id": "{{$json.user_id}}",  │
│   "amount": 50,                    │
│   "reason": "Task completed"       │
│ }                                  │
└─────────────────────────────────────┘
```

---

## 🔐 **SICHERHEIT**

### **DO:**
✅ Speichere API Keys sicher (z.B. n8n Credentials)  
✅ Benutze den `X-API-Key` Header  
✅ Checke Audit Logs regelmäßig  
✅ Rotiere API Keys bei Verdacht  

### **DON'T:**
❌ Teile API Keys nicht öffentlich  
❌ Committe API Keys nicht in Git  
❌ Schicke API Keys nicht via Email  

---

## 🐛 **FEHLERSUCHE**

### **Error: 401 Unauthorized**
**Problem:** API Key ist falsch oder fehlt  
**Lösung:**
- Check Header: `X-API-Key` (nicht `X-Api-Key` oder `API-Key`)
- Check Wert: `browoko-...` (muss mit `browoko-` beginnen)

### **Error: 403 Forbidden**
**Problem:** Keine Berechtigung für diese Action  
**Lösung:**
- Nur HR/Superadmin können manche Actions ausführen
- Check welcher User den API Key erstellt hat

### **Error: 404 Not Found**
**Problem:** Endpoint existiert nicht  
**Lösung:**
- Check URL: `/automation/actions/MODULE/ACTION`
- Check verfügbare Actions: `GET /automation/actions`

### **Error: 500 Internal Server Error**
**Problem:** Server-Fehler  
**Lösung:**
- Check Supabase Edge Function Logs
- Check Audit Logs für Details

---

## 📊 **AUDIT LOGS CHECKEN**

**Im Admin Panel:**
1. Gehe zu: Admin → Automation Management
2. Tab: "Audit Logs"
3. Siehe alle API Calls mit Status

**Via API:**
```
GET https://DEIN_PROJECT.supabase.co/.../automation/audit-log

Header: X-API-Key: browoko-xxx
```

---

## ✅ **CHECKLISTE**

- [ ] Edge Function `BrowoKoordinator-Automation` ist deployed
- [ ] Migration `066_automation_system.sql` ist ausgeführt
- [ ] API Key ist generiert (Format: `browoko-...`)
- [ ] API Key ist in n8n gespeichert
- [ ] Test-Call zu `/automation/actions` funktioniert
- [ ] Erster echter Workflow läuft

---

## 🎉 **DU BIST FERTIG!**

Du kannst jetzt:
- 🚀 **186+ API Actions** nutzen
- 🤖 **Workflows** automatisieren
- 📊 **Daten** synchronisieren
- 🔔 **Notifications** triggern
- ⚡ **Prozesse** optimieren

**Neue Features werden automatisch verfügbar!**

---

## 📚 **WEITERFÜHRENDE DOCS**

- **Alle 186+ Endpoints:** `N8N_INTEGRATION_COMPLETE_GUIDE.md`
- **OpenAPI Schema:** `GET /automation/schema`
- **Beispiel Workflows:** `N8N_INTEGRATION_COMPLETE_GUIDE.md` (Seite 437+)

---

**Happy Automating! 🤖✨**
