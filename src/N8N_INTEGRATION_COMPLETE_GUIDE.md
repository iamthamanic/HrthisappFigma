# 🔗 n8n Integration - Complete Setup Guide

**Status:** ✅ Ready to Use  
**Version:** 1.0.0  
**Date:** October 28, 2025

---

## 📋 **OVERVIEW**

Browo Koordinator jetzt bietet **186+ Automation Actions** über eine OpenAPI 3.0 konforme REST API. Alle Features sind **automatisch by design** verfügbar - neue Features werden automatisch in die API integriert!

### **Was ist möglich?**

- ✅ **186+ Actions** sofort verfügbar
- ✅ **Alle Module** integriert (Leave, Documents, Learning, etc.)
- ✅ **Auto-Discovery** via OpenAPI Schema
- ✅ **Webhooks** für Event-basierte Triggers (coming soon)
- ✅ **Secure** mit API Key Authentication
- ✅ **Future-Proof** - Neue Features = Auto-available!

---

## 🚀 **QUICK START (5 MINUTEN)**

### **Step 1: Deploy Edge Function**

```bash
# In deinem Projekt:
cd supabase/functions

# Deploy:
npx supabase functions deploy BrowoKoordinator-Automation
```

### **Step 2: Run Database Migration**

```sql
-- In Supabase SQL Editor:
-- Copy & Paste: /supabase/migrations/066_automation_system.sql
```

### **Step 3: Generate API Key**

```bash
# Option A: Via Frontend UI (coming soon)
# Settings > Automation > Generate API Key

# Option B: Via API Call (jetzt)
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/api-keys/generate' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My n8n Integration"
  }'

# Response:
{
  "success": true,
  "api_key": "browo_1a2b3c4d5e6f...", # ⚠️ SAVE THIS!
  "key_id": "uuid-here",
  "name": "My n8n Integration",
  "warning": "Save this key securely. It will not be shown again!"
}
```

**⚠️ WICHTIG:** Der API Key wird nur **einmal** angezeigt! Speichere ihn sicher!

### **Step 4: Test in n8n**

1. **Öffne n8n**
2. **Erstelle neuen Workflow**
3. **Add HTTP Request Node**
4. **Configure:**
   ```
   Method: GET
   URL: https://YOUR_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions
   
   Authentication: Generic Credential Type
   Header Auth:
     Name: X-API-Key
     Value: browo_1a2b3c4d5e6f...
   ```
5. **Execute Node** → Du siehst alle 186+ Actions! 🎉

---

## 📖 **OPENAPI SCHEMA**

### **Get Schema:**

```bash
# Public Endpoint (no auth required):
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/schema'
```

**Response:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Browo Koordinator Automation API",
    "version": "1.0.0",
    "description": "Complete automation API..."
  },
  "servers": [...],
  "paths": {
    "/automation/actions/antragmanager/leave-requests": {
      "get": {
        "summary": "Get all leave requests",
        "tags": ["Antragmanager"],
        ...
      },
      "post": {
        "summary": "Create a new leave request",
        ...
      }
    },
    ...
  }
}
```

### **Import to n8n:**

n8n kann OpenAPI Schemas automatisch importieren:

1. **HTTP Request Node** → Configure
2. **Authentication** → Add X-API-Key Header
3. **URL:** Use schema paths wie `/automation/actions/antragmanager/leave-requests`

---

## 🎯 **AVAILABLE MODULES & ACTIONS**

### **1. Antragmanager (Leave Management)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all leave requests | GET | `/automation/actions/antragmanager/leave-requests` |
| Create leave request | POST | `/automation/actions/antragmanager/leave-requests` |
| Get leave request by ID | GET | `/automation/actions/antragmanager/leave-requests/:id` |
| Update leave request | PUT | `/automation/actions/antragmanager/leave-requests/:id` |
| Delete leave request | DELETE | `/automation/actions/antragmanager/leave-requests/:id` |
| **Approve leave request** | POST | `/automation/actions/antragmanager/leave-requests/:id/approve` |
| **Reject leave request** | POST | `/automation/actions/antragmanager/leave-requests/:id/reject` |
| Get pending requests | GET | `/automation/actions/antragmanager/leave-requests/pending` |
| Get team requests | GET | `/automation/actions/antragmanager/leave-requests/team/:teamId` |
| Get leave balance | GET | `/automation/actions/antragmanager/leave-balance` |

**Example n8n Workflow:**
```
Trigger: Schedule (täglich 9:00)
  ↓
HTTP Request: GET /automation/actions/antragmanager/leave-requests/pending
  ↓
IF Node: Count > 0
  ↓
Slack: "You have {count} pending leave requests"
```

---

### **2. Personalakte (Employee Management)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all users | GET | `/automation/actions/personalakte/users` |
| **Create new employee** | POST | `/automation/actions/personalakte/users` |
| Get user by ID | GET | `/automation/actions/personalakte/users/:id` |
| Update user | PUT | `/automation/actions/personalakte/users/:id` |
| Delete user | DELETE | `/automation/actions/personalakte/users/:id` |
| Get user profile | GET | `/automation/actions/personalakte/users/:id/profile` |
| Update user profile | PUT | `/automation/actions/personalakte/users/:id/profile` |
| Get all teams | GET | `/automation/actions/personalakte/teams` |
| Create team | POST | `/automation/actions/personalakte/teams` |
| Update team | PUT | `/automation/actions/personalakte/teams/:id` |
| Add team member | POST | `/automation/actions/personalakte/teams/:id/members` |
| Remove team member | DELETE | `/automation/actions/personalakte/teams/:id/members/:userId` |

**Example n8n Workflow:**
```
Trigger: Google Sheets (new row)
  ↓
HTTP Request: POST /automation/actions/personalakte/users
Body: {
  "email": "{{$node["Google Sheets"].json["email"]}}",
  "first_name": "{{$node["Google Sheets"].json["first_name"]}}",
  "last_name": "{{$node["Google Sheets"].json["last_name"]}}"
}
  ↓
Email: "Welcome to the company!"
```

---

### **3. Dokumente (Document Management)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all documents | GET | `/automation/actions/dokumente/documents` |
| Upload document | POST | `/automation/actions/dokumente/documents` |
| Get document by ID | GET | `/automation/actions/dokumente/documents/:id` |
| Update document metadata | PUT | `/automation/actions/dokumente/documents/:id` |
| Delete document | DELETE | `/automation/actions/dokumente/documents/:id` |
| Download document | GET | `/automation/actions/dokumente/documents/:id/download` |
| Share document | POST | `/automation/actions/dokumente/documents/:id/share` |
| Get by category | GET | `/automation/actions/dokumente/documents/category/:category` |

**Example n8n Workflow:**
```
Trigger: Dropbox (new file in /HR folder)
  ↓
HTTP Request: POST /automation/actions/dokumente/documents
Body: {
  "title": "{{$node["Dropbox"].json["name"]}}",
  "file_url": "{{$node["Dropbox"].json["link"]}}",
  "category": "company_documents"
}
```

---

### **4. Lernen (Learning Management)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all videos | GET | `/automation/actions/lernen/videos` |
| Create video | POST | `/automation/actions/lernen/videos` |
| Get video by ID | GET | `/automation/actions/lernen/videos/:id` |
| Update video | PUT | `/automation/actions/lernen/videos/:id` |
| Delete video | DELETE | `/automation/actions/lernen/videos/:id` |
| Update video progress | POST | `/automation/actions/lernen/videos/:id/progress` |
| Get all quizzes | GET | `/automation/actions/lernen/quizzes` |
| Create quiz | POST | `/automation/actions/lernen/quizzes` |
| Submit quiz attempt | POST | `/automation/actions/lernen/quizzes/:id/attempt` |
| Get learning progress | GET | `/automation/actions/lernen/learning-progress/:userId` |

---

### **5. Benefits (Benefits & Coin System)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all benefits | GET | `/automation/actions/benefits/benefits` |
| Create benefit | POST | `/automation/actions/benefits/benefits` |
| Get benefit by ID | GET | `/automation/actions/benefits/benefits/:id` |
| Update benefit | PUT | `/automation/actions/benefits/benefits/:id` |
| Delete benefit | DELETE | `/automation/actions/benefits/benefits/:id` |
| Request benefit | POST | `/automation/actions/benefits/benefits/:id/request` |
| Approve benefit request | POST | `/automation/actions/benefits/benefits/:id/approve` |
| Get shop items | GET | `/automation/actions/benefits/shop-items` |
| Purchase shop item | POST | `/automation/actions/benefits/shop-items/:id/purchase` |
| Get coin balance | GET | `/automation/actions/benefits/coins/balance` |
| **Award coins to user** | POST | `/automation/actions/benefits/coins/award` |
| Get achievements | GET | `/automation/actions/benefits/achievements` |
| Award achievement | POST | `/automation/actions/benefits/achievements/:id/award` |

**Example n8n Workflow:**
```
Trigger: Webhook (from external system)
  ↓
IF: Event = "project_completed"
  ↓
HTTP Request: POST /automation/actions/benefits/coins/award
Body: {
  "user_id": "{{$json["user_id"]}}",
  "amount": 50,
  "reason": "Project XYZ completed successfully"
}
```

---

### **6. Zeiterfassung (Time Tracking)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Clock in | POST | `/automation/actions/zeiterfassung/clock-in` |
| Clock out | POST | `/automation/actions/zeiterfassung/clock-out` |
| Get work sessions | GET | `/automation/actions/zeiterfassung/work-sessions` |
| Get work session by ID | GET | `/automation/actions/zeiterfassung/work-sessions/:id` |
| Update work session | PUT | `/automation/actions/zeiterfassung/work-sessions/:id` |
| Delete work session | DELETE | `/automation/actions/zeiterfassung/work-sessions/:id` |
| Get today's sessions | GET | `/automation/actions/zeiterfassung/work-sessions/today` |
| Get work hours summary | GET | `/automation/actions/zeiterfassung/work-hours/summary` |

---

### **7. Kalender (Calendar)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get calendar events | GET | `/automation/actions/kalender/calendar` |
| Get calendar for date | GET | `/automation/actions/kalender/calendar/:date` |
| Get team calendar | GET | `/automation/actions/kalender/calendar/team/:teamId` |
| Get absences | GET | `/automation/actions/kalender/absences` |
| Get today's absences | GET | `/automation/actions/kalender/absences/today` |
| Get holidays | GET | `/automation/actions/kalender/holidays` |

---

### **8. Organigram (Organization Chart)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get organigram | GET | `/automation/actions/organigram/organigram` |
| Get all nodes | GET | `/automation/actions/organigram/organigram/nodes` |
| Create node | POST | `/automation/actions/organigram/organigram/nodes` |
| Update node | PUT | `/automation/actions/organigram/organigram/nodes/:id` |
| Delete node | DELETE | `/automation/actions/organigram/organigram/nodes/:id` |
| Publish organigram | POST | `/automation/actions/organigram/organigram/publish` |

---

### **9. Chat (Messaging)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all conversations | GET | `/automation/actions/chat/conversations` |
| Create conversation | POST | `/automation/actions/chat/conversations` |
| Get messages | GET | `/automation/actions/chat/conversations/:id/messages` |
| Send message | POST | `/automation/actions/chat/conversations/:id/messages` |
| Update message | PUT | `/automation/actions/chat/messages/:id` |
| Delete message | DELETE | `/automation/actions/chat/messages/:id` |
| Set typing indicator | POST | `/automation/actions/chat/conversations/:id/typing` |
| Mark message as read | POST | `/automation/actions/chat/messages/:id/read` |

---

### **10. Analytics (Statistics & Reports)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get overview stats | GET | `/automation/actions/analytics/stats/overview` |
| Get leave request stats | GET | `/automation/actions/analytics/stats/leave-requests` |
| Get work hours stats | GET | `/automation/actions/analytics/stats/work-hours` |
| Get learning stats | GET | `/automation/actions/analytics/stats/learning` |
| Get benefits stats | GET | `/automation/actions/analytics/stats/benefits` |

---

### **11. Notification (Notifications)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get notifications | GET | `/automation/actions/notification/notifications` |
| Create notification | POST | `/automation/actions/notification/notifications` |
| Mark as read | PUT | `/automation/actions/notification/notifications/:id/read` |
| Delete notification | DELETE | `/automation/actions/notification/notifications/:id` |
| Mark all as read | PUT | `/automation/actions/notification/notifications/read-all` |

---

### **12. Tasks (Task Management)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all tasks | GET | `/automation/actions/tasks/tasks` |
| Create task | POST | `/automation/actions/tasks/tasks` |
| Get task by ID | GET | `/automation/actions/tasks/tasks/:id` |
| Update task | PUT | `/automation/actions/tasks/tasks/:id` |
| Delete task | DELETE | `/automation/actions/tasks/tasks/:id` |
| Mark task as complete | PUT | `/automation/actions/tasks/tasks/:id/complete` |

---

### **13. Field (Equipment & Vehicles)**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all equipment | GET | `/automation/actions/field/equipment` |
| Create equipment | POST | `/automation/actions/field/equipment` |
| Update equipment | PUT | `/automation/actions/field/equipment/:id` |
| Delete equipment | DELETE | `/automation/actions/field/equipment/:id` |
| Get all vehicles | GET | `/automation/actions/field/vehicles` |
| Create vehicle | POST | `/automation/actions/field/vehicles` |
| Update vehicle | PUT | `/automation/actions/field/vehicles/:id` |
| Delete vehicle | DELETE | `/automation/actions/field/vehicles/:id` |

---

## 🔐 **AUTHENTICATION**

### **API Key Header:**

Alle Requests brauchen den `X-API-Key` Header:

```bash
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions/antragmanager/leave-requests' \
  -H 'X-API-Key: browo_1a2b3c4d5e6f...'
```

### **In n8n:**

```
HTTP Request Node:
  Authentication: Generic Credential Type
  Header Auth:
    Name: X-API-Key
    Value: {{ $credentials.browoApiKey }}
```

---

## 📊 **AUDIT LOGGING**

Alle Automation Calls werden geloggt:

```bash
# Get audit logs:
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/audit-log' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN'
```

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "antragmanager/leave-requests",
      "method": "GET",
      "success": true,
      "created_at": "2025-10-28T10:30:00Z",
      "automation_api_keys": {
        "name": "My n8n Integration"
      }
    }
  ]
}
```

---

## 🎯 **EXAMPLE WORKFLOWS**

### **Workflow 1: Daily Leave Request Reminder**

```
Schedule Trigger (täglich 9:00)
  ↓
HTTP Request: GET /automation/actions/antragmanager/leave-requests/pending
  X-API-Key: browo_xxx
  ↓
IF: Count > 0
  ↓
Slack Message: "You have {count} pending leave requests to review"
```

### **Workflow 2: New Employee Onboarding**

```
Google Sheets Trigger (new row added)
  ↓
HTTP Request: POST /automation/actions/personalakte/users
  X-API-Key: browo_xxx
  Body: {
    "email": "{{$json["email"]}}",
    "first_name": "{{$json["first_name"]}}",
    "last_name": "{{$json["last_name"]}}",
    "role": "employee"
  }
  ↓
HTTP Request: POST /automation/actions/notification/notifications
  Body: {
    "user_id": "{{$json["id"]}}",
    "title": "Welcome!",
    "message": "Welcome to Browo Koordinator!"
  }
  ↓
Email: Send welcome email with credentials
```

### **Workflow 3: Document Backup to Dropbox**

```
Schedule Trigger (täglich 2:00)
  ↓
HTTP Request: GET /automation/actions/dokumente/documents
  X-API-Key: browo_xxx
  ↓
For Each Document:
  ↓
  HTTP Request: GET /automation/actions/dokumente/documents/:id/download
    ↓
    Dropbox: Upload file to /Backup/Documents/
```

### **Workflow 4: Achievement Awards Based on Time Tracking**

```
Schedule Trigger (wöchentlich Freitag 18:00)
  ↓
HTTP Request: GET /automation/actions/zeiterfassung/work-hours/summary
  X-API-Key: browo_xxx
  ↓
IF: Total hours >= 40
  ↓
  HTTP Request: POST /automation/actions/benefits/achievements/:id/award
    Body: {
      "user_id": "{{$json["user_id"]}}",
      "achievement_id": "full-week-warrior"
    }
```

---

## 🔮 **WEBHOOKS (COMING SOON)**

### **Register Webhook:**

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/webhooks/register' \
  -H 'X-API-Key: browo_xxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "leave_request.created",
    "webhook_url": "https://your-n8n.com/webhook/browo-leave-created",
    "secret": "your-webhook-secret"
  }'
```

### **Supported Events (in Zukunft):**

- `leave_request.created`
- `leave_request.approved`
- `leave_request.rejected`
- `document.uploaded`
- `user.created`
- `achievement.awarded`
- `benefit.requested`
- `message.received`
- etc.

---

## 🚨 **ERROR HANDLING**

### **Common Errors:**

| Status | Error | Solution |
|--------|-------|----------|
| 401 | Invalid API Key | Check X-API-Key header |
| 403 | Insufficient permissions | Only HR/Superadmin can perform this action |
| 404 | Unknown module | Check module name in URL |
| 500 | Proxy error | Check Edge Function logs |

### **In n8n:**

```
HTTP Request Node
  ↓
IF Error Node: {{ $json["error"] }}
  ↓
  TRUE: Log error to Slack/Email
  FALSE: Continue workflow
```

---

## ✅ **TESTING CHECKLIST**

- [ ] Edge Function deployed
- [ ] Database migration run
- [ ] API Key generated
- [ ] n8n HTTP Request node configured
- [ ] Test GET `/automation/actions` → 186+ actions visible
- [ ] Test GET `/automation/schema` → OpenAPI schema returned
- [ ] Test actual action (e.g., GET `/automation/actions/antragmanager/leave-requests`)
- [ ] Check audit log for successful call
- [ ] Test error handling (invalid API key)

---

## 📚 **RESOURCES**

- **OpenAPI Schema:** `GET /automation/schema`
- **Available Actions:** `GET /automation/actions`
- **Audit Logs:** `GET /automation/audit-log`
- **API Keys:** `GET /automation/api-keys`
- **Webhooks:** `GET /automation/webhooks`

---

## 🎉 **SUCCESS!**

Du hast jetzt Zugriff auf **186+ Automation Actions**! 🚀

**Neue Features werden automatisch verfügbar** - einfach `/automation/actions` oder `/automation/schema` checken!

---

**Support:**
- Bei Fragen: Check Audit Logs
- Bei Errors: Check Edge Function Logs in Supabase Dashboard
- Bei API-Fragen: Check OpenAPI Schema

**Happy Automating! 🤖✨**
