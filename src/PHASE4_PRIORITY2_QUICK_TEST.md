# 🧪 Phase 4 - Priority 2 - Quick Test Guide

**Test your input sanitization in 5 minutes!**

---

## 🚀 **START THE APP:**

```bash
npm run dev
```

---

## ✅ **TEST 1: LOGIN WITH VALID EMAIL**

### **Steps:**
1. Go to http://localhost:5173/login
2. Enter:
   - Email: `test@example.com`
   - Password: `your-password`
3. Click "Anmelden"

### **Expected Result:**
- ✅ Login works normally
- ✅ No errors
- ✅ Redirects to dashboard

---

## ❌ **TEST 2: LOGIN WITH XSS IN EMAIL**

### **Steps:**
1. Go to http://localhost:5173/login
2. Enter:
   - Email: `<script>alert('xss')</script>@test.com`
   - Password: `test123`
3. Click "Anmelden"

### **Expected Result:**
- ❌ Error: "Ungültige E-Mail-Adresse"
- ✅ XSS blocked
- ✅ No script execution

---

## ❌ **TEST 3: LOGIN WITH INVALID EMAIL**

### **Steps:**
1. Go to http://localhost:5173/login
2. Enter:
   - Email: `not-an-email`
   - Password: `test123`
3. Click "Anmelden"

### **Expected Result:**
- ❌ Error: "Ungültige E-Mail-Adresse"
- ✅ Invalid format rejected

---

## ✅ **TEST 4: REGISTER WITH VALID DATA**

### **Steps:**
1. Go to http://localhost:5173/login
2. Click "Jetzt registrieren"
3. Enter:
   - Email: `newuser@example.com`
   - First Name: `Max`
   - Last Name: `Mustermann`
   - Password: `test123456`
   - Confirm Password: `test123456`
4. Click "Registrieren"

### **Expected Result:**
- ✅ Registration works
- ✅ User created
- ✅ Auto-login

---

## ❌ **TEST 5: REGISTER WITH XSS IN NAME**

### **Steps:**
1. Go to Register page
2. Enter:
   - Email: `test2@example.com`
   - First Name: `<script>alert('xss')</script>`
   - Last Name: `Test`
   - Password: `test123456`
   - Confirm Password: `test123456`
3. Click "Registrieren"

### **Expected Result:**
- ✅ Registration works BUT name is sanitized
- ✅ XSS tags removed
- ✅ No script execution
- ✅ First name stored as empty or "scriptalertxssscript"

---

## 🔍 **BROWSER CONSOLE TESTS:**

### **Test Sanitization Functions:**

Open browser console (F12) and run:

#### **1. Test Email Sanitization:**
```javascript
// Assuming sanitize is globally available or import it
import('http://localhost:5173/utils/security/HRTHIS_sanitization.js').then(module => {
  const sanitize = module.default;
  
  // Test 1: Valid email
  console.log(sanitize.email('test@example.com'));
  // Expected: "test@example.com"
  
  // Test 2: Invalid email
  console.log(sanitize.email('not-an-email'));
  // Expected: ""
  
  // Test 3: XSS in email
  console.log(sanitize.email('<script>alert("xss")</script>@test.com'));
  // Expected: ""
  
  // Test 4: Case normalization
  console.log(sanitize.email('TEST@EXAMPLE.COM'));
  // Expected: "test@example.com"
});
```

#### **2. Test Text Sanitization:**
```javascript
import('http://localhost:5173/utils/security/HRTHIS_sanitization.js').then(module => {
  const sanitize = module.default;
  
  // Test 1: Normal text
  console.log(sanitize.text('Hello World'));
  // Expected: "Hello World"
  
  // Test 2: XSS attack
  console.log(sanitize.text('<script>alert("xss")</script>Hello'));
  // Expected: "Hello"
  
  // Test 3: HTML tags
  console.log(sanitize.text('<b>Bold</b> text'));
  // Expected: "Bold text"
  
  // Test 4: Multiple spaces
  console.log(sanitize.text('  Too   many   spaces  '));
  // Expected: "Too   many   spaces"
});
```

#### **3. Test Search Query Sanitization:**
```javascript
import('http://localhost:5173/utils/security/HRTHIS_sanitization.js').then(module => {
  const sanitize = module.default;
  
  // Test 1: Normal search
  console.log(sanitize.searchQuery('john doe'));
  // Expected: "john doe"
  
  // Test 2: XSS in search
  console.log(sanitize.searchQuery('<script>alert("xss")</script>'));
  // Expected: "scriptalertxssscript" or empty
  
  // Test 3: SQL injection attempt
  console.log(sanitize.searchQuery("'; DROP TABLE users--"));
  // Expected: " DROP TABLE users" (quotes removed)
  
  // Test 4: Long query
  console.log(sanitize.searchQuery('a'.repeat(200)));
  // Expected: First 100 chars only
});
```

---

## 📊 **EXPECTED RESULTS SUMMARY:**

| Test | Input | Expected Output | Status |
|------|-------|----------------|--------|
| Valid Email | test@example.com | Works | ✅ |
| XSS Email | `<script>` | Blocked | ✅ |
| Invalid Email | not-an-email | Blocked | ✅ |
| Valid Register | Normal data | Success | ✅ |
| XSS Name | `<script>` | Sanitized | ✅ |

---

## 🚨 **TROUBLESHOOTING:**

### **Problem: Module import fails**
**Solution:** 
- Open DevTools
- Go to Sources tab
- Find `/utils/security/HRTHIS_sanitization.ts`
- Verify file exists
- Check console for import errors

### **Problem: Sanitization not working**
**Check:**
1. File `/utils/security/HRTHIS_sanitization.ts` exists
2. Import in component is correct
3. Function is called before submit
4. Console shows sanitized values

### **Problem: Valid emails rejected**
**Check:**
1. Email format is correct (must have `@` and `.`)
2. No extra spaces
3. Check console for exact error

---

## ✅ **CHECKLIST:**

After testing, verify:

- [ ] Valid emails work in login
- [ ] Invalid emails are rejected
- [ ] XSS attempts are blocked
- [ ] Registration works with valid data
- [ ] XSS in names is sanitized
- [ ] No console errors
- [ ] App doesn't crash

---

## 🎯 **NEXT STEPS:**

### **If all tests pass:**
✅ **Priority 2 is working!**

Continue integration with:
- RequestLeaveDialog
- DocumentUploadDialog
- AddEmployeeScreen

### **If tests fail:**
❌ **Debug the issue:**

1. Check browser console for errors
2. Verify imports are correct
3. Check that sanitization functions exist
4. Review code changes

---

## 💡 **QUICK DEBUG COMMANDS:**

```javascript
// Check if sanitize is imported
console.log(typeof sanitize);
// Expected: "object"

// Check available functions
console.log(Object.keys(sanitize));
// Expected: ["html", "text", "email", "url", ...]

// Test a simple sanitization
console.log(sanitize.text('test'));
// Expected: "test"
```

---

**Created:** 2025-01-10  
**Phase:** 4 - Security & Resilience  
**Priority:** 2 - Input Validation & Sanitization  
**Status:** 🧪 Testing Guide
