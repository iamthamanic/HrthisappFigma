# 🏗️ BROWO KOORDINATOR - REFACTORING MASTERPLAN

**Projekt:** HRthis → Browo Koordinator  
**Typ:** Complete Rename + Edge Function Modularization  
**Status:** Planning Phase  
**Datum:** 26. Oktober 2025

---

## 📊 IST-ANALYSE

### 1.1 Haupt-Edge Function

**Datei:** `/supabase/functions/server/index.tsx`  
**Größe:** 837 Zeilen  
**Status:** ✅ Monolith (alle Routes in einer Function)

---

### 1.2 Alle Routes (Gruppiert nach Domain)

```
DOMAIN: Health & Diagnostics
├── GET  /make-server-f659121d/health
└── GET  /make-server-f659121d/storage/status

DOMAIN: Storage - Company Logos
├── POST   /make-server-f659121d/logo/upload
└── DELETE /make-server-f659121d/logo/:organizationId

DOMAIN: Storage - Profile Pictures
├── POST   /make-server-f659121d/profile-picture/upload
└── DELETE /make-server-f659121d/profile-picture/:userId

DOMAIN: Storage - Documents
├── POST   /make-server-f659121d/documents/upload
├── DELETE /make-server-f659121d/documents
└── GET    /make-server-f659121d/storage/sign

DOMAIN: Time Management (DISABLED - fehlende Dependencies)
├── POST /make-server-f659121d/time-account/calculate        (COMMENTED OUT)
├── POST /make-server-f659121d/time-account/calculate-all    (COMMENTED OUT)
└── GET  /make-server-f659121d/time-account/:userId/:month/:year

DOMAIN: User Management
└── POST /make-server-f659121d/users/create
```

**TOTAL:** 13 Routes (2 disabled)

---

### 1.3 Frontend API Calls

**Services (bereits modular):**
```
/services/
├── HRTHIS_announcementService.ts    → Announcements
├── HRTHIS_auditLogService.ts        → Audit Logs
├── HRTHIS_authService.ts            → Authentication
├── HRTHIS_benefitsService.ts        → Benefits System
├── HRTHIS_coinAchievementsService.ts → Gamification
├── HRTHIS_documentAuditService.ts   → Document Audit
├── HRTHIS_documentService.ts        → Documents (uses Edge Function)
├── HRTHIS_learningService.ts        → Learning Management
├── HRTHIS_leaveService.ts           → Leave/Vacation
├── HRTHIS_notificationService.ts    → Notifications
├── HRTHIS_organigramService.ts      → Organization Chart
├── HRTHIS_realtimeService.ts        → Realtime Subscriptions
├── HRTHIS_teamService.ts            → Team Management
├── HRTHIS_userService.ts            → User Management
└── base/
    ├── ApiService.ts                → Base Class
    └── ApiError.ts                  → Error Handling
```

**Edge Function API Calls gefunden in:**
- `/stores/HRTHIS_adminStore.ts` → `/users/create` Endpoint
- Frontend Services nutzen DIREKT Supabase Client (KEIN Gateway!)

**❌ PROBLEM:** Kein zentrales API Gateway im Frontend!  
**❌ PROBLEM:** Services machen direkte Supabase Calls, NICHT zu Edge Functions

---

### 1.4 Shared Code in Edge Function

**Supabase Client:**
```typescript
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
```

**Storage Buckets:**
```typescript
const LOGO_BUCKET = 'make-f659121d-company-logos';
const PROFILE_BUCKET = 'make-f659121d-profile-pictures';
const ANNOUNCEMENTS_BUCKET = 'make-f659121d-announcements';
const DOCUMENTS_BUCKET = 'make-f659121d-documents';
```

**Helper Functions:**
- `ensureBucketExists(bucketName)`
- `initializeAllBuckets()`

**CORS Config:**
```typescript
cors({
  origin: '*',
  credentials: true,
  allowHeaders: [...],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
})
```

**Error Handling:** Console.log basiert, strukturiert

**Auth Middleware:** ❌ NICHT implementiert (keine Auth Checks in Routes)

---

## 🎯 ZIEL-ARCHITEKTUR

### 2.1 Edge Function Map (Modular)

```
/supabase/functions/
├── browo-health/index.ts              → Health & Diagnostics
│   ├── GET /health
│   └── GET /storage/status
│
├── browo-storage/index.ts             → ALL Storage Operations
│   ├── POST   /logo/upload
│   ├── DELETE /logo/:organizationId
│   ├── POST   /profile-picture/upload
│   ├── DELETE /profile-picture/:userId
│   ├── POST   /documents/upload
│   ├── DELETE /documents
│   └── GET    /storage/sign
│
├── browo-users/index.ts               → User Management
│   └── POST /users/create
│
└── browo-time/index.ts                → Time Management (Future)
    ├── POST /time-account/calculate
    ├── POST /time-account/calculate-all
    └── GET  /time-account/:userId/:month/:year
```

**Anzahl Functions:** 4 (Health + Storage + Users + Time)

---

### 2.2 Naming Convention

**Edge Functions:**
- Format: `browo-[domain]`
- Beispiele: `browo-storage`, `browo-users`, `browo-health`

**Storage Buckets:**
- Format: `browo-koordinator-[type]`
- Beispiele:
  - `browo-koordinator-company-logos`
  - `browo-koordinator-profile-pictures`
  - `browo-koordinator-documents`
  - `browo-koordinator-announcements`

**Frontend Dateien:**
- Services: `Browo_[domain]Service.ts`
- Components: `Browo_[ComponentName].tsx`
- Hooks: `Browo_use[HookName].ts`
- Stores: `Browo_[domain]Store.ts`

---

### 2.3 Shared Code Strategy

**Option A: Copy-Paste in jede Function (EMPFOHLEN für Figma Make)**
- ✅ Jede Function ist unabhängig
- ✅ Kein Import-Chaos
- ✅ Einfaches Deployment
- ❌ Code-Duplikation

**Option B: Shared Utils Datei** (NICHT MÖGLICH in Figma Make)
- ❌ Figma Make erlaubt keine shared imports zwischen Functions

**ENTSCHEIDUNG: Option A** - Copy-Paste Shared Code

**Was muss in JEDE Function:**
```typescript
// 1. Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// 2. CORS Config
app.use('/*', cors({ origin: '*', ... }));

// 3. Logger
app.use('*', logger(console.log));

// 4. Error Handling Pattern
try {
  // ...
} catch (error: any) {
  console.error('[Function Name] Error:', error);
  return c.json({ error: error.message }, 500);
}

// 5. Bucket Names (nur für Storage Function)
const LOGO_BUCKET = 'browo-koordinator-company-logos';
// ...

// 6. Helper Functions (nur für Storage Function)
async function ensureBucketExists(bucketName: string) { ... }
```

---

## 📋 MIGRATION CHECKLIST

### PHASE 1: Vorbereitung (Woche 1)

**Step 1.1: Project Rename** ⏳
- [ ] Umbenennung: `HRthis` → `Browo Koordinator`
- [ ] Alle `HRTHIS_*` Dateien → `Browo_*`
- [ ] Alle `hrthis` imports → `browo`
- [ ] `package.json` name update
- [ ] README.md update
- [ ] Dokumentation update

**Files betroffen:** ~150+ Dateien

**Tools:**
```bash
# Step 1: Rename all files
find . -name "HRTHIS_*" -type f -exec bash -c 'mv "$0" "${0/HRTHIS_/Browo_}"' {} \;

# Step 2: Replace in file contents
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/HRTHIS_/Browo_/g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/HRthis/Browo Koordinator/g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/hrthis/browo/g' {} +
```

**Step 1.2: Frontend API Gateway erstellen** ⏳
```typescript
// /lib/api-gateway.ts
const FUNCTION_ROUTES = {
  '/health': 'browo-health',
  '/storage': 'browo-storage',
  '/logo': 'browo-storage',
  '/profile-picture': 'browo-storage',
  '/documents': 'browo-storage',
  '/users': 'browo-users',
  '/time-account': 'browo-time',
};

export async function apiGateway(path: string, options: RequestInit) {
  const functionName = FUNCTION_ROUTES[getBasePath(path)];
  const url = `https://${projectId}.supabase.co/functions/v1/${functionName}${path}`;
  return fetch(url, options);
}
```

**Step 1.3: API Client umbauen** ⏳
```typescript
// /services/base/ApiService.ts
import { apiGateway } from '../../lib/api-gateway';

export class ApiService {
  protected async request(path: string, options: RequestInit) {
    return apiGateway(path, options);
  }
}
```

---

### PHASE 2: Edge Functions Migration (Woche 2-3)

**Step 2.1: browo-health Function** ⏳
- [ ] File erstellen: `/supabase/functions/browo-health/index.ts`
- [ ] Routes extrahieren: `/health`, `/storage/status`
- [ ] Shared Code kopieren
- [ ] Deployen via Supabase Dashboard
- [ ] Testen

**Step 2.2: browo-storage Function** ⏳
- [ ] File erstellen: `/supabase/functions/browo-storage/index.ts`
- [ ] Routes extrahieren: Alle Storage-Routes
- [ ] Bucket Management kopieren
- [ ] Helper Functions kopieren
- [ ] Deployen
- [ ] Testen

**Step 2.3: browo-users Function** ⏳
- [ ] File erstellen: `/supabase/functions/browo-users/index.ts`
- [ ] Route extrahieren: `/users/create`
- [ ] Auth Logic kopieren
- [ ] Deployen
- [ ] Testen

**Step 2.4: browo-time Function (Optional)** ⏳
- [ ] File erstellen: `/supabase/functions/browo-time/index.ts`
- [ ] Fehlende Dependencies implementieren (`timeAccountCalculation.ts`)
- [ ] Routes aktivieren
- [ ] Deployen
- [ ] Testen

---

### PHASE 3: Storage Bucket Migration (Woche 3)

**Step 3.1: Bucket Renaming** ⏳
```sql
-- Run in Supabase SQL Editor
-- CANNOT rename buckets directly, must create new + migrate

-- 1. Create new buckets
-- Run via Edge Function startup or manually
```

**Step 3.2: Data Migration** ⏳
- [ ] Copy files from old buckets to new buckets
- [ ] Update database URLs (logos, profile_pictures, documents)
- [ ] Test all uploads/downloads
- [ ] Delete old buckets

---

### PHASE 4: Cleanup (Woche 4)

**Step 4.1: Old Function deaktivieren** ⏳
- [ ] Alte `/supabase/functions/server/` Function löschen
- [ ] Alle References entfernen
- [ ] `make-server-f659121d` aus Code entfernen

**Step 4.2: Dokumentation** ⏳
- [ ] API Docs schreiben
- [ ] Migration Guide schreiben
- [ ] Architecture Diagram erstellen

**Step 4.3: Performance Check** ⏳
- [ ] Load Testing
- [ ] Error Monitoring
- [ ] Logs überprüfen

---

## ⚠️ RISIKEN & EMPFEHLUNGEN

### Potenzielle Probleme

**1. Breaking Changes**
- ❌ Alle Frontend API Calls ändern sich
- ❌ Storage URLs ändern sich (Bucket Namen)
- ✅ LÖSUNG: Feature Flag System für schrittweise Migration

**2. Dependencies**
- ❌ `timeAccountCalculation.ts` existiert nicht → Time Routes funktionieren nicht
- ✅ LÖSUNG: Entweder implementieren ODER weglassen

**3. Auth**
- ❌ KEINE Auth Middleware in aktuellen Routes
- ⚠️ SICHERHEITSRISIKO: Jeder kann User erstellen!
- ✅ LÖSUNG: Auth Middleware implementieren:
```typescript
async function requireAuth(c: Context) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  return user;
}
```

**4. Storage Migration**
- ⚠️ File URLs im DB hardcoded → müssen geupdatet werden
- ⚠️ Downtime während Migration
- ✅ LÖSUNG: Blue-Green Deployment (beide Buckets parallel)

**5. Performance**
- ⚠️ Mehr Functions = mehr Cold Starts
- ⚠️ Latency könnte steigen
- ✅ LÖSUNG: Keep-Alive Pings für kritische Functions

---

### Best Practices

**1. Testing Strategy**
```typescript
// Test alle Edge Functions
// /tests/edge-functions/browo-storage.test.ts
describe('browo-storage', () => {
  it('should upload logo', async () => {
    const response = await fetch(`${EDGE_FUNCTION_URL}/logo/upload`, {...});
    expect(response.status).toBe(200);
  });
});
```

**2. Error Handling**
```typescript
// Strukturiertes Error Logging
try {
  // ...
} catch (error: any) {
  console.error('❌ [browo-storage] Logo upload failed:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    organizationId: organizationId,
  });
  
  return c.json({ 
    error: 'Upload failed',
    details: error.message,
    code: 'LOGO_UPLOAD_ERROR'
  }, 500);
}
```

**3. Monitoring**
- [ ] Supabase Dashboard Logs checken
- [ ] Error Tracking (Sentry?)
- [ ] Performance Metrics
- [ ] Usage Analytics

**4. Documentation**
```markdown
# Browo Koordinator API Documentation

## browo-storage

### POST /logo/upload
Upload company logo

**Request:**
- Content-Type: multipart/form-data
- Authorization: Bearer {token}

**Body:**
- file: File
- organizationId: string

**Response:**
{
  "publicUrl": "https://..."
}
```

---

## 🚀 QUICK START (für andere Claude Instanzen)

### Wenn du nur EINEN Schritt machst:

**SCHRITT 1: Projekt umbenennen**
```bash
# Alle HRTHIS_ → Browo_
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/HRTHIS_/Browo_/g' {} +

# Alle HRthis → Browo Koordinator
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/HRthis/Browo Koordinator/g' {} +
```

**SCHRITT 2: Erste Edge Function erstellen**
1. `/supabase/functions/browo-health/index.ts` erstellen
2. Health + Storage Status Routes migrieren
3. Im Supabase Dashboard deployen
4. Testen

**SCHRITT 3: API Gateway**
1. `/lib/api-gateway.ts` erstellen
2. Routing Logic implementieren
3. Services umbauen auf Gateway

---

## 📊 ZEITSCHÄTZUNG

| Phase | Aufgaben | Geschätzte Zeit | Risiko |
|-------|----------|-----------------|--------|
| Phase 1 | Rename + Gateway | 2-3 Tage | Niedrig |
| Phase 2 | Edge Functions | 5-7 Tage | Mittel |
| Phase 3 | Storage Migration | 2-3 Tage | Hoch |
| Phase 4 | Cleanup + Docs | 2 Tage | Niedrig |
| **TOTAL** | | **11-15 Tage** | |

---

## ✅ NEXT STEPS

**Wenn du JA sagst:**
1. Ich rename das komplette Projekt (HRTHIS → Browo)
2. Ich erstelle die erste Edge Function `browo-health`
3. Ich erstelle das API Gateway System
4. Wir deployen schrittweise

**Wenn du NEIN sagst:**
- Wir behalten HRthis als Namen
- Wir machen nur die Edge Function Modularisierung

**Deine Entscheidung?** 🤔
