# 🛡️ PHASE 4 - PRIORITY 2 - INPUT VALIDATION & SANITIZATION
## INTEGRATION GUIDE

**Status:** 🚀 Ready to Integrate  
**Files Created:** `/utils/security/HRTHIS_sanitization.ts`, `/utils/security/HRTHIS_validation.ts`  
**Time Estimate:** 12 hours

---

## 📋 **INTEGRATION CHECKLIST:**

### **✅ Level 1 - Critical (4 hours)**
- [ ] Auth Forms (Login, Register)
- [ ] User Creation (Admin)
- [ ] Password Reset
- [ ] Profile Updates

### **✅ Level 2 - High Priority (4 hours)**
- [ ] Leave Requests
- [ ] Document Upload
- [ ] Team Management
- [ ] User Service

### **✅ Level 3 - Medium Priority (4 hours)**
- [ ] Learning Content
- [ ] Settings Forms
- [ ] Search Queries
- [ ] Other Forms

---

## 🎯 **QUICK START:**

### **1. Import the Utilities**

```typescript
// In any component or service:
import sanitize from '../utils/security/HRTHIS_sanitization';
import validators from '../utils/security/HRTHIS_validation';
```

---

### **2. Sanitize Form Inputs**

```typescript
// Example: Login Form
const handleLogin = async (email: string, password: string) => {
  // ✅ SANITIZE INPUTS
  const sanitizedEmail = sanitize.email(email);
  
  if (!sanitizedEmail) {
    toast.error('Ungültige E-Mail-Adresse');
    return;
  }
  
  // Continue with login...
  await authService.signIn(sanitizedEmail, password);
};
```

---

### **3. Validate with Zod + Sanitization**

```typescript
// Example: User Creation Form
const UserCreateSchema = z.object({
  email: validators.email,
  first_name: validators.name,
  last_name: validators.name,
  password: validators.simplePassword,
});

// In form submission:
const result = await validators.validateForm(UserCreateSchema, formData);

if (!result.success) {
  // Show errors
  setErrors(result.errors);
  return;
}

// Use sanitized & validated data
await createUser(result.data);
```

---

### **4. Sanitize in Services**

```typescript
// Example: UserService.updateUser()
async updateUser(userId: string, data: UpdateUserData) {
  // ✅ SANITIZE ALL TEXT FIELDS
  const sanitizedData = {
    ...data,
    first_name: data.first_name ? sanitize.text(data.first_name) : undefined,
    last_name: data.last_name ? sanitize.text(data.last_name) : undefined,
    email: data.email ? sanitize.email(data.email) : undefined,
    position: data.position ? sanitize.text(data.position) : undefined,
  };
  
  // Continue with update...
}
```

---

## 📝 **DETAILED INTEGRATION STEPS:**

---

## **STEP 1: AUTH FORMS (Critical - 1.5 hours)**

### **1.1 - Update Login Component**

**File:** `/components/Login.tsx`

**Add Sanitization:**

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';

// In handleLogin function:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // ✅ SANITIZE EMAIL
    const sanitizedEmail = sanitize.email(email);
    
    if (!sanitizedEmail) {
      setError('Ungültige E-Mail-Adresse');
      setLoading(false);
      return;
    }

    // Check rate limit (already implemented in Priority 1)
    if (!loginRateLimiter.isAllowed(sanitizedEmail)) {
      const blockedTime = loginRateLimiter.getBlockedTime(sanitizedEmail);
      const minutes = Math.ceil(blockedTime / 60000);
      setError(`Zu viele Anmeldeversuche. Bitte warten Sie ${minutes} Minuten.`);
      setLoading(false);
      return;
    }

    // Use sanitized email
    const services = getServices();
    const user = await services.auth.signIn(sanitizedEmail, password);

    // Reset rate limit on success
    loginRateLimiter.reset(sanitizedEmail);

    toast.success('Erfolgreich angemeldet!');
    navigate('/dashboard');
  } catch (err: any) {
    // Record failed attempt
    if (email) {
      const sanitizedEmail = sanitize.email(email);
      if (sanitizedEmail) {
        loginRateLimiter.recordAttempt(sanitizedEmail);
        
        const remaining = loginRateLimiter.getRemainingAttempts(sanitizedEmail);
        if (remaining > 0) {
          setError(`Anmeldung fehlgeschlagen. ${remaining} Versuche übrig.`);
        } else {
          setError('Konto temporär gesperrt. Bitte später erneut versuchen.');
        }
      }
    }
  } finally {
    setLoading(false);
  }
};
```

---

### **1.2 - Update Register Component**

**File:** `/components/Register.tsx`

**Add Validation Schema:**

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';
import validators from '../utils/security/HRTHIS_validation';
import { z } from 'zod';

// Define registration schema
const RegisterSchema = z.object({
  first_name: validators.name,
  last_name: validators.name,
  email: validators.email,
  password: validators.password,
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirm_password'],
});

// In handleRegister:
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // ✅ VALIDATE & SANITIZE
    const formData = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      confirm_password: confirmPassword,
    };

    const result = await validators.validateForm(RegisterSchema, formData);

    if (!result.success) {
      // Show first error
      const firstError = Object.values(result.errors)[0];
      setError(firstError);
      setLoading(false);
      return;
    }

    // Use validated & sanitized data
    const services = getServices();
    await services.auth.signUp(
      result.data.email,
      result.data.password,
      {
        first_name: result.data.first_name,
        last_name: result.data.last_name,
      }
    );

    toast.success('Konto erfolgreich erstellt!');
    navigate('/dashboard');
  } catch (err: any) {
    setError(err.message || 'Registrierung fehlgeschlagen');
  } finally {
    setLoading(false);
  }
};
```

---

### **1.3 - Update Forgot Password**

**File:** `/components/ForgotPassword.tsx`

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';

const handleResetRequest = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // ✅ SANITIZE EMAIL
    const sanitizedEmail = sanitize.email(email);
    
    if (!sanitizedEmail) {
      setError('Ungültige E-Mail-Adresse');
      setLoading(false);
      return;
    }

    // Send reset email
    const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail);

    if (error) throw error;

    setSuccess(true);
  } catch (err: any) {
    setError(err.message || 'Fehler beim Senden der E-Mail');
  } finally {
    setLoading(false);
  }
};
```

---

## **STEP 2: USER SERVICE (Critical - 1.5 hours)**

### **2.1 - Update UserService**

**File:** `/services/HRTHIS_userService.ts`

**Add imports:**

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';
import { UserUpdateInputSchema } from '../types/schemas/HRTHIS_userSchemas';
```

**Update methods:**

```typescript
/**
 * Update user
 */
async updateUser(userId: string, updates: UpdateUserData): Promise<User> {
  this.logRequest('updateUser', 'UserService', { userId, updates });

  try {
    // ✅ VALIDATE WITH ZOD
    const validatedUpdates = UserUpdateInputSchema.parse(updates);

    // ✅ SANITIZE TEXT FIELDS
    const sanitizedUpdates: any = { ...validatedUpdates };
    
    if (sanitizedUpdates.first_name) {
      sanitizedUpdates.first_name = sanitize.text(sanitizedUpdates.first_name);
    }
    
    if (sanitizedUpdates.last_name) {
      sanitizedUpdates.last_name = sanitize.text(sanitizedUpdates.last_name);
    }
    
    if (sanitizedUpdates.email) {
      sanitizedUpdates.email = sanitize.email(sanitizedUpdates.email);
    }
    
    if (sanitizedUpdates.position) {
      sanitizedUpdates.position = sanitize.text(sanitizedUpdates.position);
    }

    // Continue with update...
    const { data, error } = await this.supabase
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    this.logResponse('UserService.updateUser', { userId });
    return data as User;
  } catch (error: any) {
    this.handleError(error, 'UserService.updateUser');
  }
}

/**
 * Search users
 */
async searchUsers(query: string): Promise<User[]> {
  this.logRequest('searchUsers', 'UserService', { query });

  try {
    // ✅ SANITIZE SEARCH QUERY
    const sanitizedQuery = sanitize.searchQuery(query);

    if (!sanitizedQuery) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .or(`first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
      .limit(50);

    if (error) throw error;

    return data as User[];
  } catch (error: any) {
    this.handleError(error, 'UserService.searchUsers');
  }
}
```

---

## **STEP 3: LEAVE REQUESTS (High - 2 hours)**

### **3.1 - Update RequestLeaveDialog**

**File:** `/components/RequestLeaveDialog.tsx`

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';
import validators from '../utils/security/HRTHIS_validation';
import { z } from 'zod';

// Leave request schema
const LeaveRequestSchema = z.object({
  start_date: validators.date,
  end_date: validators.date,
  leave_type: z.enum(['VACATION', 'SICK', 'UNPAID', 'OTHER']),
  notes: validators.multiline({ max: 500, required: false }),
});

const handleSubmit = async () => {
  setErrors({});
  setSubmitting(true);

  try {
    // ✅ VALIDATE & SANITIZE
    const formData = {
      start_date: startDate,
      end_date: endDate,
      leave_type: leaveType,
      notes: notes || '',
    };

    const result = await validators.validateForm(LeaveRequestSchema, formData);

    if (!result.success) {
      setErrors(result.errors);
      setSubmitting(false);
      return;
    }

    // Validate dates
    if (new Date(result.data.end_date) < new Date(result.data.start_date)) {
      setErrors({ end_date: 'Enddatum muss nach Startdatum liegen' });
      setSubmitting(false);
      return;
    }

    // Submit request
    const services = getServices();
    await services.leave.createLeaveRequest({
      user_id: userId,
      ...result.data,
    });

    toast.success('Urlaubsantrag erfolgreich eingereicht!');
    onClose();
    onSuccess?.();
  } catch (error: any) {
    toast.error(error.message || 'Fehler beim Erstellen des Antrags');
  } finally {
    setSubmitting(false);
  }
};
```

---

## **STEP 4: DOCUMENT UPLOAD (High - 1.5 hours)**

### **4.1 - Update Document Upload Dialog**

**File:** `/components/HRTHIS_DocumentUploadDialog.tsx`

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';

const handleUpload = async () => {
  if (!selectedFile) return;

  setUploading(true);

  try {
    // ✅ VALIDATE FILE
    const validation = sanitize.fileUpload(selectedFile, {
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'],
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    if (!validation.valid) {
      toast.error(validation.error || 'Ungültige Datei');
      setUploading(false);
      return;
    }

    // ✅ SANITIZE METADATA
    const sanitizedTitle = sanitize.text(title);
    const sanitizedDescription = sanitize.multiline(description);
    const sanitizedFilename = validation.sanitizedName;

    if (!sanitizedTitle) {
      toast.error('Titel ist erforderlich');
      setUploading(false);
      return;
    }

    // Upload with sanitized data
    const services = getServices();
    await services.document.uploadDocument(selectedFile, {
      title: sanitizedTitle,
      description: sanitizedDescription,
      category,
      filename: sanitizedFilename,
    });

    toast.success('Dokument erfolgreich hochgeladen!');
    onClose();
    onSuccess?.();
  } catch (error: any) {
    toast.error(error.message || 'Upload fehlgeschlagen');
  } finally {
    setUploading(false);
  }
};
```

---

## **STEP 5: USER CREATION (Critical - 1.5 hours)**

### **5.1 - Update Add Employee Screen**

**File:** `/screens/admin/AddEmployeeScreen.tsx`

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';
import validators from '../utils/security/HRTHIS_validation';
import { z } from 'zod';

// Employee creation schema
const EmployeeCreateSchema = z.object({
  email: validators.email,
  password: validators.simplePassword,
  first_name: validators.name,
  last_name: validators.name,
  position: validators.text({ required: false, max: 100 }),
  phone: validators.phone.optional(),
  department_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  setLoading(true);

  try {
    // ✅ VALIDATE & SANITIZE
    const formData = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      position,
      phone,
      department_id: departmentId,
      location_id: locationId,
    };

    const result = await validators.validateForm(EmployeeCreateSchema, formData);

    if (!result.success) {
      setErrors(result.errors);
      setLoading(false);
      return;
    }

    // Create user with sanitized data
    const services = getServices();
    await services.user.createUser({
      email: result.data.email,
      password: result.data.password,
      userData: {
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        position: result.data.position,
        phone: result.data.phone,
        department_id: result.data.department_id,
        location_id: result.data.location_id,
      },
    });

    toast.success('Mitarbeiter erfolgreich erstellt!');
    navigate('/admin/team-management');
  } catch (error: any) {
    toast.error(error.message || 'Fehler beim Erstellen des Mitarbeiters');
  } finally {
    setLoading(false);
  }
};
```

---

## **STEP 6: SEARCH QUERIES (Medium - 1 hour)**

### **6.1 - Update Search Components**

**Example: Team Management Search**

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';

const handleSearch = (query: string) => {
  // ✅ SANITIZE SEARCH QUERY
  const sanitizedQuery = sanitize.searchQuery(query);
  
  setSearchTerm(sanitizedQuery);
  
  // Filter users with sanitized query
  const filtered = users.filter(user => 
    user.first_name.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(sanitizedQuery.toLowerCase())
  );
  
  setFilteredUsers(filtered);
};
```

---

## **STEP 7: SETTINGS FORMS (Medium - 1.5 hours)**

### **7.1 - Update Personal Settings**

**File:** `/components/PersonalSettings.tsx`

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';
import validators from '../utils/security/HRTHIS_validation';

const handleSave = async () => {
  setSaving(true);

  try {
    // ✅ SANITIZE UPDATES
    const updates: any = {};

    if (firstName !== profile.first_name) {
      const sanitized = sanitize.text(firstName);
      if (!sanitized) {
        toast.error('Ungültiger Vorname');
        setSaving(false);
        return;
      }
      updates.first_name = sanitized;
    }

    if (lastName !== profile.last_name) {
      const sanitized = sanitize.text(lastName);
      if (!sanitized) {
        toast.error('Ungültiger Nachname');
        setSaving(false);
        return;
      }
      updates.last_name = sanitized;
    }

    if (phone !== profile.phone) {
      updates.phone = sanitize.phone(phone);
    }

    // Save with sanitized data
    const services = getServices();
    await services.user.updateUser(profile.id, updates);

    toast.success('Einstellungen gespeichert!');
  } catch (error: any) {
    toast.error(error.message || 'Fehler beim Speichern');
  } finally {
    setSaving(false);
  }
};
```

---

## **STEP 8: LEARNING CONTENT (Medium - 1 hour)**

### **8.1 - Update Video Creation**

**File:** `/components/CreateVideoDialog.tsx`

```typescript
import sanitize from '../utils/security/HRTHIS_sanitization';
import validators from '../utils/security/HRTHIS_validation';

const handleSubmit = async () => {
  setSubmitting(true);

  try {
    // ✅ VALIDATE YOUTUBE URL
    const urlValidation = validators.validateForm(
      z.object({ url: validators.youtubeUrl }),
      { url: youtubeUrl }
    );

    if (!urlValidation.success) {
      toast.error('Ungültige YouTube URL');
      setSubmitting(false);
      return;
    }

    // ✅ SANITIZE TEXT FIELDS
    const sanitizedTitle = sanitize.text(title);
    const sanitizedDescription = sanitize.multiline(description);

    if (!sanitizedTitle) {
      toast.error('Titel ist erforderlich');
      setSubmitting(false);
      return;
    }

    // Create video
    const services = getServices();
    await services.learning.createVideo({
      title: sanitizedTitle,
      description: sanitizedDescription,
      youtube_url: urlValidation.data.url,
      category,
      duration,
      xp_reward,
      coin_reward,
    });

    toast.success('Video erfolgreich erstellt!');
    onClose();
    onSuccess?.();
  } catch (error: any) {
    toast.error(error.message || 'Fehler beim Erstellen');
  } finally {
    setSubmitting(false);
  }
};
```

---

## 📊 **TESTING CHECKLIST:**

### **After Integration:**

- [ ] **Login Form**
  - [ ] Valid email works
  - [ ] Invalid email rejected
  - [ ] XSS attempts blocked
  - [ ] Rate limiting works

- [ ] **Register Form**
  - [ ] Valid data works
  - [ ] Invalid names rejected
  - [ ] Password requirements enforced
  - [ ] XSS blocked

- [ ] **Leave Requests**
  - [ ] Valid request works
  - [ ] Invalid dates rejected
  - [ ] Notes sanitized
  - [ ] XSS in notes blocked

- [ ] **Document Upload**
  - [ ] Valid files work
  - [ ] Invalid files rejected
  - [ ] File size limit enforced
  - [ ] Filename sanitized

- [ ] **User Creation**
  - [ ] Valid user created
  - [ ] Invalid email rejected
  - [ ] XSS in names blocked
  - [ ] Phone sanitized

- [ ] **Search**
  - [ ] Search works
  - [ ] XSS in search blocked
  - [ ] SQL injection blocked
  - [ ] Special characters handled

---

## 🎯 **QUICK TEST SCRIPT:**

```javascript
// Run in browser console after integration:

// Test 1: XSS in search
securityTest.testSearch('<script>alert("xss")</script>');
// Expected: Sanitized to empty string or "scriptalertxssscript"

// Test 2: Valid email
console.log(sanitize.email('test@example.com'));
// Expected: "test@example.com"

// Test 3: Invalid email
console.log(sanitize.email('not-an-email'));
// Expected: ""

// Test 4: XSS in text
console.log(sanitize.text('<script>alert("xss")</script>Hello'));
// Expected: "Hello"

// Test 5: File validation
const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
console.log(sanitize.fileUpload(file));
// Expected: { valid: true, sanitizedName: 'test.pdf' }
```

---

## ⚠️ **IMPORTANT NOTES:**

1. **Always sanitize before storing** - Never trust user input
2. **Use Zod schemas** - Runtime validation is critical
3. **Check for XSS** - Use `containsXSS()` for critical fields
4. **Validate file uploads** - Type and size limits
5. **Sanitize search queries** - Prevent SQL injection

---

## 🚀 **NEXT STEPS:**

1. **Start with Step 1** - Auth Forms (Critical)
2. **Test each step** - Verify sanitization works
3. **Move to Step 2** - User Service
4. **Continue systematically** - Follow the guide

---

**Created:** 2025-01-10  
**Phase:** 4 - Security & Resilience  
**Priority:** 2 - Input Validation & Sanitization  
**Status:** 📝 Ready to Integrate  
**Estimated Time:** 12 hours
