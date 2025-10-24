# 📋 SQL Copy & Paste - HRthis Setup

**Alle SQL-Befehle für schnelles Copy & Paste in Supabase**

---

## 🎯 Schnellanleitung

1. Öffne Supabase Dashboard → SQL Editor
2. Kopiere den gewünschten SQL-Block
3. Füge ihn ein und klicke "Run"
4. Fertig! ✅

---

## 1️⃣ Profilbild Index entfernen (WICHTIG!)

**Problem:** B-Tree Index kann max. 2704 bytes speichern, Base64-Bilder sind ~6000 bytes groß  
**Lösung:** Index entfernen (wird nicht benötigt, da wir nie nach Profilbild suchen)

```sql
-- Entferne den problematischen Index
DROP INDEX IF EXISTS idx_users_profile_picture;

-- Verifikation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_profile_picture'
  ) THEN
    RAISE EXCEPTION 'Index idx_users_profile_picture still exists!';
  ELSE
    RAISE NOTICE '✅ Index idx_users_profile_picture successfully removed';
  END IF;
END $$;
```

---

## 2️⃣ Profilbild Spalte sicherstellen

**Stellt sicher, dass alle benötigten Spalten in der users-Tabelle existieren**

```sql
-- Füge fehlende Spalten zur users-Tabelle hinzu
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS private_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bic TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shirt_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pants_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shoe_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS jacket_size TEXT;

-- Verifikation
SELECT 
  'SUCCESS: All columns exist!' as status,
  column_name 
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('profile_picture', 'profile_picture_url', 'private_email');
```

---

## 3️⃣ Storage Bucket Setup

**Erstellt den Storage Bucket für Profilbilder (falls noch nicht vorhanden)**

```sql
-- Bucket wird automatisch durch die App erstellt
-- Dieser SQL-Code ist nur zur Info - NICHT ausführen!
-- Die App erstellt den Bucket "hrthis-profile-pictures" automatisch beim ersten Upload
```

---

## 4️⃣ Single-Tenant: Default Organization

**Erstellt automatisch eine Standard-Organisation für alle User (Single-Tenant)**

```sql
-- Erstelle Standard-Organisation falls nicht vorhanden
INSERT INTO organizations (id, name, is_default, tier, max_users)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Standard Organization',
  true,
  'ENTERPRISE',
  999999
)
ON CONFLICT (id) DO NOTHING;

-- Trigger: Auto-Zuweisung aller neuen User zur Default-Org
CREATE OR REPLACE FUNCTION auto_assign_default_org()
RETURNS TRIGGER AS $$
BEGIN
  -- Weise User automatisch der Default-Org zu
  UPDATE users 
  SET organization_id = '00000000-0000-0000-0000-000000000001'
  WHERE id = NEW.id 
    AND organization_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle Trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_org ON users;
CREATE TRIGGER trigger_auto_assign_org
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_default_org();

-- Weise alle existierenden User ohne Org der Default-Org zu
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Verifikation
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as users_with_org,
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as users_without_org
FROM users;
```

---

## 5️⃣ Locations Tabelle

**Erstellt die locations-Tabelle für Standorte**

```sql
-- Erstelle locations Tabelle
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Deutschland',
  is_headquarters BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(organization_id);

-- RLS aktivieren
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy: User sehen nur Locations ihrer eigenen Org
CREATE POLICY "Users can view their org locations"
  ON locations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Admins können Locations ihrer Org verwalten
CREATE POLICY "Admins can manage their org locations"
  ON locations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Verifikation
SELECT 'SUCCESS: locations table created!' as status;
```

---

## 6️⃣ Komplettes Setup überprüfen

**Überprüft, ob alle wichtigen Tabellen und Spalten existieren**

```sql
-- Zeige alle Tabellen
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Zeige users Spalten
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Zeige Default-Org
SELECT id, name, is_default, tier, max_users
FROM organizations
WHERE is_default = true;

-- Zeige User-Org Zuweisungen
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  o.name as organization
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LIMIT 10;
```

---

## 7️⃣ Reset: Alles neu aufsetzen (VORSICHT!)

**⚠️ ACHTUNG: Löscht ALLE Daten! Nur für Development/Testing!**

```sql
-- ACHTUNG: Dies löscht ALLE Daten!
-- Nur in Development/Testing verwenden!

-- Deaktiviere RLS temporär
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;

-- Lösche alle Daten (CASCADE löscht auch abhängige Daten)
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE locations CASCADE;

-- Erstelle Default-Org neu
INSERT INTO organizations (id, name, is_default, tier, max_users)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Standard Organization',
  true,
  'ENTERPRISE',
  999999
);

-- Reaktiviere RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Verifikation
SELECT 'RESET COMPLETE - All data deleted!' as status;
```

---

## 8️⃣ Debugging: Häufige Probleme

### Problem: "relation does not exist"

```sql
-- Zeige alle Tabellen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Problem: "column does not exist"

```sql
-- Zeige alle Spalten einer Tabelle
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### Problem: "permission denied"

```sql
-- Zeige RLS Policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
```

### Problem: User hat keine Organization

```sql
-- Zeige User ohne Org
SELECT id, email, full_name, organization_id
FROM users
WHERE organization_id IS NULL;

-- Weise sie der Default-Org zu
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;
```

---

## 📚 Weitere Infos

- **Migrations:** Siehe `/supabase/migrations/` für vollständige SQL-Dateien
- **Profilbild-Crop:** Siehe `/components/PROFILE_PICTURE_CROP_SYSTEM.md`
- **Single-Tenant Setup:** Siehe `/SINGLE_TENANT_SETUP.md`
- **Quick Start:** Siehe `/QUICK_START_GUIDE.md`

---

## ✅ Checkliste

Nach dem Ausführen der SQL-Befehle:

- [ ] Index `idx_users_profile_picture` wurde entfernt
- [ ] Spalte `profile_picture` existiert in `users`
- [ ] Default-Organization existiert mit `is_default = true`
- [ ] Alle User haben eine `organization_id`
- [ ] Locations-Tabelle existiert
- [ ] RLS ist aktiviert auf allen Tabellen
- [ ] Trigger `trigger_auto_assign_org` ist aktiv

---

**Erstellt:** 2025-01-04  
**Version:** 1.0  
**Projekt:** HRthis Single-Tenant
