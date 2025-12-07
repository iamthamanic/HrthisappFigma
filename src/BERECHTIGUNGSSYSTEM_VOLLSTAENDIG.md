# 🔐 Berechtigungssystem - Vollständige Erklärung

## ❓ DEINE FRAGE:

> "Woher nimmt das System die Berechtigungen? Weil wir haben ja die Berechtigungen die bei Team und Mitarbeiterverwaltung geändert werden können. Wird das nochmal woanders geregelt?"

---

## ✅ ANTWORT:

**NEIN, es gibt KEINE separate Berechtigungs-Datenbank oder Permissions-Tabelle!**

Die Berechtigungen werden **DIREKT aus der Rolle berechnet** - in Echtzeit im Frontend.

---

## 🏗️ SO FUNKTIONIERT ES:

### 1️⃣ **Rolle wird in der Datenbank gespeichert**

```sql
-- users Tabelle
id    | email              | role        
------|--------------------|-----------
uuid1 | admin@firma.de     | ADMIN
uuid2 | user@firma.de      | USER
uuid3 | hr@firma.de        | HR
```

### 2️⃣ **Berechtigungen werden im Frontend BERECHNET**

**Datei:** `/hooks/usePermissions.ts`

```typescript
export function usePermissions(role: UserRole | undefined) {
  const normalizedRole = (role || 'USER') as UserRole;
  
  const isExtern = normalizedRole === 'EXTERN';
  const isAdmin = normalizedRole === 'HR' || 
                  normalizedRole === 'TEAMLEAD' || 
                  normalizedRole === 'ADMIN' || 
                  normalizedRole === 'SUPERADMIN';

  // ⚡ BERECHTIGUNGEN WERDEN DIREKT BERECHNET:
  const can = useMemo(() => ({
    // Beispiele:
    submitLeaveRequest: !isExtern,           // ✅ ALLE außer EXTERN
    approveLeaveRequests: isAdmin,          // ✅ Nur Admins
    createUser: normalizedRole === 'HR' || 
                normalizedRole === 'ADMIN' || 
                normalizedRole === 'SUPERADMIN',  // ✅ HR, ADMIN, SUPERADMIN
    createSuperadmin: normalizedRole === 'SUPERADMIN', // ✅ Nur SUPERADMIN
    assignRoles: normalizedRole === 'SUPERADMIN',      // ✅ Nur SUPERADMIN
  }), [normalizedRole, isExtern, isAdmin]);

  return {
    role: normalizedRole,
    can,
    getAllPermissions,
    roleInfo: getRoleInfo,
  };
}
```

### 3️⃣ **Berechtigungen werden in Komponenten verwendet**

```tsx
import { usePermissions } from './hooks/usePermissions';

function MyComponent() {
  const { profile } = useAuthStore();
  const { can } = usePermissions(profile?.role);
  
  return (
    <div>
      {/* Bedingte Anzeige basierend auf Berechtigungen */}
      {can.addEmployees && (
        <Button>Mitarbeiter hinzufügen</Button>
      )}
      
      {can.createSuperadmin && (
        <Button>Super Admin erstellen</Button>
      )}
      
      {can.approveLeaveRequests && (
        <Button>Urlaub genehmigen</Button>
      )}
    </div>
  );
}
```

---

## 📋 BERECHTIGUNGS-HIERARCHIE (aus usePermissions.ts)

| Berechtigung | USER | EXTERN | TEAMLEAD | HR | ADMIN | SUPERADMIN |
|--------------|------|--------|----------|----|----|------------|
| **Dashboard & Profil** |
| Dashboard anzeigen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Eigenes Profil bearbeiten | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Profilbild hochladen | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Zeit & Urlaub** |
| Urlaubsantrag stellen | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Urlaub genehmigen | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Learning** |
| Kurse ansehen | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Kurse erstellen | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Benefits & Dokumente** |
| Benefits einsehen | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Dokumente hochladen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Benefits verwalten | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Team & Organisation** |
| Mitarbeiter hinzufügen | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mitarbeiter bearbeiten | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| USER erstellen | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| ADMIN erstellen | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| HR erstellen | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| SUPERADMIN erstellen | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Rollen zuweisen | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Administration** |
| Admin-Bereich | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| System-Einstellungen | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 TEAM-ROLLEN vs GLOBALE BERECHTIGUNGEN

Du hast vielleicht **Team-Rollen** gemeint?

### TEAM-ROLLEN (`team_members` Tabelle):

```sql
-- team_members Tabelle
team_id | user_id | role      | priority_tag
--------|---------|-----------|-------------
team1   | uuid1   | TEAMLEAD  | PRIMARY
team1   | uuid2   | MEMBER    | NULL
team2   | uuid1   | MEMBER    | NULL
```

**Team-Rollen beeinflussen:**
- ✅ Wer Urlaub in diesem spezifischen Team genehmigen kann
- ✅ Priorität bei Genehmigungen (PRIMARY, BACKUP, BACKUP_BACKUP)
- ❌ **NICHT** die globalen Berechtigungen des Users

### Beispiel:

```
User: Max Mustermann
├── Globale Rolle: USER (aus users.role)
│   └── Berechtigungen: Dashboard, Urlaub beantragen, etc.
│
├── Team A: TEAMLEAD (aus team_members.role)
│   └── Kann Urlaub in Team A genehmigen
│
└── Team B: MEMBER (aus team_members.role)
    └── Kann Urlaub in Team B NICHT genehmigen
```

---

## 🔍 WO WERDEN BERECHTIGUNGEN GEPRÜFT?

### Frontend (React):

1. **Route Protection** (`/App.tsx`):
```tsx
function AdminRoute({ children }) {
  const { profile } = useAuthStore();
  
  const isAdmin = profile?.role === 'HR' || 
                  profile?.role === 'ADMIN' || 
                  profile?.role === 'SUPERADMIN';
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}
```

2. **Component Level** (z.B. `/components/RequestLeaveDialog.tsx`):
```tsx
const isAdmin = profile?.role === 'ADMIN' || 
                profile?.role === 'SUPERADMIN' || 
                profile?.role === 'HR' || 
                profile?.role === 'TEAMLEAD';

return (
  <div>
    {isAdmin && (
      <Select>
        <SelectItem value="user1">Mitarbeiter wählen</SelectItem>
      </Select>
    )}
  </div>
);
```

3. **Hook-basiert** (mit `usePermissions`):
```tsx
const { can } = usePermissions(profile?.role);

return (
  <div>
    {can.createUser && <Button>User erstellen</Button>}
    {can.createSuperadmin && <Button>Superadmin erstellen</Button>}
  </div>
);
```

---

## ❌ WAS ES NICHT GIBT:

### ❌ Keine `permissions` Tabelle:
```sql
-- SO ETWAS EXISTIERT NICHT:
CREATE TABLE permissions (
  user_id UUID,
  permission_name TEXT,
  granted BOOLEAN
);
```

### ❌ Keine `role_permissions` Tabelle:
```sql
-- SO ETWAS EXISTIERT NICHT:
CREATE TABLE role_permissions (
  role TEXT,
  permission TEXT
);
```

### ❌ Keine `user_custom_permissions` Tabelle:
```sql
-- SO ETWAS EXISTIERT NICHT:
CREATE TABLE user_custom_permissions (
  user_id UUID,
  permission TEXT
);
```

---

## ✅ WAS ES GIBT:

### 1. **users.role** (Globale Rolle)
```sql
SELECT id, email, role FROM users WHERE email = 'admin@firma.de';
-- Result: { id: 'uuid', email: 'admin@firma.de', role: 'ADMIN' }
```

### 2. **team_members.role** (Team-spezifische Rolle)
```sql
SELECT team_id, user_id, role, priority_tag 
FROM team_members 
WHERE user_id = 'uuid';
-- Result: { team_id: 'team1', user_id: 'uuid', role: 'TEAMLEAD', priority_tag: 'PRIMARY' }
```

### 3. **usePermissions Hook** (Berechnet Berechtigungen in Echtzeit)
```typescript
const { can } = usePermissions('ADMIN');
// can.createUser = true
// can.createSuperadmin = false
// can.approveLeaveRequests = true
```

---

## 🎨 PERMISSIONS EDITOR COMPONENT

Du hast vielleicht den **PermissionsEditor** (`/components/PermissionsEditor.tsx`) gesehen?

**⚠️ Das ist nur eine UI-Komponente zur ANZEIGE!**

```tsx
// Diese Komponente zeigt die Berechtigungen an
// ABER sie speichert sie NICHT in einer Datenbank!

export default function PermissionsEditor({ 
  userId, 
  role, 
  readOnly = false 
}: PermissionsEditorProps) {
  const { getAllPermissions, roleInfo } = usePermissions(role);
  
  // TODO: Save to backend
  // await saveUserPermissions(userId, customPermissions);
  
  // ⚠️ AKTUELL: Speichert NICHTS!
  // Die Berechtigungen werden aus der ROLLE berechnet!
}
```

**Das bedeutet:**
- ✅ Der Editor zeigt die aktuellen Berechtigungen basierend auf der Rolle
- ❌ Er speichert KEINE individuellen Berechtigungen
- ❌ Es gibt keine Custom-Permissions pro User

---

## 🔄 WORKFLOW: Rolle ändern → Berechtigungen ändern

```mermaid
User-Rolle in DB ändern
    ↓
Frontend lädt neues Profil
    ↓
usePermissions berechnet neue Berechtigungen
    ↓
UI zeigt/versteckt Features basierend auf neuen Berechtigungen
```

### SQL:
```sql
-- Rolle ändern
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'user@firma.de';
```

### Frontend:
```tsx
// Nach Login/Refresh:
const { profile } = useAuthStore(); 
// profile.role = 'ADMIN'

const { can } = usePermissions(profile.role);
// can.createUser = true
// can.approveLeaveRequests = true
// can.createSuperadmin = false
```

---

## 📊 ZUSAMMENFASSUNG

| Frage | Antwort |
|-------|---------|
| **Wo werden Berechtigungen gespeichert?** | Nirgendwo! Sie werden aus `users.role` berechnet |
| **Gibt es eine permissions Tabelle?** | ❌ Nein |
| **Können User individuelle Berechtigungen haben?** | ❌ Nein (aktuell) |
| **Wo wird geregelt wer was darf?** | `/hooks/usePermissions.ts` (Frontend-Code) |
| **Können Berechtigungen geändert werden?** | ✅ Ja - durch Ändern der ROLLE |
| **Gibt es Team-spezifische Berechtigungen?** | ✅ Ja - in `team_members.role` (nur für Urlaub) |

---

## 💡 WARUM SO?

**Vorteile:**
✅ Einfach zu verstehen  
✅ Keine zusätzliche Komplexität  
✅ Eine Rolle = Ein Set an Berechtigungen  
✅ Schnell (keine DB-Abfragen für Permissions)  
✅ Konsistent (alle mit gleicher Rolle haben gleiche Rechte)  

**Nachteile:**
❌ Keine feingranulare Kontrolle pro User  
❌ Keine Custom-Permissions  
❌ Berechtigungen sind im Code "hardcoded"  

---

## 🚀 WENN DU INDIVIDUELLE BERECHTIGUNGEN WILLST:

Du müsstest implementieren:

1. **Neue Tabelle:**
```sql
CREATE TABLE user_permissions (
  user_id UUID REFERENCES users(id),
  permission TEXT,
  granted BOOLEAN,
  PRIMARY KEY (user_id, permission)
);
```

2. **Backend API:**
```typescript
// GET /api/users/:userId/permissions
// POST /api/users/:userId/permissions
```

3. **Frontend Hook erweitern:**
```typescript
export function usePermissions(role: UserRole, customPermissions?: Record<string, boolean>) {
  // Merge role-based permissions with custom permissions
  const can = {
    ...roleBasedPermissions,
    ...customPermissions
  };
}
```

**Aber aktuell ist das NICHT implementiert!**

---

## 🎯 FAZIT:

**Die Berechtigungen werden NICHT woanders geregelt!**

- ✅ `users.role` = Globale Rolle (in DB)
- ✅ `usePermissions(role)` = Berechtigungen (berechnet im Frontend)
- ✅ `team_members.role` = Team-Rolle (nur für Urlaub-Genehmigungen)
- ❌ Keine separate Permissions-Datenbank
- ❌ Keine Custom-Permissions pro User

**Alles basiert direkt auf der Rolle!** 🎯
