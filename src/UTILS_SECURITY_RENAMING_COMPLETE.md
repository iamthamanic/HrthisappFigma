# ✅ Utils/Security Renaming - Abschlussbericht

## ✅ **FERTIG UMBENANNT:**

### **Resilience (3/3)** ✅
- `BrowoKo_circuitBreaker.ts` ✅
- `BrowoKo_retry.ts` ✅
- `BrowoKo_timeout.ts` ✅
- `index.ts` - Imports aktualisiert ✅

### **Notifications (1/1)** ✅
- `BrowoKo_notificationTriggers.ts` ✅

### **Sonstige (1/1)** ✅
- `BrowoKo_xpSystem.ts` ✅

---

## ⚠️ **NOCH ZU ERLEDIGEN:**

### **Security (5 Dateien)** 🟡

```bash
HRTHIS_bruteForceProtection.ts → BrowoKo_bruteForceProtection.ts
HRTHIS_passwordPolicies.ts → BrowoKo_passwordPolicies.ts
HRTHIS_securityTest.ts → BrowoKo_securityTest.ts
HRTHIS_sessionManager.ts → BrowoKo_sessionManager.ts
HRTHIS_validation.ts → BrowoKo_validation.ts
```

### **Scripts (6 Dateien)** 🟢 **OPTIONAL**

```bash
HRTHIS_buildProduction.sh → BrowoKo_buildProduction.sh
HRTHIS_bundleAnalyzer.js → BrowoKo_bundleAnalyzer.js
HRTHIS_dependencyScanner.js → BrowoKo_dependencyScanner.js
HRTHIS_performanceBudgetCheck.js → BrowoKo_performanceBudgetCheck.js
HRTHIS_securityAudit.js → BrowoKo_securityAudit.js
HRTHIS_securityAuditComplete.js → BrowoKo_securityAuditComplete.js
```

---

## 🚀 **SECURITY UTILS RENAMING - COPY/PASTE COMMANDS**

Diese Commands können direkt im Terminal ausgeführt werden:

```bash
# Security Utils umbenennen
cd utils/security

# bruteForceProtection
if [ -f "HRTHIS_bruteForceProtection.ts" ]; then
  cat HRTHIS_bruteForceProtection.ts | sed 's/HRTHIS_/BrowoKo_/g' > BrowoKo_bruteForceProtection.ts
  rm HRTHIS_bruteForceProtection.ts
  echo "✅ bruteForceProtection renamed"
fi

# passwordPolicies
if [ -f "HRTHIS_passwordPolicies.ts" ]; then
  cat HRTHIS_passwordPolicies.ts | sed 's/HRTHIS_/BrowoKo_/g' > BrowoKo_passwordPolicies.ts
  rm HRTHIS_passwordPolicies.ts
  echo "✅ passwordPolicies renamed"
fi

# securityTest
if [ -f "HRTHIS_securityTest.ts" ]; then
  cat HRTHIS_securityTest.ts | sed 's/HRTHIS_/BrowoKo_/g' > BrowoKo_securityTest.ts
  rm HRTHIS_securityTest.ts
  echo "✅ securityTest renamed"
fi

# sessionManager
if [ -f "HRTHIS_sessionManager.ts" ]; then
  cat HRTHIS_sessionManager.ts | sed 's/HRTHIS_/BrowoKo_/g' > BrowoKo_sessionManager.ts
  rm HRTHIS_sessionManager.ts
  echo "✅ sessionManager renamed"
fi

# validation
if [ -f "HRTHIS_validation.ts" ]; then
  cat HRTHIS_validation.ts | sed 's/HRTHIS_/BrowoKo_/g' > BrowoKo_validation.ts
  rm HRTHIS_validation.ts
  echo "✅ validation renamed"
fi

cd ../..
echo ""
echo "✅ Security Utils renaming complete!"
```

---

## 🚀 **SCRIPTS RENAMING - COPY/PASTE COMMANDS**

```bash
# Scripts umbenennen (optional)
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
echo ""
echo "✅ Scripts renaming complete!"
```

---

## ✅ **KOMPLETTER 1-COMMAND RENAMING**

Speichere dies als `finish_utils_security_renaming.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Finishing Utils/Security Renaming..."
echo "========================================"

# Security Utils
echo "📦 Renaming Security Utils..."
cd utils/security

for file in HRTHIS_*.ts; do
  if [ -f "$file" ]; then
    newname=$(echo "$file" | sed 's/HRTHIS_/BrowoKo_/')
    cat "$file" | sed 's/HRTHIS_/BrowoKo_/g' > "$newname"
    rm "$file"
    echo "✅ $file → $newname"
  fi
done

cd ../..

# Scripts
echo ""
echo "📦 Renaming Scripts..."
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

echo ""
echo "✅ ALL UTILS/SECURITY RENAMING COMPLETE!"
echo "========================================"
echo ""
echo "📊 Summary:"
echo "  - Security Utils: 5 files renamed"
echo "  - Scripts: 6 files renamed"
echo ""
echo "🧪 Verification:"
echo "  Run: grep -r 'HRTHIS_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --exclude-dir=node_modules ."
```

Mach das Skript ausführbar und führe es aus:

```bash
chmod +x finish_utils_security_renaming.sh
./finish_utils_security_renaming.sh
```

---

## 📊 **PROGRESS UPDATE**

| Kategorie | Status | Dateien | % |
|-----------|--------|---------|---|
| **Resilience** | ✅ KOMPLETT | 3/3 | 100% |
| **Notifications** | ✅ KOMPLETT | 1/1 | 100% |
| **Security** | ⚠️ AUSSTEHEND | 0/5 | 0% |
| **Scripts** | ⚠️ OPTIONAL | 0/6 | 0% |
| **TOTAL UTILS** | 🟡 IN ARBEIT | 5/15 | 33% |

---

## 🎯 **NEXT STEPS - NACH DIESEM RENAMING**

1. ✅ **Security Utils fertig** → Commands oben ausführen
2. ✅ **Scripts fertig** → Commands oben ausführen (optional)
3. ⚠️ **Icons + Imports** → Folge `/ICON_RENAMING_COMPLETE_GUIDE.md`
   - **Dies ist KRITISCH** - 47 Dateien müssen aktualisiert werden!

4. **Verification:**
   ```bash
   grep -r 'HRTHIS_' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules .
   # Sollte nur Dokumentations-Dateien (.md) zurückgeben
   ```

5. **Build testen:**
   ```bash
   npm run build
   ```

---

## ✅ **ERFOLG WENN:**

- ✅ Keine HRTHIS_* Imports in `.ts/.tsx` Dateien
- ✅ Security Utils alle umbenannt
- ✅ Scripts alle umbenannt (optional)
- ✅ Icons umbenannt + alle Imports aktualisiert
- ✅ Build läuft ohne Fehler

**Nach diesem Schritt fehlen nur noch die Icons + ihre ~50 Imports!**
