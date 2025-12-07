# 🔐 BrowoKoordinator - Permission System Documentation

**Status:** ✅ Vollständig implementiert (2024-12)  
**Version:** 2.0 (Database-backed mit GRANT/REVOKE Overrides)

---

## 📋 Inhaltsverzeichnis

1. [Architektur-Übersicht](#architektur-übersicht)
2. [Datenbank-Schema](#datenbank-schema)
3. [Frontend Integration](#frontend-integration)
4. [Backend Integration (Edge Functions)](#backend-integration-edge-functions)
5. [Permission Matrix](#permission-matrix)
6. [Migration Guide](#migration-guide)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architektur-Übersicht

Das Permission System besteht aus **4 Schichten**:

```
┌─────────────────────────────────────────────────────────────┐
│  1. FRONTEND (React)                                        │
│     - usePermissions Hook                                   │
│     - AuthStore (effectivePermissions)                      │
│     - UI Permission Guards                                  │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│  2. CONFIG LAYER                                            │
│     - /config/permissions.ts (Frontend)                     │
│     - /supabase/functions/_shared/permissions.ts (Backend)  │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│  3. API LAYER (BrowoKoordinator-Server)                     │
│     - /api/permissions/effective/:userId                    │
│     - /api/users/:userId/permissions (GRANT/REVOKE)         │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│  4. DATABASE (PostgreSQL + Supabase)                        │
│     - permissions (alle verfügbaren Permissions)            │
│     - role_permissions (Default pro Rolle)                  │
│     - user_permissions (GRANT/REVOKE Overrides)             │
│     - effective_user_permissions (VIEW mit finaler Logic)   │
└─────────────────────────────────────────────────────────────┘
```

### Kernkonzepte

**Permission Keys:**
- Eindeutige String-Identifier (z.B. `manage_employees`, `view_courses`)
- Definiert in `/config/permissions.ts` (Frontend) und `/supabase/functions/_shared/permissions.ts` (Backend)
- Gespeichert in DB-Tabelle `permissions`

**Rollen:**
- 6 Rollen: `USER`, `TEAMLEAD`, `HR`, `ADMIN`, `SUPERADMIN`, `EXTERN`
- Jede Rolle hat Default-Permissions (definiert in `role_permissions`)

**Overrides:**
- **GRANT:** User erhält zusätzliche Permission (über Rolle hinaus)
- **REVOKE:** User verliert Permission (trotz Rolle)
- Gespeichert in `user_permissions` Tabelle

**Effective Permissions:**
- Finale Berechnung: `role_permissions + GRANTs - REVOKEs`
- Berechnet durch die View `effective_user_permissions`

---

## 🗄️ Datenbank-Schema

### Tabelle: `permissions`

Definiert alle verfügbaren Permissions im System.

```sql
CREATE TABLE public.permissions (
  key TEXT PRIMARY KEY,              -- z.B. 'manage_employees'
  label TEXT NOT NULL,               -- z.B. 'Mitarbeiter verwalten'
  category TEXT NOT NULL,            -- z.B. 'Team & Organisation'
  description TEXT                   -- z.B. 'Neue Mitarbeiter anlegen...'
);
```

**Beispiel:**
| key | label | category | description |
|-----|-------|----------|-------------|
| `manage_employees` | Mitarbeiter verwalten | Team & Organisation | Mitarbeiter anlegen, bearbeiten... |
| `approve_leave_requests` | Urlaub genehmigen | Zeit & Urlaub | Urlaubsanträge genehmigen/ablehnen |

### Tabelle: `role_permissions`

Definiert Default-Permissions pro Rolle.

```sql
CREATE TABLE public.role_permissions (
  role TEXT NOT NULL CHECK (role IN ('USER', 'TEAMLEAD', 'HR', 'ADMIN', 'SUPERADMIN', 'EXTERN')),
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_key)
);
```

**Beispiel:**
| role | permission_key |
|------|----------------|
| `USER` | `view_dashboard` |
| `USER` | `submit_leave_request` |
| `ADMIN` | `view_dashboard` |
| `ADMIN` | `submit_leave_request` |
| `ADMIN` | `approve_leave_requests` |
| `ADMIN` | `manage_employees` |

### Tabelle: `user_permissions`

Individuelle Overrides pro User.

```sql
CREATE TABLE public.user_permissions (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('GRANT', 'REVOKE')),
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, permission_key)
);
```

**Beispiel:**
| user_id | permission_key | mode | granted_by | granted_at |
|---------|----------------|------|------------|------------|
| `abc123` | `manage_employees` | `GRANT` | `xyz789` | 2024-12-01 |
| `def456` | `delete_courses` | `REVOKE` | `xyz789` | 2024-12-05 |

**Use Cases:**
- GRANT: "Max (USER) soll zusätzlich Urlaube genehmigen können"
- REVOKE: "Anna (ADMIN) darf keine Kurse löschen"

### View: `effective_user_permissions`

Berechnet finale Permissions für jeden User.

```sql
CREATE OR REPLACE VIEW public.effective_user_permissions AS
-- 1. Alle Permissions aus Rolle
SELECT u.id AS user_id, rp.permission_key
FROM users u
JOIN role_permissions rp ON rp.role = u.role

UNION

-- 2. Alle GRANTs hinzufügen
SELECT up.user_id, up.permission_key
FROM user_permissions up
WHERE up.mode = 'GRANT'

EXCEPT

-- 3. Alle REVOKEs entfernen
SELECT up.user_id, up.permission_key
FROM user_permissions up
WHERE up.mode = 'REVOKE';
```

**Beispiel-Output:**
| user_id | permission_key |
|---------|----------------|
| `abc123` | `view_dashboard` |
| `abc123` | `manage_employees` ← GRANT |
| `def456` | `view_dashboard` |
| `def456` | `approve_leave_requests` |
| (kein `delete_courses`) ← REVOKE |

---

## 💻 Frontend Integration

### 1. Permission Hook: `usePermissions`

**Location:** `/hooks/usePermissions.ts`

```typescript
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { can, hasPermission, roleInfo } = usePermissions(profile?.role);

  // Option 1: can Object (legacy API)
  if (can.manageEmployees) {
    return <button>Mitarbeiter hinzufügen</button>;
  }

  // Option 2: hasPermission() (empfohlen)
  if (hasPermission('manage_employees')) {
    return <button>Mitarbeiter hinzufügen</button>;
  }

  // Role Info
  console.log(roleInfo.name); // "Administrator"
  console.log(roleInfo.description); // "Erweiterte Berechtigungen..."
}
```

### 2. Auth Store: `effectivePermissions`

**Location:** `/stores/BrowoKo_authStore.ts`

Beim Login werden Permissions geladen:

```typescript
// In authStore.ts
const loadEffectivePermissions = async (userId: string) => {
  const response = await fetch(`${API_URL}/permissions/effective/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { permissions } = await response.json();
  
  // Speichern im Store
  set({ effectivePermissions: permissions });
};
```

### 3. Config: Permission Keys

**Location:** `/config/permissions.ts`

```typescript
export const PermissionKey = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_EMPLOYEES: 'manage_employees',
  APPROVE_LEAVE_REQUESTS: 'approve_leave_requests',
  // ... alle anderen
} as const;

export const ROLE_PERMISSION_MATRIX: Record<UserRole, PermissionKey[]> = {
  USER: ['view_dashboard', 'submit_leave_request', ...],
  ADMIN: ['view_dashboard', 'manage_employees', ...],
  // ... alle Rollen
};
```

### 4. UI Guards

```tsx
// Button nur für User mit Permission anzeigen
{hasPermission('manage_employees') && (
  <button onClick={addEmployee}>
    Mitarbeiter hinzufügen
  </button>
)}

// Ganzen Screen schützen
if (!hasPermission('access_admin_area')) {
  return <Navigate to="/dashboard" />;
}
```

---

## 🚀 Backend Integration (Edge Functions)

### 1. Setup: Imports

```typescript
import { authorize, authorizeOptional } from '../_shared/auth.ts';
import { PermissionKey } from '../_shared/permissions.ts';
import { errorResponse, successResponse, ForbiddenError } from '../_shared/errors.ts';
```

### 2. Auth Context mit `authorize()`

```typescript
app.get('/api/employees', async (c) => {
  try {
    // Authentifizierung + Permission-Loading
    const auth = await authorize(c.req.header('Authorization'), supabase);

    // auth enthält:
    // - auth.user.id
    // - auth.user.email
    // - auth.user.role
    // - auth.user.first_name
    // - auth.user.last_name
    // - auth.permissions (Set<string>)
    // - auth.hasPermission(key: string): boolean
    // - auth.requirePermission(key: string): void
    // - auth.isAdmin: boolean
    // - auth.isTeamLead: boolean

    // Business Logic
    const { data } = await supabase
      .from('users')
      .select('*');

    return successResponse({ employees: data });

  } catch (error) {
    return errorResponse(error, 'GET /api/employees');
  }
});
```

### 3. Permission Checks

#### Option A: `hasPermission()` - Manueller Check

```typescript
app.post('/api/employees', async (c) => {
  const auth = await authorize(c.req.header('Authorization'), supabase);

  // Check Permission
  if (!auth.hasPermission(PermissionKey.ADD_EMPLOYEES)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Business Logic
  const body = await c.req.json();
  const { data } = await supabase.from('users').insert(body);
  
  return successResponse({ employee: data });
});
```

#### Option B: `requirePermission()` - Wirft Exception

```typescript
app.post('/api/employees', async (c) => {
  try {
    const auth = await authorize(c.req.header('Authorization'), supabase);

    // Wirft ForbiddenError wenn Permission fehlt
    auth.requirePermission(PermissionKey.ADD_EMPLOYEES);

    // Business Logic
    const body = await c.req.json();
    const { data } = await supabase.from('users').insert(body);
    
    return successResponse({ employee: data });

  } catch (error) {
    // ForbiddenError wird von errorResponse() automatisch behandelt
    return errorResponse(error, 'POST /api/employees');
  }
});
```

#### Option C: Role-Based Check

```typescript
app.delete('/api/employees/:id', async (c) => {
  const auth = await authorize(c.req.header('Authorization'), supabase);

  // Einfacher Admin-Check
  if (!auth.isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  // Business Logic
  await supabase.from('users').delete().eq('id', c.req.param('id'));
  
  return successResponse({ success: true });
});
```

#### Option D: Komplexe Logik

```typescript
app.patch('/api/leave-requests/:id/approve', async (c) => {
  const auth = await authorize(c.req.header('Authorization'), supabase);
  const requestId = c.req.param('id');

  // Request laden
  const { data: request } = await supabase
    .from('leave_requests')
    .select('*, employee:users!employee_id(*)')
    .eq('id', requestId)
    .single();

  // Komplexe Permission Logic
  const canApprove = 
    // Permission vorhanden UND...
    auth.hasPermission(PermissionKey.APPROVE_LEAVE_REQUESTS) &&
    // (...ist Manager des Users ODER ist Admin)
    (request.employee.manager_id === auth.user.id || auth.isAdmin);

  if (!canApprove) {
    return c.json({ 
      error: 'You do not have permission to approve this request' 
    }, 403);
  }

  // Business Logic
  await supabase
    .from('leave_requests')
    .update({ status: 'APPROVED', approved_by: auth.user.id })
    .eq('id', requestId);

  return successResponse({ success: true });
});
```

### 4. Optional Auth (Public Endpoints)

```typescript
app.get('/api/stats', async (c) => {
  // authorizeOptional() gibt null zurück statt Exception
  const auth = await authorizeOptional(c.req.header('Authorization'), supabase);

  if (auth) {
    // Authenticated: Zeige detaillierte Stats
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', auth.user.id);
    
    return successResponse({ tasks: data });
  } else {
    // Public: Nur aggregierte Stats
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });
    
    return successResponse({ total_tasks: count });
  }
});
```

---

## 📊 Permission Matrix

### Übersicht aller Permissions

| Permission Key | Label | Kategorie | USER | TEAMLEAD | HR | ADMIN | SUPERADMIN | EXTERN |
|----------------|-------|-----------|------|----------|----|----|------------|--------|
| `view_dashboard` | Dashboard anzeigen | Dashboard & Profil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `edit_own_profile` | Profil bearbeiten | Dashboard & Profil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `submit_leave_request` | Urlaub beantragen | Zeit & Urlaub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `approve_leave_requests` | Urlaub genehmigen | Zeit & Urlaub | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `view_courses` | Kurse ansehen | Learning | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create_courses` | Kurse erstellen | Learning | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `manage_employees` | Mitarbeiter verwalten | Team | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `assign_roles` | Rollen zuweisen | Team | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `access_admin_area` | Admin-Bereich | Administration | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `manage_workflows` | Workflows verwalten | Administration | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `access_system_settings` | System-Settings | Administration | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

**Vollständige Liste:** Siehe `/config/permissions.ts` (67 Permissions)

### Rollen-Hierarchie

```
EXTERN          → Sehr eingeschränkt (nur Dokumente, Basis)
   ↓
USER            → Standard-Mitarbeiter (Kurse, Urlaub, Gamification)
   ↓
TEAMLEAD        → USER + Team-Management (Urlaub genehmigen, Mitarbeiter bearbeiten)
   ↓
HR              → TEAMLEAD + HR-Features (Benefits, Roles, Admin-Bereich)
   ↓
ADMIN           → HR + Workflows, Field-Management
   ↓
SUPERADMIN      → Alle Permissions (System-Settings, Vollzugriff)
```

---

## 🔄 Migration Guide

### Schritt 1: Edge Function analysieren

**Alte Patterns identifizieren:**
```typescript
// ❌ Alt - Ersetzen!
async function requireAuth(c: any): Promise<any> { ... }
async function hasPermission(userId: string, permission: string): Promise<boolean> { ... }
function isAdmin(user: AuthUser): boolean { ... }
```

### Schritt 2: Imports hinzufügen

```typescript
// ✅ Neu
import { authorize, authorizeOptional } from '../_shared/auth.ts';
import { PermissionKey } from '../_shared/permissions.ts';
import { 
  errorResponse, 
  successResponse,
  UnauthorizedError,
  ForbiddenError 
} from '../_shared/errors.ts';
```

### Schritt 3: Auth-Logik ersetzen

**VORHER:**
```typescript
app.get('/api/templates', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user; // Error response

  const canManage = await hasPermission(user.id, 'manage_templates');
  if (!canManage) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const profile = await getUserProfile(user.id);
  
  // Business Logic
  const { data } = await supabase
    .from('templates')
    .select('*')
    .eq('organization_id', profile.organization_id);

  return c.json({ templates: data });
});
```

**NACHHER:**
```typescript
app.get('/api/templates', async (c) => {
  try {
    // ✅ Alles in einem: Auth + Profile + Permissions
    const auth = await authorize(c.req.header('Authorization'), supabase);

    // ✅ Permission Check vereinfacht
    auth.requirePermission(PermissionKey.MANAGE_WORKFLOWS);

    // ✅ Organization ID direkt verfügbar (wenn in users Tabelle)
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('created_by', auth.user.id);

    return successResponse({ templates: data });

  } catch (error) {
    // ✅ Error Handling vereinfacht
    return errorResponse(error, 'GET /api/templates');
  }
});
```

### Schritt 4: Permission Keys prüfen

**Checke ob Permission existiert:**

1. **In `/config/permissions.ts`:**
   ```typescript
   export const PermissionKey = {
     MANAGE_WORKFLOWS: 'manage_workflows', // ✅ Existiert
     MANAGE_TEMPLATES: 'manage_templates', // ❌ Existiert nicht!
   };
   ```

2. **In Datenbank:**
   ```sql
   SELECT * FROM permissions WHERE key = 'manage_workflows';
   -- ✅ Existiert
   
   SELECT * FROM permissions WHERE key = 'manage_templates';
   -- ❌ Existiert nicht → Muss hinzugefügt werden!
   ```

**Falls Permission fehlt:**

**Option A:** Neue Permission hinzufügen
```sql
-- 1. In DB einfügen
INSERT INTO permissions (key, label, category, description) VALUES
  ('manage_templates', 'Templates verwalten', 'Administration', 'Templates erstellen/bearbeiten');

-- 2. Zu Rollen hinzufügen
INSERT INTO role_permissions (role, permission_key) VALUES
  ('ADMIN', 'manage_templates'),
  ('SUPERADMIN', 'manage_templates');
```

```typescript
// 3. In /config/permissions.ts hinzufügen
export const PermissionKey = {
  // ... existing
  MANAGE_TEMPLATES: 'manage_templates',
};

// 4. In /supabase/functions/_shared/permissions.ts hinzufügen
export const PermissionKey = {
  // ... existing
  MANAGE_TEMPLATES: 'manage_templates',
};
```

**Option B:** Existierende Permission nutzen
```typescript
// Statt 'manage_templates' → nutze 'manage_workflows'
auth.requirePermission(PermissionKey.MANAGE_WORKFLOWS);
```

### Schritt 5: Alte Helper löschen

```typescript
// ❌ Diese Funktionen können gelöscht werden:
async function getUserFromRequest(c: any) { ... }
async function requireAuth(c: any) { ... }
async function hasPermission(userId: string, permission: string) { ... }
async function getUserProfile(userId: string) { ... }
function isAdmin(user: AuthUser) { ... }
```

### Schritt 6: Testen

**Test-Checklist:**
- [ ] Ohne Auth → 401 Unauthorized
- [ ] Mit falscher Permission → 403 Forbidden  
- [ ] Mit richtiger Permission → 200 OK
- [ ] Admin-Zugriff funktioniert
- [ ] Team-Lead-Zugriff funktioniert
- [ ] User-Overrides (GRANT/REVOKE) werden beachtet

---

## 🎯 Best Practices

### 1. Immer `authorize()` nutzen

```typescript
// ✅ Gut - authorize() lädt alles
const auth = await authorize(c.req.header('Authorization'), supabase);

// ❌ Schlecht - verifyAuth() lädt keine Permissions
const user = await verifyAuth(c.req.header('Authorization'));
```

### 2. `requirePermission()` für kritische Endpunkte

```typescript
// ✅ Gut - Exception bei fehlender Permission
auth.requirePermission(PermissionKey.DELETE_EMPLOYEES);

// ⚠️ Okay - Wenn custom Error Message nötig
if (!auth.hasPermission(PermissionKey.DELETE_EMPLOYEES)) {
  return c.json({ error: 'Nur HR darf Mitarbeiter löschen' }, 403);
}
```

### 3. Permission Keys als Konstanten

```typescript
// ✅ Gut - Typsicher, refactoring-freundlich
auth.requirePermission(PermissionKey.MANAGE_EMPLOYEES);

// ❌ Schlecht - Typo-Gefahr, keine Autovervollständigung
auth.requirePermission('manage_employes'); // Typo!
```

### 4. Permissions dokumentieren

```typescript
/**
 * DELETE /api/employees/:id
 * 
 * Löscht einen Mitarbeiter permanent.
 * 
 * Required Permission: delete_employees
 * Required Role: HR, ADMIN, SUPERADMIN
 */
app.delete('/api/employees/:id', async (c) => {
  const auth = await authorize(...);
  auth.requirePermission(PermissionKey.DELETE_EMPLOYEES);
  // ...
});
```

### 5. Komplexe Logik separat

```typescript
// ✅ Gut - Lesbar, testbar
function canEditLeaveRequest(auth: AuthContext, request: LeaveRequest): boolean {
  return (
    request.user_id === auth.user.id || // Eigener Request
    auth.hasPermission(PermissionKey.APPROVE_LEAVE_REQUESTS) && // Permission
    request.manager_id === auth.user.id || // Ist Manager
    auth.isAdmin // Oder Admin
  );
}

app.patch('/api/leave-requests/:id', async (c) => {
  const auth = await authorize(...);
  const request = await loadRequest(c.req.param('id'));
  
  if (!canEditLeaveRequest(auth, request)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  // ...
});
```

### 6. Error Handling konsistent

```typescript
app.post('/api/data', async (c) => {
  try {
    const auth = await authorize(...);
    auth.requirePermission(...);
    
    // Business Logic
    
    return successResponse({ ... });
    
  } catch (error) {
    // errorResponse() behandelt alle Error-Typen:
    // - UnauthorizedError → 401
    // - ForbiddenError → 403
    // - NotFoundError → 404
    // - BadRequestError → 400
    // - ApiError → custom status
    // - Error → 500
    return errorResponse(error, 'POST /api/data');
  }
});
```

---

## 🔧 Troubleshooting

### Problem: "Authentication required"

**Fehler:**
```json
{
  "error": "Authentication required - invalid or missing token"
}
```

**Lösung:**
1. Auth-Header prüfen: `Authorization: Bearer <token>`
2. Token gültig? (nicht abgelaufen)
3. User existiert in Supabase Auth?

### Problem: "User profile not found"

**Fehler:**
```json
{
  "error": "User profile not found"
}
```

**Lösung:**
1. User existiert in `users` Tabelle?
2. User-ID in Auth und `users` Tabelle identisch?
3. RLS Policies erlauben Zugriff?

### Problem: "Missing required permission: xyz"

**Fehler:**
```json
{
  "error": "Missing required permission: manage_employees",
  "context": {
    "required_permission": "manage_employees",
    "user_id": "abc-123",
    "user_role": "USER"
  }
}
```

**Lösung:**
1. **Check User Permissions:**
   ```sql
   SELECT * FROM effective_user_permissions 
   WHERE user_id = 'abc-123';
   ```

2. **Check Role Permissions:**
   ```sql
   SELECT * FROM role_permissions 
   WHERE role = 'USER';
   ```

3. **Add Permission via GRANT:**
   ```sql
   INSERT INTO user_permissions (user_id, permission_key, mode) 
   VALUES ('abc-123', 'manage_employees', 'GRANT');
   ```

4. **Oder Rolle ändern:**
   ```sql
   UPDATE users SET role = 'ADMIN' 
   WHERE id = 'abc-123';
   ```

### Problem: Permission existiert nicht

**Fehler:**
```
Permission 'manage_templates' not found in PermissionKey
```

**Lösung:**
1. **Permission in DB hinzufügen:**
   ```sql
   INSERT INTO permissions (key, label, category, description) 
   VALUES ('manage_templates', 'Templates verwalten', 'Administration', '...');
   ```

2. **Permission in Config hinzufügen:**
   ```typescript
   // /config/permissions.ts
   export const PermissionKey = {
     // ... existing
     MANAGE_TEMPLATES: 'manage_templates',
   };
   ```

3. **Permission zu Rollen hinzufügen:**
   ```sql
   INSERT INTO role_permissions (role, permission_key) 
   VALUES ('ADMIN', 'manage_templates');
   ```

### Problem: Permissions nicht synchron

**Symptom:** Frontend zeigt andere Permissions als Backend

**Lösung:**
1. **Permissions im Frontend neu laden:**
   ```typescript
   // In Login-Flow oder nach Permission-Update
   await authStore.loadEffectivePermissions(userId);
   ```

2. **Cache leeren:**
   ```typescript
   localStorage.clear();
   // Seite neu laden
   window.location.reload();
   ```

3. **DB-View aktualisieren:**
   ```sql
   -- Falls View nicht aktualisiert
   REFRESH MATERIALIZED VIEW effective_user_permissions;
   ```

### Problem: SUPERADMIN hat keine Permissions

**Lösung:**
```sql
-- Alle Permissions zu SUPERADMIN hinzufügen
INSERT INTO role_permissions (role, permission_key)
SELECT 'SUPERADMIN', key FROM permissions
ON CONFLICT DO NOTHING;
```

---

## 📚 Weitere Ressourcen

- **Frontend Config:** `/config/permissions.ts`
- **Backend Shared:** `/supabase/functions/_shared/auth.ts`, `/supabase/functions/_shared/permissions.ts`
- **Migration SQL:** `/supabase/migrations/079_permissions_system.sql`
- **Example Migration:** `/supabase/functions/BrowoKoordinator-Mitarbeitergespraeche/MIGRATION_EXAMPLE.tsx`
- **API Routes:** `/supabase/functions/BrowoKoordinator-Server/routes-permissions.ts`

---

## ✅ Migration Checklist

Beim Migrieren einer Edge Function:

- [ ] Imports hinzugefügt (`authorize`, `PermissionKey`, `errorResponse`)
- [ ] `requireAuth()` durch `authorize()` ersetzt
- [ ] `hasPermission()` durch `auth.hasPermission()` ersetzt
- [ ] `isAdmin()` durch `auth.isAdmin` ersetzt
- [ ] Permission-Keys als Konstanten (`PermissionKey.XYZ`)
- [ ] Permission-Keys existieren in DB und Config
- [ ] Error Handling mit `try/catch` und `errorResponse()`
- [ ] Success Responses mit `successResponse()`
- [ ] Alte Helper-Funktionen gelöscht
- [ ] Getestet: 401, 403, 200 Responses
- [ ] Dokumentation aktualisiert (JSDoc)

---

**Letzte Aktualisierung:** 2024-12-07  
**Version:** 2.0  
**Status:** ✅ Production Ready
