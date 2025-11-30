# 🚀 WORKFLOW SYSTEM - PHASE 2 TESTING GUIDE

## ✅ Was wurde implementiert

### 1. Variablen-System
- Ersetzt `{{ variable }}` oder `{{ $json.variable }}` mit echten Werten
- Unterstützt alle Context-Variablen (employeeName, employeeEmail, startDate, etc.)
- Funktioniert in **allen Text-Feldern** (Email-Betreff, Nachricht, Task-Titel, etc.)

### 2. Echte API-Calls für alle 13 Action-Typen
✅ **SEND_EMAIL** → Resolved recipient, parses subject & body with variables
✅ **ASSIGN_BENEFITS** → Calls BrowoKoordinator-Benefits (KV store)
✅ **CREATE_TASK** → Calls BrowoKoordinator-Tasks API
✅ **ASSIGN_DOCUMENT** → Stores document assignment in KV store
✅ **DISTRIBUTE_COINS** → Creates coin transactions in KV store
✅ **DELAY** → Logs delay (immediate execution in prototype)
✅ **ASSIGN_EQUIPMENT** → Stores equipment assignments in KV store
✅ **ASSIGN_TRAINING** → Stores training assignments in KV store
✅ **CREATE_NOTIFICATION** → Creates notifications in KV store
✅ **ADD_TO_TEAM** → Adds team memberships in KV store
✅ **ASSIGN_TEST** → Stores test assignments in KV store
✅ **ASSIGN_VIDEO** → Stores video assignments in KV store
✅ **APPROVE_REQUEST** → Logs request approval

### 3. Context-Weitergabe zwischen Nodes
- Workflow startet mit Initial Context (z.B. `employeeId`, `employeeName`)
- Jede Action kann den Context **erweitern** via `contextUpdates`
- Nachfolgende Actions haben Zugriff auf **alle vorherigen Context-Updates**
- Logs zeigen Context-Änderungen in jedem Schritt

---

## 📋 TEST-SZENARIO 1: ONBOARDING WORKFLOW MIT VARIABLEN

### Setup:
1. Gehe zu `/admin/workflows/builder/wf_onboarding_test`
2. Erstelle neuen Workflow "Onboarding Automation v2"

### Nodes konfigurieren:

#### **Node 1: Email senden**
Config:
```json
{
  "recipientType": "triggered_employee",
  "subject": "Willkommen bei Browo, {{ employeeName }}!",
  "body": "Hallo {{ employeeName }},\n\nwir freuen uns, dich im Team zu haben!\n\nDein erster Arbeitstag ist am {{ startDate }}.\n\nBei Fragen wende dich an {{ employeeEmail }}.\n\nViele Grüße,\nDas Browo Team"
}
```

**Expected Output:**
```
📧 Email sent to max.mustermann@example.com
   Subject: Willkommen bei Browo, Max Mustermann!
   Body: Hallo Max Mustermann, wir freuen uns...
```

#### **Node 2: Benefits zuweisen**
Config:
```json
{
  "benefitId": "benefit_123",
  "benefitName": "JobRad",
  "assignTo": "triggered_employee",
  "startDate": "immediate",
  "notes": "Willkommensbonus für {{ employeeName }}"
}
```

**Expected Output:**
```
🎁 Benefit "JobRad" assigned to user emp_456
```

#### **Node 3: Task erstellen**
Config:
```json
{
  "title": "Laptop für {{ employeeName }} vorbereiten",
  "description": "Bitte Laptop für den neuen Mitarbeiter {{ employeeName }} ({{ employeeEmail }}) vorbereiten.",
  "assigneeType": "hr_admin",
  "priority": "HIGH",
  "dueDate": "2025-12-01"
}
```

**Expected Output:**
```
✅ Task "Laptop für Max Mustermann vorbereiten" created
```

#### **Node 4: Coins verteilen**
Config:
```json
{
  "amount": "500",
  "reason": "Willkommensbonus für {{ employeeName }}",
  "recipientType": "triggered_employee"
}
```

**Expected Output:**
```
🪙 500 coins distributed to user emp_456
```

### Workflow ausführen:

1. Klicke "Speichern"
2. Klicke "Validieren" → Sollte ✅ sein
3. Klicke "Test Run"
4. **Wichtig:** Workflow wird mit diesem Context ausgeführt:
```json
{
  "employeeId": "emp_456",
  "employeeName": "Max Mustermann",
  "employeeEmail": "max.mustermann@example.com",
  "startDate": "2025-12-01",
  "organizationId": "org_123",
  "executedBy": "user_admin_1"
}
```

### Expected Execution Logs:
```
🚀 Starting Workflow Execution for wf_onboarding_test
📊 Initial Context: {"employeeId":"emp_456","employeeName":"Max Mustermann",...}
🟢 Trigger fired: Workflow Start
✅ 📧 Email sent to max.mustermann@example.com
✅ 🎁 Benefit "JobRad" assigned to user emp_456
✅ ✅ Task "Laptop für Max Mustermann vorbereiten" created
✅ 🪙 500 coins distributed to user emp_456
🏁 Workflow Execution Completed.
```

---

## 📋 TEST-SZENARIO 2: MULTI-USER WORKFLOW

### Nodes:

#### **Node 1: Email an spezifischen User**
Config:
```json
{
  "recipientType": "specific_user",
  "userId": "user_hr_123",
  "subject": "Neuer Mitarbeiter: {{ employeeName }}",
  "body": "Ein neuer Mitarbeiter wurde angelegt:\n\nName: {{ employeeName }}\nEmail: {{ employeeEmail }}\nStart: {{ startDate }}"
}
```

#### **Node 2: Task für getriggerten User**
Config:
```json
{
  "title": "Willkommens-Quiz absolvieren",
  "description": "Bitte absolviere das Willkommens-Quiz",
  "assigneeType": "triggered_employee",
  "priority": "MEDIUM"
}
```

#### **Node 3: Notification an alle**
Config:
```json
{
  "title": "Neuer Kollege",
  "message": "{{ employeeName }} startet am {{ startDate }}!",
  "recipientType": "all_employees",
  "priority": "NORMAL"
}
```

**Expected Output:**
```
✅ 📧 Email sent to hr@company.com (HR benachrichtigt)
✅ ✅ Task created for emp_456 (Neuer Mitarbeiter)
✅ 🔔 Notification would be sent to all employees (not implemented yet)
```

---

## 📋 TEST-SZENARIO 3: CONTEXT-WEITERGABE (PHASE 2B - ADVANCED)

### Beispiel: Task-ID weitergeben

In Zukunft kann Node 1 eine Task-ID generieren, die Node 2 verwendet:

```javascript
// Node 1: CREATE_TASK
const result = await executeCreateTask(node, context);
return {
  success: true,
  message: "Task created",
  contextUpdates: {
    createdTaskId: "task_789"  // ← Wird in Context gespeichert
  }
};

// Node 2: CREATE_NOTIFICATION
// Kann jetzt auf {{ createdTaskId }} zugreifen!
{
  "title": "Aufgabe zugewiesen",
  "message": "Dir wurde Aufgabe {{ createdTaskId }} zugewiesen"
}
```

---

## 🔍 DEBUGGING TIPPS

### 1. Execution Logs prüfen
Gehe zu Tab "Executions" → Klicke auf Execution → Sieh dir Logs an

### 2. Edge Function Logs (Supabase Dashboard)
```bash
# Im Supabase Dashboard:
Functions → BrowoKoordinator-Workflows → Logs

# Suche nach:
⚡ Executing Action: [SEND_EMAIL] Email senden
📧 EMAIL SENT: To: max@example.com
```

### 3. Context-Variablen prüfen
```
📊 Initial Context: {...}
📊 Context updated: {...}
📊 Final Context: {...}
```

### 4. Fehler debuggen
```
❌ Action failed: Email senden - No recipient email found
```
→ Prüfe ob `employeeEmail` im Context vorhanden ist

---

## 🚨 BEKANNTE EINSCHRÄNKUNGEN (Phase 2A)

### ❌ Noch nicht implementiert:
1. **E-Mail Templates aus DB** → Aktuell nur Textarea
2. **Rich-Text Editor** → Aktuell nur Plain Text
3. **Massen-Actions** ("Alle Mitarbeiter") → Nur Logging
4. **Delay Scheduling** → Aktuell sofortige Ausführung
5. **Echte E-Mail-Integration** → Benötigt Resend/SendGrid API Key
6. **Task-API mit Kontext** → Aktuell wird Context nicht als Header mitgesendet

### ⚠️ Workarounds:
- **Massen-Actions**: Manuell mehrere Workflows erstellen (einer pro User)
- **Delay**: Später via Cron-Job nachholen
- **E-Mail**: Aktuell nur Logs, später echte Integration

---

## ✅ ERFOLGS-KRITERIEN

### Workflow gilt als erfolgreich wenn:
1. ✅ Alle Nodes werden ausgeführt (grüne Checkmarks in Logs)
2. ✅ Variablen werden korrekt ersetzt (keine `{{ }}` in Logs)
3. ✅ Context wird korrekt weitergegeben
4. ✅ Keine ❌ Fehler in Execution Logs
5. ✅ Status = "COMPLETED"

### Workflow gilt als fehlgeschlagen wenn:
1. ❌ Unconfigured Nodes (orange) → Blockiert durch Validation
2. ❌ Missing Context Variables (z.B. `employeeId` fehlt)
3. ❌ API Errors (z.B. Task-API antwortet mit 500)
4. ❌ Status = "FAILED"

---

## 🎯 NÄCHSTE SCHRITTE (Phase 2B)

### 1. E-Mail Templates System
- [ ] DB-Tabelle für Templates erstellen
- [ ] Template-Manager UI im Admin-Panel
- [ ] Rich-Text Editor (TipTap oder Quill)
- [ ] Template-Variablen Preview

### 2. Echte E-Mail Integration
- [ ] Resend API Key hinzufügen
- [ ] E-Mail-Service in Edge Function
- [ ] HTML-Templates rendern
- [ ] E-Mail-Tracking (Opened, Clicked)

### 3. Massen-Actions
- [ ] "Alle Mitarbeiter" mit Batching (50 pro Request)
- [ ] Queue-System für lange Workflows
- [ ] Progress-Tracking in UI

### 4. Delay Scheduling
- [ ] Cron-Job für geplante Executions
- [ ] DB-Tabelle für "Pending Executions"
- [ ] Resume Workflow nach Delay

---

## 📞 SUPPORT

Bei Fragen oder Problemen:
1. Prüfe Execution Logs (Tab "Executions")
2. Prüfe Edge Function Logs (Supabase Dashboard)
3. Validiere Workflow-Konfiguration (Button "Validieren")
4. Prüfe Context-Variablen (müssen im Trigger-Event vorhanden sein)

---

**Version:** Phase 2A - Echte Execution Engine
**Status:** ✅ Production Ready (mit Einschränkungen)
**Datum:** 2025-01-28
