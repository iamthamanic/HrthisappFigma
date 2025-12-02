# Browo Koordinator - Workflow System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWO KOORDINATOR                         │
│                  HR Automation Platform                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │      WORKFLOW ENGINE (n8n-style)        │
        └─────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌─────────┐         ┌─────────┐        ┌──────────┐
    │ TRIGGER │         │ ACTIONS │        │  LOGIC   │
    │  NODES  │         │  NODES  │        │  NODES   │
    └─────────┘         └─────────┘        └──────────┘
          │                   │                   │
          │                   │                   │
          ▼                   ▼                   ▼
```

## Phase 3A: HTTP Request Node Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   HTTP REQUEST NODE                          │
└──────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │   FRONTEND   │    │   BACKEND    │
            │  Components  │    │   Executor   │
            └──────────────┘    └──────────────┘
                    │                   │
        ┌───────────┼───────────┐       │
        ▼           ▼           ▼       ▼
   ┌────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐
   │  Node  │ │ Config  │ │ Types  │ │ Execute │
   │ Visual │ │  Panel  │ │ Defs   │ │  Logic  │
   └────────┘ └─────────┘ └────────┘ └─────────┘
```

## Component Architecture

### 1. Frontend Layer

```typescript
// HttpRequestNode.tsx
┌─────────────────────────────────────┐
│      HTTP REQUEST NODE (Visual)     │
├─────────────────────────────────────┤
│ • Method Badge (GET/POST/PUT/...)   │
│ • URL Preview (truncated)           │
│ • Auth Indicator                    │
│ • Status Indicator                  │
└─────────────────────────────────────┘
            │
            │ onClick
            ▼
┌─────────────────────────────────────┐
│    NODE CONFIG PANEL (Sidebar)      │
├─────────────────────────────────────┤
│ 1. Info Card                        │
│ 2. Method Selector                  │
│ 3. URL Input (+ Variables)          │
│ 4. Authentication:                  │
│    - None                           │
│    - API Key (Header/Query)         │
│    - Bearer Token                   │
│    - Basic Auth                     │
│ 5. Custom Headers (JSON)            │
│ 6. Request Body (JSON)              │
│ 7. Advanced Options:                │
│    - Timeout                        │
│    - Retries                        │
│    - Continue on Error              │
│    - Response Variable              │
│ 8. Example Card                     │
└─────────────────────────────────────┘
```

### 2. Backend Layer

```typescript
// actionExecutor.ts - executeHttpRequest()
┌──────────────────────────────────────────┐
│         EXECUTION PIPELINE               │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  1. PARSE VARIABLES                      │
│     {{ employeeName }} → "Max"           │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  2. BUILD AUTHENTICATION                 │
│     • API Key → Header/Query             │
│     • Bearer → Authorization Header      │
│     • Basic → Base64 + Authorization     │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  3. BUILD REQUEST                        │
│     • URL + Query Params                 │
│     • Headers (Auth + Custom)            │
│     • Body (JSON/Form/Raw)               │
│     • Timeout Signal                     │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  4. EXECUTE WITH RETRIES                 │
│     Attempt 1 → Fail                     │
│     Wait 1s (Exponential Backoff)        │
│     Attempt 2 → Fail                     │
│     Wait 2s                              │
│     Attempt 3 → Success ✓                │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  5. HANDLE RESPONSE                      │
│     • Parse JSON/Text                    │
│     • Check Status Code                  │
│     • Store in Context Variable          │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  6. RETURN RESULT                        │
│     • success: true/false                │
│     • message: "HTTP 200 OK"             │
│     • contextUpdates: { var: data }      │
└──────────────────────────────────────────┘
```

## Data Flow

### Workflow Execution

```
USER CREATES WORKFLOW
        │
        ▼
┌──────────────────────┐
│   Workflow Editor    │
│   (React Flow)       │
└──────────────────────┘
        │
        │ Drag & Drop
        ▼
┌──────────────────────┐
│  Add HTTP Request    │
│  Node to Canvas      │
└──────────────────────┘
        │
        │ Click Node
        ▼
┌──────────────────────┐
│  Open Config Panel   │
│  Configure Settings  │
└──────────────────────┘
        │
        │ Save
        ▼
┌──────────────────────┐
│  Store in Database   │
│  (Supabase KV)       │
└──────────────────────┘
        │
        │ Trigger Workflow
        ▼
┌──────────────────────┐
│  Load Workflow JSON  │
│  (nodes + edges)     │
└──────────────────────┘
        │
        │ Execute
        ▼
┌──────────────────────┐
│  Action Executor     │
│  executeHttpRequest()│
└──────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│  EXTERNAL API CALL               │
│  ┌────────────────────────────┐  │
│  │  Slack                     │  │
│  │  GitHub                    │  │
│  │  Jira                      │  │
│  │  n8n                       │  │
│  │  Custom APIs               │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
        │
        │ Response
        ▼
┌──────────────────────┐
│  Store Response in   │
│  Context Variables   │
└──────────────────────┘
        │
        │ Continue
        ▼
┌──────────────────────┐
│  Next Node in        │
│  Workflow            │
└──────────────────────┘
```

## Variable System

```
┌─────────────────────────────────────────┐
│         CONTEXT VARIABLES               │
└─────────────────────────────────────────┘
              │
      ┌───────┴───────┐
      ▼               ▼
┌──────────┐    ┌──────────┐
│ SYSTEM   │    │  CUSTOM  │
│ VARS     │    │  VARS    │
└──────────┘    └──────────┘
      │               │
      │               │
      ▼               ▼
┌──────────────────────────────┐
│ • employeeId                 │
│ • employeeName               │
│ • employeeEmail              │
│ • startDate                  │
│ • endDate                    │
│ • organizationId             │
└──────────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│ • apiResponse (from HTTP)    │
│ • userData (from HTTP)       │
│ • githubIssue (from HTTP)    │
│ • jiraTicket (from HTTP)     │
└──────────────────────────────┘
      │
      │ Used in:
      ▼
┌──────────────────────────────┐
│ • URL: /users/{{ userId }}   │
│ • Body: { "name": "{{...}}"} │
│ • Headers: { "X-User": ...}  │
│ • Email: {{ userData.name }} │
└──────────────────────────────┘
```

## Authentication Flow

```
┌─────────────────────────────────────┐
│     AUTHENTICATION TYPES             │
└─────────────────────────────────────┘
              │
      ┌───────┼────────┬────────┐
      ▼       ▼        ▼        ▼
  ┌──────┐ ┌────┐ ┌──────┐ ┌─────┐
  │ NONE │ │API │ │BEARER│ │BASIC│
  │      │ │KEY │ │TOKEN │ │AUTH │
  └──────┘ └────┘ └──────┘ └─────┘
              │       │       │
              ▼       ▼       ▼
         ┌────────────────────────┐
         │   BUILD HEADERS        │
         └────────────────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │ Headers = {            │
         │   "X-API-Key": "...",  │
         │   "Authorization":     │
         │     "Bearer ..."       │
         │     "Basic ..."        │
         │ }                      │
         └────────────────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │   ATTACH TO REQUEST    │
         └────────────────────────┘
```

## Error Handling & Retry

```
┌──────────────────────────────────────┐
│        HTTP REQUEST ATTEMPT          │
└──────────────────────────────────────┘
              │
              ▼
        ┌──────────┐
        │ Success? │
        └──────────┘
          │    │
     YES  │    │  NO
          │    ▼
          │  ┌─────────────┐
          │  │ Retries > 0?│
          │  └─────────────┘
          │    │    │
          │ YES│    │ NO
          │    │    ▼
          │    │  ┌──────────────┐
          │    │  │Continue on   │
          │    │  │Error = true? │
          │    │  └──────────────┘
          │    │    │      │
          │    │ YES│      │ NO
          │    │    │      │
          │    │    ▼      ▼
          │    │  ┌────┐ ┌────┐
          │    │  │WARN│ │FAIL│
          │    │  └────┘ └────┘
          │    │
          │    ▼
          │  ┌──────────────────┐
          │  │ Exponential      │
          │  │ Backoff Wait     │
          │  │ 1s→2s→4s→8s→10s │
          │  └──────────────────┘
          │    │
          │    ▼
          │  [RETRY]
          │    │
          └────┴──────▼
         ┌──────────────┐
         │   CONTINUE   │
         │   WORKFLOW   │
         └──────────────┘
```

## Integration Points

```
┌────────────────────────────────────────────┐
│      EXTERNAL INTEGRATIONS                 │
└────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │MESSAGING│ │PROJECT │  │AUTOMAT.│
   │         │  │ MGMT   │  │PLATFORM│
   └────────┘  └────────┘  └────────┘
        │           │           │
    ┌───┴───┐   ┌───┴───┐   ┌───┴───┐
    ▼       ▼   ▼       ▼   ▼       ▼
  Slack  Teams GitHub Jira n8n  Zapier
  Discord      Asana   Linear Make.com

                    │
                    ▼
        ┌────────────────────────┐
        │   CUSTOM APIS          │
        │                        │
        │ • Internal Services    │
        │ • Legacy Systems       │
        │ • Microservices        │
        │ • Webhooks            │
        │ • Analytics           │
        └────────────────────────┘
```

## File Structure

```
/
├── components/
│   └── workflows/
│       ├── nodes/
│       │   ├── HttpRequestNode.tsx      ← Visual Node
│       │   ├── ActionNode.tsx
│       │   └── TriggerNode.tsx
│       └── NodeConfigPanel.tsx          ← Config UI
│
├── supabase/
│   └── functions/
│       └── BrowoKoordinator-Workflows/
│           └── actionExecutor.ts        ← Execution Logic
│
├── types/
│   └── workflow.ts                      ← Type Definitions
│
├── screens/
│   └── admin/
│       └── WorkflowDetailScreen.tsx     ← Workflow Editor
│
└── docs/
    ├── HTTP_REQUEST_NODE.md             ← Documentation
    ├── HTTP_REQUEST_EXAMPLES.json       ← Examples
    ├── PHASE_3A_QUICKSTART.md          ← Quick Start
    └── ARCHITECTURE.md                  ← This file
```

## Performance Considerations

```
┌─────────────────────────────────────┐
│      PERFORMANCE OPTIMIZATIONS       │
└─────────────────────────────────────┘

1. TIMEOUT PROTECTION
   ├─ User-configurable (1-300s)
   ├─ AbortSignal for clean cancellation
   └─ Prevents hanging workflows

2. RETRY STRATEGY
   ├─ Exponential Backoff
   ├─ Max 10s delay between retries
   └─ Configurable retry count (0-5)

3. MEMORY MANAGEMENT
   ├─ Stream processing for large responses
   ├─ Selective variable storage
   └─ Garbage collection friendly

4. NETWORK EFFICIENCY
   ├─ Native fetch (no axios overhead)
   ├─ Reusable connections
   └─ Compression support
```

## Security Model

```
┌─────────────────────────────────────┐
│         SECURITY LAYERS              │
└─────────────────────────────────────┘
              │
      ┌───────┼───────┐
      ▼       ▼       ▼
  ┌──────┐ ┌────┐ ┌─────┐
  │INPUT │ │AUTH│ │RESP │
  │VALID.│ │    │ │VALID│
  └──────┘ └────┘ └─────┘
      │       │       │
      ▼       ▼       ▼

1. Input Validation
   ├─ URL format validation
   ├─ JSON parsing with error handling
   └─ Type checking (TypeScript)

2. Authentication Security
   ├─ Password type inputs
   ├─ No API keys in logs
   └─ HTTPS enforcement (recommended)

3. Response Validation
   ├─ Status code checking
   ├─ Content-type detection
   └─ Size limits (future)

4. Future Enhancements
   ├─ Environment variables for secrets
   ├─ Rate limiting
   ├─ IP whitelisting
   └─ Request signing
```

---

**Version:** 1.0.0  
**Last Updated:** November 30, 2025  
**Status:** ✅ Phase 3A Complete
