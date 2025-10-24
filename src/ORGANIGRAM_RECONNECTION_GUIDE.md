# Canvas Organigram: Reconnection & Multi-Node Guide

## 🎯 Neue Features

### 1. **Connection Reconnection** (Verbindungen neu verbinden)

Du kannst jetzt Verbindungen von einem Pin Point zu einem anderen verschieben, indem du einfach am Verbindungspunkt "packst" und zu einem neuen Ziel ziehst.

#### So funktioniert's:

1. **Hover** über einen Node - die Pin Points (oben, rechts, unten, links) werden sichtbar
2. **Klicke und halte** einen Pin Point, der bereits eine Verbindung hat (grün markiert)
3. Die **alte Verbindung wird automatisch entfernt**, sobald du anfängst zu ziehen
4. **Ziehe** den Pin Point zu einem neuen Ziel-Pin Point auf einem anderen Node
5. **Lasse los** - eine neue Verbindung wird erstellt!

#### Technische Details:

```typescript
// Beim Start eines Connection-Drags von einem verbundenen Pin:
const handleConnectionStart = (nodeId: string, position: PinPosition) => {
  // Prüfe ob dieser Pin bereits Verbindungen hat
  const existingConnections = connections.filter(
    (conn) =>
      (conn.sourceNodeId === nodeId && conn.sourcePosition === position) ||
      (conn.targetNodeId === nodeId && conn.targetPosition === position)
  );
  
  if (existingConnections.length > 0) {
    // Entferne alte Verbindungen sofort (Reconnection Mode)
    const updatedConnections = connections.filter(/* ... */);
    onConnectionsChange(updatedConnections);
  }
  
  // Starte neue Verbindung
  setConnectionDraft({ sourceNodeId: nodeId, sourcePosition: position });
};
```

#### Pin Point States:

- **Grau (unverbunden)**: Kein Connection - Drag erstellt neue Verbindung
- **Grün (verbunden)**: Hat Connection(s) - Drag entfernt alte und erstellt neue
- **Blau (dragging)**: Aktiver Drag-Vorgang

---

### 2. **Multiple Nodes des gleichen Typs** (Mehrfach-Erstellung)

Du kannst jetzt beliebig viele Nodes des gleichen Typs erstellen:

- ✅ **Mehrere Standorte** (Location Nodes)
- ✅ **Mehrere Geschäftsführer** (Executive Nodes)
- ✅ **Mehrere Abteilungen** (Department Nodes)
- ✅ **Mehrere Spezialisierungen** (Specialization Nodes)

#### Wie es funktioniert:

Jeder neue Node bekommt eine **eindeutige temporäre ID** beim Erstellen:

```typescript
const newNode: OrgNodeData = {
  id: `node-${Date.now()}`, // Temporäre ID: z.B. "node-1733507890123"
  type: data.type,
  title: data.title,
  // ...
};
```

Beim Speichern in Supabase:
1. Node wird in DB eingefügt
2. Postgres generiert **echte UUID** (z.B. `"a3f4b2c1-..."`)
3. Temporäre ID wird durch echte UUID ersetzt
4. **Alle Connections werden automatisch aktualisiert** mit neuer UUID

#### Node-ID Mapping System:

```typescript
// Tracking von ID-Änderungen
const [nodeIdMapping, setNodeIdMapping] = useState<Record<string, string>>({});

// Nach DB-Insert:
setNodeIdMapping(prev => ({ 
  ...prev, 
  'node-1733507890123': 'a3f4b2c1-abcd-4567-...' 
}));

// useEffect aktualisiert Connections automatisch:
useEffect(() => {
  setConnections(prevConnections => 
    prevConnections.map(conn => {
      if (nodeIdMapping[conn.sourceNodeId]) {
        return { ...conn, sourceNodeId: nodeIdMapping[conn.sourceNodeId] };
      }
      return conn;
    })
  );
}, [nodeIdMapping]);
```

---

## 🔧 Technische Implementierung

### Connection-Validierung beim Speichern

Connections werden nur gespeichert, wenn **beide Nodes echte UUIDs haben**:

```typescript
const validConnections = newConnections.filter((conn) => {
  const sourceIsValid = !conn.sourceNodeId.startsWith('node-');
  const targetIsValid = !conn.targetNodeId.startsWith('node-');
  
  if (!sourceIsValid || !targetIsValid) {
    console.warn('⚠️ Skipping connection with temporary node ID');
  }
  
  return sourceIsValid && targetIsValid;
});
```

Temporäre Connections (mit `node-*` IDs) werden **nicht in die DB geschrieben**, bis die Nodes ihre echten UUIDs haben.

---

## 🎨 User Experience

### Reconnection-Flow:

1. User sieht einen **grünen Pin Point** (= verbunden)
2. User **klickt und hält** den Pin Point
3. **Visuelles Feedback**: Alte Verbindung verschwindet sofort
4. User **zieht** zu neuem Ziel-Pin
5. **Neue Verbindung** wird beim Loslassen erstellt
6. **Auto-Save** zu Supabase

### Multi-Node-Flow:

1. User klickt **"Node hinzufügen"**
2. Wählt Typ (z.B. **Standort**)
3. Gibt Titel ein (z.B. "Berlin Mitte")
4. Klickt **"Erstellen"**
5. Node erscheint auf Canvas mit temporärer ID
6. User kann **sofort weitere Standorte** erstellen
7. Beim Speichern werden alle IDs zu echten UUIDs konvertiert

---

## 📊 Datenfluss-Diagramm

```
USER ACTION                 FRONTEND STATE              DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Create Node "HR"
   → newNode: {
       id: "node-123",      ──────┐
       title: "HR"                │
     }                            │
                                  │
2. Create Node "IT"              │
   → newNode: {                  │
       id: "node-456",      ──────┤
       title: "IT"                │
     }                            │
                                  │
3. Connect HR → IT               │
   → connection: {               │
       source: "node-123", ◄──────┘
       target: "node-456"  ◄──────┐
     }                            │
                                  │
4. Save to DB                    │
   ──────────────────────────────▶ INSERT node "HR"
                                    ← returns UUID: "abc-def"
                                    
   ──────────────────────────────▶ INSERT node "IT"
                                    ← returns UUID: "ghi-jkl"
   
5. Update IDs                    │
   nodeIdMapping: {              │
     "node-123": "abc-def", ◄─────┘
     "node-456": "ghi-jkl"  ◄─────┐
   }                              │
                                  │
6. Update Connection             │
   connection: {                 │
     source: "abc-def",    ◄──────┘
     target: "ghi-jkl"     ◄──────┐
   }                              │
                                  │
7. Save Connection               │
   ──────────────────────────────▶ INSERT connection
                                    ← Success!
```

---

## 🐛 Troubleshooting

### Problem: "Verbindung wird nicht gespeichert"

**Ursache**: Connection referenziert noch temporäre Node-ID

**Lösung**: 
```javascript
// Check in Browser Console:
console.log('Connections:', connections);

// Look for connections with IDs starting with "node-"
// These will be filtered out during save

// Fix: Wait for nodes to be saved first, then connections auto-update
```

### Problem: "Node wird überschrieben beim Erstellen"

**Ursache**: Alte Version - Nodes hatten gleiche IDs

**Lösung**: ✅ **Bereits gefixt!** Jeder Node bekommt jetzt `Date.now()` ID

### Problem: "Verbindung zeigt auf falschen Node"

**Ursache**: Node-ID Mapping nicht angewendet

**Lösung**: `useEffect` Hook aktualisiert automatisch - prüfe Console-Logs:
```
🔄 Updating connections with new node IDs: { "node-123": "abc-def" }
```

---

## 🎓 Best Practices

### 1. **Warte mit Connections bis Nodes gespeichert sind**

Wenn du mehrere Nodes gleichzeitig erstellst:
1. Erstelle alle Nodes
2. **Warte 1-2 Sekunden** (Auto-Save)
3. Dann erstelle Connections

### 2. **Reconnection statt Delete**

Anstatt:
- ❌ Verbindung löschen → Neue Verbindung erstellen

Mache:
- ✅ Verbindung direkt **umhängen** (Reconnect)

### 3. **Eindeutige Node-Titel**

Gib jedem Node einen eindeutigen Titel:
- ✅ "Standort Berlin"
- ✅ "Standort München"
- ❌ "Standort" (mehrfach)

---

## 🚀 Performance

### Connection Update Batching

Alle Connection-Updates durch ID-Mapping passieren in einem **einzigen Render**:

```typescript
useEffect(() => {
  // Batch-Update alle Connections auf einmal
  setConnections(prevConnections => 
    prevConnections.map(conn => /* update */)
  );
  
  // Clear mapping → prevents infinite loops
  setNodeIdMapping({});
}, [nodeIdMapping]);
```

### Debounced Auto-Save

- ⏱️ Auto-Save triggert **500ms nach letzter Änderung**
- 💾 Verhindert zu viele DB-Writes
- ✅ Speichert nur **geänderte Nodes**

---

## ✅ Testing Checklist

- [ ] Erstelle 2+ Standort-Nodes → Prüfe: Beide bleiben erhalten
- [ ] Erstelle 3+ Abteilungs-Nodes → Prüfe: Alle eindeutig
- [ ] Verbinde 2 Nodes → Prüfe: Connection wird gespeichert
- [ ] **Reconnect** eine Verbindung → Prüfe: Alte weg, neue da
- [ ] Reconnect mehrfach → Prüfe: Kein Speicherfehler
- [ ] Erstelle Node → Sofort verbinden → Prüfe: Funktioniert nach Auto-Save

---

**Version:** 2.0.0  
**Datum:** 2025-10-06  
**Features:** ✅ Reconnection | ✅ Multi-Node Support | ✅ Auto-ID-Mapping
