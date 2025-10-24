#!/bin/bash

###############################################################################
# IMPORT-ANALYSE SCRIPT
###############################################################################
# Zeigt aktuelle Import-Patterns und hilft bei der Planung der Migration
###############################################################################

echo "📊 Import-Analyse - HRthis System"
echo "=================================="
echo ""

echo "🔍 Suche nach relativen Imports..."
echo ""

echo "1️⃣  Imports mit '../../' (2+ Ebenen hoch):"
echo "-------------------------------------------"
grep -r "from ['\"]\.\./.*/.*['\"]" --include="*.tsx" --include="*.ts" . 2>/dev/null | wc -l | xargs echo "   Gefunden:"
echo ""

echo "2️⃣  Imports mit '../' (1 Ebene hoch):"
echo "------------------------------------"
grep -r "from ['\"]\.\.\/[^./]" --include="*.tsx" --include="*.ts" . 2>/dev/null | wc -l | xargs echo "   Gefunden:"
echo ""

echo "3️⃣  Imports mit './' (gleiches Verzeichnis):"
echo "-------------------------------------------"
grep -r "from ['\"]\./[^./]" --include="*.tsx" --include="*.ts" . 2>/dev/null | wc -l | xargs echo "   Gefunden:"
echo "   → Diese BEHALTEN wir (korrekt für gleiches Verzeichnis)"
echo ""

echo "4️⃣  Beispiele von Imports die migriert werden:"
echo "----------------------------------------------"
echo ""
echo "   Components:"
grep -r "from ['\"].*components/" --include="*.tsx" --include="*.ts" . 2>/dev/null | head -5 | sed 's/^/     /'
echo ""
echo "   Stores:"
grep -r "from ['\"].*stores/" --include="*.tsx" --include="*.ts" . 2>/dev/null | head -3 | sed 's/^/     /'
echo ""
echo "   Hooks:"
grep -r "from ['\"].*hooks/" --include="*.tsx" --include="*.ts" . 2>/dev/null | head -3 | sed 's/^/     /'
echo ""

echo "=================================="
echo "✅ Analyse complete!"
echo ""
echo "📝 Next: Run migration script"
echo "   → chmod +x scripts/01_migrate_imports_to_aliases.sh"
echo "   → ./scripts/01_migrate_imports_to_aliases.sh"
echo ""
