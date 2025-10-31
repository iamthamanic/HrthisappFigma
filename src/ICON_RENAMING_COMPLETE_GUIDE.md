# 🎯 Icon-Dateien Renaming - Komplettanleitung

## Problem
Die Icon-Dateien `HRTHISIcons.tsx` und `HRTHISIcons_NEW.tsx` werden von **~50 Dateien** importiert.

## Lösung

### **STEP 1: Icon-Dateien umbenennen**

```bash
# Umbenennen
mv components/icons/HRTHISIcons.tsx components/icons/BrowoKoIcons.tsx
mv components/icons/HRTHISIcons_NEW.tsx components/icons/BrowoKoIcons_NEW.tsx

# Inhalte aktualisieren (Kommentare)
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons.tsx
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons_NEW.tsx
```

### **STEP 2: Alle Imports aktualisieren**

```bash
# Find und Replace in allen TypeScript-Dateien
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  -exec sed -i '' \
    -e "s|from './icons/HRTHISIcons'|from './icons/BrowoKoIcons'|g" \
    -e "s|from \"./icons/HRTHISIcons\"|from \"./icons/BrowoKoIcons\"|g" \
    -e "s|from '../icons/HRTHISIcons'|from '../icons/BrowoKoIcons'|g" \
    -e "s|from \"../icons/HRTHISIcons\"|from \"../icons/BrowoKoIcons\"|g" \
    -e "s|from '../../components/icons/HRTHISIcons'|from '../../components/icons/BrowoKoIcons'|g" \
    -e "s|from \"../../components/icons/HRTHISIcons\"|from \"../../components/icons/BrowoKoIcons\"|g" \
    -e "s|from './components/icons/HRTHISIcons'|from './components/icons/BrowoKoIcons'|g" \
    -e "s|from \"./components/icons/HRTHISIcons\"|from \"./components/icons/BrowoKoIcons\"|g" \
    {} +

echo "✅ All icon imports updated!"
```

### **STEP 3: Verification**

```bash
# Check for remaining HRTHISIcons references
grep -r "HRTHISIcons" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .

# Should return NO results from component files, only from docs/md files
```

## Betroffene Dateien (47 total)

<details>
<summary>Komplette Liste der betroffenen Dateien</summary>

```
components/AchievementBadge.tsx
components/ActivityFeed.tsx
components/AdminMobileMenu.tsx
components/AdminRequestLeaveDialog.tsx
components/AnnouncementContentEditor.tsx
components/AssignEmployeesDialog.tsx
components/AvatarDisplay.tsx
components/AvatarEditor.tsx
components/BulkActionsBar.tsx
components/BulkDocumentUploadDialog.tsx
components/BulkEditDialog.tsx
components/ConnectionError.tsx
components/CreateNodeDialog.tsx
components/CreateVideoDialog.tsx
components/DeleteVideoDialog.tsx
components/DraggableOrgChart.tsx
components/EditDepartmentDialog.tsx
components/EditNodeDialog.tsx
components/EditVideoDialog.tsx
components/EmptyState.tsx
components/ErrorBoundary.tsx
components/ErrorBoundaryAdvanced.tsx
components/ExportDialog.tsx
components/ForgotPassword.tsx
components/ImageCropDialog.tsx
components/LiveStats.tsx
components/LoadingState.tsx
components/MeineDaten.tsx
components/MigrationRequiredAlert.tsx
components/MobileNav.tsx
components/ModernOrgChart.tsx
components/MonthYearPicker.tsx
components/NotificationCenter.tsx
components/OnlineUsers.tsx
components/OrgChart.tsx
components/OrgNode.tsx
components/PermissionsEditor.tsx
components/PermissionsView.tsx
components/QuickActionsMenu.tsx
components/QuickAwardCoinsDialog.tsx
components/QuickEditDialog.tsx
components/QuickNoteDialog.tsx
components/QuickUploadDocumentDialog.tsx
components/QuizPlayer.tsx
components/Register.tsx
components/RequestLeaveDialog.tsx
components/ResetPassword.tsx
components/SavedSearchesDropdown.tsx
... und weitere ~20 Dateien
```

</details>

## Alternative: Manuelle Methode (falls sed nicht verfügbar)

Verwende VS Code oder einen anderen Editor:

1. **Find:** `from './icons/HRTHISIcons'`
   **Replace:** `from './icons/BrowoKoIcons'`

2. **Find:** `from "../icons/HRTHISIcons"`
   **Replace:** `from "../icons/BrowoKoIcons"`

3. **Find:** `from "../../components/icons/HRTHISIcons"`
   **Replace:** `from "../../components/icons/BrowoKoIcons"`

Führe jeden Replace für das gesamte Projekt aus (Replace All).

## Nach dem Renaming

```bash
# Test build
npm run build

# Or in Figma Make: Just save and let it auto-build
```

Wenn der Build erfolgreich ist, ist das Icon-Renaming komplett! ✅
