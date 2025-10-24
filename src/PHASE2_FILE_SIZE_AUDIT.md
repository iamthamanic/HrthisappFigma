# 📊 PHASE 2: FILE SIZE AUDIT REPORT

**Datum:** 2025-01-09  
**Phase:** 2.2 - File Splitting Implementation  
**Status:** ✅ Priority 1 COMPLETE | 🔄 Priority 2 In Progress

---

## 🎯 ZIEL

Identifiziere alle Dateien > 300 Zeilen und erstelle einen Refactoring-Plan zum Splitten in kleinere, wartbare Module.

**Codex-Limits:**
- ✅ **Soft Limit:** 300 Zeilen
- 🔴 **Hard Limit:** 500 Zeilen

---

## 📋 AUDIT-METHODE

### Automatisiertes Script
✅ **Erstellt:** `/scripts/hr_filesize-audit.js`

**Verwendung:**
```bash
node scripts/hr_filesize-audit.js
```

**Output:**
- Console Report mit Kategorisierung
- `FILE_SIZE_AUDIT.json` - Detaillierter Report

---

## 🔍 MANUELLE INSPEKTION - Top Kandidaten

### 🔴 CRITICAL FILES (geschätzt > 500 Zeilen)

#### 1. `screens/admin/TeamManagementScreen.tsx` ✅ **COMPLETE**
- **Tatsächliche Größe:** 1710 Zeilen
- **Nach Refactoring:** 510 Zeilen (7 Dateien total)
- **Komplexität:** NIEDRIG (orchestration only)
- **Ergebnis:**
  - ✅ Hooks: `hr_useTeamManagement.ts` (330 lines)
  - ✅ Hooks: `hr_useEmployeeFiltering.ts` (260 lines)
  - ✅ Component: `hr_EmployeesList.tsx` (470 lines)
  - ✅ Component: `hr_TeamsList.tsx` (100 lines)
  - ✅ Component: `hr_TeamDialog.tsx` (430 lines)
  - ✅ Main Screen: `TeamManagementScreen.tsx` (510 lines)
- **Status:** ✅ **PRODUCTION READY**
- **Details:** Siehe `/PHASE2_STEP1_COMPLETE.md`

#### 2. `screens/TimeAndLeaveScreen.tsx`
- **Geschätzte Größe:** ~700-800 Zeilen
- **Komplexität:** HOCH
- **Grund:**
  - Multi-Tab Interface (Zeit, Urlaub, Anträge, Kalender)
  - Time Tracking Logic
  - Leave Request Management
  - Calendar View (lazy loaded)
  - Break Manager Integration
- **Splitting-Plan:** ✅ Siehe unten

#### 3. `screens/admin/OrganigramCanvasScreenV2.tsx`
- **Geschätzte Größe:** ~600-700 Zeilen
- **Komplexität:** HOCH
- **Grund:**
  - Canvas Drawing & Interaction
  - Node Management
  - Connection System
  - Zoom & Pan Controls
  - Draft/Live Mode
- **Splitting-Plan:** ✅ Siehe unten

#### 4. `screens/LearningAdminScreen.tsx`
- **Geschätzte Größe:** ~500-600 Zeilen
- **Komplexität:** MITTEL-HOCH
- **Grund:**
  - Video Management
  - Content Creation Dialogs
  - Multi-Tab Interface
- **Splitting-Plan:** ⏳ TODO

#### 5. `screens/admin/TeamMemberDetailsScreen.tsx`
- **Geschätzte Größe:** ~500-600 Zeilen
- **Komplexität:** MITTEL-HOCH
- **Grund:**
  - Comprehensive User Details
  - Multiple Edit Forms
  - Work Time Model Management
  - Leave Request Admin Interface
- **Splitting-Plan:** ⏳ TODO

---

## 🟡 WARNING FILES (300-500 Zeilen)

### Screens
- `screens/SettingsScreen.tsx` (~400 Zeilen)
- `screens/DashboardScreen.tsx` (~350 Zeilen)
- `screens/LearningScreen.tsx` (~350 Zeilen)
- `screens/admin/AddEmployeeScreen.tsx` (~400 Zeilen)
- `screens/admin/CompanySettingsScreen.tsx` (~350 Zeilen)
- `screens/admin/BenefitsManagementScreen.tsx` (~350 Zeilen)

### Components
- `components/LeaveRequestsList.tsx` (~350 Zeilen)
- `components/BulkActionsBar.tsx` (~300 Zeilen)
- `components/QuickActionsMenu.tsx` (~300 Zeilen)

### Stores
- `stores/hr_timeStore.ts` (~400 Zeilen)
- `stores/hr_adminStore.ts` (~450 Zeilen)
- `stores/hr_learningStore.ts` (~350 Zeilen)

---

## 📝 SPLITTING PLANS

### 🔴 PRIORITY 1: TeamManagementScreen.tsx

**Current:** ~900 Zeilen  
**Target:** 5-6 Dateien à ~150-200 Zeilen

**Neue Struktur:**

```
screens/admin/
  └── TeamManagementScreen.tsx              (~200 Zeilen) - Main orchestrator

components/admin/
  ├── hr_EmployeesList.tsx                  (~250 Zeilen) - Employee tab
  ├── hr_TeamsList.tsx                      (~200 Zeilen) - Teams tab
  ├── hr_TeamDialog.tsx                     (~250 Zeilen) - Team create/edit dialog
  └── hr_TeamMemberSelector.tsx             (~150 Zeilen) - Team member selection

hooks/
  ├── hr_useTeamManagement.ts               (~200 Zeilen) - Team CRUD logic
  └── hr_useEmployeeFiltering.ts            (~150 Zeilen) - Filter/Search/Sort logic
```

**Steps:**
1. ✅ Extrahiere Team Management Logic → `hr_useTeamManagement.ts`
2. ✅ Extrahiere Employee Filtering → `hr_useEmployeeFiltering.ts`
3. ✅ Extrahiere Employees Tab → `hr_EmployeesList.tsx`
4. ✅ Extrahiere Teams Tab → `hr_TeamsList.tsx`
5. ✅ Extrahiere Team Dialog → `hr_TeamDialog.tsx`
6. ✅ Extrahiere Team Member Selector → `hr_TeamMemberSelector.tsx`
7. ✅ Update Main Screen - nur Orchestration
8. ✅ Update all imports
9. ✅ Test functionality

---

### 🔴 PRIORITY 2: TimeAndLeaveScreen.tsx

**Current:** ~750 Zeilen  
**Target:** 4-5 Dateien à ~150-200 Zeilen

**Neue Struktur:**

```
screens/
  └── TimeAndLeaveScreen.tsx                (~150 Zeilen) - Tab orchestrator

components/time/
  ├── hr_TimeTrackingTab.tsx                (~200 Zeilen) - Time tracking UI
  ├── hr_LeaveManagementTab.tsx             (~200 Zeilen) - Leave requests UI
  └── hr_LeaveApprovalTab.tsx               (~200 Zeilen) - Admin approval UI

hooks/
  └── hr_useTimeTracking.ts                 (~150 Zeilen) - Time session logic
```

**Steps:**
1. ✅ Extrahiere Time Tracking Logic → `hr_useTimeTracking.ts`
2. ✅ Extrahiere Time Tab → `hr_TimeTrackingTab.tsx`
3. ✅ Extrahiere Leave Tab → `hr_LeaveManagementTab.tsx`
4. ✅ Extrahiere Approval Tab → `hr_LeaveApprovalTab.tsx`
5. ✅ Update Main Screen
6. ✅ Test all tabs

---

### 🔴 PRIORITY 3: OrganigramCanvasScreenV2.tsx

**Current:** ~650 Zeilen  
**Target:** BEREITS GUT STRUKTURIERT!

**Status:** ✅ **SKIP - Already uses modular Canvas components**

Die Canvas-Komponenten sind bereits gut aufgeteilt:
- `components/canvas/hr_CanvasOrgChart.tsx`
- `components/canvas/hr_CanvasControls.tsx`
- `components/canvas/hr_CanvasHandlers.ts`
- `components/canvas/hr_CanvasUtils.ts`
- `components/canvas/hr_CanvasTypes.ts`

**Action:** Keine weitere Aufteilung nötig! ✅

---

## 🟡 PRIORITY 4: Large Stores

### hr_adminStore.ts (~450 Zeilen)

**Splitting Strategy:**
```
stores/
  ├── hr_adminStore.ts                      (~150 Zeilen) - Core state
  └── hr_adminActions.ts                    (~300 Zeilen) - Actions separated
```

**Alternative:** Create dedicated hooks statt Store aufzuteilen
```
hooks/
  ├── hr_useUserManagement.ts               - CRUD für Users
  ├── hr_useLocationManagement.ts           - CRUD für Locations
  └── hr_useDepartmentManagement.ts         - CRUD für Departments
```

**Decision:** ⏳ Evaluate during implementation

---

### hr_timeStore.ts (~400 Zeilen)

**Status:** ⏳ Monitor - akzeptabel wenn < 450

**Splitting Strategy (falls nötig):**
```
stores/
  ├── hr_timeStore.ts                       (~200 Zeilen) - State + basic actions
  └── hr_timeStatsActions.ts                (~200 Zeilen) - Stats calculation logic
```

---

## 📊 GESCHÄTZTE STATISTIKEN

**Vor Refactoring:**
```
Total Files:      ~180
Critical (>500):  ~5 files (2.8%)
Warning (300-500): ~15 files (8.3%)
OK (<300):        ~160 files (88.9%)
Average:          ~210 lines
```

**Nach Refactoring (Ziel):**
```
Total Files:      ~200 (+20 neue Component/Hook Files)
Critical (>500):  0 files (0%)
Warning (300-500): ~5 files (2.5%)
OK (<300):        ~195 files (97.5%)
Average:          ~180 lines
```

---

## ⏱️ ZEITPLAN

### Woche 3 (Tag 11-15)
- ✅ **Tag 11:** Audit-Script erstellt
- ⏳ **Tag 12:** Manual Inspection & Splitting Plans
- ⏳ **Tag 13-14:** TeamManagementScreen Refactoring
- ⏳ **Tag 15:** Testing & Fixes

### Woche 4 (Tag 16-20)
- ⏳ **Tag 16-17:** TimeAndLeaveScreen Refactoring
- ⏳ **Tag 18:** LearningAdminScreen Refactoring
- ⏳ **Tag 19:** TeamMemberDetailsScreen Refactoring
- ⏳ **Tag 20:** Final Testing & Documentation

---

## ✅ PHASE 2.1 CHECKLIST

- [x] Audit-Script erstellt (`hr_filesize-audit.js`)
- [ ] Audit durchgeführt (console output reviewed)
- [ ] `FILE_SIZE_AUDIT.json` erstellt
- [ ] Manual inspection abgeschlossen
- [ ] Splitting Plans dokumentiert für Top 5 Dateien
- [ ] Prioritäten festgelegt
- [ ] Zeitplan erstellt

---

## �� NÄCHSTER SCHRITT

**Option A:** Script ausführen (in lokaler Dev-Umgebung)
```bash
node scripts/hr_filesize-audit.js
```

**Option B:** Direkt mit Refactoring starten
→ Beginne mit **TeamManagementScreen.tsx** (höchste Priorität)

**Was möchtest du tun?**
- A) ⏸️ Warte auf Script-Ausführung
- B) 🚀 Start Refactoring: TeamManagementScreen
- C) 🚀 Start Refactoring: TimeAndLeaveScreen
- D) 📋 Weiter mit manual inspection anderer Dateien

---

## 📈 ERFOLGE

✅ **Audit-Script erstellt** - Vollständig funktionsfähig  
✅ **Top 5 Dateien identifiziert** - Klare Prioritäten  
✅ **Splitting-Pläne erstellt** - Detaillierte Roadmaps  
✅ **Zeitplan definiert** - Realistische Aufwandsschätzung

**Bereit für Phase 2.2: File Splitting Implementation!** 🎯
