# 🚀 FIELD EDGE FUNCTION v1.0.0 - DEPLOYMENT GUIDE

## ✅ **WAS IST NEU?**

Die **BrowoKoordinator-Field** Edge Function wurde von einer **STUB-Implementation** zu einer **vollständig funktionierenden API** umgebaut!

### **VORHER (Stub):**
```typescript
// TODO: Implement get vehicles
// - Fetch all vehicles
// - Include assignment status
// - Filter by availability if needed

return c.json({
  message: 'Get vehicles - Coming soon',
  vehicles: []
});
```

### **JETZT (Vollständig):**
```typescript
// Fetch all vehicles for the organization
const { data: vehicles, error: vehiclesError } = await supabase
  .from('vehicles')
  .select('*')
  .eq('organization_id', user.organization_id)
  .order('created_at', { ascending: false });

return c.json({
  success: true,
  vehicles: vehicles || []
});
```

---

## 📋 **13 VOLLSTÄNDIGE ENDPOINTS**

| # | Endpoint | Method | Auth | Beschreibung |
|---|----------|--------|------|--------------|
| 1 | `/health` | GET | ❌ Public | Health Check |
| 2 | `/vehicles` | GET | ✅ User | Alle Fahrzeuge abrufen |
| 3 | `/vehicles` | POST | 🔐 HR/Admin | Fahrzeug erstellen |
| 4 | `/vehicles/:id` | PUT | 🔐 HR/Admin | Fahrzeug bearbeiten |
| 5 | `/vehicles/:id` | DELETE | 🔐 HR/Admin | Fahrzeug löschen |
| 6 | `/equipment` | GET | ✅ User | Alle Ausrüstung abrufen |
| 7 | `/equipment` | POST | 🔐 HR/Admin | Ausrüstung erstellen |
| 8 | `/equipment/:id` | PUT | 🔐 HR/Admin | Ausrüstung bearbeiten |
| 9 | `/equipment/:id` | DELETE | 🔐 HR/Admin | Ausrüstung löschen |
| 10 | `/checkout` | POST | ✅ User | Item auschecken |
| 11 | `/checkin` | POST | ✅ User | Item einchecken |
| 12 | `/my-assignments` | GET | ✅ User | Meine Zuweisungen |
| 13 | `/history` | GET | ✅ User | Zuweisungs-Verlauf |

---

## 🎯 **DEPLOYMENT SCHRITTE**

### **SCHRITT 1: MIGRATION AUSFÜHREN**

⚠️ **WICHTIG:** Die Tabellen müssen zuerst erstellt werden!

```sql
-- 1. Öffne Supabase Dashboard → SQL Editor
-- 2. Klicke "New Query"
-- 3. Kopiere KOMPLETTEN Code aus: /supabase/migrations/067_field_management_tables.sql
-- 4. Füge ein und klicke "Run" (Cmd/Ctrl + Enter)
-- 5. Warte auf: "Success. No rows returned"
```

**Was wird erstellt:**
- ✅ `vehicles` Tabelle (Fahrzeuge)
- ✅ `equipment` Tabelle (Ausrüstung)
- ✅ `field_assignments` Tabelle (Checkout/Checkin)
- ✅ RLS Policies (Row Level Security)
- ✅ Indexes für Performance

### **SCHRITT 2: CODE KOPIEREN**

1. Öffne Datei: `/supabase/functions/BrowoKoordinator-Field/index.ts`
2. **Cmd/Ctrl + A** (Alles markieren)
3. **Cmd/Ctrl + C** (Kopieren)

### **SCHRITT 3: SUPABASE DASHBOARD**

1. Öffne: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions
2. Klicke auf **"BrowoKoordinator-Field"**
3. Scrolle zum Code-Editor

### **SCHRITT 4: CODE EINFÜGEN**

1. **Cmd/Ctrl + A** im Editor (Alten Code markieren)
2. **Cmd/Ctrl + V** (Neuen Code einfügen)
3. Scrolle nach unten zum **"Deploy"** Button
4. Klicke **"Deploy"**

### **SCHRITT 5: DEPLOYMENT FLAGS**

⚠️ **WICHTIG!** Verwende diese Flags:

```bash
--no-verify-jwt
```

**Warum?**
- `/health` Endpoint muss public bleiben (für Monitoring)
- Alle anderen Endpoints haben eigene JWT-Verification im Code

### **SCHRITT 6: WARTEN**

- Status: `Deploying...`
- Warten bis: `Successfully deployed`
- Dauer: ~30-60 Sekunden

### **SCHRITT 7: TESTEN**

1. Öffne Browser-Konsole (F12)
2. Kopiere Code aus: `FIELD_EDGE_FUNCTION_CONSOLE_TEST.js`
3. Füge in Konsole ein
4. Führe aus: `fieldTests.quickTest()`

---

## 🧪 **CONSOLE TESTS**

### **QUICK TEST (Empfohlen):**

```javascript
fieldTests.quickTest()
```

**Testet:**
- ✅ Health Check
- ✅ Get Vehicles
- ✅ Get Equipment
- ✅ Get My Assignments

### **VOLLSTÄNDIGER TEST:**

```javascript
fieldTests.runAll()
```

**Testet alle 13 Endpoints:**
- ✅ Health Check
- ✅ Get Vehicles / Equipment
- ✅ Create / Update / Delete Vehicle
- ✅ Create / Update / Delete Equipment
- ✅ Checkout / Checkin
- ✅ My Assignments
- ✅ History

### **EINZELNE TESTS:**

```javascript
// Health Check
await fieldTests.health()

// Fahrzeuge abrufen
await fieldTests.getVehicles()

// Fahrzeug erstellen
await fieldTests.createVehicle({
  kennzeichen: 'B-ABC-123',
  modell: 'VW Transporter T6',
  fahrzeugtyp: 'Transporter',
  ladekapazitaet: 1200
})

// Ausrüstung abrufen
await fieldTests.getEquipment()

// Ausrüstung erstellen
await fieldTests.createEquipment({
  name: 'Bohrmaschine Makita',
  category: 'Werkzeug',
  serial_number: 'SN-12345'
})

// Item auschecken
await fieldTests.checkout('vehicle', 'VEHICLE_ID')

// Item einchecken
await fieldTests.checkin('vehicle', 'VEHICLE_ID', 'good', 'Alles okay')

// Meine Zuweisungen
await fieldTests.getMyAssignments()

// Verlauf
await fieldTests.getHistory()
```

---

## ✅ **ERWARTETE ERGEBNISSE**

### **1. Health Check**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Field",
  "version": "1.0.0",
  "timestamp": "2025-01-30T..."
}
```

### **2. Get Vehicles**
```json
{
  "success": true,
  "vehicles": [],
  "timestamp": "2025-01-30T..."
}
```

### **3. Create Vehicle**
```json
{
  "success": true,
  "vehicle": {
    "id": "uuid...",
    "organization_id": "uuid...",
    "kennzeichen": "B-TEST-123",
    "modell": "VW Transporter",
    "fahrzeugtyp": "Transporter",
    "status": "available",
    ...
  }
}
```

### **4. Checkout**
```json
{
  "success": true,
  "assignment": {
    "id": "uuid...",
    "item_type": "vehicle",
    "item_id": "uuid...",
    "assigned_to": "uuid...",
    "checked_out_at": "2025-01-30T...",
    "checked_in_at": null
  },
  "message": "vehicle checked out successfully"
}
```

---

## 🔍 **TROUBLESHOOTING**

### **Problem: "Unauthorized"**

**Lösung:**
```javascript
// 1. Prüfe ob eingeloggt
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// 2. Falls nicht eingeloggt, anmelden
await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
})

// 3. Test erneut ausführen
await fieldTests.quickTest()
```

### **Problem: "No organization found"**

**Lösung:**
```sql
-- Prüfe organization_id
SELECT id, email, organization_id FROM users WHERE id = auth.uid();

-- Falls NULL, setze default organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE is_default = true LIMIT 1)
WHERE id = auth.uid();
```

### **Problem: "Insufficient permissions"**

**Lösung:**
```sql
-- Prüfe Rolle
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Setze HR-Rolle (falls berechtigt)
UPDATE users SET role = 'HR' WHERE id = auth.uid();
```

### **Problem: "relation 'vehicles' does not exist"**

**Lösung:**
Migration 067 wurde nicht ausgeführt!

```sql
-- Führe Migration aus:
-- Öffne: /supabase/migrations/067_field_management_tables.sql
-- Kopiere KOMPLETTEN Code
-- SQL Editor → New Query → Einfügen → Run
```

### **Problem: "Cannot delete vehicle - currently assigned"**

**Lösung:**
Das ist korrektes Verhalten! Fahrzeug ist ausgecheckt.

```javascript
// 1. Prüfe aktive Zuweisungen
await fieldTests.getMyAssignments()

// 2. Item einchecken
await fieldTests.checkin('vehicle', 'VEHICLE_ID', 'good')

// 3. Dann löschen
await fieldTests.deleteVehicle('VEHICLE_ID')
```

---

## 📊 **TABELLEN-STRUKTUR**

### **vehicles**
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  kennzeichen TEXT NOT NULL,
  modell TEXT NOT NULL,
  fahrzeugtyp TEXT NOT NULL,
  ladekapazitaet NUMERIC DEFAULT 0,
  dienst_start DATE,
  letzte_wartung DATE,
  status TEXT DEFAULT 'available',
  condition TEXT,
  images JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  thumbnail TEXT,
  wartungen JSONB DEFAULT '[]',
  unfaelle JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### **equipment**
```sql
CREATE TABLE equipment (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  serial_number TEXT,
  purchase_date DATE,
  status TEXT DEFAULT 'available',
  condition TEXT DEFAULT 'good',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### **field_assignments**
```sql
CREATE TABLE field_assignments (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  item_type TEXT CHECK (item_type IN ('vehicle', 'equipment')),
  item_id UUID NOT NULL,
  assigned_to UUID REFERENCES users(id),
  checked_out_by UUID REFERENCES users(id),
  checked_out_at TIMESTAMPTZ NOT NULL,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES users(id),
  condition_on_return TEXT,
  notes TEXT,
  checkin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎉 **DEPLOYMENT CHECKLIST**

- [ ] Migration 067 ausgeführt (Tabellen erstellt)
- [ ] Code aus `/supabase/functions/BrowoKoordinator-Field/index.ts` kopiert
- [ ] In Supabase Dashboard eingefügt
- [ ] Mit `--no-verify-jwt` deployed
- [ ] Health Check erfolgreich (200 OK)
- [ ] Quick Test ausgeführt
- [ ] Alle Tests bestanden

---

## 📝 **VERSION HISTORY**

### **v1.0.0** (30. Jan 2025)
- ✅ Vollständige Implementation aller 13 Endpoints
- ✅ Vehicles Management (CRUD)
- ✅ Equipment Management (CRUD)
- ✅ Checkout/Checkin System
- ✅ Assignment History
- ✅ Organization-based isolation
- ✅ Proper error handling
- ✅ Console test suite
- ✅ Database migration

---

## 🚀 **NEXT STEPS**

Nach erfolgreichem Deployment:

1. **Frontend Integration aktualisieren**
   - FieldManagementScreen auf Edge Function umstellen
   - LocalStorage-Code durch API-Calls ersetzen
   - Fehlerbehandlung implementieren

2. **Weitere Edge Functions deployen**
   - BrowoKoordinator-Analytics (6 Endpoints)
   - BrowoKoordinator-Personalakte (8 Endpoints)
   - BrowoKoordinator-Tasks (9 Endpoints)

3. **Field System erweitern**
   - Wartungs-Erinnerungen
   - Checkout-Benachrichtigungen
   - Report-System

---

**🎯 Bei Problemen:**
- Prüfe Supabase Function Logs
- Teste einzelne Endpoints via Console
- Checke RLS Policies auf vehicles & equipment
- Verifiziere organization_id beim User

**Happy Deploying! 🚀**
