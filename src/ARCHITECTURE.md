# 🏗️ HRthis - System-Architektur

**Single-Tenant HR-Management-System mit Gamification**

---

## 📐 ARCHITEKTUR-ÜBERSICHT

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Learning    │  │    Admin     │          │
│  │   Screens    │  │   Center     │  │   Bereich    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Zustand Stores (State Management)         │          │
│  │  auth • gamification • learning • time • admin    │          │
│  └──────────────────────────────────────────────────┘          │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                              │
│                                                                   │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   Edge Functions     │    │   PostgreSQL DB       │          │
│  │   (Hono Server)      │◄──►│   - users             │          │
│  │                      │    │   - organizations     │          │
│  │  /health             │    │   - time_records      │          │
│  │  /storage/status     │    │   - leave_requests    │          │
│  │  /logo/upload        │    │   - video_content     │          │
│  │  /profile-picture/*  │    │   - quiz_content      │          │
│  └──────────────────────┘    │   - achievements      │          │
│           │                   │   - coin_transactions │          │
│           │                   │   - locations         │          │
│           │                   └──────────────────────┘          │
│           ▼                            ▲                         │
│  ┌──────────────────────┐             │                         │
│  │  Storage Buckets     │─────────────┘                         │
│  │  - company-logos     │                                       │
│  │  - profile-pictures  │                                       │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 SINGLE-TENANT MODELL

### Konzept
```
┌────────────────────────────────────────────────────┐
│              EINE FIRMA = EINE DATENBANK           │
└────────────────────────────────────────────────────┘

Firma A                  Firma B                  Firma C
   │                        │                        │
   ▼                        ▼                        ▼
┌─────────┐            ┌─────────┐            ┌─────────┐
│Supabase │            │Supabase │            │Supabase │
│   A     │            │   B     │            │   C     │
└─────────┘            └─────────┘            └─────────┘

✅ Keine komplexe Multi-Tenancy
✅ Maximale Datenisolation
✅ Einfachere Skalierung
✅ Bessere Performance
```

### Default-Organisation
```sql
-- Jede Datenbank hat EINE Default-Organisation
┌─────────────────────────────────────────────────────┐
│  Default Organization                                │
│  ├─ ID: 00000000-0000-0000-0000-000000000001        │
│  ├─ is_default: true                                 │
│  ├─ tier: ENTERPRISE                                 │
│  ├─ max_users: 999999 (unlimited)                   │
│  └─ features: ALL                                    │
└─────────────────────────────────────────────────────┘
           │
           ├─ User 1 (ADMIN)
           ├─ User 2 (EMPLOYEE)
           ├─ User 3 (EMPLOYEE)
           └─ User n...

Auto-Assignment: Jeder neue User wird automatisch zugewiesen!
```

---

## 📊 DATENBANK SCHEMA

### Core Tables
```
users
├─ id (UUID, PK)
├─ email (TEXT, UNIQUE)
├─ full_name (TEXT)
├─ role (ENUM: EMPLOYEE, ADMIN, SUPERADMIN)
├─ organization_id (UUID, FK → organizations)
├─ profile_picture (TEXT, Base64)
├─ avatar_emoji (TEXT)
├─ coins (INTEGER)
├─ xp (INTEGER)
├─ level (INTEGER)
└─ ...personal_data, sizes, banking, etc.

organizations
├─ id (UUID, PK)
├─ name (TEXT)
├─ is_default (BOOLEAN)
├─ tier (ENUM: FREE, PRO, ENTERPRISE)
├─ max_users (INTEGER)
└─ company_logo (TEXT)

time_records
├─ id (UUID, PK)
├─ user_id (UUID, FK → users)
├─ check_in (TIMESTAMPTZ)
├─ check_out (TIMESTAMPTZ)
├─ break_minutes (INTEGER)
└─ total_hours (DECIMAL)

leave_requests
├─ id (UUID, PK)
├─ user_id (UUID, FK → users)
├─ type (ENUM: VACATION, SICK, etc.)
├─ start_date (DATE)
├─ end_date (DATE)
├─ status (ENUM: PENDING, APPROVED, REJECTED)
└─ approved_by (UUID, FK → users)

video_content
├─ id (UUID, PK)
├─ title (TEXT)
├─ video_url (TEXT)
├─ thumbnail_url (TEXT)
├─ coin_cost (INTEGER, 0 = free)
├─ xp_reward (INTEGER)
└─ category (TEXT)

quiz_content
├─ id (UUID, PK)
├─ title (TEXT)
├─ questions (JSONB)
├─ passing_score (INTEGER)
├─ coin_cost (INTEGER)
└─ xp_reward (INTEGER)

achievements
├─ id (UUID, PK)
├─ name (TEXT)
├─ description (TEXT)
├─ icon (TEXT)
├─ xp_requirement (INTEGER)
└─ reward_coins (INTEGER)

locations
├─ id (UUID, PK)
├─ organization_id (UUID, FK → organizations)
├─ name (TEXT)
├─ address (TEXT)
├─ is_headquarters (BOOLEAN)
└─ ...
```

---

## 🔄 DATENFLUSS

### Authentication Flow
```
1. User registriert sich
   └─> Supabase Auth erstellt User
       └─> Trigger: auto_assign_default_org()
           └─> User bekommt organization_id
               └─> User Profil wird erstellt (role: EMPLOYEE)
                   └─> Erster User wird zu ADMIN

2. User loggt ein
   └─> authStore.initialize()
       └─> Supabase Session Check
           └─> Load User Profile
               └─> Load Gamification Data (XP, Coins, Avatar)
                   └─> Redirect zu /dashboard
```

### Time Tracking Flow
```
1. User klickt "Check-in"
   └─> timeStore.checkIn()
       └─> INSERT time_record (check_in = NOW())
           └─> Live Stats aktualisieren
               └─> Activity Feed Update
                   └─> XP Reward (+10 XP)

2. User klickt "Check-out"
   └─> timeStore.checkOut()
       └─> UPDATE time_record (check_out = NOW())
           └─> Calculate total_hours
               └─> XP Reward basierend auf Stunden
                   └─> Activity Feed Update
```

### Learning Flow
```
1. User öffnet Video
   └─> learningStore.loadVideo(id)
       └─> Check if locked (coin_cost > 0)
           └─> If locked: Show "Unlock" Button
           └─> If unlocked: Show Video Player
               └─> Track Progress
                   └─> On Complete: Award XP + Coins
                       └─> Check Achievements
                           └─> Notify User

2. User macht Quiz
   └─> QuizPlayer Component
       └─> Load Questions (JSONB)
           └─> Track Answers
               └─> Calculate Score
                   └─> If passed: Award XP + Coins
                       └─> Update User Progress
```

### Gamification Flow
```
┌──────────────────────────────────────────────────────┐
│                  GAMIFICATION ENGINE                  │
│                                                        │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐  │
│  │   XP       │   │   COINS    │   │  LEVELS    │  │
│  │            │   │            │   │            │  │
│  │ Earned by: │   │ Earned by: │   │ Based on:  │  │
│  │ - Login    │   │ - Videos   │   │ - XP       │  │
│  │ - Check-in │   │ - Quizzes  │   │ - 1-100    │  │
│  │ - Videos   │   │ - Daily    │   │            │  │
│  │ - Quizzes  │   │            │   │            │  │
│  └────────────┘   └────────────┘   └────────────┘  │
│         │                │                │          │
│         └────────────────┼────────────────┘          │
│                          ▼                            │
│                  ┌──────────────┐                    │
│                  │ ACHIEVEMENTS │                    │
│                  │  - Unlock    │                    │
│                  │  - Badges    │                    │
│                  │  - Rewards   │                    │
│                  └──────────────┘                    │
└──────────────────────────────────────────────────────┘
```

---

## 🗂️ FOLDER STRUKTUR

```
hrthis/
│
├── components/              # Reusable Components
│   ├── ui/                 # shadcn/ui Components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── figma/              # Figma-specific
│   │   └── ImageWithFallback.tsx
│   ├── AvatarDisplay.tsx
│   ├── AvatarEditor.tsx
│   ├── QuizPlayer.tsx
│   ├── VideoPlayer.tsx
│   ├── XPProgress.tsx
│   ├── ActivityFeed.tsx
│   └── ...
│
├── screens/                # Full Page Screens
│   ├── DashboardScreen.tsx
│   ├── TimeAndLeaveScreen.tsx
│   ├── LearningScreen.tsx
│   ├── AvatarScreen.tsx
│   ├── BenefitsScreen.tsx
│   ├── DocumentsScreen.tsx
│   ├── SettingsScreen.tsx
│   └── admin/              # Admin-Only Screens
│       ├── AdminDashboardScreen.tsx
│       ├── TeamManagementScreen.tsx
│       ├── CompanySettingsScreen.tsx
│       └── ...
│
├── layouts/                # Layout Wrappers
│   ├── MainLayout.tsx      # User Layout (Sidebar + TopNav)
│   └── AdminLayout.tsx     # Admin Layout
│
├── stores/                 # Zustand State Management
│   ├── authStore.ts        # Auth & User Profile
│   ├── gamificationStore.ts # XP, Coins, Avatar
│   ├── learningStore.ts    # Videos, Quizzes
│   ├── timeStore.ts        # Time Tracking, Leave
│   ├── adminStore.ts       # Admin Functions
│   ├── documentStore.ts    # Documents
│   ├── notificationStore.ts # Notifications
│   └── rewardStore.ts      # Rewards
│
├── supabase/               # Backend
│   ├── functions/
│   │   └── server/
│   │       ├── index.tsx   # Main Server (Hono)
│   │       └── kv_store.tsx # KV Utility (Protected)
│   └── migrations/         # SQL Migrations
│       ├── 001_initial_schema.sql
│       ├── 016_multitenancy_organizations.sql
│       ├── 019_auto_assign_default_org.sql
│       ├── 023_remove_profile_picture_index.sql
│       └── ...
│
├── utils/                  # Helper Functions
│   ├── supabase/
│   │   ├── client.ts       # Supabase Client
│   │   └── info.tsx        # Project Info (Protected)
│   ├── xpSystem.ts         # XP Calculations
│   └── organizationHelper.ts
│
├── types/                  # TypeScript Definitions
│   └── database.ts         # Database Types
│
├── styles/                 # CSS & Styling
│   └── globals.css         # Tailwind v4 + Animations
│
└── guidelines/             # Development Standards
    └── Guidelines.md
```

---

## 🔐 SECURITY & RLS

### Row Level Security (RLS)

```sql
-- Users können nur ihre eigenen Daten sehen
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users können eigene Time Records sehen
CREATE POLICY "Users can view own time records"
  ON time_records FOR SELECT
  USING (auth.uid() = user_id);

-- Admins können alle Daten ihrer Org sehen
CREATE POLICY "Admins can view all org data"
  ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );
```

### Protected Endpoints
```typescript
// Server-Side: Require Auth
const accessToken = request.headers.get('Authorization')?.split(' ')[1];
const { data: { user }, error } = await supabase.auth.getUser(accessToken);

if (!user) {
  return new Response('Unauthorized', { status: 401 });
}

// Only ADMIN can access
if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
  return new Response('Forbidden', { status: 403 });
}
```

---

## 🚀 PERFORMANCE OPTIMIERUNGEN

### Frontend
```typescript
// 1. Lazy Loading für alle Screens
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));

// 2. Skeleton Loading
<Suspense fallback={<LoadingState loading={true} type="skeleton" />}>
  <DashboardScreen />
</Suspense>

// 3. Optimistic Updates in Stores
gamificationStore.setState({ coins: currentCoins + reward });
```

### Backend
```sql
-- 1. Indizes auf häufig abgefragte Spalten
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_time_records_user ON time_records(user_id);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);

-- 2. NICHT auf großen Spalten (Base64)
-- DROP INDEX idx_users_profile_picture; ✅

-- 3. Composite Indizes
CREATE INDEX idx_time_records_user_date 
  ON time_records(user_id, check_in);
```

### Storage
```typescript
// 1. Bucket-Level Caching
const bucketExists = await checkBucketCache(bucketName);

// 2. Compression für Bilder
// Base64 mit quality: 0.6 (60%)
canvas.toDataURL('image/jpeg', 0.6);

// 3. Size Limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

---

## 📈 SKALIERUNG

### Horizontal Scaling
```
┌──────────────────────────────────────────────────┐
│              Load Balancer (Supabase)             │
└──────────────────────────────────────────────────┘
           │            │            │
           ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Edge     │ │ Edge     │ │ Edge     │
    │ Function │ │ Function │ │ Function │
    │    1     │ │    2     │ │    3     │
    └──────────┘ └──────────┘ └──────────┘
           │            │            │
           └────────────┼────────────┘
                        ▼
              ┌──────────────────┐
              │   PostgreSQL     │
              │   (Connection    │
              │    Pooling)      │
              └──────────────────┘
```

### Vertical Scaling
```
Database Size        Recommended Plan
────────────────────────────────────
< 500 users         Free Tier
500 - 5,000        Pro
5,000 - 50,000     Team
> 50,000           Enterprise

Jede Firma kann individuell skalieren!
```

---

## 🔄 DEPLOYMENT

### CI/CD Pipeline (Konzept)
```
1. Git Push to main
   └─> GitHub Actions triggered
       └─> Run Tests
           └─> Build Frontend
               └─> Deploy to Vercel/Netlify
                   └─> Deploy Edge Functions to Supabase
                       └─> Run Migrations (if any)
                           └─> Smoke Tests
                               └─> Done! ✅
```

### Environment Variables
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Backend (Supabase Secrets)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_DB_URL=postgresql://...
```

---

## 🎓 BEST PRACTICES

### Code Organization
- ✅ Ein Screen = Ein File
- ✅ Reusable Components in `/components`
- ✅ Business Logic in Stores (nicht in Components)
- ✅ TypeScript Types aus `/types/database.ts`

### State Management
- ✅ Nutze Zustand Stores für globalen State
- ✅ Nutze React State nur für UI-State
- ✅ Optimistic Updates für bessere UX

### Database
- ✅ Nutze Migrations (nicht manuelles SQL)
- ✅ Indizes auf Foreign Keys
- ✅ RLS immer aktiviert
- ✅ Transactions für kritische Operations

### Security
- ✅ Niemals SERVICE_ROLE_KEY im Frontend
- ✅ Alle API-Calls über Edge Functions
- ✅ Input Validation auf Server-Side
- ✅ RLS Policies testen!

---

**Version:** 4.0.0  
**Erstellt:** 2025-01-04  
**Architektur:** Single-Tenant
