# 🎯 PHASE 2 - PRIORITY 1: OrganigramCanvasScreenV2 Refactoring

**File:** `/screens/admin/OrganigramCanvasScreenV2.tsx`  
**Current Size:** 812 lines  
**Target:** < 300 lines  
**Aufwand:** 20 Stunden  
**Status:** 📋 PLANNING

---

## 📊 **CURRENT STRUCTURE ANALYSIS**

### File Breakdown (812 lines):

| Section | Lines | Percentage | Complexity |
|---------|-------|------------|------------|
| **Imports & Types** | 1-36 | 4% | Low |
| **State Management** | 42-59 | 2% | Medium |
| **Migration Check** | 62-89 | 3% | Low |
| **Load Data** | 95-200 | 13% | **HIGH** |
| **History (Undo/Redo)** | 203-267 | 8% | **HIGH** |
| **handleNodesChange** | 270-349 | 10% | **HIGH** |
| **handleConnectionsChange** | 352-423 | 9% | **HIGH** |
| **publishChanges** | 426-616 | 23% | **CRITICAL** |
| **toggleEditMode** | 619-626 | 1% | Low |
| **Loading UI** | 629-637 | 1% | Low |
| **Error UI** | 640-669 | 4% | Low |
| **Main UI (Toolbar)** | 672-797 | 15% | Medium |
| **Canvas Rendering** | 800-812 | 2% | Low |

**CRITICAL SECTIONS (High Complexity):**
1. ❌ **publishChanges** (190 lines) - MASSIV, muss extrahiert werden
2. ❌ **Load Data** (105 lines) - Zu groß, muss in Hook
3. ❌ **handleNodesChange** (79 lines) - Auto-Save-Logik muss extrahiert werden
4. ❌ **handleConnectionsChange** (71 lines) - Auto-Save-Logik muss extrahiert werden
5. ❌ **Undo/Redo Logic** (64 lines) - Sollte ein eigener Hook sein

---

## 🎯 **REFACTORING STRATEGY**

### Phase 1: Extract Custom Hooks (3 neue Hooks)

#### **1. `useOrganigramData.ts`** ✅
**Verantwortlich für:**
- Data Loading (nodes + connections)
- Migration Checks
- Table Existence Checks
- Published vs Draft splitting
- Unsaved Changes Detection

**Extracted Functions:**
- `checkMigrations()`
- `loadData()`
- `checkForUnsavedChanges()`

**Returns:**
```typescript
{
  // Data
  nodes, setNodes,
  connections, setConnections,
  publishedNodes, setPublishedNodes,
  publishedConnections, setPublishedConnections,
  
  // Status
  loading,
  tableExists,
  missingColumns,
  hasUnsavedChanges,
  
  // Methods
  loadData,
  setHasUnsavedChanges,
}
```

---

#### **2. `useOrganigramHistory.ts`** ✅
**Verantwortlich für:**
- Undo/Redo History Management
- Keyboard Shortcuts (Cmd+Z, Cmd+Shift+Z)
- History State Updates

**Extracted Functions:**
- `addToHistory()`
- `undo()`
- `redo()`
- Keyboard event handler

**Returns:**
```typescript
{
  // State
  history,
  historyIndex,
  
  // Methods
  addToHistory,
  undo,
  redo,
  
  // Computed
  canUndo: historyIndex > 0,
  canRedo: historyIndex < history.length - 1,
}
```

---

#### **3. `useOrganigramAutoSave.ts`** ✅
**Verantwortlich für:**
- Auto-Save Draft Nodes to DB
- Auto-Save Draft Connections to DB
- UPSERT Logic
- Delete removed items

**Extracted Functions:**
- `autoSaveNodes()`
- `autoSaveConnections()`

**Returns:**
```typescript
{
  autoSaveNodes: (nodes: OrgNodeData[]) => Promise<void>,
  autoSaveConnections: (connections: Connection[]) => Promise<void>,
}
```

---

### Phase 2: Extract UI Components (4 neue Components)

#### **4. `OrganigramToolbar.tsx`** ✅
**Verantwortlich für:**
- Edit Mode Toggle
- Add Node Button
- Canvas Controls Help (Popover)
- Undo/Redo Buttons
- Push Live Button
- Unsaved Changes Indicator

**Props:**
```typescript
{
  isEditMode: boolean,
  onToggleEditMode: () => void,
  canUndo: boolean,
  canRedo: boolean,
  onUndo: () => void,
  onRedo: () => void,
  hasUnsavedChanges: boolean,
  isPublishing: boolean,
  onPublish: () => void,
  onAddNode: () => void,
}
```

---

#### **5. `OrganigramErrorAlerts.tsx`** ✅
**Verantwortlich für:**
- Loading State
- Table Missing Alert
- Missing Columns Alert

**Props:**
```typescript
{
  loading: boolean,
  tableExists: boolean,
  missingColumns: string[],
}
```

---

#### **6. `useOrganigramPublish.ts`** ✅ (Hook, nicht Component)
**Verantwortlich für:**
- Publish Changes Logic (Push Live)
- ID Mapping (draft → published)
- Batch UPSERT/INSERT Operations
- Toast Notifications

**Extracted Functions:**
- `publishChanges()` - gesamte 190-Zeilen-Funktion!

**Returns:**
```typescript
{
  publishChanges: () => Promise<void>,
  isPublishing: boolean,
  nodeIdMapping: Record<string, string>,
}
```

---

#### **7. Main Screen** (`OrganigramCanvasScreenV2.tsx`) ✅
**Final Size:** < 200 lines  
**Verantwortlich für:**
- Orchestrierung aller Hooks
- Layout & Canvas Rendering
- Handler-Delegation

**Structure:**
```typescript
function OrganigramCanvasScreenV2() {
  // ✅ Use Custom Hooks
  const data = useOrganigramData();
  const history = useOrganigramHistory(data.nodes, data.connections);
  const autoSave = useOrganigramAutoSave();
  const publish = useOrganigramPublish(data);
  
  // ✅ Minimal State
  const [isEditMode, setIsEditMode] = useState(false);
  
  // ✅ Simple Handlers
  const handleNodesChange = (nodes) => {
    data.setNodes(nodes);
    history.addToHistory(nodes, data.connections);
    data.setHasUnsavedChanges(true);
    if (isEditMode) autoSave.autoSaveNodes(nodes);
  };
  
  // ✅ Render
  return (
    <div>
      <OrganigramErrorAlerts {...data} />
      <OrganigramToolbar {...props} />
      <CanvasOrgChart {...canvasProps} />
    </div>
  );
}
```

---

## 📁 **NEW FILE STRUCTURE**

```
/hooks/
├── HRTHIS_useOrganigramData.ts          ← NEW (Data Loading)
├── HRTHIS_useOrganigramHistory.ts       ← NEW (Undo/Redo)
├── HRTHIS_useOrganigramAutoSave.ts      ← NEW (Auto-Save)
└── HRTHIS_useOrganigramPublish.ts       ← NEW (Publish Logic)

/components/organigram/                   ← NEW FOLDER
├── HRTHIS_OrganigramToolbar.tsx         ← NEW (UI)
└── HRTHIS_OrganigramErrorAlerts.tsx     ← NEW (UI)

/screens/admin/
└── OrganigramCanvasScreenV2.tsx         ← REFACTORED (< 200 lines)
```

---

## ✅ **SUCCESS CRITERIA**

- [x] Main Screen < 300 lines (Target: ~200 lines)
- [x] Each Hook < 150 lines
- [x] Each Component < 100 lines
- [x] All functionality preserved
- [x] No performance regression
- [x] All features tested

---

## 📊 **EXPECTED RESULTS**

### Before:
```
OrganigramCanvasScreenV2.tsx: 812 lines (CRITICAL)
```

### After:
```
OrganigramCanvasScreenV2.tsx:        ~180 lines ✅
HRTHIS_useOrganigramData.ts:         ~120 lines ✅
HRTHIS_useOrganigramHistory.ts:       ~80 lines ✅
HRTHIS_useOrganigramAutoSave.ts:     ~100 lines ✅
HRTHIS_useOrganigramPublish.ts:      ~150 lines ✅
HRTHIS_OrganigramToolbar.tsx:         ~90 lines ✅
HRTHIS_OrganigramErrorAlerts.tsx:     ~50 lines ✅
---
TOTAL: ~770 lines (distributed across 7 files)
```

**Benefits:**
- ✅ Main Screen: 812 → 180 lines (-78%)
- ✅ Each file < 150 lines (maintainable)
- ✅ Clear separation of concerns
- ✅ Reusable hooks
- ✅ Easier testing
- ✅ Better readability

---

## 🚀 **EXECUTION PLAN**

### Step 1: Create Hooks (Bottom-Up)
1. ✅ `HRTHIS_useOrganigramData.ts`
2. ✅ `HRTHIS_useOrganigramHistory.ts`
3. ✅ `HRTHIS_useOrganigramAutoSave.ts`
4. ✅ `HRTHIS_useOrganigramPublish.ts`

### Step 2: Create Components
5. ✅ `/components/organigram/` folder
6. ✅ `HRTHIS_OrganigramToolbar.tsx`
7. ✅ `HRTHIS_OrganigramErrorAlerts.tsx`

### Step 3: Refactor Main Screen
8. ✅ Integrate all hooks
9. ✅ Replace inline code with hook calls
10. ✅ Test all features
11. ✅ Verify Undo/Redo works
12. ✅ Verify Publish works
13. ✅ Verify Auto-Save works

### Step 4: Cleanup & Test
14. ✅ Remove old code
15. ✅ Test in production build
16. ✅ Verify performance
17. ✅ Update documentation

---

## ⏱️ **TIME ESTIMATE**

| Task | Time | Status |
|------|------|--------|
| Create useOrganigramData | 3h | ⏳ TODO |
| Create useOrganigramHistory | 2h | ⏳ TODO |
| Create useOrganigramAutoSave | 2h | ⏳ TODO |
| Create useOrganigramPublish | 4h | ⏳ TODO |
| Create Toolbar Component | 2h | ⏳ TODO |
| Create ErrorAlerts Component | 1h | ⏳ TODO |
| Refactor Main Screen | 3h | ⏳ TODO |
| Testing & Bug Fixes | 3h | ⏳ TODO |
| **TOTAL** | **20h** | |

---

## 📋 **NEXT STEPS**

**Ready to start?** Begin with Step 1: Create `HRTHIS_useOrganigramData.ts`

---

**Created:** 2025-01-10  
**Phase:** Phase 2 - Priority 1  
**Status:** Planning Complete ✅
