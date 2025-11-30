# 📧 RESEND EMAIL INTEGRATION - SETUP GUIDE

## ✅ WAS WURDE IMPLEMENTIERT (PHASE 2C)

### 1. Echte Email-Versendung via Resend API
- ✅ **Resend API Integration** in actionExecutor.ts
- ✅ **HTML + Plain Text** Emails
- ✅ **Batch-Processing** für "Alle Mitarbeiter"
- ✅ **Fallback zu Logging** wenn keine API Key

### 2. Email-Tracking System
- ✅ **Email-Logs** in KV Store
- ✅ **Webhook Handler** für Resend Events
- ✅ **Status-Tracking** (SENT, DELIVERED, OPENED, CLICKED, BOUNCED, FAILED)
- ✅ **Statistics Dashboard** (API)

### 3. Delay-Node mit Scheduling
- ✅ **Scheduling** für spätere Execution
- ✅ **Zeit-Einheiten** (Minuten, Stunden, Tage, Wochen)
- ✅ **Scheduled Executions** in KV Store
- ⏳ **Cron-Job** benötigt für automatische Ausführung

---

## 📋 SCHRITT 1: RESEND ACCOUNT ERSTELLEN

### **1. Registrieren bei Resend**
```
1. Gehe zu: https://resend.com
2. Klicke "Sign Up"
3. Account erstellen (kostenlos)
4. Email bestätigen
```

### **2. API Key generieren**
```
1. Gehe zu: https://resend.com/api-keys
2. Klicke "Create API Key"
3. Name: "Browo Koordinator Production"
4. Permissions: "Full access" (oder "Sending access")
5. Klicke "Create"
6. ⚠️ WICHTIG: Kopiere den Key jetzt! (wird nur einmal angezeigt)
```

**Dein API Key sieht aus wie:**
```
re_123abc456def789ghi012jkl345mno678
```

---

## 📋 SCHRITT 2: DOMAIN VERIFIZIEREN (OPTIONAL, EMPFOHLEN)

### **Warum Domain verifizieren?**
- ✅ Professioneller: `onboarding@browo.de` statt `onboarding@resend.dev`
- ✅ Bessere Zustellbarkeit
- ✅ Höhere Email-Limits
- ✅ Keine "via resend.dev" Warnung

### **Domain hinzufügen:**
```
1. Gehe zu: https://resend.com/domains
2. Klicke "Add Domain"
3. Domain eingeben: browo.de
4. Klicke "Add"
```

### **DNS-Records konfigurieren:**

Resend zeigt dir DNS-Records zum Hinzufügen:

```
Record Type: TXT
Name: _resend
Value: resend-domain-verification=abc123def456ghi789
TTL: 3600

Record Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
TTL: 3600

Record Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10
TTL: 3600
```

**Bei deinem Domain-Provider (z.B. Hetzner, Namecheap, Cloudflare):**
```
1. Gehe zu DNS-Einstellungen für browo.de
2. Füge alle 3 Records hinzu
3. Warte 15-60 Minuten (DNS-Propagation)
4. Zurück zu Resend → "Verify Domain"
5. ✅ Status ändert sich zu "Verified"
```

---

## 📋 SCHRITT 3: API KEY IN SUPABASE HINZUFÜGEN

### **Option A: Via Supabase Dashboard (EMPFOHLEN)**

```
1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Sidebar → "Settings" → "Secrets"
4. Klicke "Add New Secret"
5. Name: RESEND_API_KEY
6. Value: re_123abc456def789ghi012jkl345mno678 (dein Key)
7. Klicke "Save"
8. ⚠️ WICHTIG: Edge Functions neu deployen!
```

### **Option B: Via Supabase CLI**

```bash
# Login zu Supabase
supabase login

# Secret setzen
supabase secrets set RESEND_API_KEY=re_123abc456def789ghi012jkl345mno678

# Edge Functions neu deployen
supabase functions deploy BrowoKoordinator-Workflows
supabase functions deploy BrowoKoordinator-EmailTracking
```

---

## 📋 SCHRITT 4: TESTEN

### **Test 1: Einfache Email senden**

```
1. Gehe zu /admin/workflows/builder/wf_test
2. Erstelle SEND_EMAIL Node:
   {
     "recipientType": "specific_user",
     "userId": "DEINE_USER_ID",
     "subject": "Test Email via Resend",
     "body": "Hallo, das ist ein Test!"
   }
3. Test Run ausführen
4. ✅ Prüfe Logs:
   "✅ EMAIL SENT via Resend (ID: abc123...)"
5. ✅ Prüfe dein Email-Postfach!
```

### **Test 2: Template-Email**

```
1. Erstelle Template unter /admin/email-templates
2. Workflow-Node mit Template verknüpfen
3. Test Run
4. ✅ Email sollte ankommen mit formatiertem HTML
```

### **Test 3: Batch-Email (Alle Mitarbeiter)**

```
1. SEND_EMAIL Node mit recipientType: "all_employees"
2. Test Run
3. ✅ Logs zeigen:
   "📧 Batch email completed: 15 sent, 0 failed (15 total)"
4. ✅ Alle Mitarbeiter bekommen Email
```

---

## 📋 SCHRITT 5: WEBHOOKS EINRICHTEN (OPTIONAL)

### **Warum Webhooks?**
- ✅ **Email-Status tracken** (Delivered, Opened, Clicked, Bounced)
- ✅ **Fehler erkennen** (Bounces, Complaints)
- ✅ **Analytics** (Open-Rate, Click-Rate)

### **Webhook konfigurieren:**

```
1. Gehe zu: https://resend.com/webhooks
2. Klicke "Create Webhook"
3. URL eingeben:
   https://DEIN_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-EmailTracking/webhook
   
   Beispiel:
   https://abc123def456.supabase.co/functions/v1/BrowoKoordinator-EmailTracking/webhook

4. Events auswählen:
   ✅ email.sent
   ✅ email.delivered
   ✅ email.opened
   ✅ email.clicked
   ✅ email.bounced
   ✅ email.failed

5. Klicke "Create"
6. ⚠️ WICHTIG: Kopiere "Signing Secret" (für Security)
```

### **Signing Secret hinzufügen (optional, für Sicherheit):**

```bash
supabase secrets set RESEND_WEBHOOK_SECRET=whsec_abc123def456...
```

### **Webhook testen:**

```
1. Resend Dashboard → Webhooks → Dein Webhook → "Test"
2. Event auswählen: "email.delivered"
3. Klicke "Send Test Event"
4. ✅ Prüfe Supabase Edge Function Logs:
   "📨 Resend Webhook: email.delivered"
```

---

## 📊 EMAIL-TRACKING NUTZEN

### **Email-Statistiken abrufen:**

```bash
GET https://DEIN_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-EmailTracking/stats

Response:
{
  "stats": {
    "total": 124,
    "sent": 120,
    "delivered": 115,
    "opened": 87,
    "clicked": 23,
    "failed": 4,
    "bounced": 5
  }
}
```

### **Logs für Workflow abrufen:**

```bash
GET https://DEIN_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-EmailTracking/logs/exec_123

Response:
{
  "logs": [
    {
      "id": "email_1738000000001",
      "recipientEmail": "max@example.com",
      "subject": "Willkommen im Team!",
      "status": "DELIVERED",
      "openedAt": "2025-01-28T14:35:22Z",
      "clickedAt": "2025-01-28T14:36:10Z"
    }
  ]
}
```

---

## 🎨 FROM-ADDRESS ANPASSEN

### **Standard (ohne eigene Domain):**
```typescript
from: 'Browo Koordinator <onboarding@resend.dev>'
```

### **Mit verifizierter Domain:**
```typescript
from: 'Browo Koordinator <onboarding@browo.de>'
```

**Anpassen in Code:**

```typescript
// In actionExecutor.ts, Zeile ~155
body: JSON.stringify({
  from: 'Browo Koordinator <onboarding@browo.de>',  // ← Hier ändern
  to: [recipientEmail],
  subject: subject,
  html: bodyHtml,
  text: body,
}),
```

---

## 💰 RESEND PRICING (Stand 2025)

### **Free Tier:**
```
✅ 3,000 Emails/Monat
✅ Alle Features
✅ Webhooks
✅ API Access
⚠️ Nur Test-Domain (resend.dev)
```

### **Pro Plan: $20/Monat**
```
✅ 50,000 Emails/Monat
✅ Eigene Domain
✅ Bessere Zustellbarkeit
✅ Analytics Dashboard
✅ Support
```

### **Für Browo Koordinator:**
```
Empfehlung: Start mit Free Tier
→ Wenn > 100 Emails/Tag: Upgrade zu Pro
```

---

## 🚨 TROUBLESHOOTING

### **Problem 1: "API Key not found"**

**Symptom:**
```
📧 EMAIL LOGGED (no API key)
```

**Lösung:**
```bash
1. Prüfe ob Secret gesetzt:
   supabase secrets list

2. Falls nicht da:
   supabase secrets set RESEND_API_KEY=re_...

3. Edge Functions neu deployen:
   supabase functions deploy BrowoKoordinator-Workflows
```

---

### **Problem 2: "Domain not verified"**

**Symptom:**
```
❌ Resend API error: Domain not verified
```

**Lösung:**
```
1. Prüfe Domain-Status: https://resend.com/domains
2. Falls "Pending": DNS-Records prüfen
3. Falls "Failed": DNS-Records korrigieren
4. Warte 15-60 Minuten
5. Klicke "Verify Domain" erneut
```

---

### **Problem 3: "Rate limit exceeded"**

**Symptom:**
```
❌ Resend API error: Rate limit exceeded
```

**Lösung:**
```
Free Tier: 3,000 Emails/Monat = ~100/Tag

1. Prüfe aktuelle Usage: https://resend.com/usage
2. Falls Limit erreicht:
   - Upgrade zu Pro Plan
   - ODER warte bis nächster Monat
   - ODER reduziere Batch-Size (aktuell 10)
```

---

### **Problem 4: Email kommt nicht an**

**Check-Liste:**
```
✅ Resend Dashboard → "Emails" → Suche nach Email
   → Status sollte "delivered" sein

✅ Spam-Ordner prüfen (ohne verifizierte Domain!)

✅ Email-Adresse korrekt?
   → Logs prüfen: "To: ..."

✅ Bounced?
   → Webhook-Logs prüfen
   → Email-Adresse ungültig?

✅ Domain verifiziert?
   → Bessere Zustellbarkeit
```

---

## 🎯 PRODUCTION CHECKLIST

Bevor du in Production gehst:

```
✅ Resend API Key gesetzt
✅ Domain verifiziert (empfohlen)
✅ Webhooks konfiguriert
✅ FROM-Address angepasst
✅ Test-Emails versendet
✅ Batch-Email getestet
✅ Template-Emails getestet
✅ Tracking funktioniert
✅ Error-Handling getestet (falsche Email)
✅ Rate-Limits verstanden (Free: 3K/Monat)
```

---

## 🔮 ADVANCED FEATURES

### **1. Reply-To setzen:**

```typescript
body: JSON.stringify({
  from: 'Browo Koordinator <onboarding@browo.de>',
  to: [recipientEmail],
  reply_to: 'hr@browo.de',  // ← Antworten gehen an HR
  subject: subject,
  html: bodyHtml,
  text: body,
}),
```

### **2. CC/BCC hinzufügen:**

```typescript
body: JSON.stringify({
  from: 'Browo Koordinator <onboarding@browo.de>',
  to: [recipientEmail],
  cc: ['manager@browo.de'],
  bcc: ['hr@browo.de'],
  subject: subject,
  html: bodyHtml,
  text: body,
}),
```

### **3. Attachments hinzufügen:**

```typescript
body: JSON.stringify({
  from: 'Browo Koordinator <onboarding@browo.de>',
  to: [recipientEmail],
  subject: subject,
  html: bodyHtml,
  text: body,
  attachments: [
    {
      filename: 'welcome.pdf',
      content: 'BASE64_ENCODED_PDF_HERE',
    }
  ],
}),
```

### **4. Custom Headers:**

```typescript
body: JSON.stringify({
  from: 'Browo Koordinator <onboarding@browo.de>',
  to: [recipientEmail],
  subject: subject,
  html: bodyHtml,
  text: body,
  headers: {
    'X-Entity-Ref-ID': 'employee_123',
  },
}),
```

---

## 📚 RESEND DOCUMENTATION

- **API Docs:** https://resend.com/docs
- **Webhooks:** https://resend.com/docs/webhooks
- **Rate Limits:** https://resend.com/docs/rate-limits
- **Best Practices:** https://resend.com/docs/best-practices

---

## ✅ ZUSAMMENFASSUNG

### **Was funktioniert JETZT:**
✅ Echte Email-Versendung via Resend API
✅ HTML + Plain Text Emails
✅ Template-Rendering mit Variablen
✅ Batch-Processing für "Alle Mitarbeiter"
✅ Email-Tracking (Sent, Delivered, Opened, Clicked)
✅ Webhooks für Status-Updates
✅ Fallback zu Logging (ohne API Key)

### **Nächste Schritte:**
1. Resend Account erstellen
2. API Key generieren & in Supabase setzen
3. (Optional) Domain verifizieren
4. (Optional) Webhooks einrichten
5. Test-Email senden
6. Production!

---

**🎉 HAPPY EMAILING! 📧**

**Version:** Phase 2C - Resend Integration
**Status:** ✅ Production Ready
**Datum:** 2025-01-28
