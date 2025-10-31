# 🎯 HRTHIS → BrowoKo Renaming - Finaler Status

**Datum:** 2025-01-27  
**Migration:** HRTHIS zu Browo Koordinator (BrowoKo)  
**Status:** 85% Komplett

---

## ✅ **KOMPLETT UMBENANNT (200+ Dateien)**

### **Services** (14 Dateien) ✅
- Alle `HRTHIS_*Service.ts` → `BrowoKo_*Service.ts`
- Service-Index aktualisiert

### **Components** (140+ Dateien) ✅
- Alle Dateinamen umbenannt
- ⚠️ **NOTE:** ~10 Komponenten haben noch `export default function HRTHIS_*` im Code

### **Screens** (19 Dateien) ✅
- Alle Screen-Dateien umbenannt

### **Stores** (7 Dateien) ✅
- Alle Store-Dateien umbenannt

### **Hooks** (33 Dateien) ✅
- Alle Hook-Dateien umbenannt

### **Schemas** (6 Dateien) ✅
- Alle Schema-Dateien umbenannt

### **Config** (2 Dateien) ✅
- `HRTHIS_projectConfig.ts` → `BrowoKo_projectConfig.ts`
- `HRTHIS_performanceBudgets.ts` → `BrowoKo_performanceBudgets.ts`

### **Utils** (1 Datei) ✅
- `HRTHIS_xpSystem.ts` → `BrowoKo_xpSystem.ts`

### **Resilience** (1 Datei) ✅  
- `HRTHIS_circuitBreaker.ts` → `BrowoKo_circuitBreaker.ts`

---

## ❌ **NOCH ZU ERLEDIGEN (19 Dateien)**

### **1. Icon-Dateien** (2 Dateien) - **KRITISCH** 🔴

```bash
/components/icons/HRTHISIcons.tsx → BrowoKoIcons.tsx
/components/icons/HRTHISIcons_NEW.tsx → BrowoKoIcons_NEW.tsx
```

**Problem:** Diese werden von ~100+ Dateien importiert!

**Lösung:**
```bash
# 1. Dateien umbenennen
mv components/icons/HRTHISIcons.tsx components/icons/BrowoKoIcons.tsx
mv components/icons/HRTHISIcons_NEW.tsx components/icons/BrowoKoIcons_NEW.tsx

# 2. Alle Imports aktualisieren (in allen .tsx/.ts Dateien)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s/from '\.\/icons\/HRTHISIcons'/from '.\/icons\/BrowoKoIcons'/g" \
  -e "s/from '\.\.\/icons\/HRTHISIcons'/from '..\/icons\/BrowoKoIcons'/g" \
  -e "s/from '\.\.\/\.\.\/components\/icons\/HRTHISIcons'/from '..\/..\/components\/icons\/BrowoKoIcons'/g" \
  {} +

# 3. Dateiinhalte aktualisieren
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons.tsx
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons_NEW.tsx
```

### **2. Utils/Resilience** (2 Dateien) 🟡

```bash
/utils/resilience/HRTHIS_retry.ts → BrowoKo_retry.ts
/utils/resilience/HRTHIS_timeout.ts → BrowoKo_timeout.ts
```

**Commands:**
```bash
# Umbenennen
mv utils/resilience/HRTHIS_retry.ts utils/resilience/BrowoKo_retry.ts
mv utils/resilience/HRTHIS_timeout.ts utils/resilience/BrowoKo_timeout.ts

# Inhalte aktualisieren
sed -i '' 's/HRTHIS_/BrowoKo_/g' utils/resilience/BrowoKo_retry.ts
sed -i '' 's/HRTHIS_/BrowoKo_/g' utils/resilience/BrowoKo_timeout.ts

# Index-Datei aktualisieren
sed -i '' 's/HRTHIS_/BrowoKo_/g' utils/resilience/index.ts
```

### **3. Utils/Notifications** (1 Datei) 🟡

```bash
/utils/notifications/HRTHIS_notificationTriggers.ts → BrowoKo_notificationTriggers.ts
```

**Commands:**
```bash
mv utils/notifications/HRTHIS_notificationTriggers.ts utils/notifications/BrowoKo_notificationTriggers.ts
sed -i '' 's/HRTHIS_/BrowoKo_/g' utils/notifications/BrowoKo_notificationTriggers.ts
```

### **4. Utils/Security** (5 Dateien) 🟡

**ACHTUNG:** `HRTHIS_sanitization.ts` und `HRTHIS_securityHeaders.ts` existieren bereits als `BrowoKo_*` Versionen!

```bash
# Diese können direkt gelöscht werden (Duplikate):
rm utils/security/HRTHIS_sanitization.ts
rm utils/security/HRTHIS_securityHeaders.ts

# Diese müssen umbenannt werden:
mv utils/security/HRTHIS_bruteForceProtection.ts utils/security/BrowoKo_bruteForceProtection.ts
mv utils/security/HRTHIS_passwordPolicies.ts utils/security/BrowoKo_passwordPolicies.ts
mv utils/security/HRTHIS_securityTest.ts utils/security/BrowoKo_securityTest.ts
mv utils/security/HRTHIS_sessionManager.ts utils/security/BrowoKo_sessionManager.ts
mv utils/security/HRTHIS_validation.ts utils/security/BrowoKo_validation.ts

# Inhalte aktualisieren
for file in utils/security/BrowoKo_*.ts; do
  sed -i '' 's/HRTHIS_/BrowoKo_/g' "$file"
done
```

### **5. Scripts** (6 Dateien) 🟢 - **OPTIONAL**

Diese Dateien sind nicht kritisch für die Laufzeit:

```bash
scripts/HRTHIS_buildProduction.sh → BrowoKo_buildProduction.sh
scripts/HRTHIS_bundleAnalyzer.js → BrowoKo_bundleAnalyzer.js
scripts/HRTHIS_dependencyScanner.js → BrowoKo_dependencyScanner.js
scripts/HRTHIS_performanceBudgetCheck.js → BrowoKo_performanceBudgetCheck.js
scripts/HRTHIS_securityAudit.js → BrowoKo_securityAudit.js
scripts/HRTHIS_securityAuditComplete.js → BrowoKo_securityAuditComplete.js
```

**Commands:**
```bash
cd scripts
for file in HRTHIS_*; do
  newname=$(echo "$file" | sed 's/HRTHIS_/BrowoKo_/')
  mv "$file" "$newname"
  sed -i '' 's/HRTHIS_/BrowoKo_/g' "$newname"
  sed -i '' 's/HRthis/Browo Koordinator/g' "$newname"
done
cd ..
```

---

## ⚠️ **FUNKTIONSBEZEICHNUNGEN ZU KORRIGIEREN**

Diese Komponenten haben umbenannte Dateinamen, aber noch `export default function HRTHIS_*`:

```tsx
// BrowoKo_BenefitApprovalDialog.tsx
export default function HRTHIS_BenefitApprovalDialog → BrowoKo_BenefitApprovalDialog

// BrowoKo_BenefitBrowseCard.tsx
export default function HRTHIS_BenefitBrowseCard → BrowoKo_BenefitBrowseCard

// BrowoKo_BenefitRequestDialog.tsx
export default function HRTHIS_BenefitRequestDialog → BrowoKo_BenefitRequestDialog

// BrowoKo_CoinAchievementCard.tsx
export default function HRTHIS_CoinAchievementCard → BrowoKo_CoinAchievementCard
interface HRTHIS_CoinAchievementCardProps → BrowoKo_CoinAchievementCardProps

// BrowoKo_CoinStatsDialog.tsx
export default function HRTHIS_CoinStatsDialog → BrowoKo_CoinStatsDialog

// BrowoKo_CoinWalletWidget.tsx
export default function HRTHIS_CoinWalletWidget → BrowoKo_CoinWalletWidget

// BrowoKo_DashboardAnnouncementCard.tsx
export default function HRTHIS_DashboardAnnouncementCard → BrowoKo_DashboardAnnouncementCard

// BrowoKo_LearningAvatarWidget.tsx
export default function HRTHIS_LearningAvatarWidget → BrowoKo_LearningAvatarWidget

// BrowoKo_MyBenefitsCard.tsx
export default function HRTHIS_MyBenefitsCard → BrowoKo_MyBenefitsCard
```

**Fix Command:**
```bash
# Automatisch alle Funktionsbezeichnungen aktualisieren
find components -name "BrowoKo_*.tsx" -exec sed -i '' \
  -e 's/export default function HRTHIS_/export default function BrowoKo_/g' \
  -e 's/interface HRTHIS_/interface BrowoKo_/g' \
  -e 's/type HRTHIS_/type BrowoKo_/g' \
  {} +
```

---

## 📋 **KOMPLETTES AUTOMATISIERUNGS-SCRIPT**

Speichere dies als `complete_renaming.sh` und führe es aus:

```bash
#!/bin/bash
set -e

echo "🚀 Starting Complete HRTHIS → BrowoKo Renaming..."
echo "=================================================="

# 1. Icons umbenennen
echo "📦 Step 1: Renaming Icon Files"
mv components/icons/HRTHISIcons.tsx components/icons/BrowoKoIcons.tsx 2>/dev/null || true
mv components/icons/HRTHISIcons_NEW.tsx components/icons/BrowoKoIcons_NEW.tsx 2>/dev/null || true

# 2. Icon-Imports aktualisieren
echo "📦 Step 2: Updating Icon Imports"
find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" -exec sed -i '' \
  -e "s/from '\.\/icons\/HRTHISIcons'/from '.\/icons\/BrowoKoIcons'/g" \
  -e "s/from '\.\.\/icons\/HRTHISIcons'/from '..\/icons\/BrowoKoIcons'/g" \
  -e "s/from '\.\.\/\.\.\/components\/icons\/HRTHISIcons'/from '..\/..\/components\/icons\/BrowoKoIcons'/g" \
  -e "s/'\.\/components\/icons\/HRTHISIcons'/'.\/ components\/icons\/BrowoKoIcons'/g" \
  {} + 2>/dev/null || true

# 3. Resilience Utils
echo "📦 Step 3: Renaming Resilience Utils"
mv utils/resilience/HRTHIS_retry.ts utils/resilience/BrowoKo_retry.ts 2>/dev/null || true
mv utils/resilience/HRTHIS_timeout.ts utils/resilience/BrowoKo_timeout.ts 2>/dev/null || true

# 4. Notification Utils
echo "📦 Step 4: Renaming Notification Utils"
mv utils/notifications/HRTHIS_notificationTriggers.ts utils/notifications/BrowoKo_notificationTriggers.ts 2>/dev/null || true

# 5. Security Utils (remove duplicates first)
echo "📦 Step 5: Renaming Security Utils"
rm -f utils/security/HRTHIS_sanitization.ts utils/security/HRTHIS_securityHeaders.ts
mv utils/security/HRTHIS_bruteForceProtection.ts utils/security/BrowoKo_bruteForceProtection.ts 2>/dev/null || true
mv utils/security/HRTHIS_passwordPolicies.ts utils/security/BrowoKo_passwordPolicies.ts 2>/dev/null || true
mv utils/security/HRTHIS_securityTest.ts utils/security/BrowoKo_securityTest.ts 2>/dev/null || true
mv utils/security/HRTHIS_sessionManager.ts utils/security/BrowoKo_sessionManager.ts 2>/dev/null || true
mv utils/security/HRTHIS_validation.ts utils/security/BrowoKo_validation.ts 2>/dev/null || true

# 6. Scripts
echo "📦 Step 6: Renaming Scripts"
cd scripts
for file in HRTHIS_*; do
  [ -f "$file" ] || continue
  newname=$(echo "$file" | sed 's/HRTHIS_/BrowoKo_/')
  mv "$file" "$newname" 2>/dev/null || true
done
cd ..

# 7. Update all file contents
echo "📦 Step 7: Updating File Contents"
find . -type f \( -name "BrowoKo_*.ts" -o -name "BrowoKo_*.tsx" -o -name "BrowoKo_*.js" -o -name "BrowoKo_*.sh" \) \
  ! -path "*/node_modules/*" \
  -exec sed -i '' 's/HRTHIS_/BrowoKo_/g' {} + 2>/dev/null || true

# 8. Fix function declarations
echo "📦 Step 8: Fixing Function Declarations"
find components -name "BrowoKo_*.tsx" -exec sed -i '' \
  -e 's/export default function HRTHIS_/export default function BrowoKo_/g' \
  -e 's/interface HRTHIS_/interface BrowoKo_/g' \
  -e 's/type HRTHIS_/type BrowoKo_/g' \
  {} + 2>/dev/null || true

echo ""
echo "✅ Renaming Complete!"
echo "=================================================="
echo "📊 Next Steps:"
echo "  1. Test build: npm run build"
echo "  2. Check for remaining HRTHIS references: grep -r 'HRTHIS_' --exclude-dir=node_modules"
echo "  3. Commit changes"
echo ""
```

---

## 🧪 **VERIFICATION COMMANDS**

Nach dem Renaming:

```bash
# Check für verbleibende HRTHIS Referenzen
grep -r "HRTHIS_" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .

# Check für HRTHISIcons Imports
grep -r "HRTHISIcons" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .

# Anzahl umbenannter Dateien
find . -name "BrowoKo_*" | wc -l

# Build testen
npm run build
```

---

## 📈 **PROGRESS TRACKER**

- ✅ Services: 14/14 (100%)
- ✅ Components: 140/140 (100% Dateinamen, 90% Code)
- ✅ Screens: 19/19 (100%)
- ✅ Stores: 7/7 (100%)
- ✅ Hooks: 33/33 (100%)
- ✅ Schemas: 6/6 (100%)
- ✅ Config: 2/2 (100%)
- ✅ Utils: 2/12 (17%)
- ❌ Icons: 0/2 (0%)
- ❌ Scripts: 0/6 (0%)

**Gesamt: ~210/235 Dateien (89%)**

---

## 🎯 **EDGE FUNCTIONS TODO**

Nach dem Renaming sollten die Edge Functions modularisiert werden:

```
/supabase/functions/server/
├── index.tsx (Router)
├── modules/
│   ├── auth.ts
│   ├── documents.ts
│   ├── learning.ts
│   ├── benefits.ts
│   └── notifications.ts
└── kv_store.tsx (existing)
```

Dies ist Teil des ursprünglichen Ziels einer **modularen Multi-Function Edge Function Architektur**.
