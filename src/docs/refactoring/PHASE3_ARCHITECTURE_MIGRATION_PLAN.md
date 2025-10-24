# 🏗️ PHASE 3 - ARCHITECTURE MIGRATION

**Duration:** 80 hours  
**Status:** 📋 PLANNING  
**Impact:** Long-term codebase improvement  
**Goal:** Clean architecture with API layer, type safety, and scalability

---

## 📊 **CURRENT ARCHITECTURE ANALYSIS**

### **Current State (Problems):**

```
Frontend (Screens/Components)
    ↓
Hooks (useXYZ)
    ↓
Stores (direct Supabase calls) ← PROBLEM!
    ↓
Supabase (Backend)
```

**Issues:**
1. ❌ **No API abstraction** - Stores call Supabase directly
2. ❌ **Tight coupling** - Frontend tied to Supabase implementation
3. ❌ **No type safety** - Generic `any` types in many places
4. ❌ **Difficult testing** - Hard to mock Supabase calls
5. ❌ **No error handling layer** - Errors handled inconsistently
6. ❌ **No request/response validation** - No runtime type checking
7. ❌ **Scattered business logic** - Logic in stores, hooks, and components

---

### **Target Architecture (Clean):**

```
Frontend (Screens/Components)
    ↓
Hooks (useXYZ) - UI logic only
    ↓
Services (API Layer) ← NEW! Clean interface
    ↓
API Client (Type-safe requests)
    ↓
Backend (Supabase/Edge Functions)
```

**Benefits:**
1. ✅ **Clean separation** - Each layer has single responsibility
2. ✅ **Type safety** - End-to-end TypeScript types
3. ✅ **Easy testing** - Mock services, not Supabase
4. ✅ **Better errors** - Consistent error handling
5. ✅ **Validation** - Runtime type checking
6. ✅ **Scalability** - Easy to swap backends
7. ✅ **Maintainability** - Clear code organization

---

## 🎯 **PHASE 3 PRIORITIES**

### **Priority 1: Create Service Layer** (20h) 🔧
Create clean API abstraction layer

**Sub-tasks:**
1. Create `/services` directory structure
2. Create base `ApiService` class
3. Create domain-specific services (Auth, User, Team, Learning, etc.)
4. Implement error handling middleware
5. Add request/response interceptors

**Files to create:**
- `/services/base/ApiService.ts`
- `/services/base/ApiError.ts`
- `/services/HRTHIS_authService.ts`
- `/services/HRTHIS_userService.ts`
- `/services/HRTHIS_teamService.ts`
- `/services/HRTHIS_learningService.ts`
- `/services/HRTHIS_organigramService.ts`
- `/services/HRTHIS_leaveService.ts`
- `/services/HRTHIS_documentService.ts`

---

### **Priority 2: Improve Type Safety** (15h) 📐
Add runtime validation and better types

**Sub-tasks:**
1. Create Zod schemas for all entities
2. Add runtime validation to API calls
3. Create type guards
4. Add strict TypeScript config
5. Fix all `any` types

**Files to create:**
- `/types/schemas/userSchema.ts`
- `/types/schemas/teamSchema.ts`
- `/types/schemas/leaveSchema.ts`
- `/types/schemas/organigramSchema.ts`
- `/types/guards.ts`
- `/types/validators.ts`

---

### **Priority 3: Refactor Stores** (15h) 🗄️
Convert stores to use services instead of direct Supabase

**Sub-tasks:**
1. Refactor `HRTHIS_authStore.ts` to use `authService`
2. Refactor `HRTHIS_adminStore.ts` to use `userService` + `teamService`
3. Refactor `HRTHIS_learningStore.ts` to use `learningService`
4. Refactor `HRTHIS_organigramStore.ts` to use `organigramService`
5. Refactor `HRTHIS_timeStore.ts` to use `leaveService`
6. Remove direct Supabase calls from stores

**Files to modify:**
- `/stores/HRTHIS_authStore.ts`
- `/stores/HRTHIS_adminStore.ts`
- `/stores/HRTHIS_learningStore.ts`
- `/stores/HRTHIS_organigramStore.ts`
- `/stores/HRTHIS_timeStore.ts`

---

### **Priority 4: Add Error Handling** (10h) ⚠️
Consistent error handling across app

**Sub-tasks:**
1. Create error types (NetworkError, ValidationError, etc.)
2. Create error handler middleware
3. Add error boundaries
4. Add retry logic
5. Add error logging

**Files to create:**
- `/utils/errors/ErrorTypes.ts`
- `/utils/errors/ErrorHandler.ts`
- `/utils/errors/ErrorLogger.ts`
- `/components/ErrorBoundaryAdvanced.tsx`

---

### **Priority 5: Add Request/Response Caching** (10h) 💾
Implement intelligent caching layer

**Sub-tasks:**
1. Create cache manager
2. Add cache strategies (TTL, LRU)
3. Cache GET requests
4. Invalidate cache on mutations
5. Add cache debugging tools

**Files to create:**
- `/utils/cache/CacheManager.ts`
- `/utils/cache/CacheStrategies.ts`
- `/utils/cache/CacheDebug.ts`

---

### **Priority 6: Add Testing Infrastructure** (10h) 🧪
Set up testing for services

**Sub-tasks:**
1. Set up testing framework (Vitest)
2. Create service mocks
3. Write tests for services
4. Add CI/CD integration
5. Create testing guidelines

**Files to create:**
- `/tests/services/authService.test.ts`
- `/tests/services/userService.test.ts`
- `/tests/mocks/supabaseMock.ts`
- `/tests/setup.ts`

---

## 📁 **NEW DIRECTORY STRUCTURE**

```
/services/
  /base/
    - ApiService.ts        # Base service class
    - ApiError.ts          # Error types
    - ApiClient.ts         # HTTP client wrapper
  - HRTHIS_authService.ts
  - HRTHIS_userService.ts
  - HRTHIS_teamService.ts
  - HRTHIS_learningService.ts
  - HRTHIS_organigramService.ts
  - HRTHIS_leaveService.ts
  - HRTHIS_documentService.ts
  - HRTHIS_timeService.ts
  - index.ts              # Export all services

/types/
  /schemas/               # Zod schemas
    - userSchema.ts
    - teamSchema.ts
    - leaveSchema.ts
    - organigramSchema.ts
    - index.ts
  - guards.ts             # Type guards
  - validators.ts         # Validators
  - database.ts           # Existing

/utils/
  /errors/
    - ErrorTypes.ts
    - ErrorHandler.ts
    - ErrorLogger.ts
  /cache/
    - CacheManager.ts
    - CacheStrategies.ts
    - CacheDebug.ts

/tests/
  /services/
    - authService.test.ts
    - userService.test.ts
  /mocks/
    - supabaseMock.ts
  - setup.ts
```

---

## 🔧 **PRIORITY 1 DETAILS: Service Layer**

### **Step 1: Create Base Service Class**

**File:** `/services/base/ApiService.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './ApiError';

/**
 * BASE API SERVICE
 * ================
 * Base class for all domain services
 * Provides common functionality like error handling, logging, etc.
 */
export abstract class ApiService {
  protected supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Handle Supabase errors and convert to ApiError
   */
  protected handleError(error: any, context: string): never {
    console.error(`[${context}] Error:`, error);
    throw new ApiError(
      error.message || 'An error occurred',
      error.code || 'UNKNOWN_ERROR',
      context,
      error
    );
  }

  /**
   * Log request for debugging
   */
  protected logRequest(method: string, context: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${context}] ${method}`, data);
    }
  }

  /**
   * Log response for debugging
   */
  protected logResponse(context: string, data: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${context}] Response:`, data);
    }
  }
}
```

---

### **Step 2: Create Error Types**

**File:** `/services/base/ApiError.ts`

```typescript
/**
 * API ERROR TYPES
 * ===============
 * Custom error types for better error handling
 */

export class ApiError extends Error {
  code: string;
  context: string;
  originalError?: any;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context: string = 'API',
    originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, context: string, originalError?: any) {
    super(message, 'NETWORK_ERROR', context, originalError);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApiError {
  validationErrors: Record<string, string>;

  constructor(
    message: string,
    context: string,
    validationErrors: Record<string, string> = {},
    originalError?: any
  ) {
    super(message, 'VALIDATION_ERROR', context, originalError);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string, context: string, originalError?: any) {
    super(message, 'AUTH_ERROR', context, originalError);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string, context: string, originalError?: any) {
    super(message, 'AUTHORIZATION_ERROR', context, originalError);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, context: string, originalError?: any) {
    super(`${resource} not found`, 'NOT_FOUND', context, originalError);
    this.name = 'NotFoundError';
  }
}
```

---

### **Step 3: Create Auth Service**

**File:** `/services/HRTHIS_authService.ts`

```typescript
import { ApiService } from './base/ApiService';
import { AuthenticationError, ValidationError } from './base/ApiError';
import type { User } from '../types/database';

/**
 * AUTHENTICATION SERVICE
 * ======================
 * Handles all authentication operations
 * 
 * Replaces direct Supabase calls in authStore
 */
export class AuthService extends ApiService {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    this.logRequest('signIn', 'AuthService', { email });

    // Validate input
    if (!email || !password) {
      throw new ValidationError(
        'Email and password are required',
        'AuthService.signIn',
        {
          email: !email ? 'Email is required' : '',
          password: !password ? 'Password is required' : '',
        }
      );
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new AuthenticationError(
          error.message,
          'AuthService.signIn',
          error
        );
      }

      if (!data.user) {
        throw new AuthenticationError(
          'No user returned from sign in',
          'AuthService.signIn'
        );
      }

      this.logResponse('AuthService.signIn', data.user);
      return data.user as User;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'AuthService.signIn');
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    userData: {
      first_name: string;
      last_name: string;
      organization_id?: string;
    }
  ): Promise<User> {
    this.logRequest('signUp', 'AuthService', { email, userData });

    // Validate input
    if (!email || !password || !userData.first_name || !userData.last_name) {
      throw new ValidationError(
        'All fields are required',
        'AuthService.signUp',
        {
          email: !email ? 'Email is required' : '',
          password: !password ? 'Password is required' : '',
          first_name: !userData.first_name ? 'First name is required' : '',
          last_name: !userData.last_name ? 'Last name is required' : '',
        }
      );
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        throw new AuthenticationError(
          error.message,
          'AuthService.signUp',
          error
        );
      }

      if (!data.user) {
        throw new AuthenticationError(
          'No user returned from sign up',
          'AuthService.signUp'
        );
      }

      this.logResponse('AuthService.signUp', data.user);
      return data.user as User;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'AuthService.signUp');
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    this.logRequest('signOut', 'AuthService');

    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw new AuthenticationError(
          error.message,
          'AuthService.signOut',
          error
        );
      }

      this.logResponse('AuthService.signOut', 'Success');
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'AuthService.signOut');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    this.logRequest('getCurrentUser', 'AuthService');

    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        throw new AuthenticationError(
          error.message,
          'AuthService.getCurrentUser',
          error
        );
      }

      this.logResponse('AuthService.getCurrentUser', data.user);
      return data.user as User | null;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'AuthService.getCurrentUser');
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    this.logRequest('resetPassword', 'AuthService', { email });

    if (!email) {
      throw new ValidationError(
        'Email is required',
        'AuthService.resetPassword',
        { email: 'Email is required' }
      );
    }

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw new AuthenticationError(
          error.message,
          'AuthService.resetPassword',
          error
        );
      }

      this.logResponse('AuthService.resetPassword', 'Success');
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'AuthService.resetPassword');
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    this.logRequest('updatePassword', 'AuthService');

    if (!newPassword) {
      throw new ValidationError(
        'New password is required',
        'AuthService.updatePassword',
        { password: 'Password is required' }
      );
    }

    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new AuthenticationError(
          error.message,
          'AuthService.updatePassword',
          error
        );
      }

      this.logResponse('AuthService.updatePassword', 'Success');
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'AuthService.updatePassword');
    }
  }
}
```

---

## 📊 **PHASE 3 ROADMAP**

### **Week 1-2: Priority 1 - Service Layer** (20h)
- Day 1-2: Create base service class + error types (6h)
- Day 3-4: Create auth service + user service (6h)
- Day 5-6: Create team service + learning service (4h)
- Day 7-8: Create organigram + leave services (4h)

### **Week 3: Priority 2 - Type Safety** (15h)
- Day 9-10: Create Zod schemas (6h)
- Day 11-12: Add runtime validation (5h)
- Day 13: Fix all `any` types (4h)

### **Week 4-5: Priority 3 - Refactor Stores** (15h)
- Day 14-15: Refactor auth store (4h)
- Day 16-17: Refactor admin store (5h)
- Day 18-19: Refactor learning + organigram stores (4h)
- Day 20: Refactor time store (2h)

### **Week 6: Priority 4 - Error Handling** (10h)
- Day 21-22: Create error types + handlers (4h)
- Day 23: Add error boundaries (3h)
- Day 24: Add retry logic + logging (3h)

### **Week 7: Priority 5 - Caching** (10h)
- Day 25-26: Create cache manager (4h)
- Day 27: Add cache strategies (3h)
- Day 28: Cache integration (3h)

### **Week 8: Priority 6 - Testing** (10h)
- Day 29-30: Set up testing framework (4h)
- Day 31-32: Write service tests (4h)
- Day 33: CI/CD + guidelines (2h)

**Total:** ~80 hours over 8 weeks

---

## ✅ **SUCCESS CRITERIA**

### **Priority 1: Service Layer**
- [ ] All services created
- [ ] No direct Supabase calls in stores
- [ ] Clean API abstraction
- [ ] Consistent error handling
- [ ] Proper logging

### **Priority 2: Type Safety**
- [ ] Zod schemas for all entities
- [ ] Runtime validation
- [ ] No `any` types
- [ ] Type guards implemented
- [ ] Strict TypeScript config

### **Priority 3: Refactored Stores**
- [ ] All stores use services
- [ ] No direct Supabase calls
- [ ] Clean store interfaces
- [ ] Simplified store logic
- [ ] Better error handling

### **Priority 4: Error Handling**
- [ ] Custom error types
- [ ] Error handler middleware
- [ ] Error boundaries
- [ ] Retry logic
- [ ] Error logging

### **Priority 5: Caching**
- [ ] Cache manager implemented
- [ ] TTL + LRU strategies
- [ ] GET requests cached
- [ ] Cache invalidation
- [ ] Cache debugging

### **Priority 6: Testing**
- [ ] Testing framework set up
- [ ] Service tests written
- [ ] >80% test coverage
- [ ] CI/CD integration
- [ ] Testing guidelines

---

## 💡 **BENEFITS AFTER PHASE 3**

### **Code Quality:**
- ✅ Clean architecture
- ✅ Single responsibility
- ✅ Easy to understand
- ✅ Well documented

### **Developer Experience:**
- ✅ Easy to test
- ✅ Easy to mock
- ✅ Easy to extend
- ✅ Clear error messages

### **Performance:**
- ✅ Request caching
- ✅ Reduced API calls
- ✅ Better error recovery
- ✅ Optimized queries

### **Maintainability:**
- ✅ Easy to refactor
- ✅ Easy to debug
- ✅ Easy to scale
- ✅ Backend agnostic

### **Type Safety:**
- ✅ Runtime validation
- ✅ Compile-time checks
- ✅ Better autocomplete
- ✅ Fewer bugs

---

## 🚀 **GETTING STARTED**

### **Step 1: Choose Starting Point**

**Option A:** Start with Priority 1 - Service Layer
- Most impactful
- Foundation for other priorities
- **Recommended** ✅

**Option B:** Start with Priority 2 - Type Safety
- Enables better service development
- Good if you want types first

**Option C:** Do a small proof-of-concept
- Create just Auth Service
- Refactor just Auth Store
- See the benefits before committing

---

## 📝 **NEXT STEPS**

### **Immediate Actions:**

1. **Create `/services` directory**
2. **Create base service classes**
3. **Create Auth Service**
4. **Test Auth Service**
5. **Refactor Auth Store to use Auth Service**
6. **Verify everything still works**
7. **Continue with other services**

---

**Created:** 2025-01-10  
**Phase:** Phase 3 - Architecture Migration  
**Status:** Planning Complete ✅  
**Ready to start:** YES  

**What would you like to do next?**

A) Start with Priority 1 - Service Layer (AuthService first) ✅ **Recommended**  
B) Start with Priority 2 - Type Safety (Zod schemas first)  
C) Do a proof-of-concept (Small demo of the new architecture)  
D) Review the plan in more detail before starting
