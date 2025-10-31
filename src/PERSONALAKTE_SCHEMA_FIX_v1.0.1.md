# ⚠️ PERSONALAKTE EDGE FUNCTION - SCHEMA FIX v1.0.1

## 🐛 **PROBLEM**

Die initiale v1.0.0 Implementation verwendete **falsche Spaltennamen**, die nicht mit der tatsächlichen Datenbankstruktur übereinstimmten!

### **Fehler beim Testing:**

```
❌ ERROR: column users.department_id does not exist
❌ ERROR: column documents.created_at does not exist  
❌ ERROR: Could not find a relationship between 'user_notes' and 'users'
```

---

## ✅ **LÖSUNG - v1.0.1 SCHEMA-KORREKTUREN**

### **1. users.department ist TEXT, nicht UUID!**

**FALSCH (v1.0.0):**
```typescript
SELECT department_id FROM users
```

**RICHTIG (v1.0.1):**
```typescript
SELECT department FROM users
// department ist ein TEXT Feld, nicht UUID!
```

**Warum?**
- Die `users` Tabelle hat **keine** `department_id` Spalte
- Department wird als **TEXT** gespeichert (z.B. "IT", "HR")
- Die separate `departments` Tabelle existiert, aber users verlinken nicht per FK

---

### **2. documents.uploaded_at, nicht created_at**

**FALSCH (v1.0.0):**
```typescript
.order('created_at', { ascending: false })
```

**RICHTIG (v1.0.1):**
```typescript
.order('uploaded_at', { ascending: false })
```

**Schema:**
```sql
CREATE TABLE documents (
  id UUID,
  user_id UUID,
  title TEXT,
  category TEXT,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ  -- NICHT created_at!
);
```

---

### **3. user_notes.author_id, nicht created_by**

**FALSCH (v1.0.0):**
```typescript
created_by: user.id,
created_by_user:users!user_notes_created_by_fkey(...)
```

**RICHTIG (v1.0.1):**
```typescript
author_id: user.id,
author:users!user_notes_author_id_fkey(...)
```

**Schema:**
```sql
CREATE TABLE user_notes (
  id UUID,
  user_id UUID REFERENCES users(id),
  author_id UUID REFERENCES users(id),  -- NICHT created_by!
  note_text TEXT,
  is_private BOOLEAN,
  created_at TIMESTAMPTZ
);
```

---

### **4. user_notes hat KEIN category Feld!**

**FALSCH (v1.0.0):**
```typescript
{
  note_text: "My note",
  category: "Mitarbeitergespräch"  // ❌ Spalte existiert nicht!
}
```

**RICHTIG (v1.0.1):**
```typescript
{
  note_text: "My note",
  is_private: true  // ✅ Korrekte Spalte
}
```

**Schema:**
```sql
CREATE TABLE user_notes (
  id UUID,
  user_id UUID,
  author_id UUID,
  note_text TEXT,
  is_private BOOLEAN,  -- ✅ Existiert
  -- category         -- ❌ Existiert NICHT!
);
```

---

### **5. team_members hat is_lead, kein role**

**FALSCH (v1.0.0):**
```typescript
SELECT team_id, role, teams(...)
```

**RICHTIG (v1.0.1):**
```typescript
SELECT team_id, is_lead, teams(...)
```

**Schema:**
```sql
CREATE TABLE team_members (
  team_id UUID,
  user_id UUID,
  is_lead BOOLEAN,  -- ✅ Existiert
  -- role            -- ❌ Existiert NICHT!
  joined_at TIMESTAMPTZ
);
```

---

## 📋 **ALLE ÄNDERUNGEN in v1.0.1**

| Bereich | v1.0.0 (FALSCH) | v1.0.1 (RICHTIG) |
|---------|----------------|------------------|
| **Users Department** | `department_id` (UUID) | `department` (TEXT) |
| **Documents Timestamp** | `created_at` | `uploaded_at` |
| **Notes Author** | `created_by` | `author_id` |
| **Notes Category** | `category` Feld | ❌ Existiert nicht, `is_private` verwenden |
| **Team Members Role** | `role` Feld | `is_lead` (BOOLEAN) |

---

## 🚀 **DEPLOYMENT - v1.0.1**

### **SCHRITT 1: CODE KOPIEREN**

```bash
# Öffne: /supabase/functions/BrowoKoordinator-Personalakte/index.ts
# Cmd/Ctrl + A (alles markieren)
# Cmd/Ctrl + C (kopieren)
```

Die Function wurde bereits korrigiert!

### **SCHRITT 2: DEPLOYEN**

```bash
# Supabase Dashboard:
# 1. Functions → BrowoKoordinator-Personalakte
# 2. Code einfügen
# 3. Deploy (--no-verify-jwt)
```

### **SCHRITT 3: TESTEN**

```javascript
// Browser-Konsole (F12)
// Code aus PERSONALAKTE_EDGE_FUNCTION_CONSOLE_TEST.js einfügen

personalakteTests.quickTest()

// Erwartete Ausgabe:
// ✅ Health Check: v1.0.1  <- Neue Version!
// ✅ Get Employees: { employees: [...] }
// ✅ Get Profile: { employee: { department: "IT" } }  <- TEXT!
// ✅ Get Documents: { documents: [...] }
```

---

## ✅ **ERWARTETE ERFOLGREICHE RESPONSES**

### **Health Check**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Personalakte",
  "version": "1.0.1"  // <- Aktualisiert!
}
```

### **Get Employees**
```json
{
  "success": true,
  "employees": [
    {
      "id": "uuid...",
      "first_name": "Max",
      "last_name": "Mustermann",
      "email": "max@example.com",
      "department": "IT",  // <- TEXT, nicht Object!
      "role": "EMPLOYEE",
      "position": "Entwickler"
    }
  ],
  "total": 45
}
```

### **Get Profile**
```json
{
  "success": true,
  "employee": {
    "id": "uuid...",
    "first_name": "Max",
    "department": "IT",  // <- TEXT!
    "teams": [
      {
        "id": "uuid...",
        "name": "Team Alpha",
        "is_lead": false  // <- is_lead, nicht role!
      }
    ],
    ...
  }
}
```

### **Get Documents**
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid...",
      "title": "Arbeitsvertrag",
      "uploaded_at": "2025-01-15T..."  // <- uploaded_at!
    }
  ]
}
```

### **Get Notes**
```json
{
  "success": true,
  "notes": [
    {
      "id": "uuid...",
      "note_text": "Test Note",
      "is_private": true,  // <- is_private, nicht category!
      "author": {  // <- author, nicht created_by_user!
        "id": "uuid...",
        "name": "Anna Schmidt"
      }
    }
  ]
}
```

### **Add Note**
```json
{
  "success": true,
  "note": {
    "id": "uuid...",
    "user_id": "uuid...",
    "note_text": "My note",
    "author_id": "uuid...",  // <- author_id, nicht created_by!
    "is_private": true
  }
}
```

---

## 🔍 **TROUBLESHOOTING**

### **Problem: "column users.department_id does not exist"**

**Ursache:** Edge Function v1.0.0 verwendet falsche Spaltennamen

**Lösung:** ✅ **v1.0.1 deployen!**

---

### **Problem: "column documents.created_at does not exist"**

**Ursache:** documents Tabelle hat `uploaded_at`, nicht `created_at`

**Lösung:** ✅ **v1.0.1 deployen!**

---

### **Problem: "Could not find a relationship"**

**Ursache:** Foreign Key Name falsch (created_by vs author_id)

**Lösung:** ✅ **v1.0.1 deployen!**

---

## 📊 **SCHEMA-REFERENZ**

### **users Tabelle (Auszug)**

```sql
CREATE TABLE users (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  position TEXT,
  department TEXT,  -- ✅ TEXT, nicht UUID!
  phone TEXT,
  profile_picture TEXT,
  organization_id UUID,
  yearly_leave_days INTEGER,
  vacation_days INTEGER,
  used_leave_days INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### **documents Tabelle (Auszug)**

```sql
CREATE TABLE documents (
  id UUID,
  user_id UUID,
  organization_id UUID,
  title TEXT,
  category TEXT,
  file_url TEXT,
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ  -- ✅ uploaded_at!
);
```

### **user_notes Tabelle (Komplett)**

```sql
CREATE TABLE user_notes (
  id UUID,
  user_id UUID REFERENCES users(id),
  author_id UUID REFERENCES users(id),  -- ✅ author_id!
  note_text TEXT,
  is_private BOOLEAN,  -- ✅ is_private, kein category!
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### **team_members Tabelle (Komplett)**

```sql
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  is_lead BOOLEAN,  -- ✅ is_lead, kein role!
  joined_at TIMESTAMPTZ,
  PRIMARY KEY (team_id, user_id)
);
```

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Code aus `/supabase/functions/BrowoKoordinator-Personalakte/index.ts` kopiert
- [ ] Version auf **v1.0.1** geprüft
- [ ] In Supabase Dashboard eingefügt
- [ ] Mit `--no-verify-jwt` deployed
- [ ] Health Check zeigt **v1.0.1**
- [ ] Get Employees funktioniert (department als TEXT)
- [ ] Get Profile funktioniert (department als TEXT, teams mit is_lead)
- [ ] Get Documents funktioniert (uploaded_at)
- [ ] Get Notes funktioniert (author_id, is_private)
- [ ] Add Note funktioniert (ohne category)

---

## 🎉 **STATUS**

✅ **v1.0.1 READY TO DEPLOY!**

**Alle Schema-Fehler behoben:**
- ✅ `users.department` als TEXT
- ✅ `documents.uploaded_at` 
- ✅ `user_notes.author_id`
- ✅ `user_notes.is_private` (kein category)
- ✅ `team_members.is_lead` (kein role)

**Jetzt deployen und erneut testen!** 🚀
