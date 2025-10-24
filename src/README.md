# HRthis - Modern HR Management Platform

A comprehensive HR management application with gamification, learning management, time tracking, and employee engagement features.

---

## 🚀 Quick Start

**Neu hier?** Starte mit **[START_HERE.md](./START_HERE.md)** für eine 5-Minuten-Setup-Anleitung!

### 📚 Wichtige Dokumentation

### 🎯 Quick Start
- **[START_HERE.md](./START_HERE.md)** - ⭐ 5-Minuten Quick Start
- **[docs/guides/QUICK_START_GUIDE.md](./docs/guides/QUICK_START_GUIDE.md)** - Detaillierter Setup-Guide
- **[SQL_COPY_PASTE.md](./SQL_COPY_PASTE.md)** - SQL-Befehle zum Copy & Paste

### 📖 Dokumentations-Index
- **[docs/README.md](./docs/README.md)** - ⭐ Kompletter Dokumentations-Index
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System-Architektur & Diagramme
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Dateistruktur-Übersicht

### 📁 Nach Thema
- **[docs/features/](./docs/features/)** - Feature-Dokumentation (Organigram, Learning, etc.)
- **[docs/guides/](./docs/guides/)** - Setup- & Quick-Start-Anleitungen
- **[docs/fixes/](./docs/fixes/)** - Bug-Fixes & Troubleshooting
- **[docs/migrations/](./docs/migrations/)** - SQL-Migrations & DB-Setup
- **[docs/refactoring/](./docs/refactoring/)** - Refactoring-Roadmaps & Progress

---

## 🏢 Single-Tenant Architecture

```
🏢 Firma A                    🏢 Firma B                    🏢 Firma C
   ↓                             ↓                             ↓
📊 Supabase DB A              📊 Supabase DB B              📊 Supabase DB C
   ├─ 1 Organization             ├─ 1 Organization             ├─ 1 Organization
   ├─ Unlimited Users            ├─ Unlimited Users            ├─ Unlimited Users
   ├─ ENTERPRISE Tier            ├─ ENTERPRISE Tier            ├─ ENTERPRISE Tier
   └─ Vollständig isoliert       └─ Vollständig isoliert       └─ Vollständig isoliert

✅ Jede Firma hat ihre eigene Datenbank
✅ Automatische Mitarbeiter-Zuweisung zur Default-Organization
✅ Maximale Datensicherheit & Isolation
✅ Keine komplexe Multi-Tenancy
```

**Mehr Details:** [ARCHITECTURE.md](./ARCHITECTURE.md) | [SINGLE_TENANT_SETUP.md](./SINGLE_TENANT_SETUP.md)

---

## ⚡ Setup (5 Minuten)

### 1️⃣ SQL in Supabase ausführen

```bash
# Option A: Schnellstart
1. Öffne SQL_COPY_PASTE.md
2. Kopiere SQL aus Abschnitt 2️⃣ 
3. Führe in Supabase SQL Editor aus
4. Fertig! ✅

# Option B: Komplettes Setup
1. Öffne RUN_THIS_IN_SUPABASE.sql
2. Kopiere gesamten Code
3. Führe in Supabase SQL Editor aus
4. Fertig! ✅
```

**Detaillierte Anleitung:** [START_HERE.md](./START_HERE.md)

### 2️⃣ Ersten Account erstellen

1. Öffne `/register` in der App
2. Registriere dich mit deiner E-Mail
3. Du wirst automatisch als ADMIN erstellt
4. Alle weiteren User werden automatisch der Default-Organization zugewiesen

### 3️⃣ Loslegen! 🎉

- Dashboard öffnet sich automatisch
- Konfiguriere Company Settings (Admin → Firmeneinstellungen)
- Füge Mitarbeiter hinzu (Admin → Team Management)
- Erstelle Learning Content (Learning → Admin)

## 📁 Project Structure

```
/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components (Login, Register, etc.)
├── screens/            # Screen components (Dashboard, Learning, etc.)
│   └── admin/         # Admin-specific screens
├── layouts/            # Layout components (MainLayout, AdminLayout)
├── stores/             # Zustand state management stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── supabase/           # Supabase backend code
│   ├── functions/     # Edge functions (server)
│   └── migrations/    # SQL migration files
└── styles/             # Global CSS and Tailwind config
```

## ⚡ Key Features

### User Features
- **Dashboard**: Personal overview with stats, upcoming events, team activity
- **Time & Leave**: Time tracking with break management, leave requests
- **Calendar**: Integrated calendar view with events and absences
- **Learning**: Video courses and interactive quizzes
- **Achievements**: Gamified achievement system with XP and levels
- **Avatar**: Customizable emoji-based avatar system
- **Benefits**: Company benefits catalog
- **Documents**: Document management and storage

### Admin Features
- **Team Management**: Employee overview, add/edit team members
- **Teams & Organigram**: Team structure and organizational chart
- **Learning Admin**: Manage courses, videos, and quizzes
- **Benefits Management**: Configure company benefits
- **Avatar System**: Manage avatar items and rewards
- **Analytics**: Dashboard insights and team statistics

### Gamification System
- **XP System**: Earn experience points for activities
- **Levels**: Progress through levels (1-100)
- **Coins**: Virtual currency for avatar customization
- **Achievements**: Unlock badges and milestones
- **Leaderboards**: Compete with team members

## 🗄️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

## 📊 Database Schema

Key tables:
- `users` - User profiles and settings
- `time_records` - Time tracking entries
- `leave_requests` - Vacation and leave requests
- `video_content` - Learning video library
- `quiz_content` - Interactive quiz courses
- `achievements` - Achievement definitions
- `user_achievements` - User achievement progress
- `coin_transactions` - Gamification currency tracking
- `activity_feed` - Real-time activity stream

## 🔐 Authentication

- Supabase Auth with email/password
- Row Level Security (RLS) enabled
- Role-based access control (USER, ADMIN, SUPERADMIN)
- Automatic profile creation on signup

## 🎨 Design System

- Modern, clean interface with smooth animations
- Responsive design (mobile & desktop)
- Dark mode ready (theme tokens in globals.css)
- Consistent spacing and typography
- Accessible components (ARIA compliant)

## 📝 Development

### Component Guidelines
- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Use Zustand stores for global state
- Use React Router for navigation
- Lazy load screens for performance

### Code Organization
- **Components**: Reusable UI elements
- **Screens**: Full page components
- **Layouts**: Page wrapper components
- **Stores**: Global state management
- **Utils**: Helper functions and utilities

## 🛠️ Common Tasks

### Adding a New Quiz
1. Go to Admin → Learning
2. Click "Neues Quiz erstellen"
3. Fill in quiz details and questions
4. Save and publish

### Managing Team Members
1. Go to Admin → Team Management
2. Click "Mitarbeiter hinzufügen"
3. Enter employee details
4. Assign role and department

### Configuring Benefits
1. Go to Admin → Benefits Management
2. Add benefit categories
3. Configure benefit items
4. Set eligibility rules

## 🐛 Troubleshooting

### Database Issues
- Check Supabase connection in browser console
- Verify migration was run successfully
- Check RLS policies are enabled

### Login Issues
- Clear browser cache and cookies
- Check Supabase Auth configuration
- Verify email confirmation is disabled (for development)

### Performance Issues
- Check browser console for errors
- Verify lazy loading is working
- Check network tab for slow API calls

### Profile Picture Upload Error
If you see: `Could not find the 'profile_picture_url' column`
- **Fix:** Run migration `021_ensure_profile_picture_column.sql` in Supabase SQL Editor
- **Details:** See `PROFILE_PICTURE_FIX_INSTRUCTIONS.md` for step-by-step guide
- This adds the missing `profile_picture_url` and personal info columns to the users table

### Storage Bucket Errors
If you see: `Bucket not found` errors
- **Fix:** The server automatically creates buckets on startup
- **Verify:** Use Storage Diagnostics in Admin → Company Settings
- **Details:** See `BUCKET_ERROR_FIX.md` and `PROFILE_PICTURE_UPLOAD_FIX.md`

## 📄 License

Proprietary - All rights reserved

## 🙋 Support

For issues or questions, contact the development team.

---

**Version**: 3.0.0 (Router Architecture)  
**Last Updated**: October 2025
