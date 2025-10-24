# 🧪 Test User Creation - Console Test

**COPY & PASTE in Browser Console (F12)**

---

## ✅ **TEST 1: Health Check**

```javascript
fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/make-server-f659121d/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzOTEsImV4cCI6MjA3NDk2MDM5MX0.bls9aJ-M1Wi-387R9mveOuiQCkmVPjTc6IntZjM1YMk'
  }
})
  .then(r => r.json())
  .then(d => console.log('✅ Health Check:', d))
  .catch(e => console.error('❌ Error:', e));
```

**Expected:** `{status: "ok"}`

---

## ✅ **TEST 2: User Creation**

```javascript
fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/make-server-f659121d/users/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzOTEsImV4cCI6MjA3NDk2MDM5MX0.bls9aJ-M1Wi-387R9mveOuiQCkmVPjTc6IntZjM1YMk'
  },
  body: JSON.stringify({
    email: 'console-test@example.com',
    password: 'Test1234!',
    userData: {
      first_name: 'Console',
      last_name: 'Test',
      role: 'USER'
    }
  })
})
  .then(async r => {
    console.log('Status:', r.status);
    const text = await r.text();
    console.log('Response Text:', text);
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  })
  .then(d => console.log('✅ Result:', d))
  .catch(e => console.error('❌ Error:', e));
```

---

## 📋 **Possible Results:**

### ✅ **SUCCESS:**
```json
{
  "success": true,
  "user": {...},
  "message": "User created successfully"
}
```

### ❌ **400 - Bad Request:**
```json
{
  "error": "Email and password are required"
}
```

### ❌ **500 - Server Error:**
```json
{
  "error": "Auth creation error",
  "details": "..."
}
```

### ❌ **Network Error (CORS):**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

### ❌ **Failed to fetch:**
```
TypeError: Failed to fetch
```

---

## 🚀 **What to do:**

1. **Open Browser Console:** F12
2. **Paste TEST 1** → Check if health endpoint works
3. **If health works:** Paste TEST 2 → Check if user creation works
4. **Screenshot the results and send to Claude**

---

**Created:** 2025-01-10
