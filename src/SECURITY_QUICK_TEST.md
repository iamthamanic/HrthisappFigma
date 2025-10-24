# 🔒 Security Quick Test Guide

**Phase 4 - Priority 1 Complete!**  
**Test your security implementation in 5 minutes**

---

## 🚀 **Quick Start:**

### **1. Start the App**

```bash
npm run dev
```

---

### **2. Open Browser Console**

Open your browser DevTools (F12) → Console tab

---

### **3. Run Security Tests**

```javascript
// Load the security test utility (already loaded automatically)

// Run all tests
securityTest.runAll();

// Or run individual tests:
securityTest.testCSP();
securityTest.testSecurityHeaders();
securityTest.testHTTPS();
securityTest.getScore();
```

---

## ✅ **Expected Results:**

### **1. CSP Test:**
```
🔒 Testing Content Security Policy...

✅ CSP Meta Tag Found
Content: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
```

### **2. Security Headers Test:**
```
🛡️ Testing Security Headers...

✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
```

### **3. Security Score:**
```
🔒 SECURITY SCORE: 6/7 (85%)
✅ EXCELLENT - Your app is well secured!
```

---

## 🧪 **Manual Checks:**

### **1. Check CSP Meta Tag**

**In Browser DevTools:**
```javascript
// Elements tab → <head> section
// Should see:
<meta http-equiv="Content-Security-Policy" content="...">
```

### **2. Check for CSP Violations**

**In Console:**
- Look for messages like: "Refused to load..."
- **If you see violations:** They're being blocked by CSP (good!)
- **If no violations:** Everything is allowed (also good!)

### **3. Check Network Tab**

**In DevTools → Network:**
- All requests should succeed
- Supabase requests should work
- No CORS errors

### **4. Check Console for Errors**

**Look for:**
- ❌ "Blocked by CSP" → Expected if testing XSS
- ❌ "CORS policy" → Should NOT appear
- ❌ "Mixed Content" → Should NOT appear

---

## 🎯 **What Should Work:**

### **✅ These Should Work:**
- ✅ App loads normally
- ✅ Login/Register
- ✅ Supabase API calls
- ✅ Image loading
- ✅ Font loading (Google Fonts)
- ✅ YouTube embeds (if any)
- ✅ All navigation

### **❌ These Should Be Blocked:**
- ❌ Loading scripts from unknown domains
- ❌ Embedding app in iframe
- ❌ MIME type confusion
- ❌ Unauthorized CORS requests

---

## 🔍 **Detailed Test Commands:**

### **1. Test CSP:**
```javascript
securityTest.testCSP();
```

**Expected Output:**
```
✅ CSP Meta Tag Found
```

---

### **2. Test Security Headers:**
```javascript
securityTest.testSecurityHeaders();
```

**Expected Output:**
```
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
```

---

### **3. Test HTTPS:**
```javascript
securityTest.testHTTPS();
```

**Expected Output (Development):**
```
⚠️ Not using HTTPS (OK for local development)
Current protocol: http:
```

**Expected Output (Production):**
```
✅ HTTPS Enabled
```

---

### **4. Test Third-Party Resources:**
```javascript
securityTest.testThirdPartyResources();
```

**Expected Output:**
```
Inline Scripts: 1-3
External Scripts: 5-10
```

---

### **5. Test Local Storage:**
```javascript
securityTest.testLocalStorage();
```

**Expected Output:**
```
✅ No obvious sensitive data in localStorage
```

---

### **6. Get Security Score:**
```javascript
securityTest.getScore();
```

**Expected Output:**
```
🔒 SECURITY SCORE: 6/7 (85%)
✅ EXCELLENT - Your app is well secured!
```

**Score Breakdown:**
- Development: 6/7 (85%) - Excellent
- Production (with HTTPS): 7/7 (100%) - Perfect

---

## 🚨 **Troubleshooting:**

### **Problem: CSP Not Found**

**Check:**
1. `vite.config.ts` has CSP plugin imported
2. App restarted after adding plugin
3. Check `<head>` in browser DevTools

**Fix:**
```bash
# Restart dev server
npm run dev
```

---

### **Problem: Security Headers Not Applied**

**Check:**
1. `App.tsx` calls `applySecurityHeaders()`
2. Import is correct
3. Function runs on startup

**Fix:**
```typescript
// In App.tsx
import { applySecurityHeaders } from './utils/security/HRTHIS_securityHeaders';

useEffect(() => {
  applySecurityHeaders(); // ✅ Make sure this runs
  initialize();
}, [initialize]);
```

---

### **Problem: CORS Errors**

**Check:**
1. Backend is running
2. Frontend origin is whitelisted
3. No typos in origin URLs

**Fix:**
```typescript
// In /supabase/functions/server/index.tsx
const allowedOrigins = [
  'http://localhost:5173', // ✅ Match your dev server port
  'http://localhost:3000',
];
```

---

### **Problem: Low Security Score**

**Common Reasons:**
- Not using HTTPS (OK in dev)
- Too many inline scripts
- Sensitive data in localStorage

**Check:**
```javascript
// See detailed results:
securityTest.runAll();
```

---

## 📊 **Security Score Explained:**

### **Score Components (7 points):**

1. **CSP Meta Tag** (1 point)
   - ✅ Present = 1 point
   - ❌ Missing = 0 points

2. **X-Frame-Options** (1 point)
   - ✅ Present = 1 point
   - ❌ Missing = 0 points

3. **X-Content-Type-Options** (1 point)
   - ✅ Present = 1 point
   - ❌ Missing = 0 points

4. **HTTPS** (1 point)
   - ✅ Enabled = 1 point
   - ❌ Disabled = 0 points (OK in dev)

5. **No Sensitive Data in localStorage** (1 point)
   - ✅ Clean = 1 point
   - ❌ Has passwords/tokens = 0 points

6. **Limited Inline Scripts** (1 point)
   - ✅ < 5 scripts = 1 point
   - ❌ ≥ 5 scripts = 0 points

7. **Production Mode** (1 point)
   - ✅ Production = 1 point
   - ❌ Development = 0 points

### **Score Interpretation:**

- **100% (7/7):** Perfect! Production ready
- **85% (6/7):** Excellent! (typical for dev)
- **70% (5/7):** Good, but improvements needed
- **< 70%:** Action required

---

## ✅ **Quick Checklist:**

- [ ] App starts without errors
- [ ] `securityTest.runAll()` completes
- [ ] Security score ≥ 85%
- [ ] No CORS errors
- [ ] All features work normally
- [ ] CSP meta tag present
- [ ] Security headers present

---

## 🎉 **If All Tests Pass:**

**You're done! Security headers are working!** 🔒

**Next Step:** Move to Priority 2 - Input Validation & Sanitization

---

## 📞 **Need Help?**

If tests fail or you see errors:

1. Check this guide's troubleshooting section
2. Restart dev server
3. Clear browser cache
4. Check browser console for specific errors

---

**Created:** 2025-01-10  
**Phase:** 4 - Security & Resilience  
**Priority:** 1 - Security Headers & CSP  
**Status:** ✅ COMPLETE
