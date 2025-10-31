#!/bin/bash

# ==============================================================================
# AUTOMATED HRTHIS to BrowoKo RENAMING SCRIPT
# ==============================================================================
# This script renames all remaining HRTHIS_* files and updates their content
# 
# Created: 2025-01-27
# Purpose: Complete the systematic service renaming migration
# ==============================================================================

set -e  # Exit on error

echo "🚀 Starting HRTHIS to BrowoKo Renaming..."
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
RENAMED=0
UPDATED=0

# Function to rename and update file
rename_and_update() {
    local OLD_FILE="$1"
    local NEW_FILE="$2"
    
    if [ ! -f "$OLD_FILE" ]; then
        echo -e "${YELLOW}⚠️  File not found: $OLD_FILE${NC}"
        return
    fi
    
    echo -e "${BLUE}📝 Processing: $OLD_FILE${NC}"
    
    # Read file content and replace HRTHIS with BrowoKo
    sed 's/HRTHIS_/BrowoKo_/g; s/HRTHISIcons/BrowoKoIcons/g; s/HRthis/Browo Koordinator/g' "$OLD_FILE" > "$NEW_FILE"
    
    # Remove old file
    rm "$OLD_FILE"
    
    echo -e "${GREEN}✅ Renamed: $(basename $OLD_FILE) -> $(basename $NEW_FILE)${NC}"
    ((RENAMED++))
}

echo "📦 Step 1: Renaming Icon Files"
echo "-------------------------------"
rename_and_update "/components/icons/HRTHISIcons.tsx" "/components/icons/BrowoKoIcons.tsx"
rename_and_update "/components/icons/HRTHISIcons_NEW.tsx" "/components/icons/BrowoKoIcons_NEW.tsx"
echo ""

echo "📦 Step 2: Renaming Utils Files"
echo "-------------------------------"
# Notifications
rename_and_update "/utils/notifications/HRTHIS_notificationTriggers.ts" "/utils/notifications/BrowoKo_notificationTriggers.ts"

# Resilience
rename_and_update "/utils/resilience/HRTHIS_circuitBreaker.ts" "/utils/resilience/BrowoKo_circuitBreaker.ts"
rename_and_update "/utils/resilience/HRTHIS_retry.ts" "/utils/resilience/BrowoKo_retry.ts"
rename_and_update "/utils/resilience/HRTHIS_timeout.ts" "/utils/resilience/BrowoKo_timeout.ts"

# Security
rename_and_update "/utils/security/HRTHIS_bruteForceProtection.ts" "/utils/security/BrowoKo_bruteForceProtection.ts"
rename_and_update "/utils/security/HRTHIS_passwordPolicies.ts" "/utils/security/BrowoKo_passwordPolicies.ts"
rename_and_update "/utils/security/HRTHIS_sanitization.ts" "/utils/security/BrowoKo_sanitization_legacy.ts"
rename_and_update "/utils/security/HRTHIS_securityHeaders.ts" "/utils/security/BrowoKo_securityHeaders_legacy.ts"
rename_and_update "/utils/security/HRTHIS_securityTest.ts" "/utils/security/BrowoKo_securityTest.ts"
rename_and_update "/utils/security/HRTHIS_sessionManager.ts" "/utils/security/BrowoKo_sessionManager.ts"
rename_and_update "/utils/security/HRTHIS_validation.ts" "/utils/security/BrowoKo_validation.ts"
echo ""

echo "📦 Step 3: Renaming Script Files"
echo "-------------------------------"
rename_and_update "/scripts/HRTHIS_buildProduction.sh" "/scripts/BrowoKo_buildProduction.sh"
rename_and_update "/scripts/HRTHIS_bundleAnalyzer.js" "/scripts/BrowoKo_bundleAnalyzer.js"
rename_and_update "/scripts/HRTHIS_dependencyScanner.js" "/scripts/BrowoKo_dependencyScanner.js"
rename_and_update "/scripts/HRTHIS_performanceBudgetCheck.js" "/scripts/BrowoKo_performanceBudgetCheck.js"
rename_and_update "/scripts/HRTHIS_securityAudit.js" "/scripts/BrowoKo_securityAudit.js"
rename_and_update "/scripts/HRTHIS_securityAuditComplete.js" "/scripts/BrowoKo_securityAuditComplete.js"
echo ""

echo ""
echo "=========================================="
echo -e "${GREEN}✨ Renaming Complete!${NC}"
echo "=========================================="
echo -e "📊 Statistics:"
echo -e "   Files renamed: ${GREEN}$RENAMED${NC}"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Update all imports in components/screens that reference the renamed files"
echo "2. Test the build: npm run build"
echo "3. Commit changes: git add . && git commit -m 'chore: Complete HRTHIS to BrowoKo renaming'"
echo ""
