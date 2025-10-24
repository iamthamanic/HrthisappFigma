# 🏢 HRthis - Single-Tenant Setup Guide

## 📋 Überblick

HRthis ist als **Single-Tenant System** konzipiert:
- **1 Firma = 1 Supabase-Datenbank**
- Jede Firma hat ihre eigene isolierte Datenbank
- Alle Mitarbeiter werden automatisch der Standard-Organisation zugewiesen
- Keine manuelle Org-Zuweisung nötig

---

## 🚀 Schnellstart für neue Firmen

### 1️⃣ Supabase-Projekt erstellen
1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Kopiere die Projekt-ID und die Anon Key

### 2️⃣ Umgebungsvariablen setzen
Erstelle eine `.env` Datei:
```env
VITE_SUPABASE_PROJECT_ID=dein-projekt-id
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

### 3️⃣ Migrationen ausführen

Führe die Migrationen in **exakt dieser Reihenfolge** aus:

#### ✅ Basis-Setup (Required)
```sql
-- 1. Basis-Schema
supabase/migrations/001_initial_schema.sql

-- 2. Storage-Setup
supabase/migrations/002_storage_setup.sql

-- 3. Auto-Profile mit Org-Zuweisung (✨ WICHTIG!)
supabase/migrations/019_auto_assign_default_org.sql

-- 4. Multi-Tenancy Organizations Table
supabase/migrations/016_multitenancy_organizations.sql

-- 5. Fehlende Tabellen
supabase/migrations/018_COMPLETE_MISSING_TABLES.sql
```

#### 🎯 Optionale Features
```sql
-- Rewards & Gamification
supabase/migrations/008_rewards_system.sql
supabase/migrations/010_achievements_system.sql
supabase/migrations/011_avatar_emoji_fields.sql

-- Learning System
supabase/migrations/009_quiz_content.sql

-- Activity Feed
supabase/migrations/012_activity_feed.sql
```

### 4️⃣ Standard-Organisation wird automatisch erstellt

Beim ersten Admin-Login:
1. Die Migration 016 erstellt automatisch eine "Demo Company"
2. Diese ist als `is_default = true` markiert
3. Alle neuen User werden automatisch dieser Org zugewiesen

**Oder manuell erstellen:**
1. Gehe zu **Admin → Firmeneinstellungen**
2. Falls keine Org existiert, klicke auf "Standard-Organisation erstellen"

---

## 🎯 Wie funktioniert die Auto-Zuweisung?

### Bei Registrierung (Self-Service)
```
User registriert sich
    ↓
Supabase Auth erstellt Account
    ↓
Trigger: handle_new_user()
    ↓
Findet default org (is_default = true)
    ↓
Erstellt User-Profile mit organization_id
    ↓
✅ User automatisch zugewiesen!
```

### Bei Admin-Erstellung
```
Admin erstellt Mitarbeiter
    ↓
adminStore.createUser()
    ↓
Holt default org via getDefaultOrganizationId()
    ↓
Erstellt User mit organization_id
    ↓
✅ User automatisch zugewiesen!
```

---

## 📊 Firmeneinstellungen bearbeiten

### Zugriff
**Admin → Firmeneinstellungen**

### Einstellbare Felder
- ✏️ **Firmenname** - Wird im System angezeigt
- 🔗 **Slug** - URL-freundlicher Name
- 📧 **E-Mail-Domain** - Haupt-Domain (z.B. für Automatisierungen)
- 📊 **Subscription Tier** - FREE, STARTER, PROFESSIONAL, ENTERPRISE
- 👥 **Max. Mitarbeiter** - Limit für die Anzahl der User

### Statistiken
- Aktuelle Mitarbeiteranzahl
- Status (immer Aktiv)
- Subscription Tier

---

## 🔐 Berechtigungen

### ADMIN & SUPERADMIN
- ✅ Kann Firmeneinstellungen bearbeiten
- ✅ Kann Mitarbeiter hinzufügen
- ✅ Automatische Org-Zuweisung bei neuen Usern

### EMPLOYEE
- ❌ Kann Firmeneinstellungen nicht sehen/bearbeiten
- ✅ Wird automatisch der Firma zugewiesen

---

## 🏗️ Datenbank-Struktur

### organizations Tabelle
```sql
id: UUID (Primary Key)
name: TEXT -- "Meine Firma GmbH"
slug: TEXT -- "meine-firma"
domain: TEXT -- "example.com" (optional)
subscription_tier: ENUM -- FREE, STARTER, PROFESSIONAL, ENTERPRISE
max_users: INTEGER -- 50, 100, 200, etc.
is_active: BOOLEAN -- immer true
is_default: BOOLEAN -- ✨ true für die Standard-Org
logo_url: TEXT (optional)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### users Tabelle
```sql
id: UUID (Primary Key, foreign key zu auth.users)
organization_id: UUID (foreign key zu organizations) ✨
email: TEXT
first_name: TEXT
last_name: TEXT
-- ... weitere Felder
```

---

## 🎨 Migration vs. Manuelles Setup

### Option A: Automatisch via Migration 016
✅ **Empfohlen für neue Setups**

Die Migration erstellt automatisch:
- "Demo Company" als Standard-Org
- `is_default = true`
- Alle existierenden User werden zugewiesen

### Option B: Manuell via Admin-UI
✅ **Wenn Migration nicht funktioniert**

1. Gehe zu **Admin → Firmeneinstellungen**
2. Klicke "Standard-Organisation erstellen"
3. Bearbeite Name und Details

---

## ⚙️ Technische Details

### Helper-Functions
```typescript
// utils/organizationHelper.ts

// Holt die Standard-Org ID
getDefaultOrganizationId(): Promise<string | null>

// Holt die komplette Standard-Org
getDefaultOrganization(): Promise<Organization | null>

// Stellt sicher, dass eine Default-Org existiert
ensureDefaultOrganizationExists(): Promise<string | null>
```

### Database Trigger
```sql
-- Automatische User-Zuweisung bei Registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

Die Function:
1. Sucht nach `organizations WHERE is_default = true`
2. Setzt `organization_id` beim User-Insert
3. Funktioniert auch wenn keine Org existiert (NULL)

---

## 🚨 Troubleshooting

### Problem: "Keine Standard-Organisation gefunden"
**Lösung:**
1. Gehe zu **Admin → Firmeneinstellungen**
2. Klicke "Standard-Organisation erstellen"
3. Oder führe Migration 016 aus

### Problem: Neue User haben keine organization_id
**Lösung:**
1. Prüfe ob Migration 019 ausgeführt wurde
2. Prüfe ob eine Org mit `is_default = true` existiert
3. Überprüfe Logs in Supabase Dashboard

### Problem: "Organization kann nicht bearbeitet werden"
**Lösung:**
- Nur ADMIN oder SUPERADMIN kann Firmeneinstellungen bearbeiten
- Prüfe User-Rolle in der Datenbank

---

## 🎯 Best Practices

### ✅ DO
- Führe alle Migrationen in der richtigen Reihenfolge aus
- Erstelle die Standard-Org direkt nach dem Setup
- Nutze die Firmeneinstellungen für Branding
- Halte Max-Users Limit realistisch

### ❌ DON'T
- Erstelle nicht mehrere Orgs mit `is_default = true`
- Lösche nicht die Standard-Org (User wären ohne Org)
- Setze `is_default` nicht manuell auf false

---

## 🔄 Von Multi-Tenant zu Single-Tenant?

Wenn du das Multi-Tenant System (mehrere Firmen in einer DB) nutzen willst:

1. Entferne **nicht** die organization_id aus den Tabellen
2. Nutze **Admin → Org-Verwaltung (SUPERADMIN)** statt Firmeneinstellungen
3. Das System unterstützt beides!

**Single-Tenant = Empfohlen für die meisten Firmen**
**Multi-Tenant = Nur für SaaS-Provider mit vielen Kunden**

---

## 📚 Weiterführende Dokumentation

- `MULTI_TENANCY_SETUP.md` - Multi-Tenant Setup (falls gewünscht)
- `MIGRATION_CHECKLIST.md` - Alle Migrationen im Detail
- `PROJECT_STRUCTURE.md` - Code-Struktur
- `QUICK_START_GUIDE.md` - Entwickler-Quick-Start

---

## 🎉 Zusammenfassung

1. ✅ **Eine Firma = Eine Datenbank**
2. ✅ **Automatische Org-Zuweisung** via Trigger + Helper
3. ✅ **Firmeneinstellungen** für Admins
4. ✅ **Kein manuelles Zuweisen** nötig
5. ✅ **Migration 019** aktiviert Auto-Assignment

**Das ist der empfohlene Weg für HRthis! 🚀**
