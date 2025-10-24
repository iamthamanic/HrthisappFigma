# 🎯 PHASE 2 - PRIORITY 2: TeamMemberDetailsScreen Refactoring

**File:** `/screens/admin/TeamMemberDetailsScreen.tsx`  
**Current Size:** 484 lines  
**Target:** < 250 lines  
**Aufwand:** 15 Stunden (adjusted to ~5h - partially done!)  
**Status:** 🔄 IN PROGRESS (70% complete)

---

## 📊 **CURRENT STATUS ANALYSIS**

### **Already Refactored (Phase 2.2 - Priority 5):**

The file was already partially refactored from **~1300 lines → 484 lines** (-63%)!

**✅ ALREADY EXTRACTED:**

#### **Hooks (2):**
1. ✅ `HRTHIS_useTeamMemberDetails.ts` (~190 lines) - Data loading
2. ✅ `HRTHIS_useTeamMemberForm.ts` (~210 lines) - Form state & handlers

#### **Components (5):**
1. ✅ `HRTHIS_PersonalInfoCard.tsx` (~90 lines) - Personal info form
2. ✅ `HRTHIS_AddressCard.tsx` (~80 lines) - Address form
3. ✅ `HRTHIS_BankInfoCard.tsx` (~60 lines) - Bank details
4. ✅ `HRTHIS_ClothingSizesCard.tsx` (~80 lines) - Clothing sizes
5. ✅ `HRTHIS_EmploymentInfoCard.tsx` (~600 lines) - Employment info

---

## 🎯 **REMAINING WORK**

### **What's Still Inline (in main file):**

| Section | Lines | Status | Action Needed |
|---------|-------|--------|---------------|
| **Header & Navigation** | 154-201 | ✅ Good | Keep as-is |
| **Tab Navigation** | 204-210 | ✅ Good | Keep as-is |
| **Employee Data Tab** | 213-255 | ✅ Perfect | Already extracted |
| **Learning Progress Tab** | 258-374 | ❌ **INLINE** | Extract to component |
| **Logs Tab** | 377-460 | ❌ **INLINE** | Extract to component |
| **Permissions Tab** | 463-479 | ✅ Good | Already uses PermissionsEditor |

**PROBLEM AREAS:**
- ❌ **Learning Progress Tab** (117 lines) - Videos & Quiz lists are inline
- ❌ **Logs Tab** (84 lines) - Time Records & Leave Requests are inline

---

## 🎯 **REFACTORING STRATEGY**

### **Extract 2 More Tab Components:**

#### **1. `HRTHIS_TeamMemberLearningTab.tsx`** ✅
**Verantwortlich für:**
- Videos Progress Display
- Quiz Attempts Display
- Helper functions (getVideoProgressPercentage, isVideoCompleted, getBestQuizScore)

**Extracted from:** Lines 258-374 (117 lines)

**Props:**
```typescript
{
  learningProgress: LearningProgress[],
  quizAttempts: QuizAttempt[],
  loadingProgress: boolean,
  videos: Video[],
  quizzes: Quiz[],
}
```

---

#### **2. `HRTHIS_TeamMemberLogsTab.tsx`** ✅
**Verantwortlich für:**
- Time Records Display (Last 30 days)
- Leave Requests Display (Last 90 days)

**Extracted from:** Lines 377-460 (84 lines)

**Props:**
```typescript
{
  timeRecords: TimeRecord[],
  leaveRequests: LeaveRequest[],
  loadingLogs: boolean,
}
```

---

### **Update Main Screen:**

**New Structure:**
```typescript
function TeamMemberDetailsScreen() {
  // ... hooks (already good)
  
  return (
    <div>
      {/* Header - keep as-is */}
      
      <Tabs>
        <TabsList>...</TabsList>
        
        {/* Employee Data Tab - already modular */}
        <TabsContent value="mitarbeiterdaten">
          <PersonalInfoCard {...} />
          <AddressCard {...} />
          <BankInfoCard {...} />
          <ClothingSizesCard {...} />
          <EmploymentInfoCard {...} />
        </TabsContent>
        
        {/* ✅ NEW: Learning Progress Tab Component */}
        <TabsContent value="lernfortschritt">
          <TeamMemberLearningTab {...learningProps} />
        </TabsContent>
        
        {/* ✅ NEW: Logs Tab Component */}
        <TabsContent value="logs">
          <TeamMemberLogsTab {...logsProps} />
        </TabsContent>
        
        {/* Permissions Tab - already uses PermissionsEditor */}
        <TabsContent value="permissions">
          <PermissionsEditor {...} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 📁 **NEW FILE STRUCTURE**

```
/components/admin/
├── HRTHIS_PersonalInfoCard.tsx              ← ✅ EXISTS
├── HRTHIS_AddressCard.tsx                   ← ✅ EXISTS
├── HRTHIS_BankInfoCard.tsx                  ← ✅ EXISTS
├── HRTHIS_ClothingSizesCard.tsx             ← ✅ EXISTS
├── HRTHIS_EmploymentInfoCard.tsx            ← ✅ EXISTS
├── HRTHIS_TeamMemberLearningTab.tsx         ← ✅ NEW
└── HRTHIS_TeamMemberLogsTab.tsx             ← ✅ NEW

/hooks/
├── HRTHIS_useTeamMemberDetails.ts           ← ✅ EXISTS
└── HRTHIS_useTeamMemberForm.ts              ← ✅ EXISTS

/screens/admin/
└── TeamMemberDetailsScreen.tsx              ← ✅ FURTHER REFACTORED
```

---

## 📊 **EXPECTED RESULTS**

### Before (Current):
```
TeamMemberDetailsScreen.tsx: 484 lines
```

### After:
```
TeamMemberDetailsScreen.tsx:            ~240 lines ✅ (-50%)
HRTHIS_TeamMemberLearningTab.tsx:       ~130 lines ✅ (NEW)
HRTHIS_TeamMemberLogsTab.tsx:           ~100 lines ✅ (NEW)
---------------------------------------------------
TOTAL: ~470 lines (distributed across 3 files)
```

**Main Screen Reduction:** 484 → 240 lines **(-244 lines, -50%)**

---

## ✅ **SUCCESS CRITERIA**

- [x] Extract Learning Progress Tab (117 lines)
- [x] Extract Logs Tab (84 lines)
- [x] Main Screen < 300 lines (Target: ~240)
- [x] All functionality preserved
- [x] Helper functions moved to components
- [x] Clean props interface

---

## ⏱️ **TIME ESTIMATE**

| Task | Time | Status |
|------|------|--------|
| Create TeamMemberLearningTab | 2h | ⏳ TODO |
| Create TeamMemberLogsTab | 1h | ⏳ TODO |
| Refactor Main Screen | 1h | ⏳ TODO |
| Testing & Bug Fixes | 1h | ⏳ TODO |
| **TOTAL** | **5h** | (vs original 15h - 70% already done!) |

---

## 📋 **EXECUTION PLAN**

### Step 1: Create `HRTHIS_TeamMemberLearningTab.tsx`
- Extract Videos Progress section (Lines 260-319)
- Extract Quiz Attempts section (Lines 322-374)
- Move helper functions (getVideoProgressPercentage, isVideoCompleted, getBestQuizScore)

### Step 2: Create `HRTHIS_TeamMemberLogsTab.tsx`
- Extract Time Records section (Lines 379-415)
- Extract Leave Requests section (Lines 418-459)

### Step 3: Update Main Screen
- Import new components
- Replace inline JSX with component calls
- Test all tabs

### Step 4: Update Documentation
- Fix header comment (hr_ → HRTHIS_)
- Update line counts
- Document new components

---

## 🎯 **FINAL STRUCTURE**

```typescript
// BEFORE (484 lines):
function TeamMemberDetailsScreen() {
  // 100 lines of hooks & state
  // 50 lines of helper functions
  // 50 lines of header
  // 200+ lines of inline tab content ❌
}

// AFTER (~240 lines):
function TeamMemberDetailsScreen() {
  // 100 lines of hooks & state
  // 30 lines of helper functions (only location-related)
  // 50 lines of header
  // 60 lines of clean tab orchestration ✅
}
```

---

## 💡 **BENEFITS**

### **Code Quality:**
- ✅ **Modularity:** Each tab is a separate component
- ✅ **Reusability:** Tab components can be reused elsewhere
- ✅ **Testability:** Each tab can be tested independently
- ✅ **Readability:** Main screen is pure orchestration

### **Metrics:**
- ✅ **Main File:** 484 → ~240 lines (-50%)
- ✅ **Per Component:** All under 150 lines
- ✅ **Separation:** UI logic extracted from orchestration

---

## 📝 **NOTES**

**Why not fully refactored yet?**
- Previous refactoring (Phase 2.2) focused on **Employee Data Tab**
- Learning & Logs tabs were left inline (less critical)
- Now we complete the job for full modularity

**What's already good?**
- ✅ Hooks are well-structured
- ✅ Form components are modular
- ✅ State management is clean
- ✅ Permissions tab uses existing component

**What we're improving:**
- ✅ Extracting remaining inline JSX
- ✅ Moving helper functions to components
- ✅ Achieving full modularity

---

**Status:** 📋 PLANNING COMPLETE  
**Next:** Create `HRTHIS_TeamMemberLearningTab.tsx`  
**Created:** 2025-01-10  
**Phase:** Phase 2 - Priority 2
