#!/bin/bash

# ==========================================
# BROWO KOORDINATOR - RENAME SCRIPT
# ==========================================
# Rennt alle HRTHIS_* → BrowoKo_* Dateien um
# Ersetzt alle Text-Inhalte

set -e

echo "🚀 Starting Browo Koordinator Rename Process..."
echo "================================================"
echo ""

# ==========================================
# STEP 1: File Renaming
# ==========================================
echo "📝 STEP 1: Renaming Files..."
echo "-------------------------------------------"

# Services
echo "  → Renaming Services..."
find ./services -name "HRTHIS_*.ts" -type f | while read file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
    echo "    ✓ $base → $newname"
done

# Components
echo "  → Renaming Components..."
find ./components -name "HRTHIS_*.tsx" -type f | while read file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
    echo "    ✓ $base → $newname"
done

# Hooks
echo "  → Renaming Hooks..."
find ./hooks -name "HRTHIS_*.ts" -type f | while read file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
    echo "    ✓ $base → $newname"
done

# Stores
echo "  → Renaming Stores..."
find ./stores -name "HRTHIS_*.ts" -type f | while read file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
    echo "    ✓ $base → $newname"
done

# Utils
echo "  → Renaming Utils..."
find ./utils -name "HRTHIS_*.ts" -type f | while read file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
    echo "    ✓ $base → $newname"
done

# Config
echo "  → Renaming Config..."
find ./config -name "HRTHIS_*.ts" -type f | while read file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
    echo "    ✓ $base → $newname"
done

# Types/Schemas
echo "  → Renaming Type Schemas..."
find ./types/schemas -name "HRTHIS_*.ts" -type f | while read file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
    echo "    ✓ $base → $newname"
done

# Scripts
echo "  → Renaming Scripts..."
find ./scripts -name "HRTHIS_*.js" -o -name "HRTHIS_*.sh" -type f | while read file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    newname="${base/HRTHIS_/BrowoKo_}"
    mv "$file" "$dir/$newname"
    echo "    ✓ $base → $newname"
done

echo ""
echo "✅ File Renaming Complete!"
echo ""

# ==========================================
# STEP 2: Content Replacement
# ==========================================
echo "📝 STEP 2: Replacing Content in Files..."
echo "-------------------------------------------"

# Replace HRTHIS_ → BrowoKo_
echo "  → Replacing 'HRTHIS_' with 'BrowoKo_'..."
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -exec sed -i.bak 's/HRTHIS_/BrowoKo_/g' {} +

# Replace HRthis → Browo Koordinator
echo "  → Replacing 'HRthis' with 'Browo Koordinator'..."
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -exec sed -i.bak 's/HRthis/Browo Koordinator/g' {} +

# Replace hrthis → browoko
echo "  → Replacing 'hrthis' with 'browoko'..."
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -exec sed -i.bak 's/hrthis/browoko/g' {} +

# Clean up backup files
echo "  → Cleaning up backup files..."
find . -name "*.bak" -type f -delete

echo ""
echo "✅ Content Replacement Complete!"
echo ""

# ==========================================
# STEP 3: Special Files
# ==========================================
echo "📝 STEP 3: Updating Special Files..."
echo "-------------------------------------------"

# Update README.md if exists
if [ -f "README.md" ]; then
    echo "  → Updating README.md..."
    sed -i.bak 's/HRthis/Browo Koordinator/g' README.md
    sed -i.bak 's/HRTHIS/BrowoKo/g' README.md
    rm -f README.md.bak
fi

# Update package.json if exists
if [ -f "package.json" ]; then
    echo "  → Updating package.json..."
    sed -i.bak 's/"name": "hrthis"/"name": "browo-koordinator"/g' package.json
    sed -i.bak 's/"name": "HRthis"/"name": "browo-koordinator"/g' package.json
    rm -f package.json.bak
fi

echo ""
echo "✅ Special Files Updated!"
echo ""

# ==========================================
# STEP 4: Verification
# ==========================================
echo "📊 STEP 4: Verification..."
echo "-------------------------------------------"

echo "  Checking for remaining HRTHIS_ references..."
HRTHIS_COUNT=$(grep -r "HRTHIS_" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | wc -l || echo "0")
echo "    → Found $HRTHIS_COUNT occurrences of 'HRTHIS_'"

echo "  Checking for BrowoKo_ references..."
BROWOKO_COUNT=$(grep -r "BrowoKo_" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | wc -l || echo "0")
echo "    → Found $BROWOKO_COUNT occurrences of 'BrowoKo_'"

echo ""
echo "================================================"
echo "✅ RENAME COMPLETE!"
echo "================================================"
echo ""
echo "📊 Summary:"
echo "  - Old prefix 'HRTHIS_': $HRTHIS_COUNT remaining"
echo "  - New prefix 'BrowoKo_': $BROWOKO_COUNT found"
echo ""
echo "⚠️  Next Steps:"
echo "  1. Review changes: git status"
echo "  2. Test the application"
echo "  3. Commit changes: git add . && git commit -m 'Rename: HRTHIS → BrowoKo'"
echo ""
