# 🚀 Automation Gateway - Deployment Guide (FIXED)

**Date:** October 28, 2025  
**Status:** ✅ Migration Done, Edge Function Deployed

---

## ✅ **DEPLOYMENT STATUS**

- [x] Edge Function deployed
- [x] Database Migration complete (3 tables verified)
- [ ] **JETZT:** API Key generieren & testen

---

## ⚠️ **WICHTIGE INFO: SUPABASE AUTHORIZATION**

**Alle Supabase Edge Functions** (auch public Endpoints) benötigen den `Authorization` Header mit dem **ANON KEY**!

```bash
# ✅ RICHTIG:
curl 'https://PROJECT.supabase.co/functions/v1/...' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# ❌ FALSCH:
curl 'https://PROJECT.supabase.co/functions/v1/...'
# → Error 401: Missing authorization header
```

**Wo finde ich meinen ANON KEY?**
1. Gehe zu: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Settings → API
3. Copy: "Project API keys" → `anon` `public`

---

## 🎯 **STEP 1: Test Health Endpoint**

```bash
# Replace:
# - azmlolgikubegzusvhra → Your Project ID
# - eyJ... → Your Supabase ANON Key

curl 'https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/health' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY_HERE'
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "BrowoKoordinator-Automation",
  "version": "1.0.0",
  "timestamp": "2025-10-28T...",
  "message": "Automation Gateway is running. 186+ actions available."
}
```

---

## 📋 **STEP 2: Test Schema Endpoint**

```bash
curl 'https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/schema' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY_HERE'
```

**Expected:** OpenAPI 3.0 JSON Schema mit allen 186+ Routes

---

## 🔑 **STEP 3: Generate API Key**

### **Method 1: Browser Console (EMPFOHLEN)**

1. **Login** in deine Browo Koordinator App
2. **F12** (Browser Console öffnen)
3. **Copy & Paste diesen Code:**

```javascript
// Get JWT Token
const { data } = await supabase.auth.getSession();
const token = data.session.access_token;
console.log('✅ JWT Token:', token);

// Generate API Key
const response = await fetch(
  'https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/api-keys/generate',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'My n8n Integration'
    })
  }
);

const result = await response.json();
console.log('📦 Result:', result);

if (result.api_key) {
  console.log('🔑 YOUR API KEY (SAVE THIS!):', result.api_key);
  console.log('⚠️ This key will NOT be shown again!');
} else {
  console.error('❌ Error:', result);
}
```

4. **Copy den API Key!** (beginnt mit `browo_...`)

---

### **Method 2: SQL (Fallback)**

Wenn du **HR oder Superadmin** bist:

```sql
-- 1. Check your role:
SELECT id, email, role, organization_id 
FROM users 
WHERE email = 'YOUR_EMAIL@example.com';

-- If role is NOT 'hr' or 'superadmin', upgrade:
UPDATE users 
SET role = 'hr' 
WHERE email = 'YOUR_EMAIL@example.com';

-- 2. Generate API Key:
INSERT INTO automation_api_keys (
  organization_id,
  key_hash,
  name,
  created_by,
  is_active
)
VALUES (
  (SELECT organization_id FROM users WHERE email = 'YOUR_EMAIL@example.com' LIMIT 1),
  'browo_test_' || gen_random_uuid()::text,
  'My First API Key',
  (SELECT id FROM users WHERE email = 'YOUR_EMAIL@example.com' LIMIT 1),
  true
)
RETURNING key_hash as api_key, id, name;
```

**Copy the `api_key` from result!**

---

## 🎯 **STEP 4: Test API Key**

```bash
# Test: Get all available actions
curl 'https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions' \
  -H 'X-API-Key: browo_YOUR_API_KEY_HERE'
```

**Expected Response:**
```json
{
  "total": 186,
  "actions": [
    {
      "id": "antragmanager.leave-requests",
      "module": "Antragmanager",
      "method": "GET",
      "path": "/leave-requests",
      "description": "Get all leave requests",
      "endpoint": "/automation/actions/antragmanager/leave-requests"
    },
    ...
  ],
  "modules": ["Antragmanager", "Personalakte", ...]
}
```

✅ **Wenn du 186+ actions siehst = SUCCESS!** 🎉

---

## 🚀 **STEP 5: Test Action Proxy**

```bash
# Test: Get all leave requests (proxied to Antragmanager Edge Function)
curl 'https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions/antragmanager/leave-requests' \
  -H 'X-API-Key: browo_YOUR_API_KEY_HERE'
```

**Expected:** Your actual leave requests data!

---

## 📋 **COMPLETE TEST CHECKLIST**

Mit deiner **Project ID: `azmlolgikubegzusvhra`**

```bash
# Get your ANON KEY first:
# https://supabase.com/dashboard/project/azmlolgikubegzusvhra/settings/api

ANON_KEY="YOUR_ANON_KEY_HERE"
API_KEY="YOUR_API_KEY_HERE"  # After Step 3

# ✅ Test 1: Health Check
curl "https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/health" \
  -H "Authorization: Bearer $ANON_KEY"

# ✅ Test 2: Schema
curl "https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/schema" \
  -H "Authorization: Bearer $ANON_KEY"

# ✅ Test 3: Actions List (requires API Key)
curl "https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions" \
  -H "X-API-Key: $API_KEY"

# ✅ Test 4: Proxy Call (requires API Key)
curl "https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions/antragmanager/leave-requests" \
  -H "X-API-Key: $API_KEY"
```

---

## ❓ **TROUBLESHOOTING**

### **Problem: 401 Missing authorization header**

**Ursache:** Fehlender `Authorization: Bearer <ANON_KEY>` Header  
**Lösung:** Immer ANON KEY mitschicken (auch bei public Endpoints)

```bash
# ❌ FALSCH:
curl 'https://PROJECT.supabase.co/functions/v1/...'

# ✅ RICHTIG:
curl 'https://PROJECT.supabase.co/functions/v1/...' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

---

### **Problem: 401 API Key required**

**Ursache:** Fehlender `X-API-Key` Header für protected Endpoints  
**Lösung:** API Key generieren (Step 3) und mitschicken

```bash
curl 'https://PROJECT.supabase.co/functions/v1/.../automation/actions' \
  -H 'X-API-Key: browo_...'
```

---

### **Problem: "Only HR/Superadmin can generate API keys"**

**Lösung:**
```sql
-- Check role:
SELECT email, role FROM users WHERE email = 'YOUR_EMAIL';

-- Upgrade to HR:
UPDATE users SET role = 'hr' WHERE email = 'YOUR_EMAIL';
```

---

## 🎯 **NEXT STEPS**

Nach erfolgreichen Tests:

1. ✅ **Weiter zu n8n Setup:**
   - Read `/N8N_INTEGRATION_COMPLETE_GUIDE.md`
   - Configure n8n HTTP Request Node
   - Create first workflow

2. ✅ **Monitor Audit Logs:**
```sql
SELECT 
  al.*,
  ak.name as api_key_name
FROM automation_audit_log al
JOIN automation_api_keys ak ON al.api_key_id = ak.id
ORDER BY al.created_at DESC
LIMIT 20;
```

---

## 🎉 **SUCCESS CRITERIA**

- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] Schema endpoint returns OpenAPI 3.0 JSON
- [ ] API Key generated successfully
- [ ] Actions endpoint returns 186+ actions
- [ ] Proxy call works (actual data returned)
- [ ] Audit log shows successful calls

**Wenn alle Checks ✅ = Ready for n8n! 🚀**
