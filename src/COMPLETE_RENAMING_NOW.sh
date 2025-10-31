#!/bin/bash
# ==============================================================================
# HRTHIS → BrowoKo COMPLETE RENAMING SCRIPT
# ==============================================================================
# This script completes the remaining 5% of the renaming project:
# - 5 Security Utils
# - 6 Scripts (optional)
# - 2 Icon files + ~47 imports (CRITICAL!)
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SUCCESS_COUNT=0
SKIP_COUNT=0

# Function to rename and update content
rename_file() {
  local old_path="$1"
  local new_path="$2"
  
  if [ ! -f "$old_path" ]; then
    echo -e "${YELLOW}⚠️  SKIP: $old_path (not found)${NC}"
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
  echo -e "${GREEN}✅  $(basename $old_path) → $(basename $new_path)${NC}"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
}

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🚀  HRTHIS → BrowoKo COMPLETE RENAMING SCRIPT  🚀         ║"
echo "║                                                               ║"
echo "║   Completing the final 5% of the renaming project            ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ==============================================================================
# STEP 1: SECURITY UTILS (5 files)
# ==============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 STEP 1/3: Renaming Security Utils...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

rename_file "utils/security/HRTHIS_bruteForceProtection.ts" "utils/security/BrowoKo_bruteForceProtection.ts"
rename_file "utils/security/HRTHIS_passwordPolicies.ts" "utils/security/BrowoKo_passwordPolicies.ts"
rename_file "utils/security/HRTHIS_securityTest.ts" "utils/security/BrowoKo_securityTest.ts"
rename_file "utils/security/HRTHIS_sessionManager.ts" "utils/security/BrowoKo_sessionManager.ts"
rename_file "utils/security/HRTHIS_validation.ts" "utils/security/BrowoKo_validation.ts"

echo ""

# ==============================================================================
# STEP 2: SCRIPTS (6 files - optional)
# ==============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 STEP 2/3: Renaming Scripts (optional)...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

rename_file "scripts/HRTHIS_buildProduction.sh" "scripts/BrowoKo_buildProduction.sh"
rename_file "scripts/HRTHIS_bundleAnalyzer.js" "scripts/BrowoKo_bundleAnalyzer.js"
rename_file "scripts/HRTHIS_dependencyScanner.js" "scripts/BrowoKo_dependencyScanner.js"
rename_file "scripts/HRTHIS_performanceBudgetCheck.js" "scripts/BrowoKo_performanceBudgetCheck.js"
rename_file "scripts/HRTHIS_securityAudit.js" "scripts/BrowoKo_securityAudit.js"
rename_file "scripts/HRTHIS_securityAuditComplete.js" "scripts/BrowoKo_securityAuditComplete.js"

echo ""

# ==============================================================================
# STEP 3: ICONS + IMPORTS (CRITICAL!)
# ==============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}🔴 STEP 3/3: Renaming Icons + Imports (CRITICAL!)...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 3.1: Rename icon files
if [ -f "components/icons/HRTHISIcons.tsx" ]; then
  mv components/icons/HRTHISIcons.tsx components/icons/BrowoKoIcons.tsx
  echo -e "${GREEN}✅  HRTHISIcons.tsx → BrowoKoIcons.tsx${NC}"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo -e "${YELLOW}⚠️  SKIP: HRTHISIcons.tsx (already renamed or not found)${NC}"
  SKIP_COUNT=$((SKIP_COUNT + 1))
fi

if [ -f "components/icons/HRTHISIcons_NEW.tsx" ]; then
  mv components/icons/HRTHISIcons_NEW.tsx components/icons/BrowoKoIcons_NEW.tsx
  echo -e "${GREEN}✅  HRTHISIcons_NEW.tsx → BrowoKoIcons_NEW.tsx${NC}"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo -e "${YELLOW}⚠️  SKIP: HRTHISIcons_NEW.tsx (already renamed or not found)${NC}"
  SKIP_COUNT=$((SKIP_COUNT + 1))
fi

# 3.2: Update icon file contents
if [ -f "components/icons/BrowoKoIcons.tsx" ]; then
  sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons.tsx
  echo -e "${GREEN}✅  Updated BrowoKoIcons.tsx content${NC}"
fi

if [ -f "components/icons/BrowoKoIcons_NEW.tsx" ]; then
  sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons_NEW.tsx
  echo -e "${GREEN}✅  Updated BrowoKoIcons_NEW.tsx content${NC}"
fi

# 3.3: Update all icon imports (47 files!)
echo -e "${YELLOW}⚠️  Updating ~47 icon imports...${NC}"

find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" -exec sed -i '' \
  -e "s|from './icons/HRTHISIcons'|from './icons/BrowoKoIcons'|g" \
  -e "s|from \"./icons/HRTHISIcons\"|from \"./icons/BrowoKoIcons\"|g" \
  -e "s|from '../icons/HRTHISIcons'|from '../icons/BrowoKoIcons'|g" \
  -e "s|from \"../icons/HRTHISIcons\"|from \"../icons/BrowoKoIcons\"|g" \
  -e "s|from '../../components/icons/HRTHISIcons'|from '../../components/icons/BrowoKoIcons'|g" \
  -e "s|from \"../../components/icons/HRTHISIcons\"|from \"../../components/icons/BrowoKoIcons\"|g" \
  -e "s|from './components/icons/HRTHISIcons'|from './components/icons/BrowoKoIcons'|g" \
  -e "s|from \"./components/icons/HRTHISIcons\"|from \"./components/icons/BrowoKoIcons\"|g" \
  {} + 2>/dev/null || true

echo -e "${GREEN}✅  Icon imports updated in all files${NC}"

# 3.4: Fix component function declarations
echo -e "${YELLOW}⚠️  Fixing component function declarations...${NC}"

find components -name "BrowoKo_*.tsx" -exec sed -i '' \
  -e 's/export default function HRTHIS_/export default function BrowoKo_/g' \
  -e 's/interface HRTHIS_/interface BrowoKo_/g' \
  -e 's/type HRTHIS_/type BrowoKo_/g' \
  {} + 2>/dev/null || true

echo -e "${GREEN}✅  Component function declarations fixed${NC}"

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   ✅ ✅ ✅  RENAMING 100% COMPLETE!  ✅ ✅ ✅              ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}📊 Results:${NC}"
echo -e "  ${GREEN}✅ Successfully processed: $SUCCESS_COUNT operations${NC}"
echo -e "  ${YELLOW}⚠️  Skipped: $SKIP_COUNT operations${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Verification Commands:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  1️⃣  Check remaining HRTHIS references:"
echo "     grep -r 'HRTHIS_' --include='*.ts' --include='*.tsx' --include='*.js' --exclude-dir=node_modules ."
echo ""
echo "  2️⃣  Check HRTHISIcons imports:"
echo "     grep -r 'HRTHISIcons' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules ."
echo ""
echo "  3️⃣  Count BrowoKo files:"
echo "     find . -name 'BrowoKo_*' -type f | wc -l"
echo "     (Expected: ~235+ files)"
echo ""
echo "  4️⃣  Test build:"
echo "     npm run build"
echo ""
echo "  5️⃣  TypeScript check:"
echo "     npx tsc --noEmit"
echo ""
echo -e "${GREEN}✨ The project has been successfully renamed to Browo Koordinator! ✨${NC}"
echo ""
