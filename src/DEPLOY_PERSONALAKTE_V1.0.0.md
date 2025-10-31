# 🚀 PERSONALAKTE EDGE FUNCTION v1.0.1 - DEPLOYMENT GUIDE

## ⚠️ **SCHEMA-KORREKTUREN in v1.0.1**

Die Function wurde an die **tatsächliche Datenbankstruktur** angepasst:

**WICHTIGE ÄNDERUNGEN:**
- ✅ `users.department` ist **TEXT** (nicht `department_id` UUID!)
- ✅ `documents.uploaded_at` (nicht `created_at`)
- ✅ `user_notes.author_id` (nicht `created_by`)
- ✅ `user_notes` hat **KEIN** `category` Feld!
- ✅ `team_members` hat nur `is_lead`, kein `role` Feld

---

# 🚀 PERSONALAKTE EDGE FUNCTION v1.0.1 - DEPLOYMENT GUIDE

## ✅ **WAS IST NEU?**

Die **BrowoKoordinator-Personalakte** Edge Function wurde von einer **umfangreichen STUB mit 20+ Endpoints** zu einer **fokussierten, vollständig funktionierenden API** umgebaut!

### **VORHER (Stub - 20+ Endpoints):**
```typescript
// TODO: Implement get employee details
// - Fetch complete employee profile
// - Include all related data (department, team, etc.)
// - Check permissions

return c.json({
  message: 'Get employee details - Coming soon',
  employeeId
});
```

### **JETZT (Vollständig - 8 Kern-Endpoints):**
```typescript
// Complete employee profile with all data
const { data: employee } = await supabase
  .from('users')
  .select('*')
  .eq('id', employeeId)
  .single();

// Get department, teams, leave balance
// ... vollständige Implementation

return c.json({
  success: true,
  employee: {
    // 50+ Felder mit echten Daten
  }
});
```

---

## 📋 **8 FOKUSSIERTE ENDPOINTS**

| # | Endpoint | Method | Auth | Beschreibung |
|---|----------|--------|------|--------------|
| 1 | `/health` | GET | ❌ Public | Health Check |
| 2 | `/employees` | GET | ✅ User | Alle Mitarbeiter abrufen |
| 3 | `/employees/:id` | GET | ✅ User/HR | Mitarbeiter-Profil abrufen |
| 4 | `/employees/:id` | PUT | ✅ User/HR | Profil aktualisieren |
| 5 | `/employees/:id/documents` | GET | ✅ User/HR | Mitarbeiter-Dokumente |
| 6 | `/employees/:id/notes` | GET | 🔐 HR/Admin | Notizen abrufen |
| 7 | `/employees/:id/notes` | POST | 🔐 HR/Admin | Notiz hinzufügen |
| 8 | `/employees/:id/notes/:note_id` | DELETE | 🔐 HR/Admin | Notiz löschen |

---

## 🎯 **PERSONALAKTE FEATURES**

### **1. Get All Employees** (`GET /employees`)

**Für alle User sichtbar:**
- ✅ Mitarbeiter-Liste mit Pagination
- ✅ Suche nach Name/Email
- ✅ Filter nach Department/Role
- ✅ Limit & Offset für Performance

**Query Parameters:**
- `search` - Suche nach Name/Email
- `department` - Filter nach Department (TEXT search!)
- `role` - Filter nach Rolle
- `limit` - Max Anzahl (default: 100)
- `offset` - Offset für Pagination (default: 0)

**Beispiel Response:**
```json
{
  "success": true,
  "employees": [
    {
      "id": "uuid...",
      "first_name": "Max",
      "last_name": "Mustermann",
      "email": "max@example.com",
      "role": "EMPLOYEE",
      "department": "IT", // TEXT, not UUID!
      "profile_picture": "https://...",
      "phone": "+49 123 456789",
      "position": "Entwickler",
      "created_at": "2025-01-01T..."
    }
  ],
  "total": 45,
  "limit": 100,
  "offset": 0
}
```

### **2. Get Employee Profile** (`GET /employees/:id`)

**Komplettes Mitarbeiter-Profil mit 50+ Feldern:**

**Permissions:**
- ✅ User kann **eigenes** Profil sehen
- ✅ HR/Admin können **alle** Profile sehen

**Profil-Daten:**
- **Basic Info:** Name, Email, Phone, Profilbild
- **Employment:** Role, Position, Department, Teams, Start/End Date
- **Personal:** Birth Date, Gender, Nationality
- **Address:** Street, Postal Code, City, Country
- **Contact:** Private Email, Mobile, Home Phone
- **Emergency Contact:** Name, Phone, Relation
- **Bank Info:** IBAN, BIC, Bank Name
- **Tax & Insurance:** Tax ID, Social Security, Health Insurance
- **Leave:** Yearly Allowance, Used, Remaining Days
- **Gamification:** Coin Balance, Learning Level, XP

**Beispiel Response:**
```json
{
  "success": true,
  "employee": {
    "id": "uuid...",
    "first_name": "Max",
    "last_name": "Mustermann",
    "email": "max@example.com",
    "phone": "+49 123 456789",
    "profile_picture": "https://...",
    
    "role": "EMPLOYEE",
    "position": "Entwickler",
    "department": "IT", // TEXT field, not object!
    "teams": [
      {
        "id": "uuid...",
        "name": "Team Alpha",
        "description": "Development Team",
        "role": "MEMBER"
      }
    ],
    
    "yearly_leave_days": 30,
    "used_leave_days": 12,
    "remaining_leave_days": 18,
    
    "coin_balance": 450,
    "learning_level": 5,
    "learning_xp": 2340,
    
    // ... 40+ weitere Felder
  }
}
```

### **3. Update Employee Profile** (`PUT /employees/:id`)

**Zwei Permission-Level:**

**User kann eigene Felder bearbeiten:**
- Phone, Mobile Phone, Home Phone
- Street Address, Postal Code, City, Country
- Private Email
- Emergency Contact (Name, Phone, Relation)
- Profile Picture

**HR/Admin kann alle Felder bearbeiten:**
- Alle User-Felder PLUS:
- First Name, Last Name, Email
- Role, Position, Department
- Start/End Date, Employment Type
- Birth Date, Gender, Nationality
- IBAN, BIC, Bank Name
- Tax ID, Social Security Number
- Health Insurance
- Yearly/Used Leave Days
- Weekly Hours, Break Minutes

**Beispiel Request:**
```json
{
  "phone": "+49 123 456789",
  "mobile_phone": "+49 171 1234567",
  "street_address": "Hauptstraße 123",
  "postal_code": "10115",
  "city": "Berlin"
}
```

**Beispiel Response:**
```json
{
  "success": true,
  "employee": {
    // Komplettes aktualisiertes Profil
  },
  "message": "Employee updated successfully"
}
```

### **4. Get Employee Documents** (`GET /employees/:id/documents`)

**Permissions:**
- ✅ User kann **eigene** Dokumente sehen
- ✅ HR/Admin können **alle** Dokumente sehen

**Features:**
- Filter nach Category
- Gruppierung nach Category
- Sortierung nach Datum

**Query Parameters:**
- `category` - Filter nach Dokument-Kategorie

**Beispiel Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid...",
      "file_name": "Arbeitsvertrag_Max_Mustermann.pdf",
      "category": "Arbeitsvertrag",
      "file_path": "documents/uuid.pdf",
      "file_size": 245678,
      "mime_type": "application/pdf",
      "user_id": "uuid...",
      "uploaded_by": "uuid...",
      "created_at": "2025-01-01T..."
    }
  ],
  "byCategory": {
    "Arbeitsvertrag": [...],
    "Zeugnisse": [...],
    "Schulungen": [...]
  },
  "total": 12
}
```

### **5. Get Employee Notes** (`GET /employees/:id/notes`)

**NUR HR/Admin!**

**Features:**
- Notizen mit Author-Info
- Kategorie-System
- Sortierung nach Datum (newest first)

**Beispiel Response:**
```json
{
  "success": true,
  "notes": [
    {
      "id": "uuid...",
      "note_text": "Mitarbeitergespräch am 15.01.2025 - sehr positives Feedback",
      "is_private": true,
      "created_at": "2025-01-15T...",
      "author": {
        "id": "uuid...",
        "name": "Anna Schmidt",
        "email": "anna@example.com"
      }
    }
  ],
  "total": 5
}
```

### **6. Add Employee Note** (`POST /employees/:id/notes`)

**NUR HR/Admin!**

**Request Body:**
```json
{
  "note_text": "Mitarbeitergespräch am 15.01.2025 - sehr positives Feedback",
  "is_private": true
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": "uuid...",
    "user_id": "uuid...",
    "note_text": "...",
    "is_private": true,
    "author_id": "uuid...",
    "created_at": "2025-01-15T..."
  },
  "message": "Note added successfully"
}
```

### **7. Delete Employee Note** (`DELETE /employees/:id/notes/:note_id`)

**NUR HR/Admin!**

**Response:**
```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

---

## 🎯 **DEPLOYMENT SCHRITTE**

### **SCHRITT 1: CODE KOPIEREN**

1. Öffne Datei: `/supabase/functions/BrowoKoordinator-Personalakte/index.ts`
2. **Cmd/Ctrl + A** (Alles markieren)
3. **Cmd/Ctrl + C** (Kopieren)

### **SCHRITT 2: SUPABASE DASHBOARD**

1. Öffne: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions
2. Klicke auf **"BrowoKoordinator-Personalakte"**
3. Scrolle zum Code-Editor

### **SCHRITT 3: CODE EINFÜGEN**

1. **Cmd/Ctrl + A** im Editor (Alten Code markieren)
2. **Cmd/Ctrl + V** (Neuen Code einfügen)
3. Scrolle nach unten zum **"Deploy"** Button
4. Klicke **"Deploy"**

### **SCHRITT 4: DEPLOYMENT FLAGS**

⚠️ **WICHTIG!** Verwende diese Flags:

```bash
--no-verify-jwt
```

### **SCHRITT 5: WARTEN**

- Status: `Deploying...`
- Warten bis: `Successfully deployed`
- Dauer: ~30-60 Sekunden

### **SCHRITT 6: TESTEN**

1. Öffne Browser-Konsole (F12)
2. Kopiere Code aus: `PERSONALAKTE_EDGE_FUNCTION_CONSOLE_TEST.js`
3. Füge in Konsole ein
4. Führe aus: `personalakteTests.quickTest()`

---

## 🧪 **CONSOLE TESTS**

### **QUICK TEST (Empfohlen):**

```javascript
personalakteTests.quickTest()
```

**Testet:**
- ✅ Health Check
- ✅ Get All Employees
- ✅ Get Own Profile
- ✅ Get Own Documents

### **VOLLSTÄNDIGER TEST:**

```javascript
personalakteTests.runAll()
```

**Testet alle 8 Endpoints:**
- ✅ Health Check
- ✅ Get Employees (mit Pagination)
- ✅ Get Own Profile
- ✅ Update Own Profile
- ✅ Get Own Documents
- ✅ Get Notes (HR/Admin)
- ✅ Add Note (HR/Admin)
- ✅ Delete Note (HR/Admin)

### **EINZELNE TESTS:**

```javascript
// Health Check
await personalakteTests.health()

// Alle Mitarbeiter abrufen
await personalakteTests.getEmployees()

// Mit Suche
await personalakteTests.getEmployees('Max')

// Eigenes Profil
await personalakteTests.getProfile()

// Anderes Profil (HR/Admin)
await personalakteTests.getProfile('USER_ID')

// Profil Update
await personalakteTests.updateProfile(null, {
  phone: '+49 123 456789',
  city: 'Berlin'
})

// Eigene Dokumente
await personalakteTests.getDocuments()

// Dokumente mit Filter
await personalakteTests.getDocuments(null, 'Arbeitsvertrag')

// Notizen abrufen (HR/Admin)
await personalakteTests.getNotes('USER_ID')

// Notiz hinzufügen (HR/Admin)
await personalakteTests.addNote('USER_ID', 'Test Notiz', true)

// Notiz löschen (HR/Admin)
await personalakteTests.deleteNote('USER_ID', 'NOTE_ID')
```

---

## ✅ **ERWARTETE ERGEBNISSE**

### **1. Health Check**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Personalakte",
  "version": "1.0.1"
}
```

### **2. Get Employees**
```json
{
  "success": true,
  "employees": [...],
  "total": 45,
  "limit": 100,
  "offset": 0
}
```

### **3. Get Profile**
```json
{
  "success": true,
  "employee": {
    // 50+ Felder
    "first_name": "Max",
    "yearly_leave_days": 30,
    "remaining_leave_days": 18,
    "coin_balance": 450,
    ...
  }
}
```

---

## 🔍 **TROUBLESHOOTING**

### **Problem: "Unauthorized"**

**Lösung:**
```javascript
// Prüfe Session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Falls nicht eingeloggt
await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
})
```

### **Problem: "Insufficient permissions"**

**Nur bei HR/Admin Endpoints!**

Die folgenden Endpoints benötigen HR/Admin Role:
- `GET /employees/:id/notes`
- `POST /employees/:id/notes`
- `DELETE /employees/:id/notes/:note_id`

**Lösung:**
```sql
-- Prüfe Rolle
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Setze HR-Rolle (falls berechtigt)
UPDATE users SET role = 'HR' WHERE id = auth.uid();
```

### **Problem: "Employee not found"**

**Lösung:**
```javascript
// Prüfe ob User existiert
const { data: users } = await supabase
  .from('users')
  .select('id, first_name, last_name, email')
  .limit(5)

console.log('Available users:', users)

// Verwende korrekte User ID
await personalakteTests.getProfile(users[0].id)
```

### **Problem: "No organization found"**

**Lösung:**
```sql
-- Prüfe organization_id
SELECT id, email, organization_id FROM users WHERE id = auth.uid();

-- Setze default organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE is_default = true LIMIT 1)
WHERE id = auth.uid();
```

---

## 📊 **VERWENDETE TABELLEN**

Die Personalakte Function greift auf folgende Tabellen zu:

1. **users** - Mitarbeiter-Profile (Haupttabelle)
2. **departments** - Abteilungen
3. **teams** - Teams
4. **team_members** - Team-Zugehörigkeiten
5. **documents** - Mitarbeiter-Dokumente
6. **user_notes** - HR-Notizen zu Mitarbeitern

**Alle Tabellen existieren bereits!** Keine Migration notwendig.

---

## 🎉 **DEPLOYMENT CHECKLIST**

- [ ] Code aus `/supabase/functions/BrowoKoordinator-Personalakte/index.ts` kopiert
- [ ] In Supabase Dashboard eingefügt
- [ ] Mit `--no-verify-jwt` deployed
- [ ] Health Check erfolgreich (200 OK)
- [ ] Quick Test ausgeführt
- [ ] Get Employees funktioniert
- [ ] Get Profile funktioniert
- [ ] Get Documents funktioniert

---

## 📝 **VERSION HISTORY**

### **v1.0.1** (30. Okt 2025) - **SCHEMA FIX**
- ✅ Fixed: `users.department` ist TEXT (nicht UUID)
- ✅ Fixed: `documents.uploaded_at` (nicht created_at)
- ✅ Fixed: `user_notes.author_id` (nicht created_by)
- ✅ Fixed: `user_notes` hat kein category Feld
- ✅ Fixed: `team_members` verwendet is_lead

### **v1.0.0** (30. Okt 2025)
- ✅ 8 fokussierte Endpoints implementiert
- ✅ Komplettes Mitarbeiter-Profil (50+ Felder)
- ✅ Employee List mit Pagination & Filters
- ✅ Profile Update mit Permission-Level
- ✅ Documents Integration
- ✅ Notes System (HR/Admin)
- ✅ Organization-based isolation
- ✅ Proper error handling
- ✅ Console test suite

---

## 🚀 **NEXT STEPS**

Nach erfolgreichem Deployment:

1. **Frontend Integration**
   - Personalakte-Screen erstellen
   - Mitarbeiter-Liste mit Suche
   - Profil-Detailansicht
   - Dokumente-Verwaltung

2. **Letzte Edge Function deployen**
   - BrowoKoordinator-Tasks (9 Endpoints)
   - **→ 100% COMPLETE!** 🎉

3. **Personalakte erweitern**
   - PDF-Export von Profilen
   - Bulk-Updates
   - Advanced Search

---

**🎯 Bei Problemen:**
- Prüfe Supabase Function Logs
- Teste einzelne Endpoints via Console
- Checke RLS Policies auf users & documents
- Verifiziere organization_id beim User

**Happy Deploying! 🚀**
