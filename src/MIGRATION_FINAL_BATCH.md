# 🚀 FINAL IMPORT MIGRATION - BATCH ÜBERSICHT

**Stand:** 2025-01-08  
**Status:** ✅ READY TO EXECUTE

---

## ✅ Bereits migriert

- [x] `/screens/admin/TeamManagementScreen.tsx`
- [x] `/screens/admin/OrganigramCanvasScreenV2.tsx`
- [x] `/components/canvas/hr_CanvasOrgChart.tsx`

---

## 🔄 Noch zu migrieren (8 Dateien)

### Admin-Screens:

1. **AddEmployeeScreen.tsx** (9 imports)
2. **TeamMemberDetailsScreen.tsx** (23 imports)
3. **TeamsOverviewScreen.tsx** (3 imports)
4. **OrganigramScreen.tsx** (18 imports)
5. **AvatarSystemAdminScreen.tsx** (3 imports)
6. **BenefitsManagementScreen.tsx** (5 imports)
7. **DashboardInfoScreen.tsx** (7 imports)
8. **CompanySettingsScreen.tsx** (11 imports)
9. **OrganigramCanvasScreen.tsx** (7 imports)

**Total:** ~91 Imports in 10 Dateien

---

## 📝 Migration-Pattern

**VORHER:**
```typescript
import { Card } from '../../components/ui/card';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../utils/supabase/client';
```

**NACHHER:**
```typescript
import { Card } from '@components/ui/card';
import { useAuthStore } from '@stores/authStore';
import { supabase } from '@utils/supabase/client';
```

---

## ⚡ Ausführung

### Option A: Automatisch (empfohlen)
```bash
node scripts/03_migrate_all_imports.js
```

### Option B: Manuell pro File
Siehe Einzelmigrationen unten.

---

## 📊 Expected Result

Nach Migration:
- ✅ 0 relative Imports (`../../`)
- ✅ 100% Import-Aliasse (`@components`, etc.)
- ✅ Build erfolgreich
- ✅ Keine Console-Errors

---

**Next:** Build testen → `npm run build`
