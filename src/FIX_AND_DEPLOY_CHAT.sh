#!/bin/bash

# ============================================================================
# FIX AND DEPLOY CHAT EDGE FUNCTION
# ============================================================================
# This script fixes all route prefixes and deploys the Chat Edge Function
# ============================================================================

echo "🔧 Fixing Chat Edge Function routes..."

# Path to the Chat Edge Function
CHAT_FUNCTION="/Users/konstantinbuchele/Documents/Projekte/BrowoKoordinator/supabase/functions/BrowoKoordinator-Chat/index.ts"

# Backup original file
cp "$CHAT_FUNCTION" "$CHAT_FUNCTION.backup"

# Fix all routes by adding /BrowoKoordinator-Chat/ prefix
# Using sed to replace route definitions

sed -i '' \
  -e "s|app\.get('/conversations|app.get('/BrowoKoordinator-Chat/conversations|g" \
  -e "s|app\.post('/conversations|app.post('/BrowoKoordinator-Chat/conversations|g" \
  -e "s|app\.put('/conversations|app.put('/BrowoKoordinator-Chat/conversations|g" \
  -e "s|app\.delete('/conversations|app.delete('/BrowoKoordinator-Chat/conversations|g" \
  -e "s|app\.get('/messages|app.get('/BrowoKoordinator-Chat/messages|g" \
  -e "s|app\.post('/messages|app.post('/BrowoKoordinator-Chat/messages|g" \
  -e "s|app\.put('/messages|app.put('/BrowoKoordinator-Chat/messages|g" \
  -e "s|app\.delete('/messages|app.delete('/BrowoKoordinator-Chat/messages|g" \
  -e "s|app\.get('/attachments|app.get('/BrowoKoordinator-Chat/attachments|g" \
  -e "s|app\.post('/attachments|app.post('/BrowoKoordinator-Chat/attachments|g" \
  -e "s|app\.delete('/attachments|app.delete('/BrowoKoordinator-Chat/attachments|g" \
  -e "s|app\.get('/users|app.get('/BrowoKoordinator-Chat/users|g" \
  -e "s|app\.post('/users|app.post('/BrowoKoordinator-Chat/users|g" \
  -e "s|app\.post('/presence|app.post('/BrowoKoordinator-Chat/presence|g" \
  -e "s|app\.get('/search|app.get('/BrowoKoordinator-Chat/search|g" \
  -e "s|app\.get('/knowledge|app.get('/BrowoKoordinator-Chat/knowledge|g" \
  -e "s|app\.post('/knowledge|app.post('/BrowoKoordinator-Chat/knowledge|g" \
  -e "s|app\.put('/knowledge|app.put('/BrowoKoordinator-Chat/knowledge|g" \
  -e "s|app\.delete('/knowledge|app.delete('/BrowoKoordinator-Chat/knowledge|g" \
  -e "s|app\.get('/feedback|app.get('/BrowoKoordinator-Chat/feedback|g" \
  -e "s|app\.post('/feedback|app.post('/BrowoKoordinator-Chat/feedback|g" \
  -e "s|app\.put('/feedback|app.put('/BrowoKoordinator-Chat/feedback|g" \
  -e "s|app\.delete('/feedback|app.delete('/BrowoKoordinator-Chat/feedback|g" \
  "$CHAT_FUNCTION"

echo "✅ Routes fixed!"
echo ""
echo "📊 Checking changes..."
echo ""

# Show what changed
diff "$CHAT_FUNCTION.backup" "$CHAT_FUNCTION" | head -20

echo ""
echo "🚀 Deploying Chat Edge Function..."
echo ""

# Deploy with Supabase CLI
cd /Users/konstantinbuchele/Documents/Projekte/BrowoKoordinator
supabase functions deploy BrowoKoordinator-Chat --no-verify-jwt

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Chat Edge Function deployed successfully!"
  echo ""
  echo "🧪 Test mit:"
  echo "   Öffne Browser Console und führe aus: await chatQuickTest()"
  echo ""
  echo "📁 Backup gespeichert unter: $CHAT_FUNCTION.backup"
else
  echo ""
  echo "❌ Deployment failed!"
  echo ""
  echo "🔄 Restoring backup..."
  mv "$CHAT_FUNCTION.backup" "$CHAT_FUNCTION"
  echo "✅ Backup restored"
fi
