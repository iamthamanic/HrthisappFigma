# 🚀 Edge Function Migration Guide - Permission System

**Ziel:** Alle BrowoKoordinator Edge Functions auf das neue Permission System migrieren.

---

## 📋 Schnell-Überblick

### Was wird ersetzt?

| Alt (❌) | Neu (✅) |
|---------|---------|
| `requireAuth(c)` | `authorize(c.req.header('Authorization'), supabase)` |
| `hasPermission(userId, 'xyz')` | `auth.hasPermission('xyz')` |
| `isAdmin(user)` | `auth.isAdmin` |
| `getUserProfile(userId)` | `auth.user` (bereits geladen) |
| Custom error responses | `errorResponse(error, 'FUNCTION_NAME')` |
| Custom success responses | `successResponse({ data })` |

---

## 🎯 Migration in 5 Schritten

### Schritt 1: Imports hinzufügen

**Füge am Anfang der Datei hinzu:**

```typescript
import { authorize, authorizeOptional } from '../_shared/auth.ts';
import { PermissionKey } from '../_shared/permissions.ts';
import { 
  errorResponse, 
  successResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError 
} from '../_shared/errors.ts';
```

---

### Schritt 2: Auth-Logik ersetzen

#### Pattern A: Standard-Endpoint

**VORHER:**
```typescript
app.get('/make-server-f659121d/api/data', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user; // Error response

  // Business Logic
  const { data } = await supabase.from('table').select('*');
  return c.json({ data });
});
```

**NACHHER:**
```typescript
app.get('/make-server-f659121d/api/data', async (c) => {
  try {
    const auth = await authorize(c.req.header('Authorization'), supabase);

    // Business Logic
    const { data } = await supabase.from('table').select('*');
    return successResponse({ data });

  } catch (error) {
    return errorResponse(error, 'GET /api/data');
  }
});
```

---

#### Pattern B: Mit Permission-Check

**VORHER:**
```typescript
app.post('/make-server-f659121d/api/data', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  const canCreate = await hasPermission(user.id, 'create_data');
  if (!canCreate) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = await c.req.json();
  const { data } = await supabase.from('table').insert(body);
  return c.json({ data });
});
```

**NACHHER:**
```typescript
app.post('/make-server-f659121d/api/data', async (c) => {
  try {
    const auth = await authorize(c.req.header('Authorization'), supabase);
    
    // Option 1: Automatisch Exception werfen
    auth.requirePermission(PermissionKey.CREATE_COURSES); // Passende Permission wählen
    
    // Option 2: Manuell checken
    // if (!auth.hasPermission(PermissionKey.CREATE_COURSES)) {
    //   return c.json({ error: 'Forbidden' }, 403);
    // }

    const body = await c.req.json();
    const { data } = await supabase.from('table').insert(body);
    return successResponse({ data });

  } catch (error) {
    return errorResponse(error, 'POST /api/data');
  }
});
```

---

#### Pattern C: Admin-Only

**VORHER:**
```typescript
app.delete('/make-server-f659121d/api/data/:id', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  const profile = await getUserProfile(user.id);
  if (!isAdmin({ id: user.id, role: profile.role })) {
    return c.json({ error: 'Admin only' }, 403);
  }

  await supabase.from('table').delete().eq('id', c.req.param('id'));
  return c.json({ success: true });
});
```

**NACHHER:**
```typescript
app.delete('/make-server-f659121d/api/data/:id', async (c) => {
  try {
    const auth = await authorize(c.req.header('Authorization'), supabase);

    if (!auth.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    await supabase.from('table').delete().eq('id', c.req.param('id'));
    return successResponse({ success: true });

  } catch (error) {
    return errorResponse(error, 'DELETE /api/data/:id');
  }
});
```

---

#### Pattern D: Komplexe Permission-Logik

**VORHER:**
```typescript
app.patch('/make-server-f659121d/api/requests/:id/approve', async (c) => {
  const user = await requireAuth(c);
  if (user.status) return user;

  const profile = await getUserProfile(user.id);
  const request = await loadRequest(c.req.param('id'));

  const canApprove = await hasPermission(user.id, 'approve_requests');
  const isManager = request.manager_id === user.id;
  const isAdminUser = isAdmin({ id: user.id, role: profile.role });

  if (!canApprove || (!isManager && !isAdminUser)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await approveRequest(request.id);
  return c.json({ success: true });
});
```

**NACHHER:**
```typescript
app.patch('/make-server-f659121d/api/requests/:id/approve', async (c) => {
  try {
    const auth = await authorize(c.req.header('Authorization'), supabase);
    const request = await loadRequest(c.req.param('id'));

    const canApprove = 
      auth.hasPermission(PermissionKey.APPROVE_LEAVE_REQUESTS) &&
      (request.manager_id === auth.user.id || auth.isAdmin);

    if (!canApprove) {
      return c.json({ 
        error: 'You do not have permission to approve this request' 
      }, 403);
    }

    await approveRequest(request.id);
    return successResponse({ success: true });

  } catch (error) {
    return errorResponse(error, 'PATCH /api/requests/:id/approve');
  }
});
```

---

### Schritt 3: User-Referenzen ersetzen

**VORHER:**
```typescript
const profile = await getUserProfile(user.id);

console.log(user.id);
console.log(profile.email);
console.log(profile.first_name);
console.log(profile.role);
console.log(profile.organization_id);
```

**NACHHER:**
```typescript
const auth = await authorize(...);

console.log(auth.user.id);
console.log(auth.user.email);
console.log(auth.user.first_name);
console.log(auth.user.role);
// auth.user.organization_id ist NICHT automatisch verfügbar!
// Falls benötigt, separat laden:
const { data: profile } = await supabase
  .from('users')
  .select('organization_id')
  .eq('id', auth.user.id)
  .single();
```

---

### Schritt 4: Alte Helper löschen

**Diese Funktionen können gelöscht werden:**

```typescript
// ❌ Löschen
async function getUserFromRequest(c: any) { ... }
async function requireAuth(c: any) { ... }
async function hasPermission(userId: string, permission: string) { ... }
async function getUserProfile(userId: string) { ... } // Nur wenn nicht mehr benötigt
function isAdmin(user: AuthUser) { ... }
function isTeamLead(user: AuthUser) { ... }
```

---

### Schritt 5: Permission-Keys prüfen

**Für jeden Permission-Check:**

1. **Permission existiert in `/config/permissions.ts`?**
   ```typescript
   export const PermissionKey = {
     MANAGE_EMPLOYEES: 'manage_employees', // ✅
     MANAGE_REVIEWS: 'manage_reviews',     // ❌ Existiert nicht!
   };
   ```

2. **Falls nicht → Passende Permission wählen:**
   ```typescript
   // Statt nicht-existierender 'manage_reviews'
   auth.requirePermission(PermissionKey.MANAGE_WORKFLOWS); // Ähnlich genug
   // ODER
   auth.requirePermission(PermissionKey.ACCESS_ADMIN_AREA); // Allgemein
   ```

3. **Oder neue Permission hinzufügen** (siehe PERMISSION_SYSTEM.md)

---

## 📝 Verfügbare Permission-Keys

**Häufig genutzte Permissions:**

```typescript
PermissionKey.VIEW_DASHBOARD              // Alle authentifizierten User
PermissionKey.SUBMIT_LEAVE_REQUEST        // Standard User
PermissionKey.APPROVE_LEAVE_REQUESTS      // TeamLead+
PermissionKey.VIEW_COURSES                // Alle User
PermissionKey.CREATE_COURSES              // HR+
PermissionKey.MANAGE_BENEFITS             // HR+
PermissionKey.ADD_EMPLOYEES               // TeamLead+
PermissionKey.EDIT_EMPLOYEES              // TeamLead+
PermissionKey.DELETE_EMPLOYEES            // HR+
PermissionKey.ACCESS_ADMIN_AREA           // HR+
PermissionKey.MANAGE_WORKFLOWS            // Admin+
PermissionKey.ACCESS_SYSTEM_SETTINGS      // SuperAdmin only
```

**Vollständige Liste:** Siehe `/config/permissions.ts` oder `PERMISSION_SYSTEM.md`

---

## 🎯 Migration Prioritäten

### Phase 1: Critical Functions (ASAP)
- ✅ BrowoKoordinator-Server (bereits teilweise migriert)
- 🔄 BrowoKoordinator-Mitarbeitergespraeche (hohes Risiko)
- 🔄 BrowoKoordinator-Learning (viele User)
- 🔄 BrowoKoordinator-TimeTracking (täglich genutzt)

### Phase 2: Admin Functions (Diese Woche)
- 🔄 BrowoKoordinator-Admin
- 🔄 BrowoKoordinator-TeamManagement
- 🔄 BrowoKoordinator-Benefits

### Phase 3: Low-Priority (Nächste Woche)
- 🔄 BrowoKoordinator-Gamification
- 🔄 BrowoKoordinator-Documents
- 🔄 Weitere...

---

## ✅ Test-Checklist

Für jeden migrierten Endpoint:

- [ ] **Ohne Auth:** `401 Unauthorized`
  ```bash
  curl -X GET https://xxx.supabase.co/functions/v1/make-server-f659121d/api/data
  # Erwartet: {"error": "Authentication required..."}
  ```

- [ ] **Mit User ohne Permission:** `403 Forbidden`
  ```bash
  curl -X POST https://xxx.supabase.co/functions/v1/make-server-f659121d/api/data \
    -H "Authorization: Bearer USER_TOKEN"
  # Erwartet: {"error": "Missing required permission..."}
  ```

- [ ] **Mit User mit Permission:** `200 OK`
  ```bash
  curl -X POST https://xxx.supabase.co/functions/v1/make-server-f659121d/api/data \
    -H "Authorization: Bearer ADMIN_TOKEN"
  # Erwartet: {"data": {...}}
  ```

- [ ] **Admin-Zugriff:** Works
- [ ] **GRANT Override:** User mit GRANT kann zugreifen
- [ ] **REVOKE Override:** User mit REVOKE kann NICHT zugreifen

---

## 🔧 Debugging

### Problem: Permission-Check schlägt fehl

```typescript
// Debug: Welche Permissions hat der User?
const auth = await authorize(...);
console.log('User Permissions:', Array.from(auth.permissions));

// Expected: ['view_dashboard', 'manage_employees', ...]
// Actual: ['view_dashboard'] ← Permission fehlt!
```

**Lösung:**
1. Permission in DB vorhanden? `SELECT * FROM permissions WHERE key = 'xyz';`
2. Rolle hat Permission? `SELECT * FROM role_permissions WHERE role = 'USER';`
3. User hat Override? `SELECT * FROM user_permissions WHERE user_id = 'abc';`
4. Effective Permissions? `SELECT * FROM effective_user_permissions WHERE user_id = 'abc';`

---

### Problem: authorize() wirft Exception

```typescript
try {
  const auth = await authorize(...);
} catch (error) {
  console.error('Auth Error:', error);
  // UnauthorizedError: Authentication required - invalid or missing token
  // oder
  // UnauthorizedError: User profile not found
}
```

**Lösung:**
1. Token gültig? Nicht abgelaufen?
2. User existiert in `users` Tabelle?
3. RLS Policies erlauben Zugriff auf `users`?

---

## 📚 Weitere Ressourcen

- **Vollständige Doku:** `/PERMISSION_SYSTEM.md`
- **Beispiel-Migration:** `/supabase/functions/BrowoKoordinator-Mitarbeitergespraeche/MIGRATION_EXAMPLE.tsx`
- **Auth Module:** `/supabase/functions/_shared/auth.ts`
- **Permission Keys:** `/supabase/functions/_shared/permissions.ts`

---

## 🎉 Nach der Migration

1. **Alte Helper-Funktionen löschen**
2. **Tests durchführen** (siehe Test-Checklist)
3. **Im CODEBASE_ANALYSIS.md dokumentieren:**
   ```markdown
   ### BrowoKoordinator-XYZ
   - ✅ **Migration Status:** Migrated to new permission system (2024-12-07)
   - **Auth:** authorize() mit effectivePermissions
   - **Permissions:** manage_xyz, view_xyz
   ```

4. **Pull Request erstellen** mit:
   - Liste der geänderten Endpoints
   - Test-Ergebnisse
   - Breaking Changes (falls vorhanden)

---

**Happy Migration! 🚀**
