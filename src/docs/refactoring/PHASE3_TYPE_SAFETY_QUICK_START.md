# 🚀 TYPE SAFETY QUICK START

**Quick reference guide for using Zod schemas and type guards in HRthis**

---

## 📚 **IMPORTS**

```typescript
// Schemas
import {
  validateCreateUser,
  validateUpdateUser,
  validateCreateLeaveRequest,
  validateCreateTeam,
  CreateUserSchema,
  UserSchema,
} from '../types/schemas';

// Type Guards
import {
  isUser,
  isLeaveRequest,
  isUUID,
  isEmail,
  assertUUID,
} from '../types/guards';
```

---

## 🔹 **BASIC VALIDATION**

### **Validate with Helper Function:**

```typescript
// Throws error if invalid
const user = validateCreateUser({
  email: 'john@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
});
```

### **Safe Validation (No Throw):**

```typescript
import { CreateUserSchema } from '../types/schemas';

const result = CreateUserSchema.safeParse(data);

if (result.success) {
  console.log(result.data); // Valid data
} else {
  console.error(result.error); // Validation errors
}
```

---

## 🔹 **TYPE GUARDS**

### **Check Type at Runtime:**

```typescript
import { isUser, isUUID } from '../types/guards';

if (isUser(data)) {
  // TypeScript knows data is User
  console.log(data.email); // ✅ Type-safe
}

if (isUUID(userId)) {
  // userId is a valid UUID string
}
```

### **Assertions (Throw if Invalid):**

```typescript
import { assertUUID, assertEmail } from '../types/guards';

assertUUID(userId); // Throws if not UUID
assertEmail(email); // Throws if not email

// After assertion, TypeScript knows the type
console.log(userId); // string (UUID)
```

---

## 🔹 **ERROR HANDLING**

### **Get Field-Specific Errors:**

```typescript
import { getValidationErrors } from '../types/schemas';

try {
  validateCreateUser(invalidData);
} catch (error) {
  const errors = getValidationErrors(error);
  
  console.log(errors);
  // {
  //   email: 'Ungültige E-Mail-Adresse',
  //   first_name: 'Vorname ist erforderlich'
  // }
}
```

### **Format Error Message:**

```typescript
import { formatZodError } from '../types/schemas';

try {
  validateCreateUser(invalidData);
} catch (error) {
  const formatted = formatZodError(error);
  
  console.log(formatted.message); // 'Validierung fehlgeschlagen'
  console.log(formatted.issues); // Array of issues
}
```

---

## 🔹 **COMMON SCHEMAS**

### **User:**

```typescript
import {
  validateCreateUser,
  validateUpdateUser,
  UserRoleSchema,
} from '../types/schemas';

// Create
const user = validateCreateUser({
  email: 'john@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'USER', // Optional
});

// Update
const updated = validateUpdateUser({
  first_name: 'Jane',
  level: 5,
});

// Validate role
UserRoleSchema.parse('ADMIN'); // ✅
UserRoleSchema.parse('INVALID'); // ❌ Error
```

### **Leave Request:**

```typescript
import {
  validateCreateLeaveRequest,
  LeaveTypeSchema,
  LeaveStatusSchema,
} from '../types/schemas';

const request = validateCreateLeaveRequest({
  user_id: 'uuid',
  type: 'VACATION',
  start_date: '2025-02-01',
  end_date: '2025-02-07',
  days: 5,
  reason: 'Family vacation', // Optional
});

// Validate enums
LeaveTypeSchema.parse('VACATION'); // ✅
LeaveStatusSchema.parse('PENDING'); // ✅
```

### **Team:**

```typescript
import {
  validateCreateTeam,
  validateAddTeamMember,
  TeamMemberRoleSchema,
} from '../types/schemas';

const team = validateCreateTeam({
  name: 'Engineering',
  description: 'Dev team', // Optional
});

const member = validateAddTeamMember({
  user_id: 'uuid',
  team_id: 'uuid',
  role: 'TEAMLEAD',
  priority_tag: 'PRIMARY', // Optional
});

TeamMemberRoleSchema.parse('TEAMLEAD'); // ✅
```

### **Learning:**

```typescript
import {
  validateCreateVideo,
  validateCreateQuiz,
  validateSubmitQuizAttempt,
} from '../types/schemas';

const video = validateCreateVideo({
  title: 'TypeScript Basics',
  youtube_url: 'https://youtube.com/watch?v=...',
  xp_reward: 20, // Optional
});

const quiz = validateCreateQuiz({
  title: 'TypeScript Quiz',
  questions: [
    {
      question: 'What is TypeScript?',
      options: ['A language', 'A framework'],
      correct_answer: 0,
    },
  ],
  passing_score: 70, // Optional
});

const attempt = validateSubmitQuizAttempt({
  quiz_id: 'uuid',
  user_id: 'uuid',
  score: 85,
  answers: [...],
  passed: true,
});
```

### **Document:**

```typescript
import {
  validateCreateDocument,
  validateFileType,
  validateFileSize,
  CommonFileTypes,
} from '../types/schemas';

const doc = validateCreateDocument({
  title: 'Handbook',
  category: 'HR',
  file_name: 'handbook.pdf',
  file_size: 1024000,
  file_type: 'application/pdf',
  file_url: 'storage/docs/handbook.pdf',
});

// File validation
const isValid = validateFileType(fileType, [CommonFileTypes.PDF]);
const sizeOk = validateFileSize(fileSize, 10); // max 10MB
```

---

## 🔹 **IN FORMS**

### **React Hook Form Integration:**

```typescript
import { useForm } from 'react-hook-form@7.55.0';
import { CreateUserSchema } from '../types/schemas';
import { getValidationErrors } from '../types/schemas';

function UserForm() {
  const form = useForm();
  
  const handleSubmit = async (data: any) => {
    try {
      // Validate with Zod
      const validated = CreateUserSchema.parse(data);
      
      // Submit
      await createUser(validated);
    } catch (error) {
      // Get field-specific errors
      const errors = getValidationErrors(error);
      
      // Set form errors
      Object.entries(errors).forEach(([field, message]) => {
        form.setError(field, { message });
      });
    }
  };
  
  return <form onSubmit={form.handleSubmit(handleSubmit)}>...</form>;
}
```

---

## 🔹 **IN SERVICES**

Services automatically validate input using Zod schemas (when implemented):

```typescript
// Service automatically validates
const user = await services.user.updateUser(userId, {
  email: 'invalid', // ❌ ValidationError thrown
  level: 150, // ❌ ValidationError thrown
});

// You can also validate manually
import { validateUpdateUser } from '../types/schemas';

try {
  const validated = validateUpdateUser(updates);
  await services.user.updateUser(userId, validated);
} catch (error) {
  // Handle validation error
}
```

---

## 🔹 **CUSTOM VALIDATION**

### **Extend Existing Schema:**

```typescript
import { CreateUserSchema } from '../types/schemas';
import { z } from 'zod';

const CustomUserSchema = CreateUserSchema.extend({
  custom_field: z.string().optional(),
});
```

### **Add Custom Refinement:**

```typescript
import { z } from 'zod';

const PasswordSchema = z.object({
  password: z.string().min(8),
  confirm_password: z.string(),
}).refine(
  (data) => data.password === data.confirm_password,
  {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirm_password'],
  }
);
```

---

## 🔹 **BEST PRACTICES**

### **✅ DO:**

```typescript
// Use validation helpers
const user = validateCreateUser(data);

// Use type guards for runtime checks
if (isUser(data)) {
  // Process user
}

// Use safeParse for non-critical validation
const result = UserSchema.safeParse(data);
if (result.success) {
  // Use data
}

// Get field-specific errors
const errors = getValidationErrors(error);
```

### **❌ DON'T:**

```typescript
// Don't skip validation
const user = data as User; // ❌ No runtime check!

// Don't ignore validation errors
try {
  validateUser(data);
} catch {
  // ❌ Don't silently ignore
}

// Don't use parse without try/catch
const user = UserSchema.parse(data); // ❌ Can throw!
```

---

## 🔹 **CHEAT SHEET**

| Task | Code |
|------|------|
| Validate (throw) | `validateCreateUser(data)` |
| Validate (safe) | `CreateUserSchema.safeParse(data)` |
| Type guard | `if (isUser(data)) {...}` |
| Assert | `assertUUID(id)` |
| Get errors | `getValidationErrors(error)` |
| Format error | `formatZodError(error)` |
| Validate UUID | `isUUID(value)` |
| Validate email | `isEmail(value)` |
| Validate enum | `UserRoleSchema.parse('ADMIN')` |

---

## 📖 **FULL DOCUMENTATION**

See `/docs/refactoring/PHASE3_PRIORITY2_COMPLETE.md` for:
- Complete schema list
- All type guards
- Advanced usage
- Error handling
- Integration examples

---

**Status:** ✅ Ready to use  
**Updated:** 2025-01-10
