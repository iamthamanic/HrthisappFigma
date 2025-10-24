# 🚀 RESILIENCE PATTERNS - QUICK START GUIDE

**Status:** ✅ Production Ready  
**Phase:** Phase 4 Priority 4  
**Date:** 2025-01-10

---

## 🎯 **WHAT ARE RESILIENCE PATTERNS?**

Resilience Patterns machen deine App robuster gegen Fehler:

- **Retry** - Wiederholt automatisch bei temporären Fehlern
- **Circuit Breaker** - Verhindert kaskadierende Fehler
- **Timeout** - Schützt vor hängenden Requests

---

## ⚡ **QUICK START (2 MINUTES)**

### **1. In Services (Recommended)**

Verwende `executeWithResilience()` in deinen Services:

```typescript
export class UserService extends ApiService {
  async getUsers(): Promise<User[]> {
    // ✅ EINFACH SO - Verwendet STANDARD Preset automatisch
    return this.executeWithResilience(
      async () => {
        const { data, error } = await this.supabase
          .from('users')
          .select('*');
        
        if (error) throw error;
        return data;
      },
      { context: 'UserService.getUsers' }
    );
  }
}
```

**Das war's!** Du hast jetzt:
- ✅ 3 Retries mit exponential backoff
- ✅ Circuit breaker protection
- ✅ 10s timeout

---

## 🎛️ **PRESETS FÜR VERSCHIEDENE SZENARIEN**

### **CRITICAL** - Für wichtige Operationen
```typescript
return this.executeWithResilience(
  () => this.supabase.auth.signInWithPassword({ email, password }),
  {
    ...ResiliencePresets.CRITICAL, // 5 retries, circuit breaker, 10s timeout
    context: 'AuthService.signIn',
  }
);

// Perfekt für: Authentication, Payments, Critical Data
```

### **STANDARD** - Für normale Operationen (DEFAULT)
```typescript
return this.executeWithResilience(
  () => this.supabase.from('users').select(),
  {
    // ResiliencePresets.STANDARD ist default - kann weggelassen werden
    context: 'UserService.getUsers',
  }
);

// Perfekt für: Die meisten API Calls
```

### **QUICK** - Für schnelle Operationen
```typescript
return this.executeWithResilience(
  () => this.cache.get('key'),
  {
    ...ResiliencePresets.QUICK, // 2 retries, no circuit breaker, 5s timeout
    context: 'CacheService.get',
  }
);

// Perfekt für: UI Interactions, Cache Reads
```

### **BACKGROUND** - Für Background Tasks
```typescript
return this.executeWithResilience(
  () => this.syncData(),
  {
    ...ResiliencePresets.BACKGROUND, // 2 retries, conservative, 60s timeout
    context: 'SyncService.sync',
  }
);

// Perfekt für: Sync Operations, Batch Processing
```

---

## 🔧 **CUSTOM CONFIGURATION**

### **Example: File Upload mit Custom Settings**
```typescript
return this.executeWithResilience(
  async () => {
    const { data, error } = await this.supabase.storage
      .from('documents')
      .upload(file.name, file);
    
    if (error) throw error;
    return data;
  },
  {
    retry: { strategy: 'aggressive', maxRetries: 5 },
    circuitBreaker: true,
    timeout: 60000, // 60s für große Dateien
    context: 'DocumentService.upload',
  }
);
```

---

## 🛡️ **CIRCUIT BREAKER CHECK**

Prüfe Circuit Breaker bevor du teure Operationen machst:

```typescript
async getLeaveRequests(): Promise<LeaveRequest[]> {
  // Check if circuit breaker is healthy
  if (!this.isCircuitHealthy()) {
    console.warn('Circuit breaker is OPEN, using cached data');
    return this.getCachedLeaveRequests();
  }

  // Proceed with normal operation
  return this.executeWithResilience(
    () => this.supabase.from('leave_requests').select(),
    { context: 'LeaveService.getLeaveRequests' }
  );
}
```

---

## 📊 **MONITORING**

### **Check Circuit Breaker Status:**
```typescript
const stats = this.getCircuitStats();
console.log('Circuit Breaker:', {
  state: stats.state, // CLOSED, OPEN, HALF_OPEN
  totalRequests: stats.totalRequests,
  totalFailures: stats.totalFailures,
  failureCount: stats.failureCount,
});
```

### **Console Logs:**
Die Resilience Patterns loggen automatisch:

```
✅ Retry successful on attempt 2/3
⚠️ Retry attempt 1/3 after 1000ms
🔴 Circuit breaker OPENED (too many failures: 5/5)
🟢 Circuit breaker CLOSED (recovered)
```

---

## 🆘 **ERROR HANDLING**

### **Circuit Breaker Errors:**
```typescript
try {
  const data = await service.getData();
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    // Circuit breaker is OPEN
    toast.error('Service temporarily unavailable. Please try again later.');
    
    // Fallback to cached data
    return getCachedData();
  }
}
```

---

## 📚 **AVAILABLE STRATEGIES**

### **Retry Strategies:**
```typescript
RetryStrategies.AGGRESSIVE   // 5 retries, 500ms initial, 5s max
RetryStrategies.BALANCED     // 3 retries, 1s initial, 30s max (DEFAULT)
RetryStrategies.CONSERVATIVE // 2 retries, 2s initial, 60s max
RetryStrategies.NONE         // No retry
```

### **Timeout Strategies:**
```typescript
TimeoutStrategies.QUICK       // 2s  - UI interactions
TimeoutStrategies.NORMAL      // 10s - API calls (DEFAULT)
TimeoutStrategies.SLOW        // 30s - File uploads
TimeoutStrategies.VERY_SLOW   // 60s - Large uploads
TimeoutStrategies.BACKGROUND  // 2min - Sync operations
```

### **Resilience Presets:**
```typescript
ResiliencePresets.CRITICAL   // Maximum resilience (5 retries)
ResiliencePresets.STANDARD   // Balanced (3 retries) - DEFAULT
ResiliencePresets.QUICK      // Minimal (2 retries)
ResiliencePresets.BACKGROUND // Conservative (2 retries)
ResiliencePresets.NONE       // No resilience
```

---

## ✅ **BEST PRACTICES**

### ✅ **DO:**
1. **Use `executeWithResilience()` für alle external calls**
2. **Wähle das richtige Preset** (CRITICAL, STANDARD, QUICK, BACKGROUND)
3. **Provide descriptive context** (`{ context: 'ServiceName.methodName' }`)
4. **Check circuit breaker** vor teuren Operationen
5. **Use specific timeout strategies** für File Uploads

### ❌ **DON'T:**
1. **Don't use resilience für local operations** (Cache reads, etc.)
2. **Don't over-retry** (max 5 retries)
3. **Don't set timeouts too short** (min 2s für API calls)
4. **Don't ignore circuit breaker state**

---

## 🎓 **QUICK REFERENCE**

| Operation Type | Preset | Config |
|---------------|--------|--------|
| **Authentication** | CRITICAL | 5 retries, 10s timeout |
| **Standard API Call** | STANDARD | 3 retries, 10s timeout |
| **File Upload** | Custom | 5 retries, 60s timeout |
| **Cache Read** | QUICK | 2 retries, 5s timeout |
| **Background Sync** | BACKGROUND | 2 retries, 60s timeout |
| **Local Operation** | NONE | No resilience |

---

## 📖 **FULL DOCUMENTATION**

Für mehr Details siehe:
- **Integration Guide:** `/docs/refactoring/PHASE4_PRIORITY4_INTEGRATION_GUIDE.md`
- **Complete Doc:** `/docs/refactoring/PHASE4_PRIORITY4_COMPLETE.md`

---

## 🎉 **READY TO USE!**

Das war's! Du kannst jetzt Resilience Patterns verwenden.

**3 Schritte:**
1. ✅ Wrap operation in `executeWithResilience()`
2. ✅ Choose appropriate preset
3. ✅ Add context for logging

**Example:**
```typescript
return this.executeWithResilience(
  () => this.supabase.from('users').select(),
  { context: 'UserService.getUsers' }
);
```

**Done!** 🚀

---

**Created:** 2025-01-10  
**Status:** ✅ Production Ready  
**Phase:** 4 - Priority 4 - Resilience Patterns
