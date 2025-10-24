# 🔧 NUCLEAR FIX: ALL SelectItem Keys

## 📊 ANALYSIS

**Found 109 SelectItems across 17 files:**

1. `/components/SortControls.tsx` - SORT OPTIONS
2. `/components/QuickEditDialog.tsx` - Departments & Locations
3. `/components/QuickUploadDocumentDialog.tsx` - Document categories
4. `/components/BulkEditDialog.tsx` - Locations & Departments
5. `/components/CreateVideoDialog.tsx` - Video categories
6. `/components/EditVideoDialog.tsx` - Video categories
7. `/components/EditDepartmentDialog.tsx` - Parent department & Manager select
8. `/components/RequestLeaveDialog.tsx` - User selection
9. `/components/AdminRequestLeaveDialog.tsx` - User selection
10. `/components/LeaveRequestsList.tsx` - Status filter
11. `/components/WorkTimeModelCard.tsx` - Work time models
12. `/components/HRTHIS_DocumentUploadDialog.tsx` - Document categories
13. `/screens/admin/AddEmployeeScreen.tsx` - **ALREADY FIXED** ✅
14. `/components/admin/HRTHIS_AddEmployeeRoleSection.tsx` - **ALREADY FIXED** ✅
15. `/components/admin/HRTHIS_BenefitDialog.tsx` - Icon & Color selection
16. `/components/admin/HRTHIS_EmployeesList.tsx` - Filter selects
17. `/components/admin/HRTHIS_EmploymentInfoCard.tsx` - Department & Employment type

## 🎯 STRATEGY

**Add unique prefixes to ALL keys:**

| File | Current Keys | New Prefix |
|------|-------------|------------|
| SortControls | `{option.value}` | `sort-` |
| QuickEditDialog | `{dept.id}`, `{loc.id}`, `""` | `quick-edit-dept-`, `quick-edit-loc-` |
| QuickUploadDoc | `"VERTRAG"`, etc | `quick-upload-` |
| BulkEditDialog | `{dept.id}`, `{loc.id}`, `""` | `bulk-dept-`, `bulk-loc-` |
| CreateVideoDialog | `"MANDATORY"`, etc | `create-video-` |
| EditVideoDialog | `"MANDATORY"`, etc | `edit-video-` |
| EditDepartmentDialog | `{dept.id}`, `"none"` | `edit-dept-parent-`, `edit-dept-manager-` |
| RequestLeaveDialog | `{user.id}` | `req-leave-user-` |
| AdminRequestLeaveDialog | `{user.id}` | `admin-leave-user-` |
| LeaveRequestsList | `"ALL"`, etc | `leave-filter-` |
| WorkTimeModelCard | `"none"`, etc | `work-time-` |
| HRTHIS_DocumentUploadDialog | `"VERTRAG"`, etc | `hrthis-upload-` |
| HRTHIS_BenefitDialog | `{option.value}` | `benefit-icon-`, `benefit-color-` |
| HRTHIS_EmployeesList | `"all"`, `{dept.id}`, etc | `emp-list-status-`, `emp-list-dept-`, etc |
| HRTHIS_EmploymentInfoCard | `"none"`, `{dept.id}`, etc | `emp-info-dept-`, `emp-info-type-` |

## ✅ FILES TO FIX

Total: **13 files** (2 already fixed)

---

## 🚀 ACTION REQUIRED

I will now fix ALL 13 files in ONE GO!

This will ensure NO duplicate keys anywhere in the codebase!
