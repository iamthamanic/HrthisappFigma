# 🔥 **hr_ → HRTHIS_ MIGRATION PHASE**

## 📋 **ÜBERSICHT**

Diese Migration benennt **ALLE** `hr_` präfixierten Files in `HRTHIS_` um, um Konflikte mit dem HTML `<hr>` Tag zu vermeiden und technische Schulden zu verhindern.

**Umfang:**
- ~100+ Dateien
- ~1000+ Import-Statements
- **6 Stores, 20 Hooks, 5 Canvas Components, 16 Admin Components, 20+ Regular Components**

---

## 🎯 **MIGRATION BATCHES**

### **BATCH 1: STORES (6 Files)** ✅ COMPLETE

| Alt | Neu | Status |
|-----|-----|--------|
| `/stores/hr_authStore.ts` | `/stores/HRTHIS_authStore.ts` | ✅ DONE (already migrated) |
| `/stores/hr_adminStore.ts` | `/stores/HRTHIS_adminStore.ts` | ✅ DONE (already migrated) |
| `/stores/hr_documentStore.ts` | `/stores/HRTHIS_documentStore.ts` | ✅ DONE (already migrated) |
| `/stores/hr_learningStore.ts` | `/stores/HRTHIS_learningStore.ts` | ✅ DONE (already migrated) |
| `/stores/hr_organigramStore.ts` | `/stores/HRTHIS_organigramStore.ts` | ✅ DONE (already migrated) |
| `/stores/hr_timeStore.ts` | `/stores/HRTHIS_timeStore.ts` | ✅ DONE (already migrated) |

**Import-Statements aktualisiert:** ✅ 44+ Dateien (ALL DONE)

---

### **BATCH 2: HOOKS (20 Files)**

| Alt | Neu |
|-----|-----|
| `/hooks/hr_useBenefitsManagement.ts` | `/hooks/HRTHIS_useBenefitsManagement.ts` |
| `/hooks/hr_useCalendarScreen.ts` | `/hooks/HRTHIS_useCalendarScreen.ts` |
| `/hooks/hr_useCoverageChain.ts` | `/hooks/HRTHIS_useCoverageChain.ts` |
| `/hooks/hr_useDashboardOrganigram.ts` | `/hooks/HRTHIS_useDashboardOrganigram.ts` |
| `/hooks/hr_useDashboardStats.ts` | `/hooks/HRTHIS_useDashboardStats.ts` |
| `/hooks/hr_useDocumentsScreen.ts` | `/hooks/HRTHIS_useDocumentsScreen.ts` |
| `/hooks/hr_useEmployeeFiltering.ts` | `/hooks/HRTHIS_useEmployeeFiltering.ts` |
| `/hooks/hr_useLearningAdmin.ts` | `/hooks/HRTHIS_useLearningAdmin.ts` |
| `/hooks/hr_useLearningScreen.ts` | `/hooks/HRTHIS_useLearningScreen.ts` |
| `/hooks/hr_useLearningShop.ts` | `/hooks/HRTHIS_useLearningShop.ts` |
| `/hooks/hr_useLeaveManagement.ts` | `/hooks/HRTHIS_useLeaveManagement.ts` |
| `/hooks/hr_useLeaveReminders.ts` | `/hooks/HRTHIS_useLeaveReminders.ts` |
| `/hooks/hr_useLeaveRequestsList.ts` | `/hooks/HRTHIS_useLeaveRequestsList.ts` |
| `/hooks/hr_useOrganigramUserInfo.ts` | `/hooks/HRTHIS_useOrganigramUserInfo.ts` |
| `/hooks/hr_useTeamLeaves.ts` | `/hooks/HRTHIS_useTeamLeaves.ts` |
| `/hooks/hr_useTeamManagement.ts` | `/hooks/HRTHIS_useTeamManagement.ts` |
| `/hooks/hr_useTeamMemberDetails.ts` | `/hooks/HRTHIS_useTeamMemberDetails.ts` |
| `/hooks/hr_useTeamMemberForm.ts` | `/hooks/HRTHIS_useTeamMemberForm.ts` |
| `/hooks/hr_useTimeStats.ts` | `/hooks/HRTHIS_useTimeStats.ts` |
| `/hooks/hr_useTimeTracking.ts` | `/hooks/HRTHIS_useTimeTracking.ts` |
| `/hooks/hr_useVacationCarryover.ts` | `/hooks/HRTHIS_useVacationCarryover.ts` |

---

### **BATCH 3: CANVAS COMPONENTS (5 Files)**

| Alt | Neu |
|-----|-----|
| `/components/canvas/hr_CanvasControls.tsx` | `/components/canvas/HRTHIS_CanvasControls.tsx` |
| `/components/canvas/hr_CanvasHandlers.ts` | `/components/canvas/HRTHIS_CanvasHandlers.ts` |
| `/components/canvas/hr_CanvasOrgChart.tsx` | `/components/canvas/HRTHIS_CanvasOrgChart.tsx` |
| `/components/canvas/hr_CanvasTypes.ts` | `/components/canvas/HRTHIS_CanvasTypes.ts` |
| `/components/canvas/hr_CanvasUtils.ts` | `/components/canvas/HRTHIS_CanvasUtils.ts` |

---

### **BATCH 4: ADMIN COMPONENTS (16 Files)**

| Alt | Neu |
|-----|-----|
| `/components/admin/hr_AddEmployeeLoginSection.tsx` | `/components/admin/HRTHIS_AddEmployeeLoginSection.tsx` |
| `/components/admin/hr_AddEmployeePersonalSection.tsx` | `/components/admin/HRTHIS_AddEmployeePersonalSection.tsx` |
| `/components/admin/hr_AddEmployeeRoleSection.tsx` | `/components/admin/HRTHIS_AddEmployeeRoleSection.tsx` |
| `/components/admin/hr_AddressCard.tsx` | `/components/admin/HRTHIS_AddressCard.tsx` |
| `/components/admin/hr_BankInfoCard.tsx` | `/components/admin/HRTHIS_BankInfoCard.tsx` |
| `/components/admin/hr_BenefitCard.tsx` | `/components/admin/HRTHIS_BenefitCard.tsx` |
| `/components/admin/hr_BenefitDialog.tsx` | `/components/admin/HRTHIS_BenefitDialog.tsx` |
| `/components/admin/hr_ClothingSizesCard.tsx` | `/components/admin/HRTHIS_ClothingSizesCard.tsx` |
| `/components/admin/hr_CompanyBasicSettings.tsx` | `/components/admin/HRTHIS_CompanyBasicSettings.tsx` |
| `/components/admin/hr_CompanyLogoUpload.tsx` | `/components/admin/HRTHIS_CompanyLogoUpload.tsx` |
| `/components/admin/hr_DepartmentManager.tsx` | `/components/admin/HRTHIS_DepartmentManager.tsx` |
| `/components/admin/hr_EmployeesList.tsx` | `/components/admin/HRTHIS_EmployeesList.tsx` |
| `/components/admin/hr_EmploymentInfoCard.tsx` | `/components/admin/HRTHIS_EmploymentInfoCard.tsx` |
| `/components/admin/hr_LocationManager.tsx` | `/components/admin/HRTHIS_LocationManager.tsx` |
| `/components/admin/hr_PersonalInfoCard.tsx` | `/components/admin/HRTHIS_PersonalInfoCard.tsx` |
| `/components/admin/hr_TeamDialog.tsx` | `/components/admin/HRTHIS_TeamDialog.tsx` |
| `/components/admin/hr_TeamsList.tsx` | `/components/admin/HRTHIS_TeamsList.tsx` |

---

### **BATCH 5: REGULAR COMPONENTS (20+ Files)**

| Alt | Neu |
|-----|-----|
| `/components/hr_AvatarStatsGrid.tsx` | `/components/HRTHIS_AvatarStatsGrid.tsx` |
| `/components/hr_CalendarDayCell.tsx` | `/components/HRTHIS_CalendarDayCell.tsx` |
| `/components/hr_CalendarExportMenu.tsx` | `/components/HRTHIS_CalendarExportMenu.tsx` |
| `/components/hr_DashboardOrganigramCard.tsx` | `/components/HRTHIS_DashboardOrganigramCard.tsx` |
| `/components/hr_DashboardWelcomeHeader.tsx` | `/components/HRTHIS_DashboardWelcomeHeader.tsx` |
| `/components/hr_DocumentCard.tsx` | `/components/HRTHIS_DocumentCard.tsx` |
| `/components/hr_DocumentCategoryCards.tsx` | `/components/HRTHIS_DocumentCategoryCards.tsx` |
| `/components/hr_DocumentUploadDialog.tsx` | `/components/HRTHIS_DocumentUploadDialog.tsx` |
| `/components/hr_LearningEmptyState.tsx` | `/components/HRTHIS_LearningEmptyState.tsx` |
| `/components/hr_LearningStatsGrid.tsx` | `/components/HRTHIS_LearningStatsGrid.tsx` |
| `/components/hr_LevelMilestones.tsx` | `/components/HRTHIS_LevelMilestones.tsx` |
| `/components/hr_QuickStatsGrid.tsx` | `/components/HRTHIS_QuickStatsGrid.tsx` |
| `/components/hr_QuizCard.tsx` | `/components/HRTHIS_QuizCard.tsx` |
| `/components/hr_RecentSessionsList.tsx` | `/components/HRTHIS_RecentSessionsList.tsx` |
| `/components/hr_ShopEmptyState.tsx` | `/components/HRTHIS_ShopEmptyState.tsx` |
| `/components/hr_ShopInfoBox.tsx` | `/components/HRTHIS_ShopInfoBox.tsx` |
| `/components/hr_ShopItemCard.tsx` | `/components/HRTHIS_ShopItemCard.tsx` |
| `/components/hr_TimeStatsCards.tsx` | `/components/HRTHIS_TimeStatsCards.tsx` |
| `/components/hr_TimeTrackingCard.tsx` | `/components/HRTHIS_TimeTrackingCard.tsx` |
| `/components/hr_VideoCardWithProgress.tsx` | `/components/HRTHIS_VideoCardWithProgress.tsx` |
| `/components/hr_VideoCategoryFilter.tsx` | `/components/HRTHIS_VideoCategoryFilter.tsx` |
| `/components/hr_VideoListItem.tsx` | `/components/HRTHIS_VideoListItem.tsx` |
| `/components/hr_VideosListTab.tsx` | `/components/HRTHIS_VideosListTab.tsx` |

---

### **BATCH 6: UTILS (4 Files)**

| Alt | Neu | Status |
|-----|-----|--------|
| `/utils/HRTHIS_leaveApproverLogic.ts` | - | ✅ ALREADY DONE |
| `/utils/hr_organigramTransformers.ts` | `/utils/HRTHIS_organigramTransformers.ts` | ⏳ TODO |
| `/utils/hr_organizationHelper.ts` | `/utils/HRTHIS_organizationHelper.ts` | ⏳ TODO |
| `/utils/hr_videoHelper.ts` | `/utils/HRTHIS_videoHelper.ts` | ⏳ TODO |
| `/utils/hr_xpSystem.ts` | `/utils/HRTHIS_xpSystem.ts` | ⏳ TODO |

---

### **BATCH 7: CONFIG (1 File)**

| Alt | Neu | Status |
|-----|-----|--------|
| `/config/HRTHIS_projectConfig.ts` | - | ✅ ALREADY DONE |

---

## 📊 **STATISTIK**

- **Gesamt Files:** ~107 Dateien
- **Import-Statements:** ~1000+
- **Batches:** 7
- **Status:** ✅ 3 Files done (2 Utils, 1 Config, 1 Store)

---

## 🚀 **NÄCHSTE SCHRITTE**

1. ✅ **BATCH 1 - Stores** fertigstellen (5 noch zu tun)
2. ⏳ **BATCH 2 - Hooks** (20 Files)
3. ⏳ **BATCH 3 - Canvas Components** (5 Files)
4. ⏳ **BATCH 4 - Admin Components** (16 Files)
5. ⏳ **BATCH 5 - Regular Components** (20+ Files)
6. ⏳ **BATCH 6 - Utils** (3 Files)
7. ⏳ **Alle Import-Statements aktualisieren**
8. ⏳ **Test & Verify**

---

## ⚠️ **WICHTIG**

Diese Migration ist **MASSIV** und wird die Codebase signifikant ändern. Bitte:

1. **Backup erstellen** vor Start
2. **Batch-weise** vorgehen (nicht alles auf einmal)
3. **Testen** nach jedem Batch
4. **Commit** nach erfolgreichen Batches

---

**Status:** 🔄 IN PROGRESS  
**Gestartet:** 2025-01-09  
**Phase:** Refactoring Phase 2.5 (NEW)
