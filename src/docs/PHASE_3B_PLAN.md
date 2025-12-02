# Phase 3B: Advanced HTTP Features - Implementation Plan

## 🎯 Ziele

Erweitere das HTTP Request Node System mit professionellen Enterprise-Features:
- OAuth2 Flow Support
- File Upload (Multipart/Form-Data)
- GraphQL Query Support
- Response Validation
- Environment Variables für API Keys
- Rate Limiting
- Request Caching

## 📋 Features Overview

### 1. OAuth2 Support (Priority: HIGH) ⭐⭐⭐
**Status:** 🔨 In Progress

**Funktionalität:**
- OAuth2 Authorization Code Flow
- Automatic Token Refresh
- Token Storage in Context
- Support für Google, GitHub, Microsoft, Custom Providers

**Components:**
```typescript
- OAuth2Config Component (NodeConfigPanel)
- OAuth2 Token Manager (Backend)
- Token Storage (KV Store)
- Refresh Token Logic
```

**Use Cases:**
- Google APIs (Gmail, Calendar, Drive)
- GitHub API (ohne PAT)
- Microsoft Graph API
- Slack API
- Custom OAuth2 APIs

### 2. File Upload Support (Priority: HIGH) ⭐⭐⭐
**Status:** 🔨 In Progress

**Funktionalität:**
- Multipart/Form-Data Support
- File Selection UI
- Base64 Encoding
- Multiple Files Support
- Progress Tracking

**Components:**
```typescript
- FileUploadConfig Component
- Multipart Form Builder
- File Input Handler
- Upload Progress Tracker
```

**Use Cases:**
- S3 File Upload
- Image Upload zu APIs
- Document Processing
- CSV/Excel Import to External Systems

### 3. GraphQL Support (Priority: MEDIUM) ⭐⭐
**Status:** 📝 Planned

**Funktionalität:**
- GraphQL Query Editor
- Variables Support
- Syntax Highlighting
- Query Validation
- Response Parsing

**Components:**
```typescript
- GraphQLConfig Component
- Query Editor with Syntax Highlight
- GraphQL Query Executor
- Schema Introspection (Future)
```

**Use Cases:**
- GitHub GraphQL API
- Shopify API
- Hasura/Supabase GraphQL
- Custom GraphQL Endpoints

### 4. Response Validation (Priority: MEDIUM) ⭐⭐
**Status:** 📝 Planned

**Funktionalität:**
- JSON Schema Validation
- Custom Validation Rules
- Type Checking
- Error Messages

**Components:**
```typescript
- ValidationConfig Component
- JSON Schema Validator
- Response Type Checker
- Validation Error Handler
```

**Use Cases:**
- API Contract Testing
- Data Quality Checks
- Fail-Fast on Invalid Data
- Schema Migration Detection

### 5. Environment Variables (Priority: HIGH) ⭐⭐⭐
**Status:** 🔨 In Progress

**Funktionalität:**
- Secure API Key Storage
- Environment Variable UI
- Variable Encryption
- Per-Organization Scope

**Components:**
```typescript
- EnvVarManager Component
- Secure Storage (Supabase)
- Variable Resolver
- Encryption/Decryption
```

**Use Cases:**
- API Keys verwalten
- Secrets nicht in Workflows hardcoden
- Multi-Environment Support (Dev/Prod)
- Team-weite Secrets

### 6. Rate Limiting (Priority: MEDIUM) ⭐⭐
**Status:** 📝 Planned

**Funktionalität:**
- Requests/Minute Limiting
- Per-API Rate Limits
- Queue Management
- Retry-After Handling

**Components:**
```typescript
- RateLimiter Class
- Request Queue
- Rate Limit Config UI
- 429 Response Handler
```

**Use Cases:**
- API Rate Limit Compliance
- Cost Control
- Fair Usage
- Prevent API Bans

### 7. Request Caching (Priority: LOW) ⭐
**Status:** 📝 Planned

**Funktionalität:**
- Response Caching
- TTL Configuration
- Cache Invalidation
- Memory/KV Storage

**Components:**
```typescript
- CacheManager
- Cache Config UI
- TTL Handler
- Cache Key Generator
```

**Use Cases:**
- Reduce API Calls
- Cost Optimization
- Performance Improvement
- Offline Support (partial)

## 🏗️ Implementation Order

### Week 1: Core Advanced Features
1. ✅ Environment Variables System (Day 1-2)
2. ✅ OAuth2 Basic Flow (Day 3-4)
3. ✅ File Upload Support (Day 5-6)
4. ✅ GraphQL Support (Day 7)

### Week 2: Quality & Optimization
1. Response Validation (Day 1-2)
2. Rate Limiting (Day 3-4)
3. Request Caching (Day 5)
4. Testing & Documentation (Day 6-7)

## 📐 Technical Architecture

### Environment Variables

```
┌─────────────────────────────────────┐
│     ENVIRONMENT VARIABLES            │
└─────────────────────────────────────┘
              │
      ┌───────┴───────┐
      ▼               ▼
┌──────────┐    ┌──────────┐
│ ADMIN UI │    │ STORAGE  │
│          │    │ (KV)     │
└──────────┘    └──────────┘
      │               │
      ▼               ▼
┌──────────────────────────────┐
│ • Create/Edit/Delete Vars    │
│ • Organization Scoped        │
│ • Encrypted Storage          │
│ • Usage in Workflows         │
└──────────────────────────────┘
      │
      │ Usage:
      ▼
┌──────────────────────────────┐
│ URL: {{ env.API_BASE_URL }}  │
│ Token: {{ env.GITHUB_TOKEN }}│
│ Key: {{ env.SLACK_KEY }}     │
└──────────────────────────────┘
```

### OAuth2 Flow

```
┌─────────────────────────────────────┐
│         OAUTH2 FLOW                  │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. User initiates OAuth2            │
│    Configure: Client ID, Secret,    │
│    Scopes, Redirect URI              │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 2. Redirect to Provider              │
│    (Google, GitHub, etc.)            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 3. User Authorizes                   │
│    Provider redirects back           │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 4. Exchange Code for Tokens          │
│    Access Token + Refresh Token      │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 5. Store Tokens (Encrypted)          │
│    Use in HTTP Requests              │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 6. Auto-Refresh on Expiry            │
│    Transparent Token Management      │
└─────────────────────────────────────┘
```

### File Upload Flow

```
┌─────────────────────────────────────┐
│        FILE UPLOAD                   │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. Select File(s)                    │
│    UI: File Input + Preview          │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 2. Build Multipart Form              │
│    Content-Type: multipart/form-data │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 3. Upload with Progress              │
│    Track: bytes sent / total         │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 4. Handle Response                   │
│    Store file URL/ID in context      │
└─────────────────────────────────────┘
```

## 🔧 Type Definitions

```typescript
// Environment Variables
interface EnvironmentVariable {
  id: string;
  organizationId: string;
  key: string;
  value: string; // Encrypted
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// OAuth2
interface OAuth2Config {
  provider: 'google' | 'github' | 'microsoft' | 'custom';
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authUrl?: string; // For custom
  tokenUrl?: string; // For custom
  redirectUri: string;
}

interface OAuth2Token {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
}

// File Upload
interface FileUploadConfig {
  fieldName: string;
  maxFileSize?: number; // bytes
  allowedTypes?: string[]; // MIME types
  multipleFiles?: boolean;
}

// GraphQL
interface GraphQLConfig {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

// Response Validation
interface ResponseValidationConfig {
  enabled: boolean;
  schema?: object; // JSON Schema
  customRules?: ValidationRule[];
}

// Rate Limiting
interface RateLimitConfig {
  requestsPerMinute: number;
  burstSize?: number;
  retryAfter?: boolean;
}

// Caching
interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  key?: string; // Custom cache key
}
```

## 📚 File Structure

```
/components/workflows/
  ├── nodes/
  │   └── HttpRequestNode.tsx (existing)
  ├── NodeConfigPanel.tsx (extend)
  └── config/
      ├── OAuth2Config.tsx (new)
      ├── FileUploadConfig.tsx (new)
      ├── GraphQLConfig.tsx (new)
      └── ResponseValidationConfig.tsx (new)

/screens/admin/
  ├── WorkflowDetailScreen.tsx (existing)
  └── EnvironmentVariablesScreen.tsx (new)

/supabase/functions/BrowoKoordinator-Workflows/
  ├── actionExecutor.ts (extend)
  ├── oauth2Manager.ts (new)
  ├── rateLimiter.ts (new)
  └── cacheManager.ts (new)

/types/
  └── workflow.ts (extend)

/docs/
  ├── OAUTH2_GUIDE.md (new)
  ├── FILE_UPLOAD_GUIDE.md (new)
  ├── GRAPHQL_GUIDE.md (new)
  └── ENV_VARS_GUIDE.md (new)
```

## ✅ Success Criteria

### Environment Variables
- [ ] UI to manage env vars per organization
- [ ] Encrypted storage in KV store
- [ ] Usage in workflows: `{{ env.KEY_NAME }}`
- [ ] Works with all HTTP configs (URL, headers, body)

### OAuth2
- [ ] Support Google, GitHub, Microsoft
- [ ] Authorization flow working
- [ ] Token storage & retrieval
- [ ] Automatic token refresh
- [ ] Custom provider support

### File Upload
- [ ] File selection UI
- [ ] Multipart form-data builder
- [ ] Upload progress tracking
- [ ] Multiple files support
- [ ] Works with S3, Image APIs, etc.

### GraphQL
- [ ] Query editor with syntax highlighting
- [ ] Variables support
- [ ] Execute GraphQL queries
- [ ] Parse responses correctly

### Response Validation
- [ ] JSON Schema validation
- [ ] Custom validation rules
- [ ] Clear error messages
- [ ] Fail workflow on invalid response

### Rate Limiting
- [ ] Configurable requests/minute
- [ ] Queue management
- [ ] 429 handling
- [ ] Per-API limits

### Caching
- [ ] Response caching
- [ ] TTL configuration
- [ ] Cache invalidation
- [ ] Cache hit/miss logging

## 🚀 Quick Start

Nach Phase 3B kannst du:

```typescript
// 1. Environment Variables
URL: {{ env.API_BASE_URL }}/users
Headers: { "Authorization": "{{ env.API_KEY }}" }

// 2. OAuth2
Auth Type: OAuth2
Provider: Google
Scopes: [gmail.send, calendar.events]
→ Automatic token management!

// 3. File Upload
Method: POST
Body Type: Multipart
Files: [employee-photo.jpg, contract.pdf]
→ Upload to S3, Cloudinary, etc.

// 4. GraphQL
Method: POST (GraphQL)
Query: |
  query GetUser($id: ID!) {
    user(id: $id) {
      name
      email
    }
  }
Variables: { "id": "{{ employeeId }}" }

// 5. Response Validation
Validate Response: true
Schema: {
  "type": "object",
  "required": ["id", "status"],
  "properties": {
    "id": { "type": "string" },
    "status": { "type": "string", "enum": ["success"] }
  }
}
→ Fail if response doesn't match!
```

## 📈 Roadmap Timeline

**Day 1-2:** Environment Variables ✅  
**Day 3-4:** OAuth2 Basic Flow ✅  
**Day 5-6:** File Upload Support ✅  
**Day 7:** GraphQL Support ✅  
**Day 8-9:** Response Validation  
**Day 10-11:** Rate Limiting  
**Day 12:** Request Caching  
**Day 13-14:** Testing & Documentation  

---

**Phase 3B Start:** December 1, 2025  
**Estimated Completion:** December 14, 2025  
**Status:** 🔨 IN PROGRESS

Let's build! 🚀
