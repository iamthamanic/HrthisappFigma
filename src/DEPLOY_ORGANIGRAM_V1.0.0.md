# 🚀 ORGANIGRAM EDGE FUNCTION v1.0.0 - DEPLOYMENT GUIDE

## ✅ **WAS IST NEU?**

Die **BrowoKoordinator-Organigram** Edge Function wurde von einer **STUB-Implementation** zu einer **vollständig funktionierenden API** umgebaut!

### **VORHER (Stub):**
```typescript
// TODO: Implement get draft
// - Fetch all draft nodes
// - Fetch all draft connections
// - Return organigram structure

return c.json({
  message: 'Get draft - Coming soon',
  draft: { nodes: [], connections: [] }
});
```

### **JETZT (Vollständig):**
```typescript
// Fetch all draft nodes
const { data: nodes, error: nodesError } = await supabase
  .from('org_nodes')
  .select('*')
  .eq('organization_id', user.organization_id)
  .eq('is_published', false)
  .order('created_at', { ascending: true });

// Fetch all draft connections
const { data: connections, error: connectionsError } = await supabase
  .from('node_connections')
  .select('*')
  .eq('organization_id', user.organization_id)
  .eq('is_published', false)
  .order('created_at', { ascending: true });

return c.json({
  success: true,
  draft: { nodes: nodes || [], connections: connections || [] }
});
```

---

## 📋 **12 VOLLSTÄNDIGE ENDPOINTS**

| # | Endpoint | Method | Auth | Beschreibung |
|---|----------|--------|------|--------------|
| 1 | `/health` | GET | ❌ Public | Health Check |
| 2 | `/draft` | GET | ✅ User | Hole Draft Organigram |
| 3 | `/live` | GET | ✅ User | Hole Live Organigram |
| 4 | `/nodes` | POST | 🔐 Admin | Erstelle Node |
| 5 | `/nodes/:id` | PUT | 🔐 Admin | Update Node |
| 6 | `/nodes/:id` | DELETE | 🔐 Admin | Lösche Node |
| 7 | `/connections` | POST | 🔐 Admin | Erstelle Connection |
| 8 | `/connections/:id` | DELETE | 🔐 Admin | Lösche Connection |
| 9 | `/publish` | POST | 🔐 Admin | Publish Draft → Live |
| 10 | `/history` | GET | 🔐 Admin | Version History |
| 11 | `/restore/:version` | POST | 🔐 Admin | Restore Version |
| 12 | `/auto-save` | POST | 🔐 Admin | Auto-save Draft |

---

## 🎯 **DEPLOYMENT SCHRITTE**

### **SCHRITT 1: CODE KOPIEREN**

1. Öffne Datei: `/supabase/functions/BrowoKoordinator-Organigram/index.ts`
2. **Cmd/Ctrl + A** (Alles markieren)
3. **Cmd/Ctrl + C** (Kopieren)

### **SCHRITT 2: SUPABASE DASHBOARD**

1. Öffne: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions
2. Klicke auf **"BrowoKoordinator-Organigram"**
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

**Warum?**
- `/health` Endpoint muss public bleiben (für Monitoring)
- Alle anderen Endpoints haben eigene JWT-Verification im Code

### **SCHRITT 5: WARTEN**

- Status: `Deploying...`
- Warten bis: `Successfully deployed`
- Dauer: ~30-60 Sekunden

### **SCHRITT 6: TESTEN**

1. Öffne Browser-Konsole (F12)
2. Kopiere Code aus: `ORGANIGRAM_EDGE_FUNCTION_CONSOLE_TEST.js`
3. Füge in Konsole ein
4. Führe aus: `organigramTests.quickTest()`

---

## 🧪 **CONSOLE TESTS**

### **QUICK TEST (Empfohlen):**

```javascript
organigramTests.quickTest()
```

**Testet:**
- ✅ Health Check
- ✅ Get Draft
- ✅ Get Live  
- ✅ Get History

### **VOLLSTÄNDIGER TEST:**

```javascript
organigramTests.runAll()
```

**Testet alle 12 Endpoints:**
- ✅ Health Check
- ✅ Get Draft / Live
- ✅ Create / Update / Delete Node
- ✅ Create / Delete Connection
- ✅ Auto-save
- ✅ Publish
- ✅ Version History

### **EINZELNE TESTS:**

```javascript
// Health Check
await organigramTests.health()

// Draft abrufen
await organigramTests.getDraft()

// Live abrufen
await organigramTests.getLive()

// Node erstellen
await organigramTests.createNode({
  node_type: 'executive',
  title: 'CEO',
  position_x: 400,
  position_y: 100
})

// Node updaten
await organigramTests.updateNode('NODE_ID', {
  title: 'CEO (Updated)',
  position_x: 450
})

// Connection erstellen
await organigramTests.createConnection({
  source_node_id: 'SOURCE_ID',
  source_position: 'bottom',
  target_node_id: 'TARGET_ID',
  target_position: 'top'
})

// Publish
await organigramTests.publish()

// History
await organigramTests.getHistory()
```

---

## ✅ **ERWARTETE ERGEBNISSE**

### **1. Health Check**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Organigram",
  "version": "1.0.0",
  "timestamp": "2025-01-30T..."
}
```

### **2. Get Draft**
```json
{
  "success": true,
  "draft": {
    "nodes": [],
    "connections": []
  },
  "timestamp": "2025-01-30T..."
}
```

### **3. Create Node**
```json
{
  "success": true,
  "node": {
    "id": "uuid...",
    "organization_id": "uuid...",
    "node_type": "executive",
    "title": "CEO",
    "position_x": 400,
    "position_y": 100,
    "is_published": false,
    "version": 1,
    ...
  }
}
```

### **4. Publish**
```json
{
  "success": true,
  "message": "Draft published to live successfully",
  "published": {
    "nodes": 2,
    "connections": 1
  }
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
await organigramTests.quickTest()
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

-- Setze Admin-Rolle (falls berechtigt)
UPDATE users SET role = 'ADMIN' WHERE id = auth.uid();
```

### **Problem: "Failed to fetch"**

**Mögliche Ursachen:**
1. Function nicht deployed
2. Falscher Function-Name
3. CORS-Problem

**Lösung:**
```javascript
// 1. Prüfe Function-URL
console.log('Testing URL:', 'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Organigram/health')

// 2. Direct fetch test
await fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Organigram/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 📊 **TABELLEN-STRUKTUR**

Die Function verwendet diese Tabellen:

### **org_nodes**
```sql
CREATE TABLE org_nodes (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  node_type TEXT REFERENCES node_types(name),
  title TEXT NOT NULL,
  description TEXT,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  width NUMERIC DEFAULT 280,
  height NUMERIC DEFAULT 180,
  metadata JSONB DEFAULT '{}',
  department_id UUID REFERENCES departments(id),
  is_published BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### **node_connections**
```sql
CREATE TABLE node_connections (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  source_node_id UUID REFERENCES org_nodes(id) ON DELETE CASCADE,
  source_position TEXT CHECK (source_position IN ('top', 'right', 'bottom', 'left')),
  target_node_id UUID REFERENCES org_nodes(id) ON DELETE CASCADE,
  target_position TEXT CHECK (target_position IN ('top', 'right', 'bottom', 'left')),
  line_style TEXT DEFAULT 'curved',
  color TEXT DEFAULT '#6B7280',
  stroke_width NUMERIC DEFAULT 2,
  label TEXT,
  metadata JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  CONSTRAINT unique_connection UNIQUE (source_node_id, source_position, target_node_id, target_position)
);
```

---

## 🎉 **DEPLOYMENT CHECKLIST**

- [ ] Code aus `/supabase/functions/BrowoKoordinator-Organigram/index.ts` kopiert
- [ ] In Supabase Dashboard eingefügt
- [ ] Mit `--no-verify-jwt` deployed
- [ ] Health Check erfolgreich (200 OK)
- [ ] Quick Test ausgeführt
- [ ] Alle Tests bestanden

---

## 📝 **VERSION HISTORY**

### **v1.0.0** (30. Jan 2025)
- ✅ Vollständige Implementation aller 12 Endpoints
- ✅ Draft/Live System
- ✅ Version Tracking
- ✅ Auto-save Funktionalität
- ✅ History & Restore
- ✅ Organization-based isolation
- ✅ Proper error handling
- ✅ Console test suite

---

## 🚀 **NEXT STEPS**

Nach erfolgreichem Deployment:

1. **Frontend Integration testen**
   - Canvas Organigram Screen öffnen
   - Nodes erstellen/bearbeiten
   - Connections zeichnen
   - Publish testen

2. **Weitere Edge Functions deployen**
   - BrowoKoordinator-Personalakte
   - BrowoKoordinator-Analytics
   - BrowoKoordinator-Tasks
   - BrowoKoordinator-Field

3. **Production Monitoring**
   - Health Checks einrichten
   - Error Logging überwachen
   - Performance Metriken tracken

---

**🎯 Bei Problemen:**
- Prüfe Supabase Function Logs
- Teste einzelne Endpoints via Console
- Checke RLS Policies auf org_nodes & node_connections
- Verifiziere organization_id beim User

**Happy Deploying! 🚀**
