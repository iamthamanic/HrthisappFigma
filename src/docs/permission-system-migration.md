# Permission System Migration - Dokumentation

## 📋 Übersicht

Das Browo Koordinator Permission-System wurde von einem reinen Frontend-basierten Rollen-System auf ein **datenbankgestütztes System mit individuellen GRANT/REVOKE-Overrides** pro User migriert.

**Datum:** 5. Dezember 2024  
**Status:** ✅ Frontend komplett fertig | ⏳ Backend muss deployed werden

---

## 🎯 Zielsetzung

### Vorher (Alt):
- ❌ Berechtigungen nur auf Frontend hardcoded in `usePermissions` Hook
- ❌ Keine individuelle Anpassung pro User möglich
- ❌ Rollen-Wechsel = kompletter Permission-Wechsel
- ❌ Keine Audit-Trails

### Nachher (Neu):
- ✅ **Datenbank-basiert**: Permissions in Supabase gespeichert
- ✅ **Individuelle Overrides**: GRANT/REVOKE pro User
- ✅ **Backward Compatible**: Fällt auf Rollen-Permissions zurück, wenn DB leer
- ✅ **Audit-Trail**: `granted_by`, `granted_at`, `revoked_at` Felder
- ✅ **Flexible**: Rollen-Standard + User-Overrides = Effektive Permissions

---

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐      ┌────────────────┐                  │
│  │  permissions  │      │ role_permissions│                  │
│  │  (Master)     │──┬──▶│   (Defaults)    │                  │
│  └───────────────┘  │   └────────────────┘                  │
│                     │                                         │
│                     │   ┌────────────────┐                  │
│                     └──▶│user_permissions │                  │
│                         │   (Overrides)   │                  │
│                         └────────────────┘                  │
│                                │                              │
│                                ▼                              │
│                    ┌──────────────────────┐                  │
│                    │effective_user_perms  │                  │
│                    │    (VIEW - Final)    │                  │
│                    └──────────────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Formel: Effective = (Role Permissions) + (GRANTs) - (REVOKEs)
```

---

## 📦 Implementierte Komponenten

### 1. **Database Migration** 📊
**Datei:** `/supabase/migrations/079_permissions_system.sql`

**Erstellt 4 Tabellen:**

1. **`permissions`** (Master-Liste)
   - `id`, `key`, `name`, `description`, `category`
   - Enthält alle verfügbaren Berechtigungen im System

2. **`role_permissions`** (Rollen-Defaults)
   - `role`, `permission_id`
   - Definiert Standard-Permissions pro Rolle (USER, ADMIN, etc.)

3. **`user_permissions`** (Individuelle Overrides)
   - `user_id`, `permission_id`, `mode` ('GRANT' | 'REVOKE')
   - `granted_by`, `granted_at`, `revoked_at`
   - Speichert individuelle GRANT/REVOKE Overrides

4. **`effective_user_permissions`** (VIEW)
   - PostgreSQL View für finale Berechtigungen
   - Kombiniert automatisch: Role + User Overrides
   - Optimiert für Performance

**Status:** ⏳ Muss noch in Supabase deployed werden

---

### 2. **Backend APIs** 🔧
**Datei:** `/supabase/functions/BrowoKoordinator-Server/routes-permissions.ts`

**Implementierte Endpoints:**

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| `GET` | `/api/me/permissions` | Effektive Permissions für aktuellen User |
| `GET` | `/api/users/:userId/permissions` | Permissions eines Users (inkl. Overrides) |
| `PUT` | `/api/users/:userId/permissions` | Overrides für einen User setzen |
| `GET` | `/api/permissions` | Alle verfügbaren Permissions (Master-Liste) |
| `GET` | `/api/roles/:role/permissions` | Default-Permissions einer Rolle |

**Registriert in:** `/supabase/functions/BrowoKoordinator-Server/index.ts`
```typescript
registerPermissionRoutes(app); // ✅ Bereits hinzugefügt
```

**Status:** ⏳ Muss noch deployed werden

---

### 3. **Frontend Services** 🌐
**Datei:** `/services/BrowoKo_authService.ts`

**Neue Methode hinzugefügt:**
```typescript
async getPermissions(userId: string): Promise<string[]> {
  // Ruft GET /api/me/permissions auf
  // Gibt Array von Permission-Keys zurück
}
```

**Status:** ✅ Fertig implementiert

---

### 4. **Auth Store Erweiterung** 💾
**Datei:** `/stores/BrowoKo_authStore.ts`

**Neue State-Felder:**
```typescript
effectivePermissions: string[];      // Finale Permissions des Users
permissionsLoading: boolean;         // Loading-State
```

**Neue Methode:**
```typescript
refreshPermissions: async () => {
  // Lädt Permissions von Backend
  // Wird automatisch bei Login aufgerufen
  // Speichert in effectivePermissions
}
```

**Integration:**
- Wird im `initialize()` Call nach Login automatisch aufgerufen
- Fehler werden graceful behandelt (fallback zu role-based)

**Status:** ✅ Fertig implementiert

---

### 5. **Permission Configuration** ⚙️
**Datei:** `/config/permissions.ts`

**Exports:**

1. **`ROLE_PERMISSION_MATRIX`** - Rollen-Default-Permissions
   ```typescript
   export const ROLE_PERMISSION_MATRIX: Record<UserRole, PermissionKey[]> = {
     USER: [...],
     ADMIN: [...],
     SUPERADMIN: [...],
     // etc.
   }
   ```

2. **`ALL_PERMISSIONS_METADATA`** - UI-Labels & Beschreibungen
   ```typescript
   export const ALL_PERMISSIONS_METADATA: PermissionMetadata[] = [
     { 
       key: 'view_dashboard', 
       label: 'Dashboard anzeigen', 
       description: '...', 
       category: 'Dashboard & Profil' 
     },
     // etc.
   ]
   ```

3. **Helper Functions:**
   - `calculateEffectivePermissions()` - Berechnet finale Permissions
   - `getPermissionMetadata()` - Holt Metadata für Permission-Key
   - `getPermissionsByCategory()` - Gruppiert Permissions nach Kategorie

**Status:** ✅ Fertig implementiert

---

### 6. **usePermissions Hook V2** 🎣
**Datei:** `/hooks/usePermissions.ts` (ersetzt alte Version)

**Features:**
- ✅ **Dual-Mode**: DB-Permissions ODER Rollen-Fallback
- ✅ **Backward Compatible**: Gleiche API wie vorher
- ✅ **Auto-Detection**: Nutzt DB wenn verfügbar, sonst Role-Matrix

**API:**
```typescript
const { can, hasPermission, effectiveKeys, useDbPermissions } = usePermissions(role);

// Alte API (backward compatible)
if (can.createUser) { /* ... */ }

// Neue API (direkter Check)
if (hasPermission('create_user')) { /* ... */ }

// Debug Info
console.log(useDbPermissions); // true = DB aktiv, false = Fallback
console.log(effectiveKeys);    // Array aller aktiven Permissions
```

**Status:** ✅ Fertig implementiert

---

### 7. **PermissionsEditor Component** 🎨
**Datei:** `/components/PermissionsEditor.tsx`

**Features:**
- ✅ Lädt Permissions via `GET /api/users/:userId/permissions`
- ✅ Zeigt Rollen-Standard + Individuelle Overrides
- ✅ **Visuelle Badges:**
  - 🟢 Grün = Zusätzlich gewährt (GRANT)
  - 🔴 Rot = Entfernt (REVOKE)
  - ⚪ Grau = Von Rolle geerbt
- ✅ Toggle-Funktion für GRANT/REVOKE
- ✅ "Auf Rollen-Standard zurücksetzen" Button
- ✅ Speichert via `PUT /api/users/:userId/permissions`

**Props:**
```typescript
<PermissionsEditor 
  userId={user.id} 
  role={user.role}
  onSave={() => console.log('Saved!')}
  readOnly={false}
/>
```

**Status:** ✅ Fertig implementiert

---

## 📂 Dateistruktur

```
browo-koordinator/
├── config/
│   └── permissions.ts                    ✅ Permission Matrix & Metadata
├── hooks/
│   └── usePermissions.ts                 ✅ V2 Hook (DB + Fallback)
├── services/
│   └── BrowoKo_authService.ts           ✅ getPermissions() Methode
├── stores/
│   └── BrowoKo_authStore.ts             ✅ effectivePermissions State
├── components/
│   └── PermissionsEditor.tsx             ✅ UI für Permission-Management
├── supabase/
│   ├── migrations/
│   │   └── 079_permissions_system.sql    ⏳ Muss deployed werden
│   └── functions/
│       └── BrowoKoordinator-Server/
│           ├── index.ts                   ✅ Routes registriert
│           └── routes-permissions.ts      ⏳ Muss deployed werden
└── docs/
    └── permission-system-migration.md     📝 Diese Datei
```

---

## 🚀 Deployment-Anleitung

### Schritt 1: Migration deployen ⚠️ **PFLICHT**

1. Öffne dein Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/azmtojgikubegzusvhra/sql
   ```

2. Öffne die Datei `/supabase/migrations/079_permissions_system.sql`

3. Kopiere den **kompletten Inhalt**

4. Füge ihn in den Supabase SQL Editor ein

5. Klicke **"Run"**

6. Warte auf ✅ Success-Message

**Wichtig:** Die Migration ist **idempotent** - kann mehrfach ausgeführt werden ohne Schaden!

---

### Schritt 2: Edge Function deployen ⚠️ **PFLICHT**

**Via Supabase Dashboard:**

1. Gehe zu: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions

2. Finde "BrowoKoordinator-Server"

3. **Deploy neu** mit allen Dateien:
   - ✅ `index.ts` (mit registerPermissionRoutes)
   - ✅ `routes-permissions.ts` (neue Datei)
   - ✅ Alle anderen bestehenden Dateien

**Wichtig:** Alle Dateien im `/supabase/functions/BrowoKoordinator-Server/` Ordner müssen zusammen deployed werden!

---

### Schritt 3: Testing 🧪

1. **App neu laden** (STRG + Shift + R)

2. **Einloggen** als SUPERADMIN oder ADMIN

3. **Browser Console öffnen** (F12)

4. **Erwartete Log-Messages:**
   ```
   🔑 Fetching permissions for user: abc-123-def
   ✅ Permissions loaded: 20 permissions
   ```

5. **Permission Check:**
   ```javascript
   // In Browser Console
   const store = useAuthStore.getState();
   console.log(store.effectivePermissions);
   // → Sollte Array von Permission-Keys zeigen
   ```

6. **PermissionsEditor testen:**
   - Gehe zu User-Verwaltung
   - Öffne einen User
   - Permissions sollten laden
   - GRANT/REVOKE sollte funktionieren
   - Speichern sollte funktionieren

---

## 🔄 Backward Compatibility

Das neue System ist **vollständig abwärtskompatibel**:

### ✅ Bestehender Code funktioniert weiter:

```typescript
// Alte API - funktioniert weiterhin!
const { can } = usePermissions(profile?.role);

if (can.createUser) {
  // Show create user button
}
```

### ✅ Automatischer Fallback:

```typescript
// Wenn DB-Permissions leer/nicht verfügbar:
// → Fällt automatisch auf ROLE_PERMISSION_MATRIX zurück
// → Bestehende Funktionalität bleibt erhalten
```

### ✅ Kein Breaking Change:

- Alle bestehenden `can.xyz` Checks funktionieren
- Alle bestehenden Komponenten funktionieren
- Migration kann schrittweise erfolgen

---

## 🎯 Verwendungsbeispiele

### Example 1: Permission Check (Alt & Neu)

```typescript
// ✅ Alte API (backward compatible)
const { can } = usePermissions(profile?.role);
if (can.createUser) {
  return <CreateUserButton />;
}

// ✅ Neue API (direkter)
const { hasPermission } = usePermissions(profile?.role);
if (hasPermission('create_user')) {
  return <CreateUserButton />;
}
```

---

### Example 2: PermissionsEditor verwenden

```tsx
import PermissionsEditor from '../components/PermissionsEditor';

function UserDetailPage({ userId, role }) {
  return (
    <div>
      <h1>Berechtigungen bearbeiten</h1>
      <PermissionsEditor 
        userId={userId}
        role={role}
        onSave={() => {
          toast.success('Gespeichert!');
          // Optional: Daten neu laden
        }}
      />
    </div>
  );
}
```

---

### Example 3: Backend API aufrufen

```typescript
import { getServices } from '../services';

// Get current user's permissions
const services = getServices();
const myPermissions = await services.auth.getPermissions(userId);
console.log(myPermissions); 
// → ['view_dashboard', 'create_user', ...]

// Get specific user's permissions with details
const response = await fetch(`/api/users/${userId}/permissions`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data);
/* → {
  user: { id, email, name, role },
  rolePermissions: [...],
  userOverrides: [{ permission_key, mode: 'GRANT' }, ...],
  effectivePermissions: [...]
} */
```

---

## 📊 Datenbank-Schema

### `permissions` Tabelle
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,           -- 'view_dashboard'
  name TEXT NOT NULL,                 -- 'Dashboard anzeigen'
  description TEXT,
  category TEXT NOT NULL,             -- 'Dashboard & Profil'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `role_permissions` Tabelle
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,                 -- 'ADMIN', 'USER', etc.
  permission_id UUID REFERENCES permissions(id),
  UNIQUE(role, permission_id)
);
```

### `user_permissions` Tabelle
```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  mode TEXT NOT NULL CHECK (mode IN ('GRANT', 'REVOKE')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_id)
);
```

### `effective_user_permissions` VIEW
```sql
CREATE VIEW effective_user_permissions AS
SELECT 
  u.id AS user_id,
  p.key AS permission_key,
  CASE
    WHEN up.mode = 'REVOKE' THEN FALSE
    WHEN up.mode = 'GRANT' THEN TRUE
    WHEN rp.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END AS is_granted
FROM users u
CROSS JOIN permissions p
LEFT JOIN user_permissions up ON up.user_id = u.id AND up.permission_id = p.id
LEFT JOIN role_permissions rp ON rp.role = u.role AND rp.permission_id = p.id
WHERE (up.mode = 'GRANT') OR (up.mode = 'REVOKE') OR (rp.id IS NOT NULL);
```

---

## 🐛 Troubleshooting

### Problem: "No matching export for ROLE_PERMISSION_MATRIX"
**Lösung:** Datei `/config/permissions.ts` wurde falsch bearbeitet. Stelle sicher, dass:
```typescript
export const ROLE_PERMISSION_MATRIX = { ... };
```
vorhanden ist.

---

### Problem: "Failed to load permissions"
**Mögliche Ursachen:**
1. ❌ Migration nicht deployed
2. ❌ Edge Function nicht deployed
3. ❌ User nicht eingeloggt (kein Access Token)

**Debug:**
```typescript
// In Browser Console
const session = await supabase.auth.getSession();
console.log(session.data.session); // Sollte nicht null sein
```

---

### Problem: Permissions ändern sich nicht
**Lösung:** Auth Store refreshen:
```typescript
import { useAuthStore } from './stores/BrowoKo_authStore';

const store = useAuthStore.getState();
await store.refreshPermissions(); // Lädt Permissions neu
```

---

### Problem: PermissionsEditor zeigt "unknown_..." Keys
**Ursache:** Permission-Key Mapping stimmt nicht

**Lösung:** Erweitere `/config/permissions.ts`:
```typescript
export const ALL_PERMISSIONS_METADATA: PermissionMetadata[] = [
  { 
    key: 'deine_permission', 
    label: 'Dein Label', 
    description: 'Deine Beschreibung',
    category: 'Deine Kategorie'
  },
  // ...
];
```

---

## ✅ Checkliste für Deployment

- [ ] **Migration deployed** (`079_permissions_system.sql`)
- [ ] **Edge Function deployed** (BrowoKoordinator-Server)
- [ ] **App neu geladen** (Hard Refresh)
- [ ] **Login erfolgreich**
- [ ] **Browser Console zeigt "Permissions loaded"**
- [ ] **PermissionsEditor funktioniert**
- [ ] **GRANT/REVOKE funktioniert**
- [ ] **Speichern funktioniert**
- [ ] **Keine Fehler in Browser Console**
- [ ] **Keine Fehler in Supabase Logs**

---

## 📈 Nächste Schritte (Optional)

### Kurzfristig:
1. **UI für Rollen-Management** - Bulk-Edit für role_permissions
2. **Audit Log UI** - Visualisierung von `granted_by`, `granted_at`
3. **Permission-Templates** - Vordefinierte Permission-Sets

### Mittelfristig:
4. **Permission-Gruppen** - Gruppiere Permissions logisch
5. **Conditional Permissions** - z.B. "kann nur eigene Team-Mitglieder bearbeiten"
6. **Permission-Export/Import** - Backup & Restore

### Langfristig:
7. **Row-Level Security (RLS)** - PostgreSQL RLS Policies
8. **API-Rate-Limiting** per Permission
9. **Advanced Auditing** - Detaillierte Logs mit Änderungshistorie

---

## 📞 Support & Kontakt

Bei Fragen oder Problemen:
1. **Check Browser Console** für Fehler
2. **Check Supabase Logs** für Backend-Fehler
3. **Check diese Dokumentation** für Troubleshooting

---

## 📝 Changelog

### v2.0.0 (5. Dezember 2024)
- ✅ Datenbank-basiertes Permission-System implementiert
- ✅ GRANT/REVOKE User-Overrides
- ✅ Backend APIs für Permission-Management
- ✅ PermissionsEditor UI Component
- ✅ usePermissions Hook V2 mit DB-Support
- ✅ Auth Store Integration
- ✅ Vollständig backward compatible

---

**🎉 Ende der Dokumentation**

Viel Erfolg beim Deployment! 🚀
