# 🔧 Migration Checklist für HRthis

## ⚠️ Aktuelles Problem

Du erhältst Fehler wie:
- `ERROR: 42P01: relation "activity_feed" does not exist`
- `ERROR: Could not find the table 'public.organizations'`

**Das bedeutet**: Einige Migrations wurden noch nicht ausgeführt.

---

## ✅ Migrations in der richtigen Reihenfolge ausführen

### Phase 1: Basis-Setup (001-011) ✅ BEREITS ERLEDIGT

Diese Migrations sollten bereits ausgeführt sein:
- ✅ 001: Initial Schema (users, teams, time_records, etc.)
- ✅ 002: Storage Setup
- ✅ 003: Auto User Profile
- ✅ 004: Disable Email Confirmation
- ✅ 005-007: RLS Fixes
- ✅ 008: Rewards System
- ✅ 009: Quiz Content
- ✅ 010: Achievements System
- ✅ 011: Avatar Emoji Fields

---

### Phase 2: Fehlende Tabellen (012-015)

**DIESE MÜSSEN JETZT AUSGEFÜHRT WERDEN!**

#### Option A: Einzelne Migrations (Original)

Führe diese Migrations nacheinander aus:

1. **Migration 012** - Activity Feed
   ```sql
   -- Kopiere und führe aus: /supabase/migrations/012_activity_feed.sql
   ```

2. **Migration 013** - Fix Achievements Schema
   ```sql
   -- Kopiere und führe aus: /supabase/migrations/013_fix_achievements_schema.sql
   ```

3. **Migration 014** - Complete Achievements Setup
   ```sql
   -- Kopiere und führe aus: /supabase/migrations/014_COMPLETE_ACHIEVEMENTS_SETUP.sql
   ```

4. **Migration 015** - Add Profile Picture
   ```sql
   -- Kopiere und führe aus: /supabase/migrations/015_add_profile_picture.sql
   ```

#### Option B: Schnell-Migration (Empfohlen!)

**ODER führe einfach diese EINE Datei aus:**

```sql
-- /supabase/migrations/018_COMPLETE_MISSING_TABLES.sql
-- Diese Datei erstellt ALLE fehlenden Tabellen auf einmal
```

**Vorteile:**
- ✅ Schneller (nur 1 Migration statt 4)
- ✅ Vermeidet Fehler durch falsche Reihenfolge
- ✅ Prüft automatisch ob Tabellen existieren

---

### Phase 3: Single-Tenant Setup (016 + 019) 🏢

**NUR AUSFÜHREN NACHDEM Phase 2 komplett ist!**

#### 1. Organizations Tabelle erstellen
```sql
-- /supabase/migrations/016_multitenancy_organizations.sql
-- Erstellt organizations table und fügt organization_id zu allen Tabellen hinzu
```

**Was diese Migration macht:**
- Erstellt `organizations` Tabelle
- Fügt `organization_id` zu ALLEN 13 Tabellen hinzu (inkl. activity_feed!)
- Richtet Row Level Security (RLS) ein
- Erstellt Demo Company mit `is_default = true`
- Ordnet alle User der Demo Company zu

#### 2. Auto-Assignment aktivieren ✨ **NEU!**
```sql
-- /supabase/migrations/019_auto_assign_default_org.sql
-- Aktiviert automatische Org-Zuweisung bei Registrierung
```

**Was diese Migration macht:**
- Updated die `handle_new_user()` Function
- Neue User werden automatisch der Default-Org zugewiesen
- Perfekt für Single-Tenant Setup!

---

### Phase 4: Optional - Demo Daten entfernen (017)

```sql
-- /supabase/migrations/017_remove_demo_quizzes.sql
-- Löscht alle Demo-Quizzes
DELETE FROM quiz_content;
```

---

## 🎯 Empfohlene Vorgehensweise (SCHNELLSTER WEG)

### Schritt 1: Fehlende Tabellen erstellen

```sql
-- Im Supabase SQL Editor ausführen:
-- Kopiere den KOMPLETTEN Inhalt von:
/supabase/migrations/018_COMPLETE_MISSING_TABLES.sql
```

**Warte bis die Ausführung erfolgreich ist!**

### Schritt 2: Organizations Setup

```sql
-- Im Supabase SQL Editor ausführen:
-- Kopiere den KOMPLETTEN Inhalt von:
/supabase/migrations/016_multitenancy_organizations.sql
```

**Warte bis die Ausführung erfolgreich ist!**

### Schritt 3: Auto-Assignment aktivieren ✨

```sql
-- Im Supabase SQL Editor ausführen:
-- Kopiere den KOMPLETTEN Inhalt von:
/supabase/migrations/019_auto_assign_default_org.sql
```

**Warte bis die Ausführung erfolgreich ist!**

### Schritt 4: SUPERADMIN setzen

```sql
-- Ersetze 'deine-email@example.com' mit deiner echten Email:
UPDATE users 
SET role = 'SUPERADMIN'
WHERE email = 'deine-email@example.com';
```

### Schritt 5: Demo-Quizzes löschen (Optional)

```sql
DELETE FROM quiz_content;
```

### Schritt 6: App testen 🎉

- Logout
- Login
- Gehe zu **Admin → Firmeneinstellungen**
- Bearbeite deine Firmendaten
- Erstelle einen neuen Mitarbeiter → Wird automatisch zugewiesen! ✅

---

## 🔍 Überprüfung

### Prüfe ob alle Tabellen existieren:

```sql
-- Führe diese Query aus um zu sehen welche Tabellen existieren:
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Du solltest MINDESTENS diese Tabellen sehen:**
- ✅ users
- ✅ teams
- ✅ time_records
- ✅ leave_requests
- ✅ documents
- ✅ video_content
- ✅ quiz_content
- ✅ learning_progress
- ✅ achievements
- ✅ user_achievements
- ✅ user_avatars
- ✅ coin_transactions
- ✅ notifications
- ✅ **activity_feed** ← WICHTIG!
- ✅ **organizations** ← WICHTIG für Multi-Tenancy!

### Prüfe ob organization_id existiert:

```sql
-- Prüfe ob users Tabelle organization_id hat:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'organization_id';
```

**Sollte zurückgeben:**
```
column_name      | data_type
----------------|----------
organization_id | uuid
```

---

## ❌ Häufige Fehler & Lösungen

### Fehler: "relation activity_feed does not exist"

**Ursache**: Migration 012 oder 018 wurde nicht ausgeführt

**Lösung**: 
```sql
-- Führe aus: /supabase/migrations/018_COMPLETE_MISSING_TABLES.sql
```

### Fehler: "Could not find the table 'public.organizations'"

**Ursache**: Migration 016 wurde nicht ausgeführt

**Lösung**:
```sql
-- Zuerst: 018_COMPLETE_MISSING_TABLES.sql
-- Dann: 016_multitenancy_organizations.sql
```

### Fehler: "column organization_id does not exist"

**Ursache**: Migration 016 wurde nicht vollständig ausgeführt

**Lösung**:
```sql
-- Führe Migration 016 KOMPLETT aus (400+ Zeilen!)
-- Nicht nur teilweise kopieren!
```

### Fehler: "User kann keine Daten sehen nach Login"

**Ursache**: User hat keine `organization_id`

**Lösung**:
```sql
-- Weise User zur Demo Company zu:
UPDATE users 
SET organization_id = (
  SELECT id FROM organizations 
  WHERE slug = 'demo-company' 
  LIMIT 1
)
WHERE organization_id IS NULL;
```

---

## 📊 Migrations Status prüfen

### Check welche Migrations bereits ausgeführt wurden:

Supabase speichert ausgeführte Migrations in der `schema_migrations` Tabelle (falls du sie nutzt).

**Alternative**: Prüfe manuell welche Tabellen/Columns existieren:

```sql
-- Prüfe ob activity_feed existiert:
SELECT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE tablename = 'activity_feed'
) AS activity_feed_exists;

-- Prüfe ob organizations existiert:
SELECT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE tablename = 'organizations'
) AS organizations_exists;

-- Prüfe ob users.organization_id existiert:
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'users' 
  AND column_name = 'organization_id'
) AS users_has_org_id;
```

**Erwartetes Ergebnis nach vollständiger Migration:**
```
activity_feed_exists | true
organizations_exists | true
users_has_org_id     | true
```

---

## 🚀 Quick Start (Copy-Paste Ready)

### Vollständiges Setup in 4 Schritten:

```sql
-- ================================================
-- SCHRITT 1: Fehlende Tabellen erstellen
-- ================================================
-- Kopiere KOMPLETTEN Inhalt von: /supabase/migrations/018_COMPLETE_MISSING_TABLES.sql
-- Füge hier ein und führe aus ↓


-- ================================================
-- SCHRITT 2: Multi-Tenancy aktivieren
-- ================================================
-- Kopiere KOMPLETTEN Inhalt von: /supabase/migrations/016_multitenancy_organizations.sql
-- Füge hier ein und führe aus ↓


-- ================================================
-- SCHRITT 3: SUPERADMIN setzen
-- ================================================
UPDATE users 
SET role = 'SUPERADMIN'
WHERE email = 'deine-email@example.com'; -- ⚠️ ERSETZE MIT DEINER EMAIL!


-- ================================================
-- SCHRITT 4: Demo-Quizzes löschen (Optional)
-- ================================================
DELETE FROM quiz_content;


-- ================================================
-- SCHRITT 5: Verifizierung
-- ================================================
-- Prüfe ob alles funktioniert:
SELECT 
  (SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'activity_feed')) AS activity_feed_ok,
  (SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'organizations')) AS organizations_ok,
  (SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id')) AS org_id_ok,
  (SELECT COUNT(*) FROM organizations) AS org_count,
  (SELECT COUNT(*) FROM users WHERE role = 'SUPERADMIN') AS superadmin_count;
```

**Erwartetes Ergebnis:**
```
activity_feed_ok | organizations_ok | org_id_ok | org_count | superadmin_count
-----------------|------------------|-----------|-----------|------------------
true             | true             | true      | 1         | 1
```

---

## 📚 Nach der Migration

### Was du jetzt tun kannst:

1. **Logout & Login** - Deine neue SUPERADMIN Rolle aktivieren
2. **Organizations verwalten** - `/admin/organizations`
3. **Teams erstellen** - `/admin/teams`
4. **Mitarbeiter hinzufügen** - `/admin/team-management`
5. **Learning Content erstellen** - `/learning/admin`
6. **Avatar Items hinzufügen** - `/admin/avatar-management`
7. **Benefits konfigurieren** - `/admin/benefits-management`

### Weitere Dokumentation:

- 📘 **Multi-Tenancy Details**: `/MULTI_TENANCY_SETUP.md`
- 📘 **Quick Start Guide**: `/QUICK_START_GUIDE.md`
- 📘 **Projekt Struktur**: `/PROJECT_STRUCTURE.md`

---

## 🆘 Immer noch Probleme?

### Debug-Schritte:

1. **Browser Console öffnen** (F12)
2. **Suche nach Fehlern** in der Console
3. **Kopiere den kompletten Fehler**
4. **Prüfe welche Tabelle fehlt**
5. **Führe die entsprechende Migration aus**

### Wichtige Logs:

- Frontend Fehler: Browser Console (F12)
- Backend Fehler: Supabase Dashboard → Logs
- SQL Fehler: Supabase SQL Editor → Output

---

## ✅ Zusammenfassung

**Migrations Reihenfolge:**
1. ✅ Basis Setup (001-011) - Bereits erledigt
2. 🔧 **018_COMPLETE_MISSING_TABLES.sql** - JETZT ausführen!
3. 🏢 **016_multitenancy_organizations.sql** - DANACH ausführen!
4. 👤 **SUPERADMIN setzen** - SQL Update
5. 🎉 **Fertig!**

Nach erfolgreicher Migration:
- ✅ Keine Fehler mehr in der Console
- ✅ `/admin/organizations` funktioniert
- ✅ Multi-Tenancy ist aktiv
- ✅ Du bist SUPERADMIN

**Viel Erfolg! 🚀**
