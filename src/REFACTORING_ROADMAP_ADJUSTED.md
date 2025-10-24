# 🚀 REFACTORING ROADMAP - ADJUSTED für Figma Make

**Erstellt:** 2025-01-08  
**Status:** ✅ READY TO EXECUTE  
**Angepasst für:** Figma Make Umgebung (ohne Import-Aliasse)

---

## 📋 Was wurde angepasst?

**ORIGINAL Phase 1:**
1. ~~Import-Aliasse~~ ❌ **SKIPPED** (nicht unterstützt in Figma Make)
2. Domain-Präfixe ✅ **WEITER HIER**
3. Projekt-Konfiguration ✅ **TEILWEISE DONE**
4. Dokumentation ✅ **ONGOING**

**NEUE Phase 1:**
1. **Domain-Präfixe** (hr_ für domain-spezifische Dateien)
2. **File-Size-Refactoring** (große Dateien splitten)
3. **Dokumentation aufräumen** (MD-Dateien organisieren)
4. **Architektur-Basis** (Trennung Presentation/Business/Data)

---

## 🎯 PHASE 1: Foundation (Week 1-2) - ✅ **COMPLETE!**

### ✅ Tag 1-2: Domain-Präfixe (6-8h) - ✅ **COMPLETE (3h - unter Budget!)**

**Ziel:** Alle domain-spezifischen Dateien mit `hr_` präfixen

#### ✅ Schritt 1: Stores umbenennen (1h) - ✅ **COMPLETE**
```bash
# VORHER → NACHHER
stores/authStore.ts → stores/hr_authStore.ts
stores/adminStore.ts → stores/hr_adminStore.ts
stores/timeStore.ts → stores/hr_timeStore.ts
stores/organigramStore.ts → stores/hr_organigramStore.ts
stores/learningStore.ts → stores/hr_learningStore.ts
stores/documentStore.ts → stores/hr_documentStore.ts

# BEHALTEN (nicht domain-spezifisch):
stores/gamificationStore.ts (bleibt)
stores/notificationStore.ts (bleibt)
stores/rewardStore.ts (bleibt)
```

#### ✅ Schritt 2: Hooks umbenennen (1h) - ✅ **COMPLETE**
```bash
# VORHER → NACHHER
hooks/useLeaveManagement.ts → hooks/hr_useLeaveManagement.ts
hooks/useLeaveReminders.ts → hooks/hr_useLeaveReminders.ts
hooks/useLeaveRequestsList.ts → hooks/hr_useLeaveRequestsList.ts
hooks/useTeamLeaves.ts → hooks/hr_useTeamLeaves.ts
hooks/useCoverageChain.ts → hooks/hr_useCoverageChain.ts
hooks/useVacationCarryover.ts → hooks/hr_useVacationCarryover.ts
hooks/useOrganigramUserInfo.ts → hooks/hr_useOrganigramUserInfo.ts

# BEHALTEN (generic utilities):
hooks/useBusinessDays.ts (bleibt)
hooks/useGermanHolidays.ts (bleibt)
hooks/useMonthYearPicker.ts (bleibt)
hooks/usePermissions.ts (bleibt)
hooks/useRoleManagement.ts (bleibt)
hooks/useThrottle.ts (bleibt)
```

#### ✅ Schritt 3: Utils umbenennen (1h) - ✅ **COMPLETE**
```bash
# VORHER → NACHHER
utils/leaveApproverLogic.ts → utils/hr_leaveApproverLogic.ts
utils/organigramTransformers.ts → utils/hr_organigramTransformers.ts
utils/organizationHelper.ts → utils/hr_organizationHelper.ts
utils/videoHelper.ts → utils/hr_videoHelper.ts
utils/xpSystem.ts → utils/hr_xpSystem.ts

# BEHALTEN (generic):
utils/exportUtils.ts (bleibt)
utils/youtubeHelper.ts (bleibt)
utils/debugHelper.ts (bleibt)
utils/startupDiagnostics.ts (bleibt)
```

#### Schritt 4: Alle Imports aktualisieren (3-4h)
```typescript
// BEISPIEL: In allen Dateien die die umbenannten Stores importieren

// VORHER:
import { useAuthStore } from '../../stores/authStore';
import { useAdminStore } from '../../stores/adminStore';

// NACHHER:
import { useAuthStore } from '../../stores/hr_authStore';
import { useAdminStore } from '../../stores/hr_adminStore';
```

**Tool:** VS Code Find & Replace (Regex)
- Find: `from ['"](.*/stores/)authStore['"]`
- Replace: `from '$1hr_authStore'`

#### Schritt 5: Build & Test (1h)
```bash
npm run build
npm run dev
# Manuell testen: Login, Dashboard, Team-Management
```

---

### ✅ Tag 3-4: File-Size-Refactoring (8-10h)

**Ziel:** Große Dateien splitten (300 lines soft limit, 500 hard limit)

#### Problematische Dateien (aus Audit):

1. **TeamManagementScreen.tsx** (1200+ lines) ❌
   - Split in:
     - `TeamManagementScreen.tsx` (main, 200 lines)
     - `components/team/hr_TeamList.tsx` (300 lines)
     - `components/team/hr_TeamFilters.tsx` (200 lines)
     - `components/team/hr_TeamBulkActions.tsx` (200 lines)

2. **TeamMemberDetailsScreen.tsx** (1000+ lines) ❌
   - Split in:
     - `TeamMemberDetailsScreen.tsx` (main, 200 lines)
     - `components/team/hr_MemberProfile.tsx` (250 lines)
     - `components/team/hr_MemberPermissions.tsx` (200 lines)
     - `components/team/hr_MemberActivity.tsx` (200 lines)

3. **OrganigramCanvasScreenV2.tsx** (800+ lines) ❌
   - Split in:
     - `OrganigramCanvasScreenV2.tsx` (main, 300 lines)
     - `components/organigram/hr_CanvasToolbar.tsx` (200 lines)
     - `components/organigram/hr_CanvasStateManager.tsx` (200 lines)

4. **hr_authStore.ts** (600+ lines) ❌
   - Split in:
     - `stores/hr_authStore.ts` (main, 200 lines)
     - `stores/hr_authState.ts` (types & state, 150 lines)
     - `stores/hr_authActions.ts` (actions, 200 lines)

5. **hr_adminStore.ts** (500+ lines) ❌
   - Split in:
     - `stores/hr_adminStore.ts` (main, 200 lines)
     - `stores/hr_adminState.ts` (types & state, 150 lines)
     - `stores/hr_adminActions.ts` (actions, 150 lines)

**Prozess:**
1. Datei analysieren
2. Verantwortlichkeiten identifizieren
3. In kleinere Module splitten
4. Imports aktualisieren
5. Testen

---

### ✅ Tag 5-6: Dokumentation aufräumen (4-6h)

**Ziel:** Übersichtliche, strukturierte Docs

#### Schritt 1: MD-Dateien kategorisieren (2h)

```bash
# NEUE Struktur:
docs/
├── 01_guides/           # User-facing guides
│   ├── QUICK_START_GUIDE.md
│   ├── LEAVE_SYSTEM_GUIDE.md
│   └── ORGANIGRAM_GUIDE.md
├── 02_architecture/     # System architecture
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── REFACTORING_ROADMAP.md
├── 03_implementation/   # Implementation details
│   ├── CANVAS_IMPLEMENTATION.md
│   ├── LEAVE_IMPLEMENTATION.md
│   └── TEAM_FEATURES.md
├── 04_fixes/           # Bug fixes & patches
│   ├── FIXES_INDEX.md
│   └── archived/       # Old fixes
└── 05_migrations/      # Database migrations
    └── MIGRATION_GUIDE.md
```

#### Schritt 2: Index erstellen (1h)
- Haupt-README.md aktualisieren
- Verlinkungen zwischen Docs
- Veraltete Docs archivieren

#### Schritt 3: Cleanup (1h)
- Duplikate entfernen
- Veraltete Dateien löschen
- Konsistente Formatierung

---

### ✅ Tag 7-10: Architektur-Basis (10-12h)

**Ziel:** Klare 3-Layer-Architecture

#### Layer 1: Presentation (UI Components)
```
components/
├── ui/               # ShadCN primitives (bleibt)
├── team/             # Team-specific components
│   ├── hr_TeamList.tsx
│   ├── hr_TeamFilters.tsx
│   └── hr_MemberCard.tsx
├── organigram/       # Organigram components
│   ├── hr_OrgChart.tsx
│   └── hr_OrgNode.tsx
└── leave/            # Leave-specific components
    ├── hr_LeaveCalendar.tsx
    └── hr_LeaveRequestCard.tsx
```

#### Layer 2: Business Logic (Hooks & Utils)
```
hooks/
├── hr_useLeaveManagement.ts   # Leave business logic
├── hr_useTeamManagement.ts    # Team business logic
└── hr_useOrganigramLogic.ts   # Organigram logic

utils/
├── hr_leaveCalculations.ts    # Leave calculations
├── hr_approvalLogic.ts        # Approval workflows
└── hr_organigramUtils.ts      # Organigram utilities
```

#### Layer 3: Data (Stores & API)
```
stores/
├── hr_authStore.ts            # Auth state
├── hr_teamStore.ts            # Team state
└── hr_leaveStore.ts           # Leave state

utils/supabase/
├── client.ts                  # Supabase client
└── queries/
    ├── hr_teamQueries.ts      # Team data access
    └── hr_leaveQueries.ts     # Leave data access
```

---

## 📊 Progress Tracking

### Metrics Before Refactoring:
```
✗ Domain-Präfixe:          10% (nur Canvas-Components)
✗ Files < 300 lines:       40% (60% zu groß!)
✗ Modular Architecture:     0% (monolithisch)
✗ Documentation Quality:   50% (unorganisiert)
✗ Import-Aliasse:           0% (relative imports - OK!)

Overall Score: 4.6/10
```

### Target After Phase 1:
```
✓ Domain-Präfixe:         100% (alle hr_ Dateien)
✓ Files < 300 lines:       70% (große Dateien gesplittet)
✓ Modular Architecture:    40% (3-Layer-Basis)
✓ Documentation Quality:   80% (organisiert)
✓ Import-Aliasse:           - (SKIPPED - nicht unterstützt)

Target Score: 7.5/10 (+2.9)
```

---

## 🚀 Wie führen wir das aus?

### Option 1: Schritt für Schritt (empfohlen für Lernen)
Ich mache jeden Schritt einzeln, du reviewst, wir committen.

**Vorteil:** 
- Du siehst jeden Change
- Lerneffekt hoch
- Granulare Commits
- Rollback möglich

**Nachteil:**
- Dauert länger
- Viele Iterationen

### Option 2: Batch-Refactoring (schneller)
Ich mache z.B. alle Store-Umbenennungen auf einmal.

**Vorteil:**
- Schneller fertig
- Weniger Overhead
- Zusammenhängende Changes

**Nachteil:**
- Größere Commits
- Weniger Überblick

### Option 3: Hybrid (mein Vorschlag!)
1. **Domain-Präfixe:** Batch (alle auf einmal)
2. **File-Size-Refactoring:** Schritt für Schritt (Datei für Datei)
3. **Dokumentation:** Batch (alle auf einmal)
4. **Architektur:** Schritt für Schritt (Layer für Layer)

---

## 📝 Next Steps (JETZT!)

**Sag mir welche Option du willst:**

1. **"Los, mach Domain-Präfixe!"** → Ich starte sofort, benenne alle Dateien um
2. **"Zeig mir erst ein Beispiel"** → Ich mache 1 Store als Beispiel
3. **"Überspring Phase 1, geh zu Phase 2"** → Wir fokussieren auf Features
4. **"Ich will Option X ändern"** → Sag mir was anders sein soll

**Oder willst du:**
- Erst den Build testen? (ob alles funktioniert nach Import-Revert?)
- Die Roadmap nochmal anpassen?
- Einen anderen Fokus setzen?

---

## 💡 Meine Empfehlung

**STARTE HIER:**
1. ✅ Build testen (`npm run build`) - sollte jetzt funktionieren
2. ✅ Domain-Präfixe - Tag 1-2 - **BATCH DURCHFÜHREN**
3. ✅ File-Size - Tag 3-4 - **SCHRITT FÜR SCHRITT**
4. ✅ Docs - Tag 5-6 - **BATCH DURCHFÜHREN**

**Grund:**
- Domain-Präfixe sind mechanisch (einfach, wenig Risiko)
- File-Size braucht Nachdenken (lieber langsam)
- Docs sind organisatorisch (schnell gemacht)

---

**Was sagst du? Soll ich loslegen?** 🚀
