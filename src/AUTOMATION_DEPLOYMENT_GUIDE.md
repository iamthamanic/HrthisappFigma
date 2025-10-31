# 🚀 Automation Gateway - Deployment Guide

**Date:** October 28, 2025  
**Status:** Ready to Deploy

---

## ✅ **PRE-DEPLOYMENT CHECKLIST**

- [x] Edge Function created: `/supabase/functions/BrowoKoordinator-Automation/index.ts`
- [x] Database Migration created: `/supabase/migrations/066_automation_system.sql`
- [x] Documentation created: `/N8N_INTEGRATION_COMPLETE_GUIDE.md`
- [ ] **YOU NEED TO:** Deploy Edge Function
- [ ] **YOU NEED TO:** Run Database Migration
- [ ] **YOU NEED TO:** Generate API Key

---

## 📦 **STEP-BY-STEP DEPLOYMENT**

### **STEP 1: Run Database Migration**

```sql
-- In Supabase SQL Editor:
-- Copy & Paste COMPLETE content from:
-- /supabase/migrations/066_automation_system.sql

-- OR use Supabase CLI:
npx supabase db push
```

**Expected Output:**
```
✅ AUTOMATION SYSTEM MIGRATION COMPLETE
Tables Created:
  - automation_api_keys
  - automation_webhooks
  - automation_audit_log

RLS Policies: 12 policies created
Helper Functions: trigger_automation_webhooks()
```

**Verify:**
```sql
-- Check tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'automation_%';

-- Expected: 3 tables
```

---

### **STEP 2: Deploy Edge Function**

```bash
# Method A: Supabase CLI (recommended)
cd /path/to/your/project
npx supabase functions deploy BrowoKoordinator-Automation

# Method B: Supabase Dashboard
# 1. Go to Edge Functions
# 2. Create new function "BrowoKoordinator-Automation"
# 3. Copy code from /supabase/functions/BrowoKoordinator-Automation/index.ts
# 4. Deploy
```

**Verify Deployment:**
```bash
xy
```

---

### **STEP 3: Test Schema Endpoint**

```bash
# Get OpenAPI Schema (no auth required):
curl 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/schema'

# Should return full OpenAPI 3.0 schema with all 186+ routes
```

---

### **STEP 4: Generate API Key**

**Option A: Via API (now)**

```bash
# 1. Get your JWT token from Supabase Auth (login first)
# In browser console after login:
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);

# 2. Generate API Key:
curl -X POST \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/api-keys/generate' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My First API Key"
  }'

# Response:
{
  "success": true,
  "api_key": "browo_a1b2c3d4e5f6...", # ⚠️ COPY THIS NOW!
  "key_id": "uuid-here",
  "name": "My First API Key",
  "warning": "Save this key securely. It will not be shown again!"
}
```

**⚠️ CRITICAL:** Save the API key somewhere safe! You'll need it for n8n!

---

### **STEP 5: Test Action Endpoint**

```bash
# Test with your new API Key:
curl 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions' \
  -H 'X-API-Key: browo_a1b2c3d4e5f6...'

# Should return all 186+ actions:
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
  "modules": ["Antragmanager", "Personalakte", "Dokumente", ...]
}
```

---

### **STEP 6: Test Actual Proxy Call**

```bash
# Example: Get all leave requests
curl 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions/antragmanager/leave-requests' \
  -H 'X-API-Key: browo_a1b2c3d4e5f6...'

# Should proxy to Antragmanager Edge Function and return data!
```

---

## ✅ **VERIFICATION CHECKLIST**

After deployment, verify:

| Check | Command | Expected |
|-------|---------|----------|
| **Health** | `curl .../automation/health` | `{"status": "healthy"}` |
| **Schema** | `curl .../automation/schema` | OpenAPI 3.0 JSON |
| **Actions** | `curl .../automation/actions` + API Key | 186+ actions |
| **Proxy** | `curl .../automation/actions/antragmanager/leave-requests` + API Key | Leave requests data |
| **Audit Log** | Check via API or DB | Log entry created |

---

## 🔍 **TROUBLESHOOTING**

### **Problem: 401 Invalid API Key**

**Solution:**
1. Check API Key is correct (copy-paste error?)
2. Check header name is `X-API-Key` (case-sensitive!)
3. Verify API Key in database:
   ```sql
   SELECT * FROM automation_api_keys WHERE is_active = true;
   ```

---

### **Problem: 404 Unknown module**

**Solution:**
- Check module name in URL (lowercase!)
- Valid modules: `antragmanager`, `personalakte`, `dokumente`, `lernen`, `benefits`, `zeiterfassung`, `kalender`, `organigram`, `chat`, `analytics`, `notification`, `tasks`, `field`

---

### **Problem: 500 Proxy Error**

**Solution:**
1. Check target Edge Function is deployed:
   ```bash
   npx supabase functions list
   ```
2. Check Edge Function logs in Supabase Dashboard
3. Verify route exists in target function

---

### **Problem: "Only HR/Superadmin can generate API keys"**

**Solution:**
- Your user must have role `hr` or `superadmin`
- Check in database:
  ```sql
  SELECT id, email, role FROM users WHERE id = auth.uid();
  ```
- Update if needed:
  ```sql
  UPDATE users SET role = 'hr' WHERE id = 'your-user-id';
  ```

---

## 📊 **POST-DEPLOYMENT**

### **Monitor Audit Logs:**

```sql
-- See all automation calls:
SELECT 
  al.*,
  ak.name as api_key_name
FROM automation_audit_log al
JOIN automation_api_keys ak ON al.api_key_id = ak.id
ORDER BY al.created_at DESC
LIMIT 50;
```

### **Monitor API Key Usage:**

```sql
-- See which keys are being used:
SELECT 
  name,
  is_active,
  created_at,
  last_used_at,
  (SELECT COUNT(*) FROM automation_audit_log WHERE api_key_id = automation_api_keys.id) as total_calls,
  (SELECT COUNT(*) FROM automation_audit_log WHERE api_key_id = automation_api_keys.id AND success = true) as successful_calls
FROM automation_api_keys
ORDER BY last_used_at DESC NULLS LAST;
```

---

## 🎯 **NEXT STEPS**

1. ✅ **Setup n8n:**
   - Read `/N8N_INTEGRATION_COMPLETE_GUIDE.md`
   - Configure HTTP Request Node with API Key
   - Test simple workflow

2. ✅ **Create Workflows:**
   - Daily leave request reminders
   - New employee onboarding
   - Document backups
   - Achievement awards

3. ✅ **Monitor:**
   - Check audit logs regularly
   - Monitor API key usage
   - Watch for failed calls

4. 🔮 **Future: Webhooks**
   - Implement event triggers
   - Push-based automation
   - Real-time notifications to n8n

---

## 📚 **ARCHITECTURE SUMMARY**

```
┌─────────────────────────────────────────────────┐
│  Browo Koordinator (186+ API Routes)           │
│  ├── Antragmanager (Leave)                     │
│  ├── Personalakte (Employees)                  │
│  ├── Dokumente (Documents)                     │
│  ├── Lernen (Learning)                         │
│  ├── Benefits (Coins & Shop)                   │
│  ├── Zeiterfassung (Time Tracking)             │
│  ├── Kalender (Calendar)                       │
│  ├── Organigram (Org Chart)                    │
│  ├── Chat (Messaging)                          │
│  ├── Analytics (Statistics)                    │
│  ├── Notification (Notifications)              │
│  ├── Tasks (Task Management)                   │
│  └── Field (Equipment & Vehicles)              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  14. BrowoKoordinator-Automation                │
│  ├── OpenAPI Schema Generator                   │
│  ├── Runtime Route Discovery                    │
│  ├── Action Proxy (to all 13 functions)        │
│  ├── API Key Authentication                     │
│  ├── Webhook Management                         │
│  └── Audit Logging                              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  n8n Workflow Automation                        │
│  ├── HTTP Request Nodes                         │
│  ├── Webhook Triggers (future)                  │
│  ├── Schedule Triggers                          │
│  └── 186+ Actions Available                     │
└─────────────────────────────────────────────────┘
```

---

## 🎉 **DEPLOYMENT COMPLETE!**

You now have:
- ✅ 14th Edge Function deployed
- ✅ 186+ Automation Actions available
- ✅ OpenAPI 3.0 Schema
- ✅ API Key System
- ✅ Webhook Infrastructure (ready for future)
- ✅ Audit Logging
- ✅ n8n Integration ready

**Auto-Discovery is LIVE:** New features added to any Edge Function will automatically appear in the automation API! 🚀

---

**Next:** Read `/N8N_INTEGRATION_COMPLETE_GUIDE.md` for n8n setup! 📖
