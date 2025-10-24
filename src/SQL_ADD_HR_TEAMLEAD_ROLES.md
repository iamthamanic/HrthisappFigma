# SQL Migration: HR und TEAMLEAD Rollen hinzufügen

## ⚠️ WICHTIG: Diese Migration in Supabase ausführen

Diese Migration fügt die neuen Rollen **HR** und **TEAMLEAD** zum System hinzu.

## 📋 Was wird gemacht?

1. Entfernt die alte CHECK Constraint für die `role` Spalte
2. Fügt eine neue CHECK Constraint hinzu, die HR und TEAMLEAD erlaubt
3. Setzt NULL-Rollen auf EMPLOYEE (Fallback)
4. Fügt Dokumentation hinzu

## 🔧 SQL Code zum Kopieren

```sql
-- Migration: Add HR and TEAMLEAD roles
-- Description: Extends the user role CHECK constraint to include HR and TEAMLEAD roles

-- Drop the existing CHECK constraint on the role column
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new CHECK constraint with HR and TEAMLEAD roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('EMPLOYEE', 'HR', 'TEAMLEAD', 'ADMIN', 'SUPERADMIN'));

-- Update any existing NULL roles to EMPLOYEE (just in case)
UPDATE users SET role = 'EMPLOYEE' WHERE role IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: EMPLOYEE (standard user), HR (human resources with admin rights), TEAMLEAD (team lead with admin rights), ADMIN (administrator), SUPERADMIN (full access including role assignment)';
```

## ✅ Verifizierung

Nach dem Ausführen kannst du prüfen, ob die Migration erfolgreich war:

```sql
-- Überprüfe die CHECK Constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND contype = 'c';
```

## 📝 Rollen-Übersicht

| Rolle | Farbe | Beschreibung | Rechte |
|-------|-------|--------------|--------|
| **EMPLOYEE** | Grau | Mitarbeiter | Standard-Berechtigungen |
| **HR** | Grün | Personalabteilung | Vollzugriff wie ADMIN |
| **TEAMLEAD** | Orange | Teamleitung | Vollzugriff wie ADMIN |
| **ADMIN** | Blau | Administrator | Erweiterte Verwaltung |
| **SUPERADMIN** | Lila | Super Administrator | Vollzugriff + Rollenvergabe |

## 🎯 Verwendung

Nach dieser Migration können HR und TEAMLEAD Benutzer erstellt werden mit:

```sql
-- Beispiel: Einen HR Benutzer erstellen
UPDATE users 
SET role = 'HR' 
WHERE email = 'hr@firma.de';

-- Beispiel: Einen TEAMLEAD Benutzer erstellen
UPDATE users 
SET role = 'TEAMLEAD' 
WHERE email = 'teamlead@firma.de';
```

## 🔐 Berechtigungen

- **HR** und **TEAMLEAD** haben die gleichen Rechte wie **ADMIN**
- Nur **SUPERADMIN** kann Rollen zuweisen
- Alle drei Rollen haben Zugriff auf den Admin-Bereich