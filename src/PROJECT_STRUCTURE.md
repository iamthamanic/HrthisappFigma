# HRthis - Project Structure

## 📁 Clean & Organized Structure

```
HRthis/
├── 📄 App.tsx                    # Main entry point, router configuration
├── 📄 README.md                  # Project documentation
├── 📄 Attributions.md            # Third-party credits
│
├── 📂 components/                # Reusable UI components
│   ├── 🎨 ui/                    # shadcn/ui components (50+ components)
│   ├── 🖼️ figma/                 # Figma integration components
│   ├── Login.tsx                 # Login form
│   ├── Register.tsx              # Registration form
│   ├── ForgotPassword.tsx        # Password recovery
│   ├── ResetPassword.tsx         # Password reset
│   ├── AvatarEditor.tsx          # Avatar customization
│   ├── AvatarDisplay.tsx         # Avatar rendering
│   ├── QuizPlayer.tsx            # Interactive quiz player
│   ├── VideoPlayer.tsx           # Video learning player
│   ├── XPProgress.tsx            # Experience points display
│   ├── AchievementBadge.tsx      # Achievement badges
│   ├── ActivityFeed.tsx          # Activity stream
│   ├── NotificationCenter.tsx    # Notification system
│   ├── BreakManager.tsx          # Break time tracking
│   ├── LoadingState.tsx          # Loading animations
│   ├── EmptyState.tsx            # Empty state placeholders
│   ├── Logo.tsx                  # Company logo
│   └── ...                       # More components
│
├── 📂 screens/                   # Screen-level components (routes)
│   ├── DashboardScreen.tsx       # Main dashboard
│   ├── TimeAndLeaveScreen.tsx    # Time & leave management
│   ├── CalendarScreen.tsx        # Calendar view
│   ├── LearningScreen.tsx        # Learning overview
│   ├── VideoDetailScreen.tsx     # Video player screen
│   ├── QuizDetailScreen.tsx      # Quiz player screen
│   ├── LearningAdminScreen.tsx   # Learning content management
│   ├── LearningShopScreen.tsx    # Avatar shop
│   ├── AchievementsScreen.tsx    # Achievements & badges
│   ├── AvatarScreen.tsx          # Avatar customization
│   ├── BenefitsScreen.tsx        # Company benefits
│   ├── DocumentsScreen.tsx       # Document management
│   ├── SettingsScreen.tsx        # User settings
│   └── admin/                    # Admin screens
│       ├── AdminDashboardScreen.tsx
│       ├── TeamManagementScreen.tsx
│       ├── AddEmployeeScreen.tsx
│       ├── TeamMemberDetailsScreen.tsx
│       ├── TeamsOverviewScreen.tsx
│       ├── OrganigramScreen.tsx
│       ├── AvatarSystemAdminScreen.tsx
│       ├── BenefitsManagementScreen.tsx
│       └── DashboardInfoScreen.tsx
│
├── 📂 layouts/                   # Layout wrappers
│   ├── MainLayout.tsx            # Main app layout (sidebar, topbar)
│   └── AdminLayout.tsx           # Admin layout (admin sidebar)
│
├── 📂 stores/                    # Zustand state management
│   ├── authStore.ts              # Authentication & user state
│   ├── timeStore.ts              # Time tracking state
│   ├── learningStore.ts          # Learning content state
│   ├── gamificationStore.ts      # XP, coins, levels
│   ├── adminStore.ts             # Admin operations
│   ├── documentStore.ts          # Document management
│   ├── notificationStore.ts      # Notifications
│   └── rewardStore.ts            # Rewards system
│
├── 📂 types/                     # TypeScript definitions
│   └── database.ts               # Database schema types
│
├── 📂 utils/                     # Utility functions
│   ├── supabase/                 # Supabase helpers
│   │   ├── client.ts             # Supabase client
│   │   ├── info.tsx              # Project info
│   │   └── testConnection.ts    # Connection testing
│   ├── exportUtils.ts            # Export helpers
│   └── xpSystem.ts               # XP calculation logic
│
├── 📂 styles/                    # Global styles
│   └── globals.css               # Tailwind v4 config & custom CSS
│
├── 📂 supabase/                  # Backend (Supabase)
│   ├── functions/                # Edge functions
│   │   └── server/               # Hono web server
│   │       ├── index.tsx         # Main server routes
│   │       └── kv_store.tsx      # Key-value store utilities
│   └── migrations/               # SQL migrations
│       ├── README.md             # Migration guide
│       ├── 999_COMPLETE_SETUP_V4.sql  # ⭐ Main setup file
│       └── 001-012_*.sql         # Individual migrations
│
├── 📂 guidelines/                # Development guidelines
│   └── Guidelines.md             # Coding standards
│
└── 📂 imports/                   # Figma imports
    ├── Container.tsx             # Container component
    └── svg-*.ts                  # SVG assets
```

## 🎯 Key Directories Explained

### `/components`
Reusable React components. Each component is self-contained and can be used across multiple screens.

**Key subdirectories:**
- `ui/` - shadcn/ui component library (buttons, forms, dialogs, etc.)
- `figma/` - Figma-specific integration components

### `/screens`
Screen-level components that correspond to routes. These compose smaller components into full pages.

**Organization:**
- Root screens: User-facing screens
- `admin/` screens: Admin-only screens (protected by role)

### `/layouts`
Layout wrapper components that provide consistent structure.

**Two main layouts:**
- `MainLayout.tsx` - For regular users (blue sidebar)
- `AdminLayout.tsx` - For admins (admin-specific navigation)

### `/stores`
Zustand stores for global state management. Each store handles a specific domain.

**Store responsibilities:**
- `authStore` - User authentication, profile, session
- `timeStore` - Time tracking, breaks, leave requests
- `learningStore` - Videos, quizzes, progress
- `gamificationStore` - XP, levels, coins, achievements
- `adminStore` - Team management, admin operations

### `/supabase`
Backend code and database migrations.

**Structure:**
- `functions/server/` - Edge function (Hono web server)
- `migrations/` - SQL files to set up database

**Important migration:**
- `999_COMPLETE_SETUP_V4.sql` - Single file with complete setup

### `/types`
TypeScript type definitions matching Supabase database schema.

### `/utils`
Helper functions and utilities.

**Key utilities:**
- `supabase/client.ts` - Supabase client singleton
- `xpSystem.ts` - XP and leveling logic

## 🏗️ Architecture Overview

### Frontend Architecture
```
App.tsx (Router)
    ↓
Layouts (MainLayout / AdminLayout)
    ↓
Screens (DashboardScreen, LearningScreen, etc.)
    ↓
Components (Login, QuizPlayer, AvatarEditor, etc.)
    ↓
UI Components (Button, Card, Dialog, etc.)
```

### State Management
```
Zustand Stores
    ↓
React Components (via hooks)
    ↓
Supabase Backend (via API calls)
```

### Data Flow
```
User Action → Store Action → Supabase API → Database
                    ↓
            Update Local State
                    ↓
            Re-render Components
```

## 🔄 Routing Structure

```
/ (redirect to /dashboard)
├── /login
├── /register
├── /forgot-password
├── /reset-password
│
└── Protected Routes (MainLayout)
    ├── /dashboard
    ├── /time-and-leave
    ├── /calendar
    ├── /learning
    │   ├── /learning/video/:videoId
    │   ├── /learning/quiz/:quizId
    │   ├── /learning/admin
    │   └── /learning/shop
    ├── /achievements
    ├── /avatar
    ├── /benefits
    ├── /documents
    ├── /settings
    │
    └── Admin Routes (AdminLayout)
        ├── /admin/dashboard
        ├── /admin/team-management
        │   ├── /admin/team-management/add-employee
        │   └── /admin/team-management/user/:userId
        ├── /admin/teams
        ├── /admin/organigram
        ├── /admin/avatar-management
        ├── /admin/benefits-management
        └── /admin/dashboard-info
```

## 📊 Database Schema (Simplified)

```
users                    # User profiles
├── id (UUID)
├── email
├── full_name
├── role (USER/ADMIN/SUPERADMIN)
├── department
├── xp, level, coins
└── avatar_* (customization)

time_records            # Time tracking
├── user_id
├── clock_in, clock_out
├── break_duration
└── total_hours

leave_requests          # Vacation/leave
├── user_id
├── leave_type
├── start_date, end_date
└── status (PENDING/APPROVED/REJECTED)

video_content           # Learning videos
├── id
├── title, description
├── video_url
└── xp_reward, coin_reward

quiz_content            # Interactive quizzes
├── id
├── title, category
├── questions (JSONB)
└── xp_reward, coin_reward

achievements            # Achievement definitions
├── id
├── title, description
├── badge_emoji
└── xp_reward

user_achievements       # User achievement progress
├── user_id
├── achievement_id
├── progress
└── unlocked_at
```

## 🎨 Design System

### Color Tokens (globals.css)
- `--primary` - Primary brand color
- `--secondary` - Secondary color
- `--accent` - Accent highlights
- `--muted` - Muted text/backgrounds
- `--destructive` - Error states

### Typography
- H1-H4 with semantic sizing
- Body text with consistent line-height
- Medium weight for headings
- Normal weight for content

### Components
- 50+ shadcn/ui components
- Consistent spacing (Tailwind)
- Smooth animations
- Accessible (ARIA compliant)

## 🚀 Getting Started

1. **Database Setup**
   ```bash
   # Run in Supabase SQL Editor
   supabase/migrations/999_COMPLETE_SETUP_V4.sql
   ```

2. **Development**
   ```bash
   # App runs automatically in Figma Make
   # No build step needed
   ```

3. **First User**
   - Register at `/register`
   - First user = SUPERADMIN
   - Login at `/login`

## 📝 Development Guidelines

- Follow TypeScript strict mode
- Use Zustand for global state
- Use React Router for navigation
- Lazy load screens for performance
- Use shadcn/ui components
- Follow existing component patterns
- Write clean, documented code

## 🔐 Security

- RLS enabled on all tables
- Role-based access control
- Protected routes with auth guards
- Service role key never in frontend
- Secure API routes in Edge Functions

---

**Last Updated**: October 2025  
**Version**: 3.0.0 (Router Architecture)
