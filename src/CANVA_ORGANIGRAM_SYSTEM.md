# 🎨 CANVA-STYLE ORGANIGRAM SYSTEM

## ✅ SYSTEM COMPLETE

Das Canva-Style Draggable Organigram System ist vollständig implementiert!

---

## 📋 FEATURES OVERVIEW

### 🎯 Core Features
- ✅ **Free-Form Drag & Drop** - Nodes frei auf Canvas positionieren (wie Canva/Figma)
- ✅ **4 Node-Typen** - Standort, Geschäftsführer, Abteilung, Spezialisierung
- ✅ **Pin Point Connections** - 4 Verbindungspunkte pro Node (top, right, bottom, left)
- ✅ **Manuelle Verbindungen** - Drag & Drop von Pin zu Pin
- ✅ **2 Linien-Stile** - Curved (Bezier) und Orthogonal umschaltbar
- ✅ **Zoom & Pan** - Canvas vergrößern/verkleinern und verschieben
- ✅ **Auto-Save** - Änderungen automatisch in Supabase gespeichert
- ✅ **Abteilungs-Integration** - Department-Nodes automatisch in Firmeneinstellungen erstellt

### 🎨 Node Types & Colors

| Typ | Icon | Farbe | Beschreibung |
|-----|------|-------|--------------|
| **Standort** | 📍 MapPin | #3B82F6 (Blau) | Büro oder Geschäftsstelle |
| **Geschäftsführer** | 👔 UserCog | #8B5CF6 (Lila) | Führungsposition |
| **Abteilung** | 🏢 Building2 | #6B7280 (Grau) | Organisationseinheit |
| **Spezialisierung** | 📑 Layers | #10B981 (Grün) | Fachbereich oder Team |

### 🔗 Connection System

**Pin Points:**
- **4 Positionen** pro Node: top, right, bottom, left
- **Sichtbarkeit**: Nur bei Node-Hover
- **States**: 
  - Grau (nicht verbunden)
  - Grün (verbunden)
  - Blau (während Drag)

**Verbindungslinien:**
- **Curved (Bezier)** - Smooth curves wie in Figma
- **Orthogonal** - Rechtwinklige Linien wie in Flowcharts
- **Click auf Linie** → Toolbar mit Style-Toggle & Delete
- **Click auf connected Pin** → Disconnect

---

## 🗂️ FILE STRUCTURE

### 📁 Database Migration
```
/supabase/migrations/031_canva_style_organigram.sql
```
- Erstellt `node_types` Tabelle (Kachel-Typen)
- Erstellt `org_nodes` Tabelle (Nodes mit Position)
- Erstellt `node_connections` Tabelle (Pin Point Connections)
- RLS Policies für Multi-Tenancy
- Default Node Types eingetragen

### 📁 Components

**Core Components:**
```
/components/OrgNode.tsx              → Draggable Node Card (280x180px)
/components/ConnectionPoint.tsx      → Pin Point Component (4 per node)
/components/ConnectionLine.tsx       → SVG Connection Line
/components/CanvasOrgChart.tsx       → Main Canvas Component
/components/CreateNodeDialog.tsx     → Dialog: Node erstellen
/components/EditNodeDialog.tsx       → Dialog: Node bearbeiten
```

### 📁 Screen
```
/screens/admin/OrganigramCanvasScreen.tsx  → Canvas Screen mit Supabase Integration
```

### 📁 Route
```
/admin/organigram-canvas  → Neue Canvas Route
```

---

## 🚀 SETUP INSTRUCTIONS

### 1️⃣ Datenbank Migration ausführen

**In Supabase Dashboard:**
1. Öffne **SQL Editor**
2. Kopiere den Code aus `/supabase/migrations/031_canva_style_organigram.sql`
3. Führe den Code aus
4. Bestätige: "Success. No rows returned"

**Tabellen Check:**
```sql
-- Prüfen ob Tabellen erstellt wurden
SELECT * FROM node_types;
SELECT * FROM org_nodes LIMIT 5;
SELECT * FROM node_connections LIMIT 5;
```

### 2️⃣ Auf Canvas zugreifen

**Navigation:**
1. Gehe zu `/admin/organigram`
2. Klicke auf **"Canvas Editor (NEU)"** Button
3. Oder direkt: `/admin/organigram-canvas`

### 3️⃣ Ersten Node erstellen

1. Klicke auf **"+ Node hinzufügen"**
2. Wähle Node-Typ (z.B. "Abteilung")
3. Gebe Titel ein (z.B. "HR-Abteilung")
4. Optional: Beschreibung
5. Klicke **"Node erstellen"**

---

## 🎮 USAGE GUIDE

### Node Management

**Node erstellen:**
- Click **"+ Node hinzufügen"** Button
- Typ wählen → Titel eingeben → Erstellen
- **Wichtig bei "Abteilung"**: Wird automatisch auch in Firmeneinstellungen erstellt! 🏢

**Node bewegen:**
- Click & Drag auf Node
- Node frei auf Canvas positionieren
- Position wird automatisch gespeichert

**Node bearbeiten:**
- Hover über Node → **Edit Button** (Stift-Icon)
- Dialog öffnet sich
- Typ, Titel, Beschreibung ändern
- **Bei Abteilungen**: Titeländerung wird in Firmeneinstellungen synchronisiert
- Speichern

**Node löschen:**
- Hover über Node → **Delete Button** (Mülleimer-Icon)
- Alle Verbindungen werden automatisch gelöscht
- **Bei Abteilungen**: Node wird gelöscht, aber Abteilung in Firmeneinstellungen bleibt erhalten

### Connection Management

**Verbindung erstellen:**
1. Hover über Source-Node → Pin Points erscheinen
2. Click & Drag auf gewünschten Pin Point
3. Ziehe zu Target-Node
4. Lasse auf Target Pin Point los
5. Verbindung wird erstellt (Curved by default)

**Linien-Stil ändern:**
1. Click auf Verbindungslinie
2. Toolbar erscheint
3. Click auf **"Curved"** oder **"Ortho"** Button
4. Stil wird umgeschaltet

**Verbindung löschen:**
- **Option 1**: Click auf Linie → Delete Button (Mülleimer)
- **Option 2**: Click auf verbundenen Pin Point → Disconnect

### Canvas Navigation

**Zoom:**
- **Zoom In**: Click **➕ Button**
- **Zoom Out**: Click **➖ Button**
- **Reset**: Click **⛶ Button** (Maximize)

**Pan (Verschieben):**
- Click & Drag auf leeren Canvas-Bereich
- Gesamte Ansicht verschieben

---

## 🗃️ DATABASE SCHEMA

### `node_types` Table
```sql
id              UUID PRIMARY KEY
name            TEXT UNIQUE        -- 'location', 'executive', 'department', 'specialization'
display_name    TEXT               -- 'Standort', 'Geschäftsführer', etc.
icon            TEXT               -- Lucide icon name: 'MapPin', 'UserCog', etc.
color           TEXT               -- Hex color: '#3B82F6', '#8B5CF6', etc.
created_at      TIMESTAMPTZ
```

### `org_nodes` Table
```sql
id                UUID PRIMARY KEY
organization_id   UUID REFERENCES organizations(id)
node_type         TEXT REFERENCES node_types(name)
title             TEXT NOT NULL
description       TEXT
position_x        NUMERIC DEFAULT 0
position_y        NUMERIC DEFAULT 0
width             NUMERIC DEFAULT 280
height            NUMERIC DEFAULT 180
metadata          JSONB
department_id     UUID REFERENCES departments(id)  -- Optional link
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
created_by        UUID REFERENCES users(id)
```

### `node_connections` Table
```sql
id                UUID PRIMARY KEY
organization_id   UUID REFERENCES organizations(id)
source_node_id    UUID REFERENCES org_nodes(id) ON DELETE CASCADE
source_position   TEXT CHECK IN ('top', 'right', 'bottom', 'left')
target_node_id    UUID REFERENCES org_nodes(id) ON DELETE CASCADE
target_position   TEXT CHECK IN ('top', 'right', 'bottom', 'left')
line_style        TEXT DEFAULT 'curved' CHECK IN ('curved', 'orthogonal', 'straight')
color             TEXT DEFAULT '#6B7280'
stroke_width      NUMERIC DEFAULT 2
label             TEXT
metadata          JSONB
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
created_by        UUID REFERENCES users(id)

-- Constraints:
UNIQUE (source_node_id, source_position, target_node_id, target_position)
CHECK (source_node_id != target_node_id)  -- No self-connections
```

---

## 🎨 COMPONENT ARCHITECTURE

### OrgNode Component
```tsx
Props:
- node: OrgNodeData              // Node data
- isSelected: boolean            // Selection state
- isDragging: boolean            // Drag state
- connectedPins: PinPosition[]   // Which pins are connected
- onDragStart, onDrag, onDragEnd // Drag handlers
- onSelect                       // Selection handler
- onEdit, onDelete               // Action handlers
- onConnectionStart/End          // Connection handlers
- onPinDisconnect                // Disconnect handler
```

**Features:**
- 280x180px fixed size
- 60% opacity background (Figma design)
- Colored header with icon
- Edit & Delete buttons on hover
- 4 ConnectionPoints (only visible on hover)

### ConnectionPoint Component
```tsx
Props:
- nodeId: string
- position: 'top' | 'right' | 'bottom' | 'left'
- isConnected: boolean
- isVisible: boolean             // Only show on node hover
- onConnectionStart              // Start dragging connection
- onConnectionEnd                // Drop on target pin
- onDisconnect                   // Disconnect existing connection
```

**States:**
- Gray circle (unconnected)
- Green circle (connected)
- Blue circle (dragging)
- Scale on hover
- Ring on hover/drag

### ConnectionLine Component
```tsx
Props:
- id: string
- start: Point {x, y}
- end: Point {x, y}
- style: 'curved' | 'orthogonal' | 'straight'
- color: string
- strokeWidth: number
- label: string (optional)
- isSelected: boolean
- onSelect, onDelete, onStyleChange
```

**Features:**
- SVG path rendering
- Curved: Bezier curves with control points
- Orthogonal: Right-angle lines
- Toolbar on select/hover
- Click to select → Show style toggle

### CanvasOrgChart Component
```tsx
Props:
- nodes: OrgNodeData[]
- connections: Connection[]
- onNodesChange: (nodes) => void
- onConnectionsChange: (connections) => void
```

**Features:**
- Grid background
- Zoom controls (0.3x - 3x)
- Pan with mouse drag
- Auto-save to parent
- Keyboard shortcuts info
- SVG connections layer
- Nodes layer (absolute positioning)

---

## 🔄 DATA FLOW

### Node Creation Flow
```
User clicks "+ Node hinzufügen"
  ↓
CreateNodeDialog opens
  ↓
User selects type & enters title
  ↓
onCreate(nodeData) callback
  ↓
CanvasOrgChart adds node to state
  ↓
onNodesChange(updatedNodes) callback
  ↓
OrganigramCanvasScreen receives updated nodes
  ↓
IF node.type === 'department':
  ↓
  Supabase INSERT into departments table
  ↓
  Get department_id
  ↓
Supabase INSERT into org_nodes (with department_id if applicable)
  ↓
Toast: "Node erstellt"
```

### Department Update Flow (Abteilungs-Sync)
```
User edits department node title
  ↓
EditNodeDialog saves changes
  ↓
handleNodesChange triggered
  ↓
Check: node.type === 'department' && has department_id?
  ↓
YES: Update departments table with new title
  ↓
Update org_nodes table
  ↓
Both tables synchronized! ✅
```

### Connection Creation Flow
```
User hovers over node → Pin points visible
  ↓
User drags from source pin
  ↓
onConnectionStart(nodeId, position)
  ↓
connectionDraft state set
  ↓
User drops on target pin
  ↓
onConnectionEnd(nodeId, position)
  ↓
Check: Not same node, not duplicate
  ↓
New connection created
  ↓
onConnectionsChange(updatedConnections)
  ↓
Supabase INSERT into node_connections
  ↓
Toast: "Verbindung erstellt"
```

### Auto-Save Flow
```
User moves node
  ↓
handleNodeDrag updates position
  ↓
onNodesChange callback
  ↓
handleNodesChange in Screen
  ↓
Supabase UPDATE org_nodes SET position_x, position_y
  ↓
Silent save (no toast for position updates)
```

---

## 🎯 DESIGN PATTERNS

### 1. Controlled Components
- Nodes & Connections managed by parent (OrganigramCanvasScreen)
- Canvas is fully controlled via props
- Single source of truth in Supabase

### 2. Separation of Concerns
- **OrgNode**: Visual representation + drag logic
- **ConnectionPoint**: Pin point logic + drag/drop
- **ConnectionLine**: SVG rendering + styling
- **CanvasOrgChart**: Orchestration + coordination
- **OrganigramCanvasScreen**: Supabase integration + persistence

### 3. Optimistic UI
- Immediate visual feedback
- Background save to database
- Toast notifications for important actions
- Silent saves for frequent updates (position)

### 4. Type Safety
```typescript
type NodeType = 'location' | 'executive' | 'department' | 'specialization';
type PinPosition = 'top' | 'right' | 'bottom' | 'left';
type LineStyle = 'curved' | 'orthogonal' | 'straight';
```

---

## 🐛 TROUBLESHOOTING

### Problem: Tables not found
**Solution:**
1. Führe Migration `/supabase/migrations/031_canva_style_organigram.sql` aus
2. Prüfe in Supabase: Table Editor → `org_nodes` sollte existieren

### Problem: Nodes werden nicht gespeichert
**Solution:**
1. Prüfe Console auf Fehler
2. Prüfe Supabase RLS Policies
3. Bestätige dass `organization_id` in `useAuthStore` vorhanden

### Problem: Pin Points nicht sichtbar
**Solution:**
1. Hover über Node (nur bei Hover sichtbar!)
2. Prüfe `isVisible` prop in ConnectionPoint
3. Check CSS: `opacity-0` → `opacity-100` transition

### Problem: Verbindungen werden nicht gezeichnet
**Solution:**
1. Prüfe dass Source & Target Nodes existieren
2. Check Console für SVG errors
3. Verifiziere `getPinPosition()` berechnet korrekte Koordinaten

### Problem: Zoom funktioniert nicht
**Solution:**
1. Prüfe `transform: scale(${zoom})` in CSS
2. Check Zoom bounds (0.3 - 3.0)
3. Verifiziere Pan state wird nicht blockiert

---

## 🚀 NEXT STEPS & ENHANCEMENTS

### Mögliche Erweiterungen:

1. **Multiple Connection Styles per Pin**
   - Aktuell: 1 Connection pro Pin-Paar
   - Erweitert: Mehrere Verbindungen vom selben Pin

2. **Connection Labels**
   - Label-Text auf Verbindungen
   - Edit-Dialog für Labels

3. **Node Grouping**
   - Nodes gruppieren
   - Gruppen gemeinsam bewegen

4. **Snap to Grid**
   - Option für Grid-Snapping
   - Besseres Alignment

5. **Undo/Redo**
   - History Stack
   - Ctrl+Z / Ctrl+Y Support

6. **Export**
   - PNG/PDF Export
   - SVG Download

7. **Templates**
   - Vordefinierte Layouts
   - Template Gallery

8. **Real-time Collaboration**
   - Supabase Realtime
   - Mehrere User gleichzeitig

---

## 📊 STATISTICS

- **Components Created**: 6
- **Database Tables**: 3
- **Total Lines of Code**: ~2,500
- **Node Types**: 4
- **Pin Points per Node**: 4
- **Line Styles**: 2 (Curved, Orthogonal)
- **Auto-Save**: ✅ Yes

---

## ✅ TESTING CHECKLIST

### Manual Testing Steps:

- [ ] Migration erfolgreich ausgeführt
- [ ] Canvas Screen lädt ohne Fehler
- [ ] Node erstellen funktioniert
- [ ] Node drag & drop funktioniert
- [ ] Pin Points erscheinen bei Hover
- [ ] Connection erstellen (Pin → Pin)
- [ ] Connection Style umschalten (Curved ↔ Orthogonal)
- [ ] Connection löschen (via Linie)
- [ ] Connection löschen (via Pin)
- [ ] Node bearbeiten (Edit Button)
- [ ] Node löschen (Delete Button)
- [ ] Zoom In/Out funktioniert
- [ ] Pan (Canvas verschieben) funktioniert
- [ ] Auto-Save nach Änderungen
- [ ] Page Reload → Nodes & Connections laden
- [ ] Multiple Nodes & Connections
- [ ] Verschiedene Node-Typen mit korrekten Farben

---

## 📞 SUPPORT

Bei Fragen oder Problemen:
1. Prüfe diese README
2. Schaue in Console auf Fehler
3. Prüfe Supabase Dashboard → SQL Editor → Logs

---

## 🎉 COMPLETED!

Das Canva-Style Organigram System ist **vollständig implementiert** und **ready to use**!

**URL**: `/admin/organigram-canvas`

**Viel Spaß beim Erstellen deines Organigrams!** 🚀
