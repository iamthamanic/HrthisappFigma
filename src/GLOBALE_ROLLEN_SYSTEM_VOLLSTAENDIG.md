# 🔐 Globale Rollen-System - Vollständige Dokumentation

## 📊 Übersicht: Wo werden die globalen Rollen gespeichert?

Die globalen User-Rollen werden in der **`users`** Tabelle gespeichert, in der Spalte **`role`**.

---

## 1️⃣ DATABASE SCHEMA (PostgreSQL)

### Tabelle: `users`

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'EMPLOYEE' 
    CHECK (role IN ('USER', 'TEAMLEAD', 'HR', 'ADMIN', 'SUPERADMIN', 'EXTERN')),
  employee_number TEXT UNIQUE,
  position TEXT,
  department TEXT,
  -- ... weitere Felder
);
```

### ✅ Verfügbare Rollen (aktueller Stand nach Migration 054):

| Rolle | Wert | Beschreibung |
|-------|------|--------------|
| **USER** | `'USER'` | Standard-Mitarbeiter (früher: EMPLOYEE) |
| **TEAMLEAD** | `'TEAMLEAD'` | Team-Leiter mit erweiterten Rechten |
| **HR** | `'HR'` | Human Resources - Personalverwaltung |
| **ADMIN** | `'ADMIN'` | Administrator - Erweiterte System-Rechte |
| **SUPERADMIN** | `'SUPERADMIN'` | Super-Administrator - Vollzugriff |
| **EXTERN** | `'EXTERN'` | Externe Mitarbeiter - Eingeschränkter Zugriff |

### 🔄 Migrations-Historie:

1. **001_initial_schema.sql** - Ursprünglich nur: `EMPLOYEE`, `ADMIN`, `SUPERADMIN`
2. **028_add_hr_teamlead_roles.sql** - Hinzugefügt: `HR`, `TEAMLEAD`
3. **046_fix_users_role_check_constraint.sql** - Umbenannt: `EMPLOYEE` → `USER`
4. **054_add_extern_role.sql** - Hinzugefügt: `EXTERN`

---

## 2️⃣ FRONTEND CODE (React + Zustand)

### Auth Store (`/stores/BrowoKo_authStore.ts`)

Der Auth Store verwaltet den authentifizierten User und sein Profil:

```typescript
interface AuthState {
  user: AuthUser | null;           // Supabase Auth User
  profile: UserWithAvatar | null;  // User Profile mit role
  organization: Organization | null;
  // ...
}

// User-Profil wird geladen mit:
await get().refreshProfile();

// Dabei wird die Rolle aus der users-Tabelle gelesen
```

### Route Protection (`/App.tsx`)

**AdminRoute Component** - Schützt Admin-Bereiche:

```tsx
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, initialized, connectionError } = useAuthStore();

  // Nur ADMIN, HR, und SUPERADMIN haben Zugriff auf Admin-Bereich
  const isAdmin = profile?.role === 'HR' || 
                  profile?.role === 'ADMIN' || 
                  profile?.role === 'SUPERADMIN';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

### Component-Level Checks (Beispiele):

**1. Request Leave Dialog** (`/components/RequestLeaveDialog.tsx`):
```tsx
const isAdmin = profile?.role === 'ADMIN' || 
                profile?.role === 'SUPERADMIN' || 
                profile?.role === 'HR' || 
                profile?.role === 'TEAMLEAD';
```

**2. Team Dialog** (`/components/admin/BrowoKo_TeamDialog.tsx`):
```tsx
// Nur ADMIN, HR, SUPERADMIN können Teamleads sein
const availableTeamLeads = users
  .filter(u => u.role === 'ADMIN' || u.role === 'HR' || u.role === 'SUPERADMIN');
```

**3. Employee List** (`/components/admin/BrowoKo_EmployeesList.tsx`):
```tsx
// Rollen-Filter
<SelectItem value="EMPLOYEE">Mitarbeiter</SelectItem>
<SelectItem value="HR">HR</SelectItem>
<SelectItem value="ADMIN">Admin</SelectItem>
<SelectItem value="SUPERADMIN">Superadmin</SelectItem>

// Farb-Coding für Badges
const badgeColor = 
  user.role === 'SUPERADMIN' ? 'bg-purple-50 text-purple-700' :
  user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700' :
  user.role === 'HR' ? 'bg-green-50 text-green-700' :
  'bg-gray-50';
```

---

## 3️⃣ BACKEND CODE (Supabase Edge Functions)

### User Service (`/services/BrowoKo_userService.ts`)

**Alle User abrufen mit Rollen-Filter:**
```typescript
async getAllUsers(filters?: UserFilters): Promise<User[]> {
  let query = this.supabase.from('users').select('*');
  
  // Rollen-Filter anwenden
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }
  
  const { data: users, error } = await query;
  return (users || []) as User[];
}
```

**User nach Rolle abrufen:**
```typescript
async getUsersByRole(role: 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN'): Promise<User[]> {
  return await this.getAllUsers({ role });
}
```

### Server Routes (`/supabase/functions/BrowoKoordinator-Server/routes-users.ts`)

**User Creation** - Rolle wird beim Erstellen gesetzt:
```typescript
app.post('/users/create', async (c) => {
  const { email, password, userData } = await c.req.json();
  
  // Supabase Auth User erstellen
  const { data: authData } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  // User-Profil mit Rolle updaten
  await supabase
    .from('users')
    .update({
      ...userData,  // enthält 'role'
      email,
    })
    .eq('id', userId);
});
```

---

## 4️⃣ BERECHTIGUNGS-HIERARCHIE

### 🏆 Rollenbasierte Berechtigungen:

```
SUPERADMIN  → Vollzugriff auf alles
    ↓
  ADMIN     → Erweiterte Verwaltung (Teams, Mitarbeiter)
    ↓
   HR       → Personalverwaltung (Mitarbeiter erstellen/bearbeiten)
    ↓
TEAMLEAD    → Team-spezifische Verwaltung (Urlaub genehmigen)
    ↓
  USER      → Standard-Mitarbeiter (Basis-Funktionen)
    ↓
 EXTERN     → Eingeschränkter Zugriff (nur Übersicht)
```

### 🎯 Typische Berechtigungen pro Rolle:

| Feature | USER | EXTERN | TEAMLEAD | HR | ADMIN | SUPERADMIN |
|---------|------|--------|----------|-----|-------|------------|
| Dashboard ansehen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Eigenes Profil bearbeiten | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Urlaub beantragen | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Team-Urlaub genehmigen | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mitarbeiter erstellen | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Teams verwalten | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin-Bereich | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Rollen zuweisen | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| System-Einstellungen | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |

⚠️ = Eingeschränkt (nicht alle Rollen)

---

## 5️⃣ CODE-BEISPIELE

### ✅ Rolle eines Users prüfen (Frontend):

```tsx
import { useAuthStore } from './stores/BrowoKo_authStore';

function MyComponent() {
  const { profile } = useAuthStore();
  
  // Einzelne Rolle prüfen
  const isAdmin = profile?.role === 'ADMIN';
  const isSuperAdmin = profile?.role === 'SUPERADMIN';
  
  // Mehrere Rollen prüfen
  const hasAdminAccess = ['HR', 'ADMIN', 'SUPERADMIN'].includes(profile?.role);
  
  // Bedingte Darstellung
  return (
    <div>
      {hasAdminAccess && (
        <Button>Admin-Funktion</Button>
      )}
    </div>
  );
}
```

### ✅ Rolle eines Users ändern (Backend):

```sql
-- Via SQL
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'user@example.com';

-- Via Supabase Client
const { data, error } = await supabase
  .from('users')
  .update({ role: 'ADMIN' })
  .eq('id', userId)
  .select()
  .single();
```

### ✅ Alle User einer Rolle abrufen:

```typescript
// Via UserService
const services = getServices();
const admins = await services.user.getUsersByRole('ADMIN');
const hrUsers = await services.user.getUsersByRole('HR');

// Direkter Supabase Query
const { data: superAdmins } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'SUPERADMIN');
```

---

## 6️⃣ WICHTIGE HINWEISE

### ⚠️ Rollen-Änderungen:

1. **Historisch gab es Änderungen:**
   - `EMPLOYEE` wurde zu `USER` umbenannt
   - Achte auf Legacy-Code der noch `EMPLOYEE` verwendet!

2. **Check Constraint:**
   - Die Datenbank erzwingt nur gültige Rollen
   - Ungültige Werte werden abgelehnt

3. **Keine separaten Berechtigungs-Tabellen:**
   - Es gibt keine `permissions` oder `global_roles` Tabelle
   - Alles wird über die `role` Spalte in `users` gesteuert

### 🔍 Debugging-Queries:

```sql
-- Alle User mit ihren Rollen anzeigen
SELECT id, email, first_name, last_name, role 
FROM users 
ORDER BY role, last_name;

-- Anzahl User pro Rolle
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- Alle Admins finden
SELECT * FROM users 
WHERE role IN ('ADMIN', 'SUPERADMIN', 'HR');

-- Rolle eines Users ändern
UPDATE users 
SET role = 'HR' 
WHERE email = 'test@example.com';
```

---

## 7️⃣ TEAM-ROLLEN vs GLOBALE ROLLEN

**⚠️ ACHTUNG: Es gibt 2 verschiedene Rollen-Konzepte!**

### 🌍 Globale Rollen (users.role)
- Gespeichert in: `users` Tabelle, Spalte `role`
- Werte: `USER`, `TEAMLEAD`, `HR`, `ADMIN`, `SUPERADMIN`, `EXTERN`
- Zweck: **Globale Berechtigungen** im gesamten System

### 👥 Team-Rollen (team_members.role)
- Gespeichert in: `team_members` Tabelle, Spalte `role`
- Werte: `TEAMLEAD`, `MEMBER`
- Zweck: **Rolle innerhalb eines spezifischen Teams**

**Beispiel:**
```
Ein User kann:
- Globale Rolle: USER (normale Berechtigungen)
- Team A Rolle: TEAMLEAD (kann Urlaub in Team A genehmigen)
- Team B Rolle: MEMBER (normales Mitglied in Team B)
```

---

## 8️⃣ QUICK REFERENCE

### Frontend:
```tsx
const { profile } = useAuthStore();
const userRole = profile?.role;
const isAdmin = ['HR', 'ADMIN', 'SUPERADMIN'].includes(userRole);
```

### Backend:
```typescript
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', userId)
  .single();
```

### SQL:
```sql
SELECT role FROM users WHERE id = 'uuid-here';
```

---

## 🎯 ZUSAMMENFASSUNG

1. **Wo gespeichert?** → `users` Tabelle, Spalte `role`
2. **Welche Werte?** → `USER`, `TEAMLEAD`, `HR`, `ADMIN`, `SUPERADMIN`, `EXTERN`
3. **Wie geprüft?** → Im Frontend via `useAuthStore().profile.role`
4. **Wie geschützt?** → Via `AdminRoute` Component + Conditional Rendering
5. **Wie verwaltet?** → Via `BrowoKo_userService.ts` + Edge Functions

---

**Du hast jetzt das komplette Rollen-System verstanden!** 🚀

Bei Fragen zu spezifischen Features oder Implementierungen, frag einfach!
