# 🗄️ SQL Migrations & Database Setup

**Alle SQL-Migrations, Database-Setups und Schema-Definitionen**

---

## 🚀 **QUICK START**

### Must-Run SQL
- **[SQL_COPY_PASTE.md](../../SQL_COPY_PASTE.md)** - ⭐ Alle wichtigen SQL-Befehle zum Copy & Paste

---

## 📁 **SQL-FILES**

### Core Migrations
- **[SUPABASE_SQL_MIGRATIONS.sql](../../SUPABASE_SQL_MIGRATIONS.sql)** - Komplette Migrations
- **[RUN_THIS_IN_SUPABASE.sql](../../RUN_THIS_IN_SUPABASE.sql)** - Haupt-Setup-SQL
- **[COPY_PASTE_THIS_NOW.sql](../../COPY_PASTE_THIS_NOW.sql)** - Schnell-Setup
- **[COPY_PASTE_THIS_SQL.sql](../../COPY_PASTE_THIS_SQL.sql)** - Basis-Setup

### Feature-Specific
- **[SQL_ORGANIGRAM.md](../../SQL_ORGANIGRAM.md)** - Organigram-Tabellen
- **[SQL_ORGANIGRAM_DEFAULT_TEMPLATE.md](../../SQL_ORGANIGRAM_DEFAULT_TEMPLATE.md)** - Default-Templates
- **[SQL_DRAGGABLE_ORGANIGRAM.sql](../../SQL_DRAGGABLE_ORGANIGRAM.sql)** - Draggable-Features
- **[SQL_EXAMPLE_HIERARCHY.sql](../../SQL_EXAMPLE_HIERARCHY.sql)** - Beispiel-Hierarchie

### Departments
- **[SQL_DEPARTMENTS_MIGRATION.md](../../SQL_DEPARTMENTS_MIGRATION.md)** - Department-System

### Time Tracking
- **[SQL_PAUSENREGELUNG.md](../../SQL_PAUSENREGELUNG.md)** - Break-Settings

### Team Features
- **[SQL_ALL_TEAM_FEATURES_MIGRATIONS.md](../../SQL_ALL_TEAM_FEATURES_MIGRATIONS.md)** - Alle Team-Features
- **[SQL_ADD_EMPLOYEE_ASSIGNMENTS.md](../../SQL_ADD_EMPLOYEE_ASSIGNMENTS.md)** - Employee-Assignments
- **[SQL_ADD_HR_TEAMLEAD_ROLES.md](../../SQL_ADD_HR_TEAMLEAD_ROLES.md)** - HR/Teamlead-Rollen
- **[SQL_USER_NOTES_MIGRATION.md](../../SQL_USER_NOTES_MIGRATION.md)** - User-Notes

---

## 🔧 **FIX-SQL-FILES**

### Database Fixes
- **[FIX_DATABASE_COLUMNS.sql](../../FIX_DATABASE_COLUMNS.sql)** - Column-Fixes
- **[FIX_UUID_NODES.sql](../../FIX_UUID_NODES.sql)** - UUID-Fixes
- **[FIX_USERS_WITHOUT_ORGANIZATION.sql](../../FIX_USERS_WITHOUT_ORGANIZATION.sql)** - Organization-Fix

### Feature Fixes
- **[FIX_ADMIN_TEAMLEAD_NOW.sql](../../FIX_ADMIN_TEAMLEAD_NOW.sql)** - Admin/Teamlead-Fix
- **[FIX_BREAK_FIELDS_DEFAULT_VALUES.sql](../../FIX_BREAK_FIELDS_DEFAULT_VALUES.sql)** - Break-Defaults
- **[FIX_EXISTING_TEAMS_ADD_ADMINS.sql](../../FIX_EXISTING_TEAMS_ADD_ADMINS.sql)** - Team-Admin-Fix
- **[FIX_LEAVE_TYPE_ENUM.sql](../../FIX_LEAVE_TYPE_ENUM.sql)** - Leave-Type-Fix
- **[FIX_PRIORITY_TAG_COLUMN_NOW.sql](../../FIX_PRIORITY_TAG_COLUMN_NOW.sql)** - Priority-Tags

### Cleanup
- **[FINAL_FIX_ADMIN_AUTO_ADD.sql](../../FINAL_FIX_ADMIN_AUTO_ADD.sql)** - Admin-Auto-Add
- **[FINAL_FIX_ONLY_HR_SUPERADMIN.sql](../../FINAL_FIX_ONLY_HR_SUPERADMIN.sql)** - HR/SUPERADMIN-Fix
- **[QUICK_FIX_ADMIN_TEAMLEAD.sql](../../QUICK_FIX_ADMIN_TEAMLEAD.sql)** - Quick Admin-Fix
- **[QUICK_FIX_TEAM_BUERO_2.sql](../../QUICK_FIX_TEAM_BUERO_2.sql)** - Team-Büro-Fix
- **[QUICK_FIX_TEAM_ROLES.sql](../../QUICK_FIX_TEAM_ROLES.sql)** - Team-Roles-Fix
- **[QUICK_COPY_UNPAID_LEAVE.sql](../../QUICK_COPY_UNPAID_LEAVE.sql)** - Unpaid-Leave-Fix
- **[UPDATE_EXISTING_TEAMS_PRIORITY_TAGS.sql](../../UPDATE_EXISTING_TEAMS_PRIORITY_TAGS.sql)** - Update Priority-Tags
- **[REMOVE_ALL_DOCUMENT_DEMO_DATA.sql](../../REMOVE_ALL_DOCUMENT_DEMO_DATA.sql)** - Remove Demo-Docs
- **[REMOVE_ALL_LEARNING_DEMO_DATA.sql](../../REMOVE_ALL_LEARNING_DEMO_DATA.sql)** - Remove Demo-Learning

### Debug
- **[DEBUG_TEAM_CREATION.sql](../../DEBUG_TEAM_CREATION.sql)** - Team-Creation-Debug
- **[CHECK_USER_BREAK_SETTINGS.sql](../../CHECK_USER_BREAK_SETTINGS.sql)** - Break-Settings-Check

---

## 📚 **MIGRATION-VERWALTUNG**

### Official Migrations (In `/supabase/migrations/`)
Die offiziellen, nummerierten Migrations befinden sich in `/supabase/migrations/`:
- `001_initial_schema.sql` - Basis-Schema
- `002_storage_setup.sql` - Storage-Setup
- `003-042_*` - Feature-Migrations
- `999_COMPLETE_SETUP_V4.sql` - Kompletter Setup

**Siehe:** [../../supabase/migrations/README.md](../../supabase/migrations/README.md)

### Quick-Fix-SQL (Root)
Die Quick-Fix-SQL-Files im Root sind für:
- Schnelle Reparaturen
- Testing
- One-off-Fixes
- Development

**Produktions-Migrations** sollten immer in `/supabase/migrations/` landen!

---

## 🎯 **MIGRATIONS-REIHENFOLGE**

### 1️⃣ **Erst-Setup** (Neue Datenbank)
```sql
-- Option A: Kompletter Setup
RUN_THIS_IN_SUPABASE.sql

-- Option B: Manuelle Migration
1. 001_initial_schema.sql
2. 002_storage_setup.sql
3. 003-042_*.sql (in Reihenfolge)
4. 999_COMPLETE_SETUP_V4.sql (optional)
```

### 2️⃣ **Feature-Aktivierung**
```sql
-- Organigram
SQL_ORGANIGRAM.md
SQL_DRAGGABLE_ORGANIGRAM.sql

-- Team-Features
SQL_ALL_TEAM_FEATURES_MIGRATIONS.md

-- Departments
SQL_DEPARTMENTS_MIGRATION.md

-- Time-Tracking
SQL_PAUSENREGELUNG.md
```

### 3️⃣ **Fixes** (Bei Problemen)
```sql
-- Siehe /docs/fixes/ für relevante Fixes
```

---

## 🔍 **SUCHE NACH MIGRATION**

### Ich brauche...

**Komplettes Setup:**  
→ [RUN_THIS_IN_SUPABASE.sql](../../RUN_THIS_IN_SUPABASE.sql)  
→ [SQL_COPY_PASTE.md](../../SQL_COPY_PASTE.md)

**Organigram-Tabellen:**  
→ [SQL_ORGANIGRAM.md](../../SQL_ORGANIGRAM.md)

**Team-Features:**  
→ [SQL_ALL_TEAM_FEATURES_MIGRATIONS.md](../../SQL_ALL_TEAM_FEATURES_MIGRATIONS.md)

**Departments:**  
→ [SQL_DEPARTMENTS_MIGRATION.md](../../SQL_DEPARTMENTS_MIGRATION.md)

**Break-Settings:**  
→ [SQL_PAUSENREGELUNG.md](../../SQL_PAUSENREGELUNG.md)

**Fixes:**  
→ [../fixes/FIXES_OVERVIEW.md](../fixes/FIXES_OVERVIEW.md)

---

## ⚠️ **WICHTIGE HINWEISE**

### Vor dem Ausführen
1. **Backup erstellen!**
2. Prüfe ob Migration bereits angewendet wurde
3. Teste in Development-Environment zuerst
4. Lies Migration-File komplett durch

### Nach dem Ausführen
1. Prüfe Supabase-Logs auf Errors
2. Teste betroffene Features
3. Dokumentiere angewendete Migration
4. Commit Code-Changes (falls nötig)

### Best Practices
- ✅ Immer `IF NOT EXISTS` verwenden
- ✅ Migrations sind idempotent
- ✅ Rollback-Plan haben
- ✅ In offiziellen Migrations-Ordner committen
- ❌ Nie direkt in Production ohne Test

---

## 📊 **MIGRATION-STATUS**

| Migration | Status | Kategorie |
|-----------|--------|-----------|
| Initial Schema | ✅ Applied | Core |
| Storage Setup | ✅ Applied | Core |
| Organigram | ✅ Applied | Feature |
| Team Features | ✅ Applied | Feature |
| Leave System | ✅ Applied | Feature |
| Departments | ✅ Applied | Feature |
| Time Tracking | ✅ Applied | Feature |
| Break Settings | ✅ Applied | Feature |

---

## 🔗 **VERWANDTE DOCS**

- [../README.md](../README.md) - Dokumentations-Index
- [../guides/QUICK_START_GUIDE.md](../guides/QUICK_START_GUIDE.md) - Setup-Guide
- [../fixes/](../fixes/) - Bug-Fixes
- [../../supabase/migrations/README.md](../../supabase/migrations/README.md) - Official Migrations

---

**Zuletzt aktualisiert:** 2025-01-10  
**Wichtigste SQL:** [SQL_COPY_PASTE.md](../../SQL_COPY_PASTE.md)
