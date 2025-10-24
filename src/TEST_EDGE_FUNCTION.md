# 🧪 Edge Function Test Guide

**Status:** ✅ Enhanced Error Logging  
**Datum:** 2025-01-10  
**Problem:** "Failed to fetch" beim User-Erstellen

---

## 🔍 **SCHRITT 1: Health Check im Browser**

### **Console Code:**
```javascript
// Test Health Endpoint
fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/make-server-f659121d/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzOTEsImV4cCI6MjA3NDk2MDM5MX0.bls9aJ-M1Wi-387R9mveOuiQCkmVPjTc6IntZjM1YMk'
  }
})
  .then(r => r.json())
  .then(d => console.log('✅ Health Check:', d))
  .catch(e => console.error('❌ Error:', e));
```

**Erwartetes Ergebnis:**
```json
{"status":"ok"}
```

**Falls Error:**
- Screenshot machen
- Error-Message kopieren
- An Claude senden

---

## 🔍 **SCHRITT 2: Test User Creation Endpoint**

### **Console Code:**
```javascript
// Test User Creation Endpoint
fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/make-server-f659121d/users/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzOTEsImV4cCI6MjA3NDk2MDM5MX0.bls9aJ-M1Wi-387R9mveOuiQCkmVPjTc6IntZjM1YMk'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test1234!',
    userData: {
      first_name: 'Test',
      last_name: 'User',
      role: 'USER'
    }
  })
})
  .then(async r => {
    console.log('Status:', r.status);
    const text = await r.text();
    console.log('Response:', text);
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  })
  .then(d => console.log('✅ Result:', d))
  .catch(e => console.error('❌ Error:', e));
```

**Mögliche Ergebnisse:**

### ✅ **SUCCESS:**
```json
{
  "success": true,
  "user": { ... },
  "message": "User created successfully"
}
```

### ❌ **400 - Bad Request:**
```json
{
  "error": "Email and password are required"
}
```

### ❌ **401 - Unauthorized:**
```json
{
  "code": 401,
  "message": "Missing authorization header"
}
```

### ❌ **500 - Server Error:**
```json
{
  "error": "Auth creation error: ...",
  "details": "..."
}
```

---

## 🐛 **SCHRITT 3: Debug mit Enhanced Logging**

**Neue Logs in `HRTHIS_adminStore.ts`:**

```typescript
console.log('🌐 Request URL:', url);
console.log('🔑 Using auth token:', publicAnonKey.substring(0, 20) + '...');
console.log('📡 Response status:', response.status);
console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
console.log('❌ Full error details:', {
  status: response.status,
  statusText: response.statusText,
  url,
  errorText
});
```

**Wie debuggen:**

1. **Preview starten in Figma Make**
2. **F12 → Console öffnen**
3. **Als SUPERADMIN einloggen**
4. **Admin → Team Management → Neuer Mitarbeiter**
5. **Form ausfüllen und "Mitarbeiter erstellen" klicken**
6. **Console Logs anschauen**

**Was suchen:**
- ✅ Request URL korrekt?
- ✅ Auth Token vorhanden?
- ❌ Response Status 401/403/500?
- ❌ CORS Error?
- ❌ Network Error?

---

## 🔧 **MÖGLICHE FEHLERQUELLEN:**

### **1. Edge Function nicht deployed**
```bash
# Check in Supabase Dashboard:
# Functions → make-server-f659121d → Status: DEPLOYED?
```

### **2. CORS Fehler**
```javascript
// Error in Console:
"Access to fetch at '...' from origin '...' has been blocked by CORS policy"
```

**Fix:** Edge Function CORS Config checken (Zeile 73-108 in `/supabase/functions/server/index.tsx`)

### **3. Authorization Header falsch**
```javascript
// Check in Console:
console.log('🔑 Auth token:', publicAnonKey);
```

**Fix:** `publicAnonKey` aus `/utils/supabase/info.tsx` verwenden

### **4. Supabase Project URL falsch**
```javascript
// Check projectId:
console.log('📍 Project ID:', projectId);
// Should be: azmtojgikubegzusvhra
```

**Fix:** `projectId` aus `/utils/supabase/info.tsx` verwenden

### **5. Edge Function Timeout**
```javascript
// Error:
"Die Anfrage hat zu lange gedauert (Timeout)"
```

**Fix:** Timeout von 30s ist bereits gesetzt, evtl. Netzwerkproblem

---

## 📋 **QUICK FIX CHECKLIST:**

- [ ] ✅ Health Endpoint testen (SCHRITT 1)
- [ ] ✅ User Creation Endpoint testen (SCHRITT 2)
- [ ] ✅ Browser Console Logs checken
- [ ] ✅ Supabase Dashboard: Edge Function Status
- [ ] ✅ Network Tab: Request/Response details
- [ ] ✅ Hard Refresh Browser (`Ctrl + Shift + R`)

---

## 🚀 **NEXT STEPS:**

**Falls Health Check funktioniert:**
→ Problem liegt im User Creation Code (Backend oder Frontend)

**Falls Health Check NICHT funktioniert:**
→ Edge Function nicht erreichbar (Deployment, Network, CORS)

**Falls beide fehlschlagen:**
→ Grundlegendes Supabase/Network Problem

---

**Erstellt:** 2025-01-10  
**Letzte Änderung:** 2025-01-10  
**Bezug:** FAILED_TO_FETCH_FIX.md
