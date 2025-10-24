# 🏗️ SERVICES USAGE GUIDE

**Phase 3 - Architecture Migration**  
**Priority 1: Service Layer**  
**Status:** ✅ **FOUNDATION COMPLETE**

---

## 📚 **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Services Created](#services-created)
4. [Usage Examples](#usage-examples)
5. [Migration Guide](#migration-guide)
6. [Error Handling](#error-handling)
7. [Next Steps](#next-steps)

---

## 📊 **OVERVIEW**

We've created a **clean service layer** that abstracts Supabase operations behind a type-safe API.

### **Benefits:**

✅ **Clean separation** - Business logic separated from UI  
✅ **Type safety** - Full TypeScript support  
✅ **Easy testing** - Mock services instead of Supabase  
✅ **Better errors** - Structured error handling  
✅ **Consistent API** - All services follow same patterns  
✅ **Backend agnostic** - Easy to swap Supabase later  

---

## 🏛️ **ARCHITECTURE**

### **Old Architecture (Before):**

```
┌─────────────────────────────────────────┐
│ Frontend (Screens/Components)           │
│                                         │
│  ↓ Direct calls                        │
│                                         │
│ Stores (Zustand)                       │
│  - authStore.ts                        │
│  - adminStore.ts                       │
│  - learningStore.ts                    │
│                                         │
│  ↓ Direct Supabase calls ❌            │
│                                         │
│ Supabase Client                         │
│  - supabase.auth.*                     │
│  - supabase.from('users').*            │
│  - supabase.storage.*                  │
└─────────────────────────────────────────┘

Problems:
❌ Tight coupling to Supabase
❌ Hard to test
❌ Inconsistent error handling
❌ No type safety
❌ Business logic scattered
```

### **New Architecture (After):**

```
┌─────────────────────────────────────────┐
│ Frontend (Screens/Components)           │
│                                         │
│  ↓ Use hooks                           │
│                                         │
│ Stores (Zustand)                       │
│  - authStore.ts                        │
│  - adminStore.ts                       │
│  - learningStore.ts                    │
│                                         │
│  ↓ Call services ✅                    │
│                                         │
│ Services Layer (NEW!)                   │
│  - AuthService                         │
│  - UserService                         │
│  - TeamService                         │
│  - LearningService                     │
│  - OrganigramService                   │
│  - LeaveService                        │
│  - DocumentService                     │
│                                         │
│  ↓ Use base service                    │
│                                         │
│ Base Service (ApiService)               │
│  - Error handling                      │
│  - Logging                             │
│  - Retry logic                         │
│  - Validation                          │
│                                         │
│  ↓ Supabase calls                      │
│                                         │
│ Supabase Client                         │
└─────────────────────────────────────────┘

Benefits:
✅ Clean separation of concerns
✅ Easy to test (mock services)
✅ Consistent error handling
✅ Full type safety
✅ Business logic centralized
✅ Backend agnostic
```

---

## 📦 **SERVICES CREATED**

### **Base Services:**

| File | Description | Status |
|------|-------------|--------|
| `/services/base/ApiError.ts` | Custom error types | ✅ Complete |
| `/services/base/ApiService.ts` | Base service class | ✅ Complete |

### **Domain Services:**

| File | Description | Status |
|------|-------------|--------|
| `/services/HRTHIS_authService.ts` | Authentication | ✅ Complete |
| `/services/HRTHIS_userService.ts` | User management | ⏳ TODO |
| `/services/HRTHIS_teamService.ts` | Team management | ⏳ TODO |
| `/services/HRTHIS_learningService.ts` | Learning system | ⏳ TODO |
| `/services/HRTHIS_organigramService.ts` | Organigram | ⏳ TODO |
| `/services/HRTHIS_leaveService.ts` | Leave requests | ⏳ TODO |
| `/services/HRTHIS_documentService.ts` | Documents | ⏳ TODO |

### **Utilities:**

| File | Description | Status |
|------|-------------|--------|
| `/services/index.ts` | Service exports | ✅ Complete |

---

## 💻 **USAGE EXAMPLES**

### **Example 1: Using Services in a Store**

**Before (Direct Supabase):**

```typescript
// stores/HRTHIS_authStore.ts
import { supabase } from '../utils/supabase/client';

export const useAuthStore = create<AuthState>((set) => ({
  login: async (email: string, password: string) => {
    // Direct Supabase call ❌
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error; // Generic error ❌
    
    set({ user: data.user });
  },
}));
```

**After (Using Services):**

```typescript
// stores/HRTHIS_authStore.ts
import { getServices } from '../services';

export const useAuthStore = create<AuthState>((set) => ({
  login: async (email: string, password: string) => {
    const services = getServices();
    
    try {
      // Use service ✅
      const { user, session } = await services.auth.signIn(email, password);
      
      set({ user });
    } catch (error) {
      // Structured error handling ✅
      if (error instanceof AuthenticationError) {
        toast.error(error.getUserMessage());
      } else {
        toast.error('Ein Fehler ist aufgetreten');
      }
      throw error;
    }
  },
}));
```

---

### **Example 2: Using Services in a Component**

```typescript
// components/Login.tsx
import { useState } from 'react';
import { getServices } from '../services';
import { AuthenticationError, ValidationError } from '../services';
import { toast } from 'sonner@2.0.3';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      const services = getServices();
      const { user } = await services.auth.signIn(email, password);
      
      toast.success(`Willkommen, ${user.email}!`);
      // Navigate to dashboard...
    } catch (error) {
      if (error instanceof ValidationError) {
        // Show validation errors
        Object.entries(error.validationErrors).forEach(([field, message]) => {
          toast.error(message);
        });
      } else if (error instanceof AuthenticationError) {
        toast.error(error.getUserMessage());
      } else {
        toast.error('Ein Fehler ist aufgetreten');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={loading}>Login</button>
    </form>
  );
}
```

---

### **Example 3: Creating a New Service**

```typescript
// services/HRTHIS_userService.ts
import { ApiService } from './base/ApiService';
import { NotFoundError, ValidationError } from './base/ApiError';
import type { User } from '../types/database';

export class UserService extends ApiService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    this.logRequest('getUserById', 'UserService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'UserService.getUserById',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new NotFoundError('Benutzer', 'UserService.getUserById', error);
      }

      if (!user) {
        throw new NotFoundError('Benutzer', 'UserService.getUserById');
      }

      this.logResponse('UserService.getUserById', { email: user.email });
      return user as User;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'UserService.getUserById');
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    this.logRequest('getAllUsers', 'UserService');

    return await this.safeQuery(
      () => this.supabase.from('users').select('*'),
      'UserService.getAllUsers'
    );
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    this.logRequest('updateUser', 'UserService', { userId, updates });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'UserService.updateUser',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'UserService.updateUser');
      }

      if (!user) {
        throw new NotFoundError('Benutzer', 'UserService.updateUser');
      }

      this.logResponse('UserService.updateUser', { email: user.email });
      return user as User;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'UserService.updateUser');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    this.logRequest('deleteUser', 'UserService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'UserService.deleteUser',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        this.handleError(error, 'UserService.deleteUser');
      }

      this.logResponse('UserService.deleteUser', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'UserService.deleteUser');
    }
  }
}
```

Then add to `/services/index.ts`:

```typescript
export { UserService } from './HRTHIS_userService';

export interface Services {
  auth: import('./HRTHIS_authService').AuthService;
  user: import('./HRTHIS_userService').UserService; // ← Add this
}

export function createServices(supabase: SupabaseClient): Services {
  const { AuthService } = require('./HRTHIS_authService');
  const { UserService } = require('./HRTHIS_userService'); // ← Add this
  
  return {
    auth: new AuthService(supabase),
    user: new UserService(supabase), // ← Add this
  };
}
```

---

## 🔄 **MIGRATION GUIDE**

### **Step-by-Step Migration:**

#### **Step 1: Identify Supabase Calls**

Search for direct Supabase calls in stores:

```bash
# Find all Supabase calls
grep -r "supabase\." stores/
```

#### **Step 2: Create Service Method**

For each Supabase call, create a corresponding service method:

```typescript
// Before (in store):
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// After (in service):
async getUserById(userId: string): Promise<User> {
  return await this.safeQuery(
    () => this.supabase.from('users').select('*').eq('id', userId).single(),
    'UserService.getUserById'
  );
}
```

#### **Step 3: Update Store to Use Service**

Replace direct Supabase calls with service calls:

```typescript
// Before:
import { supabase } from '../utils/supabase/client';

const fetchUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// After:
import { getServices } from '../services';

const fetchUser = async (userId: string) => {
  const services = getServices();
  return await services.user.getUserById(userId);
};
```

#### **Step 4: Update Error Handling**

Use structured error types:

```typescript
// Before:
try {
  const user = await fetchUser(userId);
} catch (error) {
  console.error(error);
  toast.error('Error loading user');
}

// After:
try {
  const user = await fetchUser(userId);
} catch (error) {
  if (error instanceof NotFoundError) {
    toast.error('Benutzer nicht gefunden');
  } else if (error instanceof ValidationError) {
    toast.error(error.getUserMessage());
  } else {
    toast.error('Fehler beim Laden des Benutzers');
  }
}
```

#### **Step 5: Test**

Test each migrated function to ensure it works correctly.

---

## ⚠️ **ERROR HANDLING**

### **Available Error Types:**

| Error Type | When to Use | User Message |
|------------|-------------|--------------|
| `ApiError` | Generic error | Custom |
| `NetworkError` | Network failures | "Netzwerkfehler..." |
| `ValidationError` | Invalid input | Field-specific errors |
| `AuthenticationError` | Login failures | "Anmeldung fehlgeschlagen..." |
| `AuthorizationError` | Permission denied | "Keine Berechtigung..." |
| `NotFoundError` | Resource not found | "{Resource} nicht gefunden" |
| `ConflictError` | Duplicate entries | "Konflikt..." |
| `RateLimitError` | Too many requests | "Zu viele Anfragen..." |
| `ServerError` | Server errors (5xx) | "Serverfehler..." |
| `TimeoutError` | Request timeout | "Anfrage zu lange..." |

### **Error Handling Pattern:**

```typescript
try {
  const result = await services.auth.signIn(email, password);
} catch (error) {
  // Check specific error types
  if (error instanceof ValidationError) {
    // Show validation errors
    console.log(error.validationErrors);
    toast.error(error.getUserMessage());
  } else if (error instanceof AuthenticationError) {
    // Handle auth errors
    toast.error('Login fehlgeschlagen');
  } else if (error instanceof NetworkError) {
    // Handle network errors
    toast.error('Keine Internetverbindung');
  } else {
    // Generic error
    toast.error('Ein Fehler ist aufgetreten');
  }
  
  // Log for debugging
  console.error(error);
}
```

---

## 🚀 **NEXT STEPS**

### **Priority 1 Remaining Tasks:**

1. ✅ Create base service classes
2. ✅ Create Auth Service
3. ⏳ **Create User Service** (Next!)
4. ⏳ Create Team Service
5. ⏳ Create Learning Service
6. ⏳ Create Organigram Service
7. ⏳ Create Leave Service
8. ⏳ Create Document Service

### **Then Move to Priority 2:**

After all services are created, we'll:
1. Add Zod schemas for runtime validation
2. Improve type safety
3. Add type guards

### **Then Priority 3:**

Refactor stores to use services:
1. Refactor `HRTHIS_authStore.ts`
2. Refactor `HRTHIS_adminStore.ts`
3. Refactor `HRTHIS_learningStore.ts`
4. Refactor `HRTHIS_organigramStore.ts`
5. Refactor `HRTHIS_timeStore.ts`

---

## 📝 **SUMMARY**

### **What We Created:**

✅ Base error types (`ApiError.ts`)  
✅ Base service class (`ApiService.ts`)  
✅ Auth service (`HRTHIS_authService.ts`)  
✅ Service exports (`index.ts`)  
✅ Usage guide (this document)  

### **Benefits:**

✅ Clean architecture  
✅ Type-safe API  
✅ Easy to test  
✅ Consistent errors  
✅ Backend agnostic  

### **Next:**

Create User Service → Team Service → Learning Service → etc.

---

**Status:** ✅ **FOUNDATION COMPLETE**  
**Ready for:** Next service implementation  
**Updated:** 2025-01-10
