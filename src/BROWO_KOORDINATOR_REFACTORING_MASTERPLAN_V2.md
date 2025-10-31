# 🏗️ BROWO KOORDINATOR - REFACTORING MASTERPLAN V2

**Projekt:** HRthis → Browo Koordinator  
**Naming:** `HRTHIS_` → `BrowoKo_`  
**Typ:** Complete Rename + Edge Function Modularization  
**Status:** Planning Phase  
**Datum:** 26. Oktober 2025

---

## 🎯 EXECUTIVE SUMMARY

### Was wird gemacht?

1. **COMPLETE RENAME:** `HRTHIS_*` → `BrowoKo_*` in ~150+ Dateien
2. **LOGO REPLACEMENT:** Neue Browo Koordinator Logos überall einbauen
3. **EDGE FUNCTIONS:** Monolith in **4-6 modulare Functions** aufteilen
4. **API GATEWAY:** Zentrale Routing-Logik im Frontend
5. **STORAGE BUCKETS:** Umbenennung von `make-f659121d-*` → `browo-koordinator-*`
6. **SUPABASE PROJECT:** Umbenennung in Supabase Dashboard

---

## 📊 EDGE FUNCTION ANALYSE

### Current State (Monolith)

**File:** `/supabase/functions/server/index.tsx` (837 Zeilen)

**Routes im Monolith:**
```
✅ GET  /make-server-f659121d/health
✅ GET  /make-server-f659121d/storage/status
✅ POST /make-server-f659121d/logo/upload
✅ DELETE /make-server-f659121d/logo/:organizationId
✅ POST /make-server-f659121d/profile-picture/upload
✅ DELETE /make-server-f659121d/profile-picture/:userId
✅ POST /make-server-f659121d/documents/upload
✅ DELETE /make-server-f659121d/documents
✅ GET  /make-server-f659121d/storage/sign
❌ POST /make-server-f659121d/time-account/calculate (DISABLED)
❌ POST /make-server-f659121d/time-account/calculate-all (DISABLED)
✅ GET  /make-server-f659121d/time-account/:userId/:month/:year
✅ POST /make-server-f659121d/users/create
```

**TOTAL:** 13 Routes (2 disabled wegen fehlender Dependencies)

---

### Frontend Services Analyse

**Alle Services in `/services/`:**

| Service | Nutzt Edge Function? | Nutzt Supabase direkt? | Backend Needed? |
|---------|---------------------|------------------------|-----------------|
| `announcementService` | ❌ | ✅ | Optional |
| `auditLogService` | ❌ | ✅ | Optional |
| `authService` | ❌ | ✅ Supabase Auth | ✅ Braucht Edge Function |
| `benefitsService` | ❌ | ✅ | Optional |
| `coinAchievementsService` | ❌ | ✅ | Optional |
| `documentAuditService` | ❌ | ✅ | Optional |
| `documentService` | ✅ | ❌ | ✅ Storage Upload |
| `learningService` | ❌ | ✅ | Optional |
| `leaveService` | ❌ | ✅ | Optional |
| `notificationService` | ❌ | ✅ | Optional |
| `organigramService` | ❌ | ✅ | Optional |
| `realtimeService` | ❌ | ✅ | N/A (Realtime) |
| `teamService` | ❌ | ✅ | Optional |
| `userService` | ✅ (1 Call) | ✅ | ✅ User Creation |

**FINDINGS:**
- ⚠️ **NUR 2 Services nutzen Edge Functions!**
- ⚠️ **Die meisten Services machen DIREKTE Supabase Calls**
- ⚠️ **Keine API Gateway Architektur vorhanden**

**PROBLEM:** Das widerspricht Best Practices! Edge Functions sollten für:
1. File Uploads (Storage)
2. Admin Operations (User Creation)
3. Complex Business Logic
4. Auth Operations

---

## 🎯 EMPFOHLENE EDGE FUNCTION ARCHITEKTUR

### Option 1: MINIMAL (4 Functions) - EMPFOHLEN für Start

```
/supabase/functions/
├── browo-health/          → Health Checks
│   ├── GET /health
│   └── GET /storage/status
│
├── browo-storage/         → ALL File Operations
│   ├── POST   /logo/upload
│   ├── DELETE /logo/:organizationId
│   ├── POST   /profile-picture/upload
│   ├── DELETE /profile-picture/:userId
│   ├── POST   /documents/upload
│   ├── DELETE /documents
│   └── GET    /storage/sign
│
├── browo-users/           → User Management
│   └── POST /users/create
│
└── browo-time/            → Time Management (Future)
    ├── POST /time-account/calculate
    ├── POST /time-account/calculate-all
    └── GET  /time-account/:userId/:month/:year
```

**PRO:**
- ✅ Klein und überschaubar
- ✅ Schnell migriert
- ✅ Weniger Deployment Komplexität
- ✅ Deckt aktuelle Needs ab

**CON:**
- ❌ Keine Skalierung für zukünftige Features

---

### Option 2: MODULAR (8-10 Functions) - Zukunftssicher

```
/supabase/functions/
├── browo-health/          → Health & Diagnostics
├── browo-storage/         → File Storage Operations
├── browo-auth/            → Authentication & Authorization
├── browo-users/           → User CRUD
├── browo-teams/           → Team Management
├── browo-leave/           → Leave Requests & Approvals
├── browo-learning/        → Learning System
├── browo-benefits/        → Benefits & Coin Shop
├── browo-documents/       → Document Management
└── browo-time/            → Time Tracking
```

**PRO:**
- ✅ Klare Separation of Concerns
- ✅ Skalierbar für zukünftige Features
- ✅ Einfacher zu warten
- ✅ Bessere Performance (kleinere Functions)

**CON:**
- ❌ Mehr Aufwand bei Migration
- ❌ Mehr Functions = mehr Cold Starts
- ❌ Komplexeres API Gateway

---

### Option 3: HYBRID (6 Functions) - BESTE BALANCE ⭐

```
/supabase/functions/
├── browo-health/          → Health Checks
│   └── GET /health, /storage/status
│
├── browo-storage/         → ALL Storage Operations
│   └── Logos, Profile Pics, Documents
│
├── browo-admin/           → Admin Operations
│   ├── POST /users/create
│   ├── POST /teams/create
│   ├── POST /benefits/approve
│   └── POST /leave/approve-admin
│
├── browo-users/           → User Self-Service
│   ├── GET  /users/me
│   ├── PUT  /users/me
│   └── POST /users/change-password
│
├── browo-data/            → Business Logic
│   ├── Time Calculations
│   ├── Leave Calculations
│   ├── Coin Calculations
│   └── Learning Progress
│
└── browo-realtime/        → Realtime Triggers
    ├── Notification Triggers
    ├── Live Updates
    └── Event Processing
```

**PRO:**
- ✅ Gute Balance zwischen Modularität und Komplexität
- ✅ Logische Gruppierung
- ✅ Zukunftssicher
- ✅ Nicht zu viele Functions

**CON:**
- ❌ Mehr Aufwand als Option 1

---

## 🏆 MEINE EMPFEHLUNG

**START: Option 1 (Minimal - 4 Functions)**  
**SPÄTER: Option 3 (Hybrid - 6 Functions)**

### Warum?

1. **Phase 1 (Jetzt):** Migriere nur was EXISTIERT
   - Health, Storage, Users, Time
   - Schnell deploybar
   - Minimales Risiko

2. **Phase 2 (Später):** Erweitere auf Hybrid
   - Wenn neue Features kommen
   - Wenn Services von Supabase → Edge Functions migrieren
   - Wenn Performance Probleme auftreten

---

## 📋 NAMING CONVENTION (AKTUALISIERT)

### File Naming

**Frontend Files:**
```
VORHER:                          NACHHER:
HRTHIS_announcementService.ts → BrowoKo_announcementService.ts
HRTHIS_AvatarStatsGrid.tsx   → BrowoKo_AvatarStatsGrid.tsx
HRTHIS_useCalendarScreen.ts  → BrowoKo_useCalendarScreen.ts
hrthis_systemprompt.md        → browoko_systemprompt.md
```

**Edge Functions:**
```
/supabase/functions/
  browo-health/
  browo-storage/
  browo-users/
  browo-time/
```

**Storage Buckets:**
```
VORHER:                             NACHHER:
make-f659121d-company-logos      → browo-koordinator-company-logos
make-f659121d-profile-pictures   → browo-koordinator-profile-pictures
make-f659121d-documents          → browo-koordinator-documents
make-f659121d-announcements      → browo-koordinator-announcements
```

**Constants & Variables:**
```typescript
// VORHER
const HRTHIS_MAX_FILE_SIZE = 5242880;
export const hrthisConfig = { ... };

// NACHHER
const BROWOKO_MAX_FILE_SIZE = 5242880;
export const browoKoConfig = { ... };
```

---

## 🎨 LOGO & BRANDING

### Neue Assets

**Dateien:**
- `/public/browo-icon.png` - App Icon (512x512)
- `/public/browo-logo.png` - Logo mit Text

**Zu ersetzen:**
```
1. /components/Logo.tsx
2. /public/favicon.ico (generieren aus Icon)
3. index.html <title> Tag
4. package.json name
5. Alle README/MD Dateien
6. Login Screen
7. Dashboard Header
8. Mobile Nav
9. Email Templates (falls vorhanden)
```

### Farbschema

**Primärfarbe:** Royal Blue `#3B5BDB` (aus Logo)  
**Akzentfarbe:** Light Blue `#4C6EF5`  
**Text:** Gray `#495057`

---

## 📋 MIGRATION CHECKLIST (DETAILLIERT)

### PHASE 1: RENAME PROJEKT (Tag 1-2)

#### Step 1.1: Globale Text-Ersetzung ⏳

**Files betroffen:** ~150+ Dateien

```bash
# In Codebase root
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -exec sed -i 's/HRTHIS_/BrowoKo_/g' {} +

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -exec sed -i 's/HRthis/Browo Koordinator/g' {} +

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -exec sed -i 's/hrthis/browoko/g' {} +
```

**⚠️ WICHTIG:** Backup vor sed-Operationen!

**Manuelle Checks nach sed:**
- [ ] `package.json` → name: "browo-koordinator"
- [ ] `index.html` → <title>Browo Koordinator</title>
- [ ] `README.md` → Projekt-Beschreibung
- [ ] `/utils/supabase/info.tsx` → Kommentare

#### Step 1.2: File Renaming ⏳

```bash
# Rename alle HRTHIS_* Files zu BrowoKo_*
find . -name "HRTHIS_*" -type f -exec bash -c '
  for file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
  done
' bash {} +
```

**Dateien betroffen:**
```
/services/
  HRTHIS_announcementService.ts    → BrowoKo_announcementService.ts
  HRTHIS_auditLogService.ts        → BrowoKo_auditLogService.ts
  ... (14 Services)

/components/
  HRTHIS_AvatarStatsGrid.tsx       → BrowoKo_AvatarStatsGrid.tsx
  HRTHIS_CalendarDayCell.tsx       → BrowoKo_CalendarDayCell.tsx
  ... (~50 Components)

/hooks/
  HRTHIS_useCalendarScreen.ts      → BrowoKo_useCalendarScreen.ts
  ... (~20 Hooks)

/stores/
  HRTHIS_adminStore.ts             → BrowoKo_adminStore.ts
  ... (~6 Stores)

/utils/
  HRTHIS_leaveApproverLogic.ts     → BrowoKo_leaveApproverLogic.ts
  ... (~10 Utils)

/config/
  HRTHIS_performanceBudgets.ts     → BrowoKo_performanceBudgets.ts
  HRTHIS_projectConfig.ts          → BrowoKo_projectConfig.ts
```

**TOTAL:** ~150 Dateien

#### Step 1.3: Logo Replacement ⏳

**Logo Component updaten:**
```typescript
// /components/Logo.tsx
import logoImage from '/public/browo-logo.png';
import iconImage from '/public/browo-icon.png';

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const imageSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex items-center gap-2">
      <img 
        src={showText ? logoImage : iconImage}
        alt="Browo Koordinator Logo" 
        className={`${imageSizes[size]} object-contain`}
      />
    </div>
  );
}
```

**Weitere Logo-Updates:**
- [ ] `/components/Login.tsx`
- [ ] `/components/MobileNav.tsx`
- [ ] `/screens/DashboardScreen.tsx`
- [ ] `/layouts/MainLayout.tsx`
- [ ] Favicon generieren aus Icon

#### Step 1.4: Import Updates ⏳

**ESLint Config:**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/HRTHIS_*'],
            message: 'Use BrowoKo_ prefix instead of HRTHIS_',
          },
        ],
      },
    ],
  },
};
```

---

### PHASE 2: API GATEWAY SYSTEM (Tag 3-4)

#### Step 2.1: API Gateway erstellen ⏳

```typescript
// /lib/api-gateway.ts

import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * API Gateway - Routes frontend requests to correct Edge Functions
 */

const FUNCTION_ROUTES: Record<string, string> = {
  '/health': 'browo-health',
  '/storage/status': 'browo-health',
  '/logo': 'browo-storage',
  '/profile-picture': 'browo-storage',
  '/documents': 'browo-storage',
  '/storage/sign': 'browo-storage',
  '/users/create': 'browo-users',
  '/time-account': 'browo-time',
};

/**
 * Get base path from full path
 * Example: "/logo/upload" → "/logo"
 */
function getBasePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? `/${parts[0]}` : '/';
}

/**
 * Route API call to correct Edge Function
 */
export async function apiGateway(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const basePath = getBasePath(path);
  const functionName = FUNCTION_ROUTES[basePath];

  if (!functionName) {
    throw new Error(`No Edge Function mapped for path: ${path}`);
  }

  const url = `https://${projectId}.supabase.co/functions/v1/${functionName}${path}`;

  // Add default headers
  const headers = new Headers(options.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${publicAnonKey}`);
  }
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Convenience methods
 */
export const api = {
  get: (path: string, options?: RequestInit) =>
    apiGateway(path, { ...options, method: 'GET' }),

  post: (path: string, body?: any, options?: RequestInit) =>
    apiGateway(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (path: string, body?: any, options?: RequestInit) =>
    apiGateway(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (path: string, options?: RequestInit) =>
    apiGateway(path, { ...options, method: 'DELETE' }),
};
```

#### Step 2.2: Services umbauen ⏳

**Beispiel: DocumentService**

```typescript
// /services/BrowoKo_documentService.ts

import { api } from '../lib/api-gateway';

export class DocumentService {
  /**
   * Upload document
   */
  async uploadDocument(file: File, userId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('path', `documents/${userId}/${file.name}`);

    const response = await api.post('/documents/upload', formData, {
      headers: {}, // Don't set Content-Type for FormData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.publicUrl;
  }
}
```

---

### PHASE 3: EDGE FUNCTIONS MIGRATION (Tag 5-8)

#### Step 3.1: browo-health Function ⏳

**File:** `/supabase/functions/browo-health/index.ts`

```typescript
import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Middleware
app.use('*', logger(console.log));
app.use('/*', cors({
  origin: '*',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'apikey'],
  allowMethods: ['GET', 'OPTIONS'],
}));

// Routes
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok',
    service: 'browo-health',
    timestamp: new Date().toISOString(),
  });
});

app.get('/storage/status', async (c) => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return c.json({ status: 'error', error: error.message }, 500);
    }
    
    return c.json({
      status: 'ok',
      bucketsCount: buckets?.length || 0,
      buckets: buckets?.map(b => b.name) || [],
    });
  } catch (error: any) {
    console.error('❌ [browo-health] Storage status error:', error);
    return c.json({ status: 'error', error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
```

**Deployment:**
```bash
# Im Supabase Dashboard
# Functions → Create Function
# Name: browo-health
# Code: Copy-paste oben
```

#### Step 3.2: browo-storage Function ⏳

**File:** `/supabase/functions/browo-storage/index.ts`

**Code:** Alle Storage Routes aus `/supabase/functions/server/index.tsx` kopieren

**Bucket Names updaten:**
```typescript
const LOGO_BUCKET = 'browo-koordinator-company-logos';
const PROFILE_BUCKET = 'browo-koordinator-profile-pictures';
const DOCUMENTS_BUCKET = 'browo-koordinator-documents';
const ANNOUNCEMENTS_BUCKET = 'browo-koordinator-announcements';
```

**Routes:**
- `POST /logo/upload`
- `DELETE /logo/:organizationId`
- `POST /profile-picture/upload`
- `DELETE /profile-picture/:userId`
- `POST /documents/upload`
- `DELETE /documents`
- `GET /storage/sign`

#### Step 3.3: browo-users Function ⏳

**File:** `/supabase/functions/browo-users/index.ts`

**Routes:**
- `POST /users/create`

#### Step 3.4: browo-time Function ⏳

**File:** `/supabase/functions/browo-time/index.ts`

**Routes:**
- `GET /time-account/:userId/:month/:year`
- `POST /time-account/calculate` (wenn Dependencies implementiert)
- `POST /time-account/calculate-all` (wenn Dependencies implementiert)

---

### PHASE 4: STORAGE BUCKET MIGRATION (Tag 9-10)

#### Step 4.1: Neue Buckets erstellen ⏳

**Via Edge Function Startup:**
```typescript
// In browo-storage/index.ts
const BUCKETS_CONFIG = [
  { name: 'browo-koordinator-company-logos', public: true, size: 5242880 },
  { name: 'browo-koordinator-profile-pictures', public: true, size: 5242880 },
  { name: 'browo-koordinator-documents', public: true, size: 20971520 },
  { name: 'browo-koordinator-announcements', public: false, size: 20971520 },
];

async function initializeBuckets() {
  for (const config of BUCKETS_CONFIG) {
    await ensureBucketExists(config.name, config.public, config.size);
  }
}
```

#### Step 4.2: File Migration ⏳

**WARNUNG:** Keine automatische Migration möglich in Supabase!

**Option A: Manuell** (klein)
1. Download alle Files aus alten Buckets
2. Upload in neue Buckets
3. Update URLs in DB

**Option B: Script** (groß)
```typescript
// migration-script.ts
async function migrateBucket(oldBucket: string, newBucket: string) {
  // 1. List all files
  const { data: files } = await supabase.storage.from(oldBucket).list();
  
  // 2. Copy each file
  for (const file of files!) {
    const { data: fileData } = await supabase.storage
      .from(oldBucket)
      .download(file.name);
    
    await supabase.storage
      .from(newBucket)
      .upload(file.name, fileData!);
  }
  
  // 3. Update DB URLs
  // ... SQL UPDATE Statements
}
```

**Option C: Blue-Green Deployment** (EMPFOHLEN)
1. Erstelle neue Buckets
2. Neue Uploads gehen zu neuen Buckets
3. Alte Files bleiben in alten Buckets
4. Lazy Migration: Files werden bei nächstem Access migriert
5. Nach 30 Tagen: Delete alte Buckets

---

### PHASE 5: CLEANUP & TESTING (Tag 11-12)

#### Step 5.1: Alte Function löschen ⏳

- [ ] Im Supabase Dashboard: `make-server-f659121d` deaktivieren
- [ ] `/supabase/functions/server/` Directory löschen
- [ ] Alle References zu `make-server-f659121d` entfernen

#### Step 5.2: Testing Checklist ⏳

```markdown
**Health Check:**
- [ ] GET /health → 200 OK
- [ ] GET /storage/status → Liste alle Buckets

**Storage:**
- [ ] Logo Upload funktioniert
- [ ] Logo Delete funktioniert
- [ ] Profile Picture Upload funktioniert
- [ ] Profile Picture Delete funktioniert
- [ ] Document Upload funktioniert
- [ ] Signed URLs funktionieren

**Users:**
- [ ] User Creation funktioniert
- [ ] Welcome Notification wird erstellt
- [ ] Avatar wird auto-generiert

**Frontend:**
- [ ] Login Screen zeigt neues Logo
- [ ] Dashboard zeigt neues Logo
- [ ] Mobile Nav zeigt neues Logo
- [ ] Alle File Uploads funktionieren
- [ ] Keine Console Errors
```

#### Step 5.3: Documentation ⏳

- [ ] API Documentation schreiben
- [ ] Migration Guide schreiben
- [ ] Architecture Diagram erstellen
- [ ] README.md updaten

---

## 📊 ZEITSCHÄTZUNG (DETAILLIERT)

| Phase | Task | Geschätzte Zeit | Risiko |
|-------|------|-----------------|--------|
| **Phase 1** | Global Text Replace | 2h | Niedrig |
| | File Renaming | 1h | Niedrig |
| | Logo Replacement | 2h | Niedrig |
| | Import Updates | 2h | Mittel |
| | Testing | 1h | Niedrig |
| **Phase 2** | API Gateway erstellen | 3h | Mittel |
| | Services umbauen | 4h | Mittel |
| | Testing | 2h | Mittel |
| **Phase 3** | browo-health Function | 1h | Niedrig |
| | browo-storage Function | 4h | Mittel |
| | browo-users Function | 1h | Niedrig |
| | browo-time Function | 2h | Hoch* |
| | Deployment alle Functions | 2h | Mittel |
| | Testing | 3h | Mittel |
| **Phase 4** | Neue Buckets erstellen | 1h | Niedrig |
| | File Migration Strategy | 2h | Hoch |
| | Blue-Green Setup | 3h | Mittel |
| | Testing | 2h | Mittel |
| **Phase 5** | Cleanup | 1h | Niedrig |
| | Testing | 4h | Mittel |
| | Documentation | 3h | Niedrig |
| **TOTAL** | | **12-15 Tage** | |

*browo-time hat fehlende Dependencies (`timeAccountCalculation.ts`)

---

## ⚠️ RISIKEN & MITIGATIONS

### 1. File Migration Downtime
**Risiko:** Users können während Migration keine Files hochladen  
**Mitigation:** Blue-Green Deployment (beide Buckets parallel)

### 2. Breaking Changes im Frontend
**Risiko:** Alte imports brechen nach Rename  
**Mitigation:** ESLint Rules + TypeScript wird Errors werfen

### 3. Edge Function Cold Starts
**Risiko:** Erste Requests nach Deployment sind langsam  
**Mitigation:** Keep-Alive Pings für kritische Functions

### 4. Missing Dependencies
**Risiko:** `browo-time` Function kann nicht deployed werden  
**Mitigation:** Feature deaktivieren ODER Dependencies implementieren

### 5. Auth Security
**Risiko:** Aktuell KEINE Auth Middleware in Routes  
**Mitigation:** Auth Middleware implementieren:

```typescript
async function requireAuth(c: Context) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (!user || error) return c.json({ error: 'Unauthorized' }, 401);
  
  c.set('user', user);
  return user;
}

// Usage
app.post('/users/create', async (c) => {
  const user = await requireAuth(c);
  // ... rest of handler
});
```

---

## ✅ QUICK START (wenn du JA sagst)

### Schritt 1: Backup
```bash
git add .
git commit -m "Pre-refactoring backup"
```

### Schritt 2: Ich starte mit Phase 1
1. Globale Text-Ersetzung
2. File Renaming
3. Logo Replacement

### Schritt 3: Du deployest Edge Functions
(Ich gebe dir den Code, du copy-pastest im Dashboard)

### Schritt 4: Testing
Gemeinsam alle Features testen

---

## 🤔 DEINE ENTSCHEIDUNG

**Fragen:**

1. **Edge Functions Count:** Sollen wir mit 4 starten oder direkt 6?
   - 4 = Schneller fertig (5-7 Tage)
   - 6 = Zukunftssicher (10-12 Tage)

2. **Storage Migration:** Welche Strategie?
   - Blue-Green (empfohlen)
   - Vollständige Migration (Downtime)
   - Lazy Migration

3. **Time Function:** Soll ich die fehlende `timeAccountCalculation.ts` implementieren?
   - Ja → +2 Tage
   - Nein → Feature vorerst deaktiviert

4. **Auth Middleware:** Soll ich das jetzt implementieren?
   - Ja → +1 Tag (sicherer)
   - Nein → Später (Risiko)

**Bist du bereit zu starten?** 🚀

Sag einfach:
- **"Los geht's mit 4 Functions"** → Ich starte Phase 1
- **"Lieber 6 Functions"** → Ich passe den Plan an
- **"Ich habe Fragen"** → Wir klären alles zuerst
