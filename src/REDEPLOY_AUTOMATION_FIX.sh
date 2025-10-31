#!/bin/bash
# ============================================================================
# REDEPLOY AUTOMATION EDGE FUNCTION - FIX HEALTH CHECK
# ============================================================================

echo "🚀 ========================================"
echo "🚀 Redeploy BrowoKoordinator-Automation"
echo "🚀 ========================================"
echo ""

echo "📦 Deploying Edge Function..."
echo ""

cd supabase/functions

supabase functions deploy BrowoKoordinator-Automation \
  --no-verify-jwt

echo ""
echo "✅ ========================================"
echo "✅ Deployment Complete!"
echo "✅ ========================================"
echo ""
echo "🧪 Testing Health Check..."
echo ""

# Test Health Check
sleep 2

PROJECT_ID="azmtojgikubegzusvhra"
HEALTH_URL="https://${PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/health"

echo "📍 URL: $HEALTH_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)

echo "📥 Status: $STATUS"
echo "📥 Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$STATUS" = "200" ]; then
    echo "✅ ========================================"
    echo "✅ ERFOLG! Health Check funktioniert!"
    echo "✅ ========================================"
    echo ""
    echo "🎯 Nächster Schritt:"
    echo "   Teste API Key Generation im Admin Panel"
    echo "   Settings > Automation > Create API Key"
else
    echo "❌ ========================================"
    echo "❌ FEHLER! Health Check gibt Status $STATUS"
    echo "❌ ========================================"
    echo ""
    echo "💡 Mögliche Ursachen:"
    echo "   1. Edge Function braucht 1-2 Minuten zum Starten"
    echo "   2. Deployment fehlgeschlagen"
    echo "   3. Supabase Service Problem"
    echo ""
    echo "🔄 Versuche es in 1 Minute nochmal:"
    echo "   curl $HEALTH_URL"
fi

echo ""
