# 🔧 **CHAT EDGE FUNCTION - 404 FIX**

**Problem:** Health Check zeigt 404 Error  
**Status:** Edge Function IS deployed! ✅  
**Issue:** Wrong path in health check  
**Datum:** 27. Oktober 2025

---

## ❌ **PROBLEM**

```bash
GET /BrowoKoordinator-Chat/health → 404 Not Found
```

**Supabase Logs:**
```
--> GET /BrowoKoordinator-Chat/health 404 2ms
<-- GET /BrowoKoordinator-Chat/health
```

---

## ✅ **LÖSUNG**

Die Edge Function **IST deployed und läuft**! Der Health Check verwendet nur den **falschen Path**.

### **Korrekte URL:**

```
https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Chat/health
```

**WICHTIG:** Die Edge Function fügt **automatisch** den Prefix `/BrowoKoordinator-Chat` hinzu!

Der **interne Route** ist `/health` (in der index.ts)  
Der **externe URL** ist `/BrowoKoordinator-Chat/health`

---

## 🧪 **HEALTH CHECK - KORREKT TESTEN**

### **Option 1: Browser**
```
https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Chat/health
```

### **Option 2: cURL**
```bash
curl -X GET \
  'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Chat/health' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzOTEsImV4cCI6MjA3NDk2MDM5MX0.bls9aJ-M1Wi-387R9mveOuiQCkmVPjTc6IntZjM1YMk'
```

### **Option 3: Fetch (Browser Console)**
```javascript
fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Chat/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzOTEsImV4cCI6MjA3NDk2MDM5MX0.bls9aJ-M1Wi-387R9mveOuiQCkmVPjTc6IntZjM1YMk'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Chat Health:', d))
.catch(e => console.error('❌ Error:', e));
```

**Expected Response:**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Chat",
  "timestamp": "2025-10-27T...",
  "version": "1.0.0"
}
```

---

## 📋 **DATABASE MIGRATION**

Du musst noch die Migration **065_chat_system_complete.sql** ausführen!

### **Migration Status:**
```
✅ 064_add_missing_user_address_columns.sql (deployed)
❌ 065_chat_system_complete.sql (NOT deployed yet!)
```

### **Run Migration NOW:**

1. **Öffne Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/azmtojgikubegzusvhra/editor
   ```

2. **Go to SQL Editor**

3. **Copy & Paste diese Migration:**

<function_calls>
<invoke name="view_tool">
<parameter name="path">/supabase/migrations/065_chat_system_complete.sql