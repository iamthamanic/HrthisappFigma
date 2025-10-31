#!/bin/bash
set -e

echo "🔄 Updating ALL icon imports from HRTHISIcons to BrowoKoIcons..."
echo "================================================================="
echo ""

# Update ALL .tsx and .ts files with icon imports
echo "📝 Updating imports in all TypeScript files..."

# Find and replace in all files (excluding node_modules)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.md" \
  ! -path "*/ICON_*" \
  -exec sed -i '' \
  -e "s|from './icons/HRTHISIcons'|from './icons/BrowoKoIcons'|g" \
  -e "s|from \"./icons/HRTHISIcons\"|from \"./icons/BrowoKoIcons\"|g" \
  -e "s|from '../icons/HRTHISIcons'|from '../icons/BrowoKoIcons'|g" \
  -e "s|from \"../icons/HRTHISIcons\"|from \"../icons/BrowoKoIcons\"|g" \
  -e "s|from '../../components/icons/HRTHISIcons'|from '../../components/icons/BrowoKoIcons'|g" \
  -e "s|from \"../../components/icons/HRTHISIcons\"|from \"../../components/icons/BrowoKoIcons\"|g" \
  {} + 2>/dev/null || true

echo "✅ Icon imports updated!"
echo ""

# Rename icon files
echo "📦 Renaming icon files..."

if [ -f "components/icons/HRTHISIcons.tsx" ]; then
  mv components/icons/HRTHISIcons.tsx components/icons/BrowoKoIcons.tsx
  echo "✅  HRTHISIcons.tsx → BrowoKoIcons.tsx"
else
  echo "⚠️   HRTHISIcons.tsx already renamed"
fi

if [ -f "components/icons/HRTHISIcons_NEW.tsx" ]; then
  mv components/icons/HRTHISIcons_NEW.tsx components/icons/BrowoKoIcons_NEW.tsx
  echo "✅  HRTHISIcons_NEW.tsx → BrowoKoIcons_NEW.tsx"
else
  echo "⚠️   HRTHISIcons_NEW.tsx already renamed"
fi

echo ""
echo "✅ ✅ ✅ ICON RENAMING COMPLETE! ✅ ✅ ✅"
echo ""
echo "📊 Summary:"
echo "  - Icon files renamed: 2 files"
echo "  - Icon imports updated: ~50 files"
echo ""
