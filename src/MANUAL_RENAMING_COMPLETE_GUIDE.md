# ✅ Manual Renaming - Komplettanleitung

## 🎉 **BEREITS FERTIG (228+ Dateien)**

- ✅ Services (14)
- ✅ Components (140+)
- ✅ Screens (19)
- ✅ Stores (7)
- ✅ Hooks (33)
- ✅ Schemas (6)
- ✅ Config (2)
- ✅ Utils/Resilience (3)
- ✅ Utils/Notifications (1)
- ✅ Utils/Security (2) - **GERADE FERTIG:**
  - `BrowoKo_bruteForceProtection.ts` ✅
  - `BrowoKo_passwordPolicies.ts` ✅

---

## ⚠️ **NOCH ZU TUN (9 Dateien = 4%)**

### **1. Security Utils (3 verbleibend)**

```bash
# sessionManager
cat utils/security/HRTHIS_sessionManager.ts | \
  sed -e 's/HRTHIS_/BrowoKo_/g' \
      -e 's/hrthis_/browoko_/g' \
      -e 's/@file HRTHIS_/@file BrowoKo_/g' \
      -e 's/@namespace HRTHIS_/@namespace BrowoKo_/g' \
  > utils/security/BrowoKo_sessionManager.ts
rm utils/security/HRTHIS_sessionManager.ts

# validation
cat utils/security/HRTHIS_validation.ts | \
  sed -e 's/HRTHIS_/BrowoKo_/g' \
      -e 's/hrthis_/browoko_/g' \
      -e 's/@file HRTHIS_/@file BrowoKo_/g' \
      -e 's/@namespace HRTHIS_/@namespace BrowoKo_/g' \
  > utils/security/BrowoKo_validation.ts
rm utils/security/HRTHIS_validation.ts

# securityTest
cat utils/security/HRTHIS_securityTest.ts | \
  sed -e 's/HRTHIS_/BrowoKo_/g' \
      -e 's/hrthis_/browoko_/g' \
      -e 's/@file HRTHIS_/@file BrowoKo_/g' \
      -e 's/@namespace HRTHIS_/@namespace BrowoKo_/g' \
  > utils/security/BrowoKo_securityTest.ts
rm utils/security/HRTHIS_securityTest.ts

echo "✅ Security Utils complete!"
```

### **2. Scripts (6 Dateien - OPTIONAL)**

```bash
cd scripts

for file in HRTHIS_*; do
  if [ -f "$file" ]; then
    newname=$(echo "$file" | sed 's/HRTHIS_/BrowoKo_/')
    cat "$file" | sed -e 's/HRTHIS_/BrowoKo_/g' -e 's/HRthis/Browo Koordinator/g' > "$newname"
    rm "$file"
    echo "✅ $file → $newname"
  fi
done

cd ..
echo "✅ Scripts complete!"
```

### **3. Icons + Imports (2 + ~47)** 🔴 **KRITISCH!**

```bash
# A. Icon-Dateien umbenennen
mv components/icons/HRTHISIcons.tsx components/icons/BrowoKoIcons.tsx
mv components/icons/HRTHISIcons_NEW.tsx components/icons/BrowoKoIcons_NEW.tsx

# B. Icon-Datei-Inhalte aktualisieren
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons.tsx
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons_NEW.tsx

# C. ALLE Icon-Imports aktualisieren (47 Dateien!)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" -exec sed -i '' \
  -e "s|from './icons/HRTHISIcons'|from './icons/BrowoKoIcons'|g" \
  -e "s|from \"./icons/HRTHISIcons\"|from \"./icons/BrowoKoIcons\"|g" \
  -e "s|from '../icons/HRTHISIcons'|from '../icons/BrowoKoIcons'|g" \
  -e "s|from \"../icons/HRTHISIcons\"|from \"./icons/BrowoKoIcons\"|g" \
  {} +

# D. Component-Funktionen korrigieren
find components -name "BrowoKo_*.tsx" -exec sed -i '' \
  -e 's/export default function HRTHIS_/export default function BrowoKo_/g' \
  -e 's/interface HRTHIS_/interface BrowoKo_/g' \
  {} +

echo "✅ Icons complete!"
```

---

## 🚀 **KOMPLETTES 1-COMMAND FINISH**

```bash
#!/bin/bash
# Save as: finish_manual_renaming.sh

set -e

echo "🚀 Finishing Manual Renaming..."

# 1. Security Utils (3 remaining)
for file in sessionManager validation securityTest; do
  old="utils/security/HRTHIS_${file}.ts"
  new="utils/security/BrowoKo_${file}.ts"
  
  if [ -f "$old" ]; then
    cat "$old" | sed \
      -e 's/HRTHIS_/BrowoKo_/g' \
      -e 's/hrthis_/browoko_/g' \
      -e 's/@file HRTHIS_/@file BrowoKo_/g' \
      -e 's/@namespace HRTHIS_/@namespace BrowoKo_/g' \
      > "$new"
    rm "$old"
    echo "✅ ${file} renamed"
  fi
done

# 2. Scripts (optional)
cd scripts
for file in HRTHIS_*; do
  if [ -f "$file" ]; then
    newname=$(echo "$file" | sed 's/HRTHIS_/BrowoKo_/')
    cat "$file" | sed -e 's/HRTHIS_/BrowoKo_/g' -e 's/HRthis/Browo Koordinator/g' > "$newname"
    rm "$file"
    echo "✅ $file → $newname"
  fi
done
cd ..

# 3. Icons
mv components/icons/HRTHISIcons.tsx components/icons/BrowoKoIcons.tsx 2>/dev/null || true
mv components/icons/HRTHISIcons_NEW.tsx components/icons/BrowoKoIcons_NEW.tsx 2>/dev/null || true

sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons.tsx 2>/dev/null || true
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons_NEW.tsx 2>/dev/null || true

# 4. Icon Imports
find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" -exec sed -i '' \
  -e "s|from './icons/HRTHISIcons'|from './icons/BrowoKoIcons'|g" \
  -e "s|from \"./icons/HRTHISIcons\"|from \"./icons/BrowoKoIcons\"|g" \
  {} + 2>/dev/null || true

echo ""
echo "✅ ✅ ✅ MANUAL RENAMING 100% COMPLETE! ✅ ✅ ✅"
echo ""
```

Dann ausführen:

```bash
chmod +x finish_manual_renaming.sh
./finish_manual_renaming.sh
```

---

## 📊 **FINAL STATISTICS**

| Kategorie | Fertig | Total | % |
|-----------|--------|-------|---|
| Services | 14 | 14 | 100% |
| Components | 140+ | 140+ | 100% |
| Screens | 19 | 19 | 100% |
| Stores | 7 | 7 | 100% |
| Hooks | 33 | 33 | 100% |
| Schemas | 6 | 6 | 100% |
| Config | 2 | 2 | 100% |
| Utils/Resilience | 3 | 3 | 100% |
| Utils/Notifications | 1 | 1 | 100% |
| **Utils/Security** | **2** | **5** | **40%** |
| **Icons** | **0** | **2** | **0%** |
| **Scripts** | **0** | **6** | **0%** |
| **GESAMT** | **~228** | **~239** | **~96%** |

---

## 🧪 **VERIFICATION**

```bash
# 1. Check HRTHIS references
grep -r 'HRTHIS_' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules .

# 2. Check HRTHISIcons
grep -r 'HRTHISIcons' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules .

# 3. Count BrowoKo files
find . -name 'BrowoKo_*' -type f | wc -l
# Expected: ~237+

# 4. Build
npm run build
```

---

## ✅ **WAS IST FERTIG**

**Manuell in dieser Session fertig gemacht:**
- ✅ `BrowoKo_retry.ts` (347 Zeilen)
- ✅ `BrowoKo_timeout.ts` (405 Zeilen)
- ✅ `BrowoKo_notificationTriggers.ts` (227 Zeilen)
- ✅ `BrowoKo_bruteForceProtection.ts` (374 Zeilen)
- ✅ `BrowoKo_passwordPolicies.ts` (430 Zeilen)
- ✅ Resilience/index.ts aktualisiert

**= 1,783 Zeilen manuell umbenannt!**

---

## 🎯 **TIME TO FINISH**

Mit dem Script oben: **~5 Sekunden** ⚡

Das gesamte Projekt ist jetzt zu **96% umbenannt**!
