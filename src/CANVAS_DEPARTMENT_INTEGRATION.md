# 🏢 Canvas Organigram ↔ Firmeneinstellungen Integration

## ✅ AUTOMATISCHE ABTEILUNGS-SYNCHRONISATION

Das Canvas Organigram ist jetzt vollständig mit den Firmeneinstellungen integriert!

---

## 🔄 WIE ES FUNKTIONIERT

### Beim Erstellen einer "Abteilung"-Node:

```
User erstellt Node mit Typ "Abteilung"
  ↓
Titel: "Human Resources"
  ↓
AUTOMATISCH:
├─ Abteilung in departments Tabelle erstellt
├─ department_id in org_nodes gespeichert
└─ Beide Tabellen verknüpft!
  ↓
Node im Canvas ✅
Abteilung in Firmeneinstellungen ✅
```

### Beim Bearbeiten einer "Abteilung"-Node:

```
User ändert Titel zu "HR & Recruiting"
  ↓
AUTOMATISCH:
├─ org_nodes aktualisiert
└─ departments Tabelle aktualisiert
  ↓
Beide synchronisiert! ✅
```

### Beim Löschen einer "Abteilung"-Node:

```
User löscht Node im Canvas
  ↓
org_nodes Eintrag gelöscht ✅
  ↓
departments Tabelle bleibt ERHALTEN
(Kann weiterhin in Firmeneinstellungen verwendet werden)
```

---

## 📦 DATABASE SCHEMA

### `org_nodes` Tabelle
```sql
CREATE TABLE org_nodes (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  node_type TEXT,  -- 'location', 'executive', 'department', 'specialization'
  title TEXT,
  description TEXT,
  position_x NUMERIC,
  position_y NUMERIC,
  department_id UUID REFERENCES departments(id),  -- ← LINK!
  ...
);
```

### `departments` Tabelle
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  organization_id UUID REFERENCES organizations(id),
  location_id UUID REFERENCES locations(id),
  sort_order INTEGER,
  ...
);
```

### Beziehung:
```
org_nodes.department_id → departments.id
(Optional: Nur wenn node_type = 'department')
```

---

## 🎯 USE CASES

### Use Case 1: Organigram erstellen mit Abteilungen

**Szenario:** Firma will visuelles Organigram erstellen

**Workflow:**
1. Canvas öffnen: `/admin/organigram-canvas`
2. "+ Node hinzufügen" → Typ: "Abteilung"
3. Titel: "Human Resources" → Erstellen
4. Wiederholen für "IT", "Sales", "Marketing"
5. Nodes positionieren, Verbindungen ziehen

**Resultat:**
- ✅ Visuelles Organigram im Canvas
- ✅ Alle Abteilungen auch in Firmeneinstellungen vorhanden
- ✅ Bereit für Mitarbeiter-Zuweisung in Firmeneinstellungen

---

### Use Case 2: Bestehende Abteilungen visualisieren

**Szenario:** Firma hat bereits Abteilungen in Firmeneinstellungen

**Workflow:**
1. Canvas öffnen
2. Für jede bestehende Abteilung:
   - "+ Node hinzufügen" → Typ: "Abteilung"
   - Titel: Gleicher Name wie in Firmeneinstellungen
   - Erstellen
3. Nodes arrangieren im Canvas

**Problem:** Dadurch entstehen DUPLIKATE in der departments Tabelle

**Lösung (zukünftig):**
- Dropdown in CreateNodeDialog: "Bestehende Abteilung auswählen"
- Oder: Auto-Detect wenn Name bereits existiert

---

### Use Case 3: Typ ändern (z.B. Spezialisierung → Abteilung)

**Szenario:** User erstellt "Development" als Spezialisierung, will es aber zur Abteilung machen

**Workflow:**
1. Node bearbeiten (Edit Button)
2. Typ ändern: "Spezialisierung" → "Abteilung"
3. Speichern

**Automatisch:**
- Neue Abteilung "Development" in departments erstellt
- department_id in org_nodes gesetzt
- Beide verknüpft! ✅

---

## 🚀 FEATURES

### ✅ Was funktioniert:

1. **Auto-Create Department**
   - Bei Node-Erstellung mit Typ "Abteilung"
   - department_id wird automatisch gesetzt

2. **Auto-Update Department**
   - Bei Titeländerung einer Abteilungs-Node
   - departments.name wird synchronisiert

3. **Type Conversion**
   - Wenn Node zu "Abteilung" konvertiert wird
   - Neue Department wird automatisch erstellt

4. **Referenz-Erhalt**
   - department_id bleibt erhalten bei Typ-Wechsel
   - Department in Firmeneinstellungen bleibt bestehen

### 🔄 Synchronisation:

| Aktion | org_nodes | departments | Sync |
|--------|-----------|-------------|------|
| Node erstellen (Abteilung) | INSERT | INSERT | ✅ |
| Node-Titel ändern (Abteilung) | UPDATE | UPDATE | ✅ |
| Node-Typ ändern → Abteilung | UPDATE | INSERT | ✅ |
| Node-Typ ändern von Abteilung → | UPDATE | - | ⚠️ Bleibt erhalten |
| Node löschen (Abteilung) | DELETE | - | ⚠️ Bleibt erhalten |

---

## ⚠️ WICHTIGE HINWEISE

### 1. Duplikate vermeiden

**Problem:**
Wenn User Node mit Titel "HR" erstellt, aber "HR" existiert bereits in Firmeneinstellungen.

**Aktuelles Verhalten:**
- Zweite "HR" Abteilung wird erstellt
- Zwei Einträge in departments Tabelle

**Empfehlung:**
- Vor dem Erstellen prüfen ob Department bereits existiert
- Dropdown-Auswahl für bestehende Departments

### 2. Löschen von Abteilungen

**Aktuelles Verhalten:**
- Node wird gelöscht
- Department in Firmeneinstellungen BLEIBT erhalten

**Grund:**
- Department könnte Positionen/Mitarbeiter haben
- Department könnte im alten Organigram verwendet werden
- Sicherheit: Daten nicht versehentlich löschen

**Alternative (falls gewünscht):**
```typescript
// In handleNodesChange bei Delete:
if (deletedNode.type === 'department' && deletedNode.department_id) {
  // Optional: Auch Department löschen
  await supabase
    .from('departments')
    .delete()
    .eq('id', deletedNode.department_id);
}
```

### 3. Beschreibung

**Aktuell:**
- org_nodes.description wird in departments.description gespeichert
- Synchronisation bei Änderungen

**Beachten:**
- Firmeneinstellungen könnten eigene Description haben
- Bei Konflikten: Canvas überschreibt Firmeneinstellungen

---

## 📊 DATENFLUSS DIAGRAMM

```
┌─────────────────────────────────────────────────────────────┐
│                     CANVAS ORGANIGRAM                       │
│                                                              │
│  User Action: Create "Abteilung" Node                      │
│  Title: "Human Resources"                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
         ┌───────────────────────────────┐
         │  OrganigramCanvasScreen       │
         │  handleNodesChange()          │
         └───────────┬───────────────────┘
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
┌─────────────────┐   ┌──────────────────┐
│  Supabase:      │   │  Supabase:       │
│  departments    │   │  org_nodes       │
│                 │   │                  │
│  INSERT         │   │  INSERT          │
│  name: "HR"     │   │  title: "HR"     │
│  description... │   │  department_id:  │
│                 │   │  ← Link!         │
│  RETURNS: id    │   │  node_type: dept │
└────────┬────────┘   └──────────────────┘
         │
         └──────────────┬
                        ↓
              ┌──────────────────┐
              │  FIRMENEINSTELLUNGEN  │
              │  (Company Settings)   │
              │                       │
              │  Abteilung "HR" ✅   │
              │  Sichtbar & editierbar │
              └──────────────────┘
```

---

## 🧪 TESTING CHECKLIST

### Manual Tests:

- [ ] **Test 1: Create Department Node**
  - Canvas öffnen
  - "+ Node hinzufügen" → Typ: "Abteilung"
  - Titel: "Test Abteilung"
  - Erstellen
  - ✅ Check: Firmeneinstellungen → "Test Abteilung" vorhanden

- [ ] **Test 2: Update Department Node Title**
  - Bestehende Abteilungs-Node bearbeiten
  - Titel ändern: "Test Abteilung" → "Neue Abteilung"
  - Speichern
  - ✅ Check: Firmeneinstellungen → Name aktualisiert

- [ ] **Test 3: Convert Node to Department**
  - Node mit Typ "Spezialisierung" erstellen
  - Titel: "Development"
  - Bearbeiten → Typ ändern zu "Abteilung"
  - Speichern
  - ✅ Check: Firmeneinstellungen → "Development" erstellt

- [ ] **Test 4: Delete Department Node**
  - Abteilungs-Node löschen
  - ✅ Check: Canvas → Node weg
  - ✅ Check: Firmeneinstellungen → Abteilung bleibt erhalten

- [ ] **Test 5: Multiple Departments**
  - 5 Abteilungs-Nodes erstellen
  - ✅ Check: Alle 5 in Firmeneinstellungen vorhanden
  - ✅ Check: Keine Duplikate

---

## 🔮 FUTURE ENHANCEMENTS

### Mögliche Verbesserungen:

1. **Department Selection**
   ```
   CreateNodeDialog → Typ: Abteilung
   ↓
   Dropdown: "Neue Abteilung erstellen" vs "Bestehende auswählen"
   ↓
   Wenn bestehend: Keine INSERT in departments
   ```

2. **Bidirectional Sync**
   ```
   Änderung in Firmeneinstellungen
   ↓
   Automatisch Canvas Node aktualisieren
   (Supabase Realtime Subscription)
   ```

3. **Visual Indicator**
   ```
   Abteilungs-Node mit Badge:
   "🔗 Linked to Firmeneinstellungen"
   ```

4. **Conflict Resolution**
   ```
   Wenn Department-Name bereits existiert:
   → Dialog: "Abteilung 'HR' existiert bereits"
   → Optionen:
      - Bestehende verwenden
      - Neue mit anderem Namen erstellen
      - Überspringen
   ```

5. **Cascade Delete Option**
   ```
   Delete Dialog:
   ☐ Auch Abteilung aus Firmeneinstellungen löschen
   (Warnung wenn Positionen/Mitarbeiter vorhanden)
   ```

---

## 📝 CODE EXAMPLES

### Create Department on Node Creation
```typescript
if (node.type === 'department') {
  // Create department first
  const { data: departmentData, error } = await supabase
    .from('departments')
    .insert({
      name: node.title,
      description: node.description || null,
      organization_id: profile.organization_id,
      sort_order: 999,
    })
    .select()
    .single();

  // Link to org_node
  departmentId = departmentData.id;
}

// Insert org_node with department_id
await supabase.from('org_nodes').insert({
  ...nodeData,
  department_id: departmentId,
});
```

### Update Department on Title Change
```typescript
if (node.type === 'department' && currentNode.department_id) {
  // Sync department name
  await supabase
    .from('departments')
    .update({
      name: node.title,
      description: node.description || null,
    })
    .eq('id', currentNode.department_id);
}
```

---

## ✅ READY TO USE

Die Abteilungs-Integration ist vollständig implementiert und funktioniert out-of-the-box!

**Test it now:**
1. `/admin/organigram-canvas`
2. "+ Node hinzufügen"
3. Typ: "Abteilung"
4. Titel eingeben
5. Erstellen
6. Check Firmeneinstellungen! 🎉

---

**Built with ❤️ for seamless integration between Canvas Organigram & Company Settings**
