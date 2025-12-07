# Rollen-System im BrowoKoordinator

## Es gibt KEINE "global_roles" Tabelle! ❌

Stattdessen gibt es **2 verschiedene Rollen-Konzepte**:

---

## 1️⃣ User Rollen (in `users` Tabelle)

### Wo gespeichert?
→ In der **`users`** Tabelle, Spalte **`role`**

### Welche Rollen gibt es?
```sql
role TEXT NOT NULL DEFAULT 'EMPLOYEE' 
CHECK (role IN ('EMPLOYEE', 'ADMIN', 'SUPERADMIN', 'HR', 'TEAMLEAD', 'EXTERN'))
```

**Verfügbare Rollen:**
- `EMPLOYEE` - Normaler Mitarbeiter
- `TEAMLEAD` - Team-Leiter
- `HR` - HR-Mitarbeiter
- `ADMIN` - Administrator
- `SUPERADMIN` - Super-Administrator
- `EXTERN` - Externe Mitarbeiter

### Wie prüfen?
```sql
SELECT id, email, first_name, last_name, role 
FROM users;
```

---

## 2️⃣ Job-Rollen / Positionen (im KV Store)

### Wo gespeichert?
→ In der **`kv_store_f659121d`** Tabelle mit Prefix `role_`

### Was ist das?
Das sind **Job-Beschreibungen** / **Positionen**, NICHT die User-Berechtigungen!

Beispiele:
- `role_dev` → "Software Developer"
- `role_manager` → "Team Manager"
- `role_hr` → "HR Specialist"
- `role_admin` → "System Administrator"
- `role_sales` → "Sales Representative"

### Wie prüfen?
```sql
SELECT key, value 
FROM kv_store_f659121d 
WHERE key LIKE 'role_%';
```

### Wie über API abrufen?
```
GET /api/roles
```

---

## 3️⃣ Team-spezifische Rollen

### Wo gespeichert?
→ In der **`team_members`** Tabelle

### Was ist das?
Rolle eines Users **innerhalb eines Teams**

**Spalten:**
- `is_lead` (BOOLEAN) - Ist Team-Leiter?
- `role` (TEXT) - z.B. "member", "admin", "teamlead"

### Wie prüfen?
```sql
SELECT 
  tm.team_id,
  t.name as team_name,
  u.email,
  tm.role as team_role,
  tm.is_lead
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id;
```

---

## Zusammenfassung

| Typ | Tabelle | Spalte/Prefix | Zweck |
|-----|---------|---------------|-------|
| **User-Berechtigung** | `users` | `role` | Globale Berechtigungen (EMPLOYEE, ADMIN, etc.) |
| **Job-Position** | `kv_store_f659121d` | `role_*` | Job-Beschreibungen (Developer, Manager, etc.) |
| **Team-Rolle** | `team_members` | `role`, `is_lead` | Rolle innerhalb eines Teams |

---

## Quick Check - Welche Rollen gibt es aktuell?

### 1. User-Rollen prüfen:
```sql
SELECT DISTINCT role FROM users;
```

### 2. Job-Positionen prüfen:
```sql
SELECT key, value 
FROM kv_store_f659121d 
WHERE key LIKE 'role_%';
```

### 3. Team-Rollen prüfen:
```sql
SELECT DISTINCT role FROM team_members;
```

---

## Was brauchst du konkret?

Wenn du **User-Berechtigungen** verwalten willst:
→ Schau in die `users` Tabelle, Spalte `role`

Wenn du **Job-Positionen** verwalten willst:
→ Nutze die API `/api/roles` oder schaue in `kv_store_f659121d`

Wenn du **Team-Hierarchie** verwalten willst:
→ Schau in die `team_members` Tabelle

---

**Was genau möchtest du mit den Rollen machen?** 🤔
