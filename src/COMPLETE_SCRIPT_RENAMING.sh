#!/bin/bash

###############################################################################
# COMPLETE SCRIPT RENAMING - HRTHIS to BrowoKo
###############################################################################
# Benennt alle verbleibenden HRTHIS_* Script-Dateien um
###############################################################################

echo "🚀 Starting Script Renaming..."
echo ""

# Rename script files
echo "📝 Renaming script files..."

mv scripts/HRTHIS_buildProduction.sh scripts/BrowoKo_buildProduction.sh 2>/dev/null && echo "✅ buildProduction.sh renamed" || echo "⚠️  buildProduction.sh already renamed or not found"
mv scripts/HRTHIS_bundleAnalyzer.js scripts/BrowoKo_bundleAnalyzer.js 2>/dev/null && echo "✅ bundleAnalyzer.js renamed" || echo "⚠️  bundleAnalyzer.js already renamed or not found"
mv scripts/HRTHIS_dependencyScanner.js scripts/BrowoKo_dependencyScanner.js 2>/dev/null && echo "✅ dependencyScanner.js renamed" || echo "⚠️  dependencyScanner.js already renamed or not found"
mv scripts/HRTHIS_performanceBudgetCheck.js scripts/BrowoKo_performanceBudgetCheck.js 2>/dev/null && echo "✅ performanceBudgetCheck.js renamed" || echo "⚠️  performanceBudgetCheck.js already renamed or not found"
mv scripts/HRTHIS_securityAudit.js scripts/BrowoKo_securityAudit.js 2>/dev/null && echo "✅ securityAudit.js renamed" || echo "⚠️  securityAudit.js already renamed or not found"
mv scripts/HRTHIS_securityAuditComplete.js scripts/BrowoKo_securityAuditComplete.js 2>/dev/null && echo "✅ securityAuditComplete.js renamed" || echo "⚠️  securityAuditComplete.js already renamed or not found"

echo ""
echo "✅ Script renaming complete!"
echo ""
echo "📊 Summary:"
echo "   - All HRTHIS_* files renamed to BrowoKo_*"
echo "   - Ready for content updates"
echo ""
