# 🔄 BROWO KOORDINATOR - RENAME EXECUTION PLAN

**Status:** Ready to Execute  
**Files Affected:** ~150+ files  
**Estimated Time:** 30-45 minutes manual OR 5 minutes with script

---

## ⚠️ WICHTIG: Du hast 2 Optionen

### Option A: Automatisches Renaming (EMPFOHLEN) ⭐

**Wenn du Zugriff auf Terminal/Command Line hast:**

```bash
# 1. Backup erstellen
git add .
git commit -m "Pre-rename backup"

# 2. Script ausführbar machen
chmod +x ./scripts/rename_hrthis_to_browoko.sh

# 3. Script ausführen
./scripts/rename_hrthis_to_browoko.sh

# 4. Verification
git status
npm run build  # Test ob alles funktioniert
```

**Das Script macht:**
- ✅ Renamed alle `HRTHIS_*` Files → `BrowoKo_*`
- ✅ Ersetzt `HRTHIS_` → `BrowoKo_` in allen Files
- ✅ Ersetzt `HRthis` → `Browo Koordinator`  
- ✅ Ersetzt `hrthis` → `browoko`
- ✅ Updated package.json, README.md
- ✅ Verification Report

---

### Option B: Claude macht es manuell (LANGSAM)

**Wenn Option A nicht geht:**

Claude (ich) renamed alle Files einzeln über Figma Make.

**Problem:** 
- ⚠️ ~150 Dateien
- ⚠️ Jede Datei braucht 2-3 Tool Calls (view → edit/write → verify)
- ⚠️ ~450 Tool Calls total
- ⚠️ Dauert sehr lange
- ⚠️ Fehleranfällig

**Empfehlung:** NUR wenn Option A unmöglich ist!

---

## 📋 FILES TO RENAME (Complete List)

### Services (14 files)
```
/services/
  HRTHIS_announcementService.ts    → BrowoKo_announcementService.ts
  HRTHIS_auditLogService.ts        → BrowoKo_auditLogService.ts
  HRTHIS_authService.ts            → BrowoKo_authService.ts
  HRTHIS_benefitsService.ts        → BrowoKo_benefitsService.ts
  HRTHIS_coinAchievementsService.ts → BrowoKo_coinAchievementsService.ts
  HRTHIS_documentAuditService.ts   → BrowoKo_documentAuditService.ts
  HRTHIS_documentService.ts        → BrowoKo_documentService.ts
  HRTHIS_learningService.ts        → BrowoKo_learningService.ts
  HRTHIS_leaveService.ts           → BrowoKo_leaveService.ts
  HRTHIS_notificationService.ts    → BrowoKo_notificationService.ts
  HRTHIS_organigramService.ts      → BrowoKo_organigramService.ts
  HRTHIS_realtimeService.ts        → BrowoKo_realtimeService.ts
  HRTHIS_teamService.ts            → BrowoKo_teamService.ts
  HRTHIS_userService.ts            → BrowoKo_userService.ts
```

### Components (80+ files)
```
/components/
  HRTHIS_AuditLogsView.tsx
  HRTHIS_AvatarStatsGrid.tsx
  HRTHIS_BenefitApprovalDialog.tsx
  HRTHIS_BenefitBrowseCard.tsx
  HRTHIS_BenefitPurchaseDialog.tsx
  ... (77 more)
  
/components/admin/
  HRTHIS_AchievementCard.tsx
  HRTHIS_AchievementDialog.tsx
  HRTHIS_AddEmployeeLoginSection.tsx
  ... (27 more)

/components/canvas/
  HRTHIS_CanvasControls.tsx
  HRTHIS_CanvasHandlers.ts
  HRTHIS_CanvasOrgChart.tsx
  HRTHIS_CanvasTypes.ts
  HRTHIS_CanvasUtils.ts

/components/organigram/
  HRTHIS_OrganigramErrorAlerts.tsx
  HRTHIS_OrganigramToolbar.tsx

/components/user/
  HRTHIS_AddressCard.tsx
  HRTHIS_BankInfoCard.tsx
  HRTHIS_ClothingSizesCard.tsx
  HRTHIS_EmergencyContactCard.tsx
  HRTHIS_LanguageSkillsCard.tsx
  HRTHIS_PersonalDataCard.tsx
```

### Hooks (30+ files)
```
/hooks/
  HRTHIS_useAchievementsManagement.ts
  HRTHIS_useAdminMenuRouting.ts
  HRTHIS_useBenefitsManagement.ts
  HRTHIS_useCalendarScreen.ts
  HRTHIS_useCardEditing.ts
  ... (25 more)
```

### Stores (6 files)
```
/stores/
  HRTHIS_adminStore.ts
  HRTHIS_authStore.ts
  HRTHIS_documentStore.ts
  HRTHIS_learningStore.ts
  HRTHIS_notificationStore.ts
  HRTHIS_organigramStore.ts
```

### Utils (10+ files)
```
/utils/
  HRTHIS_leaveApproverLogic.ts
  HRTHIS_organigramTransformers.ts
  HRTHIS_organizationHelper.ts
  HRTHIS_storageHelper.ts
  HRTHIS_videoHelper.ts
  HRTHIS_xpSystem.ts
  
/utils/notifications/
  HRTHIS_notificationTriggers.ts
  
/utils/resilience/
  HRTHIS_circuitBreaker.ts
  HRTHIS_retry.ts
  HRTHIS_timeout.ts
  
/utils/security/
  HRTHIS_bruteForceProtection.ts
  HRTHIS_passwordPolicies.ts
  HRTHIS_sanitization.ts
  HRTHIS_securityHeaders.ts
  HRTHIS_securityTest.ts
  HRTHIS_sessionManager.ts
  HRTHIS_validation.ts
```

### Config (2 files)
```
/config/
  HRTHIS_performanceBudgets.ts
  HRTHIS_projectConfig.ts
```

### Type Schemas (6 files)
```
/types/schemas/
  HRTHIS_benefitSchemas.ts
  HRTHIS_documentSchemas.ts
  HRTHIS_learningSchemas.ts
  HRTHIS_leaveSchemas.ts
  HRTHIS_teamSchemas.ts
  HRTHIS_userSchemas.ts
```

### Scripts (7 files)
```
/scripts/
  HRTHIS_buildProduction.sh
  HRTHIS_bundleAnalyzer.js
  HRTHIS_dependencyScanner.js
  HRTHIS_performanceBudgetCheck.js
  HRTHIS_securityAudit.js
  HRTHIS_securityAuditComplete.js
```

### Icons (2 files)
```
/components/icons/
  HRTHISIcons.tsx          → BrowoKoIcons.tsx
  HRTHISIcons_NEW.tsx      → BrowoKoIcons_NEW.tsx
```

---

## 🎯 TEXT REPLACEMENTS

### In ALL Files (*.ts, *.tsx, *.js, *.jsx, *.md):

| Find | Replace |
|------|---------|
| `HRTHIS_` | `BrowoKo_` |
| `HRthis` | `Browo Koordinator` |
| `hrthis` | `browoko` |
| `HRTHISIcons` | `BrowoKoIcons` |

### Special Files:

**package.json:**
```json
{
  "name": "browo-koordinator",
  "version": "4.10.21",
  "description": "Browo Koordinator - HR Management System"
}
```

**README.md:**
```markdown
# Browo Koordinator

HR Management System built with React, TypeScript, and Supabase.
```

**vite.config.ts:** (if needed)
No changes needed

**tsconfig.json:**
No changes needed

---

## ✅ VERIFICATION CHECKLIST

Nach dem Rename:

### 1. Build Test
```bash
npm run build
```
**Expected:** ✅ No errors

### 2. Import Check
```bash
# Check for broken imports
grep -r "from.*HRTHIS_" --include="*.ts" --include="*.tsx" .
```
**Expected:** 0 results

### 3. Service Index Check
Check `/services/index.ts` - all exports updated?

### 4. TypeScript Check
```bash
npx tsc --noEmit
```
**Expected:** ✅ No type errors

### 5. Visual Check
- [ ] Login Screen shows new logo
- [ ] Dashboard shows "Browo Koordinator"
- [ ] Mobile Nav shows new logo
- [ ] No console errors

---

## 🚨 ROLLBACK PLAN

If something breaks:

```bash
# Option 1: Git Reset (if committed before)
git reset --hard HEAD~1

# Option 2: Git Revert
git revert HEAD

# Option 3: Manual Restore
# Restore from backup
```

---

## 📞 NEXT STEPS AFTER RENAME

1. **Test Application**
   - Login works?
   - All screens load?
   - No console errors?

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: Rename HRTHIS → BrowoKo (Browo Koordinator)"
   ```

3. **Discuss Edge Functions**
   - How many edge functions do we need?
   - Modular architecture planning

---

## ❓ DEINE ENTSCHEIDUNG

**Was möchtest du machen?**

### Option A: Du rennst das Script ✅ EMPFOHLEN
```bash
chmod +x ./scripts/rename_hrthis_to_browoko.sh
./scripts/rename_hrthis_to_browoko.sh
```

### Option B: Claude macht es manuell
Sag: **"Claude, mach es manuell"**
(Dauert lange, ~450 Tool Calls)

### Option C: Wir machen es zusammen
Sag: **"Lass uns zusammen machen"**
(Du rennst Files um, Claude updated Content)

**Was ist dein Plan?** 🤔
