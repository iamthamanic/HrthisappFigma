# 📚 HRthis Documentation Index

Schneller Zugriff auf alle wichtigen Dokumentationen - sauber und übersichtlich organisiert.

---

## 🚀 START HERE

### Erste Schritte
1. **[START_HERE.md](START_HERE.md)** - ⭐ Beginne hier! Quick Start Guide
2. **[README.md](README.md)** - Haupt-Dokumentation mit Features & Setup
3. **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Schnelle Installations-Anleitung

### Performance (NEU) ⚡
- **[PERFORMANCE_QUICK_START.md](PERFORMANCE_QUICK_START.md)** - 🎯 Performance-Optimierungen Übersicht
- **[PERFORMANCE_OPTIMIZATIONS_APPLIED.md](PERFORMANCE_OPTIMIZATIONS_APPLIED.md)** - Detaillierte Implementierung
- **[PERFORMANCE_AUDIT_REPORT.json](PERFORMANCE_AUDIT_REPORT.json)** - Vollständiger Audit-Report

### SQL Setup
- **[SQL_COPY_PASTE.md](SQL_COPY_PASTE.md)** - 🎯 Alle SQL-Befehle zum Copy & Paste
- **[RUN_THIS_IN_SUPABASE.sql](RUN_THIS_IN_SUPABASE.sql)** - Quick SQL für Supabase

---

## 🏗️ ARCHITEKTUR & STRUKTUR

### Single-Tenant Setup (Aktuell)
- **[SINGLE_TENANT_SETUP.md](SINGLE_TENANT_SETUP.md)** - Aktuelle Architektur-Dokumentation
- Jede Firma = eigene Supabase-Datenbank
- Automatische Zuweisung zur Default-Organisation
- Unlimited Users (ENTERPRISE Tier)

### Projekt-Struktur
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Datei- und Ordner-Organisation
- **[guidelines/Guidelines.md](guidelines/Guidelines.md)** - Code-Standards & Best Practices

```
/components/     - Reusable UI components
  /ui/          - shadcn/ui components
  /figma/       - Figma-spezifische Components
/screens/       - Full page screens
  /admin/       - Admin-only screens
/layouts/       - Layout wrappers (MainLayout, AdminLayout)
/stores/        - Zustand state stores
/utils/         - Helper functions
/types/         - TypeScript definitions
/supabase/      - Backend & Migrations
  /functions/   - Edge Functions (Server)
  /migrations/  - SQL Migration files
```

---

## 🗄️ DATENBANK & MIGRATIONS

### SQL Migrations
📂 **Verzeichnis:** `/supabase/migrations/`

📄 **Wichtige Migrations:**
- `001_initial_schema.sql` - Core Database Schema
- `008_rewards_system.sql` - Gamification (Coins, XP, Rewards)
- `010_achievements_system.sql` - Achievement System
- `016_multitenancy_organizations.sql` - Organizations Tabelle
- `019_auto_assign_default_org.sql` - Auto-Zuweisung Default-Org
- `022_add_locations.sql` - Locations/Standorte
- `023_remove_profile_picture_index.sql` - ⚠️ Index Fix (PostgreSQL Limit)
- `999_COMPLETE_SETUP_V4.sql` - Komplettes Setup (All-in-One)

📄 **README:**
- **[supabase/migrations/README.md](supabase/migrations/README.md)** - Migrations Guide

---

## 🔧 FEATURES & KOMPONENTEN

### Profilbild System
📄 **[components/PROFILE_PICTURE_CROP_SYSTEM.md](components/PROFILE_PICTURE_CROP_SYSTEM.md)**
- Bild-Upload mit Crop-Funktionalität
- Base64-Speicherung in Datenbank
- ImageCropDialog Component
- PersonalSettings Integration

### Logo System
📄 **[components/LOGO_USAGE.md](components/LOGO_USAGE.md)**
- Company Logo Upload
- Logo Component Usage
- Storage Integration

### Notifications
📄 **[components/NOTIFICATION_GUIDE.md](components/NOTIFICATION_GUIDE.md)**
- Tab Badges System
- NotificationCenter Component
- Real-time Updates

---

## 🎯 CHECKLISTEN

### Setup Checkliste
📄 **[CHECKLIST.md](CHECKLIST.md)** - Vollständige Setup-Prüfliste

### Migration Checkliste
📄 **[MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)** - Migrations-Verifikation

**Quick Checks:**
```sql
-- Zeige alle Tabellen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Prüfe profile_picture Spalte
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'profile_picture';

-- Zeige Default-Organisation
SELECT * FROM organizations WHERE is_default = true;
```

---

## 🖥️ BACKEND & SERVER

### Supabase Edge Functions
📂 **Verzeichnis:** `/supabase/functions/server/`

📄 **Files:**
- `index.tsx` - Main Server mit API Endpoints
- `kv_store.tsx` - Key-Value Storage Utility (🔒 Protected)

### API Endpoints
```
/make-server-f659121d/health              GET   - Health Check
/make-server-f659121d/storage/status      GET   - Storage Diagnostics
/make-server-f659121d/logo/upload         POST  - Company Logo Upload
/make-server-f659121d/logo/:id            DELETE- Delete Logo
/make-server-f659121d/profile-picture/upload POST - Profile Picture Upload
/make-server-f659121d/profile-picture/:userId DELETE - Delete Profile Picture
```

---

## 📊 ZUSTAND STORES

### State Management
📂 **Verzeichnis:** `/stores/`

- `authStore.ts` - Authentication & User Profile
- `adminStore.ts` - Admin-spezifische State
- `gamificationStore.ts` - Gamification (Avatars, XP, Coins)
- `learningStore.ts` - Learning Content & Quizzes
- `timeStore.ts` - Time Tracking & Leave Management
- `documentStore.ts` - Document Management
- `notificationStore.ts` - Notifications
- `rewardStore.ts` - Rewards & Transactions

---

## 🎨 STYLING & DESIGN

### Tailwind v4 + CSS
📄 **File:** `/styles/globals.css`

**Features:**
- Custom CSS Properties (CSS Variables)
- Dark Mode Support
- Animation System (page-enter, fade-in, slide-up, etc.)
- Typography System (automatische Font-Größen)
- Skeleton Loading Animations

**Wichtig:**
- Keine Tailwind-Klassen für `font-size`, `font-weight`, `line-height` nutzen
- System nutzt automatische Typography aus globals.css

---

## 🧩 SHADCN/UI KOMPONENTEN

### Verfügbare Components
📂 **Verzeichnis:** `/components/ui/`

**UI Primitives:**
- button, input, textarea, select, checkbox, switch, slider
- dialog, alert-dialog, sheet, drawer, popover, tooltip
- card, badge, avatar, separator, progress, skeleton
- table, tabs, accordion, collapsible
- form, calendar, command, navigation-menu
- dropdown-menu, context-menu, menubar
- carousel, sidebar, breadcrumb, pagination

**Nicht überschreiben!** Diese sind von shadcn/ui.

---

## 🧪 TESTING & DEBUGGING

### Storage Diagnostics
**Location:** Admin → Company Settings → Storage Diagnose

**Checks:**
- Logo Bucket Status
- Profile Pictures Bucket Status
- Liste aller Buckets

### Browser Console
```javascript
// Prüfe Auth
console.log('User:', useAuthStore.getState().user);

// Prüfe Gamification
console.log('Profile:', useGamificationStore.getState().profile);

// Prüfe Learning
console.log('Videos:', useLearningStore.getState().videos);
```

---

## 🆘 HÄUFIGE PROBLEME

### "Column not found" Error
**Lösung:** Führe SQL aus `/SQL_COPY_PASTE.md` → Abschnitt 2️⃣ aus

### "Bucket not found" Error
**Lösung:** Bucket wird automatisch beim ersten Upload erstellt

### "Index size exceeds maximum" Error
**Lösung:** Index wurde entfernt in Migration 023 (bereits gefixt)

### User hat keine Organization
**Lösung:**
```sql
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;
```

---

## 📖 EXTERNE RESSOURCEN

### Links
- [Supabase Dashboard](https://supabase.com/dashboard) - Datenbank & Storage
- [Supabase Docs](https://supabase.com/docs) - Offizielle Dokumentation
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Tailwind CSS v4](https://tailwindcss.com/) - CSS Framework
- [React Router v6](https://reactrouter.com/) - Routing
- [Zustand](https://github.com/pmndrs/zustand) - State Management
- [Lucide Icons](https://lucide.dev/) - Icon Library

### Lizenzen
📄 **[Attributions.md](Attributions.md)** - Alle verwendeten Lizenzen

---

## 🗺️ NAVIGATION NACH ROLLE

### 👨‍💻 Developer
1. Start: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
2. Guidelines: [guidelines/Guidelines.md](guidelines/Guidelines.md)
3. Migrations: [supabase/migrations/README.md](supabase/migrations/README.md)
4. SQL: [SQL_COPY_PASTE.md](SQL_COPY_PASTE.md)

### 👔 Admin
1. Quick Start: [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
2. Setup: [SINGLE_TENANT_SETUP.md](SINGLE_TENANT_SETUP.md)
3. Checkliste: [CHECKLIST.md](CHECKLIST.md)

### 🧑‍💼 User
1. Start: [README.md](README.md) - Features Section
2. Support: README.md - Troubleshooting Section

---

## 📝 WICHTIGE HINWEISE

### ⚠️ Protected Files
**Nicht ändern oder löschen:**
- `/supabase/functions/server/kv_store.tsx`
- `/utils/supabase/info.tsx`
- `/components/figma/ImageWithFallback.tsx`

### ✅ Single-Tenant Status
- ✅ Multi-Tenancy wurde auf Single-Tenancy umgestellt
- ✅ Alle User werden automatisch Default-Org zugewiesen
- ✅ ENTERPRISE Tier mit unlimited Users
- ✅ Profilbild-System mit Crop funktioniert
- ✅ PostgreSQL Index-Problem gelöst

---

## 🔄 VERSION & UPDATES

**Version:** 4.0.0  
**Architektur:** Single-Tenant  
**Letztes Update:** 2025-01-04

### Recent Changes
- ✅ Profilbild Index entfernt (PostgreSQL 2704 byte Limit)
- ✅ SQL_COPY_PASTE.md erstellt für einfaches Setup
- ✅ Dokumentation aufgeräumt (14 veraltete Dateien gelöscht)
- ✅ Admin Top Navbar bereinigt (Notifications & Settings entfernt)
- ✅ Single-Tenant Architektur finalisiert

---

**📌 Tipp:** Beginne immer mit [START_HERE.md](START_HERE.md) für den schnellsten Einstieg!
