#!/bin/bash
set -e

echo "🚀 Executing Remaining HRTHIS → BrowoKo Renaming"
echo "================================================="
echo ""

# Step 1: Resilience Utils
echo "📦 Renaming Resilience Utils..."
if [ -f "utils/resilience/HRTHIS_retry.ts" ]; then
  cp utils/resilience/HRTHIS_retry.ts utils/resilience/BrowoKo_retry.ts
  sed -i '' 's/HRTHIS_/BrowoKo_/g' utils/resilience/BrowoKo_retry.ts
  rm utils/resilience/HRTHIS_retry.ts
  echo "✅ HRTHIS_retry.ts → BrowoKo_retry.ts"
fi

if [ -f "utils/resilience/HRTHIS_timeout.ts" ]; then
  cp utils/resilience/HRTHIS_timeout.ts utils/resilience/BrowoKo_timeout.ts
  sed -i '' 's/HRTHIS_/BrowoKo_/g' utils/resilience/BrowoKo_timeout.ts
  rm utils/resilience/HRTHIS_timeout.ts
  echo "✅ HRTHIS_timeout.ts → BrowoKo_timeout.ts"
fi

# Update resilience index
if [ -f "utils/resilience/index.ts" ]; then
  sed -i '' 's/HRTHIS_/BrowoKo_/g' utils/resilience/index.ts
  echo "✅ Updated resilience/index.ts"
fi

# Step 2: Notification Utils
echo ""
echo "📦 Renaming Notification Utils..."
if [ -f "utils/notifications/HRTHIS_notificationTriggers.ts" ]; then
  cp utils/notifications/HRTHIS_notificationTriggers.ts utils/notifications/BrowoKo_notificationTriggers.ts
  sed -i '' 's/HRTHIS_/BrowoKo_/g' utils/notifications/BrowoKo_notificationTriggers.ts
  rm utils/notifications/HRTHIS_notificationTriggers.ts
  echo "✅ HRTHIS_notificationTriggers.ts → BrowoKo_notificationTriggers.ts"
fi

# Step 3: Security Utils
echo ""
echo "📦 Renaming Security Utils..."
for file in utils/security/HRTHIS_*.ts; do
  if [ -f "$file" ]; then
    basename=$(basename "$file")
    newname=$(echo "$basename" | sed 's/HRTHIS_/BrowoKo_/')
    cp "$file" "utils/security/$newname"
    sed -i '' 's/HRTHIS_/BrowoKo_/g' "utils/security/$newname"
    rm "$file"
    echo "✅ $basename → $newname"
  fi
done

# Step 4: Scripts
echo ""
echo "📦 Renaming Scripts..."
cd scripts
for file in HRTHIS_*; do
  if [ -f "$file" ]; then
    newname=$(echo "$file" | sed 's/HRTHIS_/BrowoKo_/')
    cp "$file" "$newname"
    sed -i '' -e 's/HRTHIS_/BrowoKo_/g' -e 's/HRthis/Browo Koordinator/g' "$newname"
    rm "$file"
    echo "✅ $file → $newname"
  fi
done
cd ..

echo ""
echo "✅ Utils and Scripts Renaming Complete!"
echo ""
