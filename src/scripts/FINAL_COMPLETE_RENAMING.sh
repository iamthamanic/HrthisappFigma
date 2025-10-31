#!/bin/bash
set -e

echo "🚀 FINAL COMPLETE HRTHIS → BrowoKo RENAMING"
echo "============================================="
echo ""

SUCCESS_COUNT=0
SKIP_COUNT=0

# Function to rename and update content
rename_file() {
  local old_path="$1"
  local new_path="$2"
  
  if [ ! -f "$old_path" ]; then
    echo "⚠️  SKIP: $old_path (not found)"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    return
  fi
  
  # Read, replace content, write to new file
  cat "$old_path" | sed \
    -e 's/HRTHIS_/BrowoKo_/g' \
    -e 's/hrthis_/browoko_/g' \
    -e "s/@file HRTHIS_/@file BrowoKo_/g" \
    -e "s/@namespace HRTHIS_/@namespace BrowoKo_/g" \
    -e 's/HRthis/Browo Koordinator/g' \
    > "$new_path"
  
  rm "$old_path"
  echo "✅  $(basename $old_path) → $(basename $new_path)"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
}

# ============================================
# SECURITY UTILS
# ============================================
echo "📦 STEP 1/2: Renaming Security Utils..."
echo "----------------------------------------"

rename_file "utils/security/HRTHIS_bruteForceProtection.ts" "utils/security/BrowoKo_bruteForceProtection.ts"
rename_file "utils/security/HRTHIS_passwordPolicies.ts" "utils/security/BrowoKo_passwordPolicies.ts"
rename_file "utils/security/HRTHIS_securityTest.ts" "utils/security/BrowoKo_securityTest.ts"
rename_file "utils/security/HRTHIS_sessionManager.ts" "utils/security/BrowoKo_sessionManager.ts"
rename_file "utils/security/HRTHIS_validation.ts" "utils/security/BrowoKo_validation.ts"

echo ""

# ============================================
# SCRIPTS
# ============================================
echo "📦 STEP 2/2: Renaming Scripts (optional)..."
echo "----------------------------------------"

rename_file "scripts/HRTHIS_buildProduction.sh" "scripts/BrowoKo_buildProduction.sh"
rename_file "scripts/HRTHIS_bundleAnalyzer.js" "scripts/BrowoKo_bundleAnalyzer.js"
rename_file "scripts/HRTHIS_dependencyScanner.js" "scripts/BrowoKo_dependencyScanner.js"
rename_file "scripts/HRTHIS_performanceBudgetCheck.js" "scripts/BrowoKo_performanceBudgetCheck.js"
rename_file "scripts/HRTHIS_securityAudit.js" "scripts/BrowoKo_securityAudit.js"
rename_file "scripts/HRTHIS_securityAuditComplete.js" "scripts/BrowoKo_securityAuditComplete.js"

echo ""
echo "============================================="
echo "✅ RENAMING COMPLETE!"
echo "============================================="
echo ""
echo "📊 Results:"
echo "  ✅ Successfully renamed: $SUCCESS_COUNT files"
echo "  ⚠️  Skipped: $SKIP_COUNT files"
echo ""
echo "🧪 Verification Commands:"
echo "  1. Check remaining HRTHIS references:"
echo "     grep -r 'HRTHIS_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --exclude-dir=node_modules ."
echo ""
echo "  2. Count BrowoKo files:"
echo "     find . -name 'BrowoKo_*' -type f | wc -l"
echo ""
echo "  3. Test build:"
echo "     npm run build"
echo ""
echo "⚠️  CRITICAL NEXT STEP: Icon Renaming"
echo "     See: /ICON_RENAMING_COMPLETE_GUIDE.md"
echo ""
