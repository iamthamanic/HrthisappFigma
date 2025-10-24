#!/bin/bash

###############################################################################
# IMPORT-MIGRATION SCRIPT - Phase 1
###############################################################################
# Migriert alle relativen Imports zu @ Aliassen
# 
# VORHER:  import X from '../../components/X'
# NACHHER: import X from '@components/X'
###############################################################################

echo "🚀 HRthis Refactoring - Phase 1: Import-Migration"
echo "=================================================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "App.tsx" ]; then
    echo -e "${RED}❌ ERROR: App.tsx not found. Run this script from project root!${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  BACKUP CHECKPOINT${NC}"
echo "Creating git commit as backup..."
git add -A
git commit -m "🔖 BACKUP: Pre-import-migration checkpoint (Phase 1)" || echo "Nothing to commit"
echo ""

echo "📋 Analyzing current imports..."
echo ""

# Counters
TOTAL_FILES=0
MIGRATED_FILES=0

# Function to migrate a single file
migrate_file() {
    local file="$1"
    local changed=false
    
    # Skip node_modules, dist, build
    if [[ "$file" =~ node_modules|dist|build|\.git ]]; then
        return
    fi
    
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Migrate imports - be careful with the order!
    # Start with the most specific patterns first
    
    # Pattern: from '../../components/...
    sed -i.tmp "s|from ['\"]\\.\\./../components/|from '@components/|g" "$file"
    sed -i.tmp "s|from ['\"]\\.\\.\/components/|from '@components/|g" "$file"
    
    # Pattern: from '../../screens/...
    sed -i.tmp "s|from ['\"]\\.\\./../screens/|from '@screens/|g" "$file"
    sed -i.tmp "s|from ['\"]\\.\\.\/screens/|from '@screens/|g" "$file"
    
    # Pattern: from '../../stores/...
    sed -i.tmp "s|from ['\"]\\.\\./../stores/|from '@stores/|g" "$file"
    sed -i.tmp "s|from ['\"]\\.\\.\/stores/|from '@stores/|g" "$file"
    
    # Pattern: from '../../hooks/...
    sed -i.tmp "s|from ['\"]\\.\\./../hooks/|from '@hooks/|g" "$file"
    sed -i.tmp "s|from ['\"]\\.\\.\/hooks/|from '@hooks/|g" "$file"
    
    # Pattern: from '../../utils/...
    sed -i.tmp "s|from ['\"]\\.\\./../utils/|from '@utils/|g" "$file"
    sed -i.tmp "s|from ['\"]\\.\\.\/utils/|from '@utils/|g" "$file"
    
    # Pattern: from '../../types/...
    sed -i.tmp "s|from ['\"]\\.\\./../types/|from '@types/|g" "$file"
    sed -i.tmp "s|from ['\"]\\.\\.\/types/|from '@types/|g" "$file"
    
    # Pattern: from '../../layouts/...
    sed -i.tmp "s|from ['\"]\\.\\./../layouts/|from '@layouts/|g" "$file"
    sed -i.tmp "s|from ['\"]\\.\\.\/layouts/|from '@layouts/|g" "$file"
    
    # Pattern: from '../../styles/...
    sed -i.tmp "s|from ['\"]\\.\\./../styles/|from '@styles/|g" "$file"
    sed -i.tmp "s|from ['\"]\\.\\.\/styles/|from '@styles/|g" "$file"
    
    # Check if file changed
    if ! cmp -s "$file" "$file.backup"; then
        changed=true
        MIGRATED_FILES=$((MIGRATED_FILES + 1))
        echo -e "${GREEN}✅ Migrated:${NC} $file"
    fi
    
    # Cleanup
    rm -f "$file.tmp"
    rm -f "$file.backup"
}

# Export function for find -exec
export -f migrate_file
export TOTAL_FILES
export MIGRATED_FILES
export GREEN
export NC

echo "🔄 Migrating .tsx and .ts files..."
echo ""

# Find and migrate all TypeScript files
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" | while read file; do
    migrate_file "$file"
done

echo ""
echo "=================================================="
echo -e "${GREEN}✅ MIGRATION COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "📊 Statistics:"
echo "   Total files scanned: $TOTAL_FILES"
echo "   Files migrated:      $MIGRATED_FILES"
echo ""
echo "📝 Next steps:"
echo "   1. Review changes: git diff"
echo "   2. Test build:     npm run build"
echo "   3. If OK, commit:  git add -A && git commit -m 'refactor: migrate imports to @ aliases'"
echo "   4. If errors, rollback: git reset --hard HEAD~1"
echo ""
