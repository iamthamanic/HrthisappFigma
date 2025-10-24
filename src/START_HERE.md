# 🚀 HRthis - START HERE

**Willkommen bei HRthis!** Dein komplettes HR-Management-System mit Gamification, Learning Center, Time Tracking und mehr.

---

## ⚡ QUICK START (5 Minuten)

### 1️⃣ SQL Setup in Supabase ausführen

**Option A - Schnellste Methode:**
1. Öffne **[SQL_COPY_PASTE.md](SQL_COPY_PASTE.md)**
2. Kopiere den SQL-Code aus Abschnitt 2️⃣ (Profilbild Spalte)
3. Gehe zu Supabase → SQL Editor
4. Füge den Code ein und klicke "Run"
5. Fertig! ✅

**Option B - Komplettes Setup:**
1. Öffne **[RUN_THIS_IN_SUPABASE.sql](RUN_THIS_IN_SUPABASE.sql)**
2. Kopiere den gesamten Code
3. Führe ihn in Supabase SQL Editor aus
4. Fertig! ✅

### 2️⃣ App starten

```bash
npm install
npm run dev
```

### 3️⃣ Ersten Admin-Account erstellen

1. Gehe zu `/register`
2. Registriere dich mit deiner E-Mail
3. Du wirst automatisch als erster User mit ADMIN-Rechten erstellt
4. Login und loslegen! 🎉

---

## 📚 WICHTIGE DOKUMENTATION

### Setup & Installation
- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Detaillierte Setup-Anleitung
- **[SQL_COPY_PASTE.md](SQL_COPY_PASTE.md)** - Alle SQL-Befehle zum Copy & Paste
- **[SINGLE_TENANT_SETUP.md](SINGLE_TENANT_SETUP.md)** - Architektur-Dokumentation

### Entwicklung
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Projektstruktur & Organisation
- **[guidelines/Guidelines.md](guidelines/Guidelines.md)** - Code-Standards
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Komplette Docs-Übersicht

### Checklisten
- **[CHECKLIST.md](CHECKLIST.md)** - Setup-Checkliste
- **[MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)** - Migrations-Verifikation

---

## 🏗️ ARCHITEKTUR

### Single-Tenant Setup
- Jede Firma = eigene Supabase-Datenbank
- Automatische Zuweisung zur Default-Organisation
- Unlimited Users (ENTERPRISE Tier)
- Keine komplexe Multi-Tenancy

### Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **State:** Zustand Stores
- **Routing:** React Router v6
- **UI:** shadcn/ui Components
- **Icons:** Lucide React

### Projekt-Struktur
```
/components/     - Reusable UI Components
  /ui/          - shadcn/ui Components
/screens/       - Full Page Screens
  /admin/       - Admin-Only Screens
/layouts/       - Layout Wrappers
/stores/        - Zustand State Management
/supabase/      - Backend & Migrations
  /functions/   - Edge Functions (Server)
  /migrations/  - SQL Migrations
/utils/         - Helper Functions
/types/         - TypeScript Definitions
```

---

## 🎯 HAUPTFUNKTIONEN

### 📊 Dashboard
- Live Statistics
- Activity Feed
- Quick Actions
- XP Progress & Level System

### ⏱️ Zeit & Urlaub
- Time Tracking (Check-in/Check-out)
- Break Management
- Leave Requests (Urlaub, Krank, etc.)
- Calendar View

### 📚 Learning Center
- Video Courses mit Progress Tracking
- Interactive Quizzes
- XP & Coins Rewards
- Learning Shop (unlock content)
- Achievements System

### 🎮 Gamification
- Avatar System mit Emojis
- XP Levels (1-100)
- Coins Economy
- Achievements & Badges
- Leaderboards

### 💼 Benefits
- Company Benefits Overview
- Benefit Requests
- Status Tracking

### 📄 Dokumente
- Document Upload & Management
- Kategorien & Tags
- Download & Preview

### 👨‍💼 Admin-Bereich
- Team Management
- Employee Details
- Organigram
- Company Settings
- Benefits Management
- Avatar System Admin
- Dashboard Info Management

---

## 🗄️ DATENBANK

### Wichtige Tabellen
- `users` - User Profiles & Authentication
- `organizations` - Company/Organization Data
- `time_records` - Time Tracking Entries
- `leave_requests` - Vacation/Leave Requests
- `video_content` - Learning Videos
- `quiz_content` - Quiz Courses
- `achievements` - Achievement Definitions
- `coin_transactions` - Gamification Economy
- `locations` - Company Locations

### SQL Migrations
Alle Migrations findest du in `/supabase/migrations/`

**Wichtigste:**
- `001_initial_schema.sql` - Core Schema
- `016_multitenancy_organizations.sql` - Organizations
- `019_auto_assign_default_org.sql` - Auto-Assignment
- `022_add_locations.sql` - Locations
- `023_remove_profile_picture_index.sql` - Index Fix
- `999_COMPLETE_SETUP_V4.sql` - Complete Setup

---

## 🆘 HÄUFIGE PROBLEME

### "Column not found" Error
**Lösung:** Führe SQL aus `/SQL_COPY_PASTE.md` → Abschnitt 2️⃣ aus

### Profilbild Upload funktioniert nicht
**Lösung:** 
1. Öffne [SQL_COPY_PASTE.md](SQL_COPY_PASTE.md)
2. Führe Abschnitt 1️⃣ (Index entfernen) aus
3. Führe Abschnitt 2️⃣ (Spalten hinzufügen) aus

### User hat keine Organization
**Lösung:**
```sql
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;
```

### Bucket not found
**Lösung:** Bucket wird automatisch beim ersten Upload erstellt. Warte kurz und versuche es erneut.

---

## 🔑 WICHTIGE ENVIRONMENT VARIABLES

Die folgenden Secrets sind bereits konfiguriert:
- `SUPABASE_URL` - Deine Supabase Project URL
- `SUPABASE_ANON_KEY` - Public Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (Backend only!)
- `SUPABASE_DB_URL` - Database Connection String

**⚠️ Wichtig:** Der `SERVICE_ROLE_KEY` darf NIEMALS im Frontend verwendet werden!

---

## 🎨 DESIGN SYSTEM

### Tailwind CSS v4
Konfiguration in `/styles/globals.css`

**Wichtig:**
- ❌ KEINE Tailwind-Klassen für `font-size`, `font-weight`, `line-height`
- ✅ System nutzt automatische Typography aus globals.css
- ✅ Dark Mode Support verfügbar
- ✅ Animation System (fade-in, slide-up, etc.)

### Farben
- Primary: `#030213` (Fast-Schwarz)
- Secondary: `#f3f3f5` (Hell-Grau)
- Accent: `#3B82F6` (Blau)
- Success: `#10B981` (Grün)
- Warning: `#F59E0B` (Orange)
- Error: `#EF4444` (Rot)

---

## 🧪 TESTING & VERIFICATION

### Storage Diagnostics
**Location:** Admin → Company Settings → Storage Diagnose

**Checks:**
- Logo Bucket Status
- Profile Pictures Bucket Status
- Alle Buckets anzeigen

### Database Check
```sql
-- Zeige alle Tabellen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Prüfe Default-Organisation
SELECT * FROM organizations WHERE is_default = true;

-- Prüfe User mit Orgs
SELECT u.email, u.full_name, o.name as organization
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id;
```

---

## 📖 WEITERE RESSOURCEN

### Externe Links
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

### Interne Docs
- [README.md](README.md) - Haupt-Dokumentation
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Komplette Docs-Übersicht
- [Attributions.md](Attributions.md) - Lizenzen

---

## ✅ SETUP CHECKLISTE

Nach dem Setup solltest du folgendes haben:

- [ ] SQL Migrations ausgeführt
- [ ] Default-Organisation existiert
- [ ] Ersten Admin-Account erstellt
- [ ] Login funktioniert
- [ ] Dashboard lädt
- [ ] Profilbild Upload funktioniert
- [ ] Zeit-Tracking funktioniert
- [ ] Learning Center ist sichtbar

---

## 🚀 NÄCHSTE SCHRITTE

1. **Setup abschließen:** Folge [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
2. **Erste Mitarbeiter anlegen:** Admin → Team Management
3. **Company Logo hochladen:** Admin → Company Settings
4. **Learning Content erstellen:** Learning → Admin
5. **Benefits konfigurieren:** Admin → Benefits Management

---

## 💡 PRO TIPPS

### Development
- Nutze die Browser Console (F12) für Debugging
- Supabase Logs zeigen alle Backend-Fehler
- Storage Diagnostics hilft bei Upload-Problemen

### Performance
- Lazy Loading für alle Screens ist aktiviert
- Skeleton Loading für bessere UX
- Optimistic Updates in Stores

### Best Practices
- Folge [guidelines/Guidelines.md](guidelines/Guidelines.md)
- Nutze TypeScript Types aus `/types/database.ts`
- Nutze Zustand Stores statt lokalen State

---

## 🔄 VERSION INFO

**Version:** 4.0.0  
**Architektur:** Single-Tenant  
**Letztes Update:** 2025-01-04

### Recent Changes
- ✅ Single-Tenant Architektur finalisiert
- ✅ Profilbild-System mit Crop implementiert
- ✅ PostgreSQL Index-Problem gelöst
- ✅ Admin Top Navbar bereinigt
- ✅ Dokumentation aufgeräumt

---

**🎉 Viel Erfolg mit HRthis!**

Bei Fragen: Siehe [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) für alle verfügbaren Dokumentationen.
