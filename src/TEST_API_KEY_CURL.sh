#!/bin/bash
# ============================================================================
# API KEY GENERATION - CURL TEST
# ============================================================================
# Test die Edge Function direkt mit cURL
# ============================================================================

PROJECT_ID="hhhnumvllmzkyjsgefhd"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d"

echo "🔍 ========================================"
echo "🔍 API Key Generation - cURL Test"
echo "🔍 ========================================"
echo ""

# ============================================================================
# STEP 1: Health Check (Kein Auth erforderlich)
# ============================================================================
echo "📊 Step 1: Health Check..."
echo "📍 URL: ${BASE_URL}/automation/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/automation/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -n 1)

echo "📥 Status: $HEALTH_STATUS"
echo "📥 Response:"
echo "$HEALTH_BODY" | jq . 2>/dev/null || echo "$HEALTH_BODY"
echo ""

if [ "$HEALTH_STATUS" != "200" ]; then
    echo "❌ Health check failed!"
    echo "💡 Edge Function ist wahrscheinlich nicht deployed."
    echo ""
    echo "Fix:"
    echo "  supabase functions deploy BrowoKoordinator-Automation"
    exit 1
fi

echo "✅ Health Check OK"
echo ""

# ============================================================================
# STEP 2: API Key Generation (Auth erforderlich)
# ============================================================================
echo "📊 Step 2: API Key Generation..."
echo ""
echo "⚠️ Du brauchst einen Access Token!"
echo ""
echo "So bekommst du den Token:"
echo "  1. Öffne Browser DevTools (F12)"
echo "  2. Gehe zur Console"
echo "  3. Führe aus: localStorage.getItem('sb-hhhnumvllmzkyjsgefhd-auth-token')"
echo "  4. Kopiere den 'access_token' Wert"
echo "  5. Füge ihn unten ein:"
echo ""

read -p "Access Token eingeben (oder Enter zum Überspringen): " ACCESS_TOKEN

if [ -z "$ACCESS_TOKEN" ]; then
    echo "⚠️ Kein Token eingegeben - Skip API Key Generation Test"
    echo ""
    echo "🎯 Nächste Schritte:"
    echo "  1. Health Check war erfolgreich ✅"
    echo "  2. Edge Function läuft!"
    echo "  3. Führe das Browser Console Script aus:"
    echo "     /DEBUG_API_KEY_FIGMA_MAKE.js"
    exit 0
fi

echo ""
echo "📍 URL: ${BASE_URL}/automation/api-keys/generate"
echo "📤 Request: { \"name\": \"cURL Test Key\" }"
echo ""

API_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "${BASE_URL}/automation/api-keys/generate" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name":"cURL Test Key"}')

API_BODY=$(echo "$API_RESPONSE" | head -n -1)
API_STATUS=$(echo "$API_RESPONSE" | tail -n 1)

echo "📥 Status: $API_STATUS"
echo "📥 Response:"
echo "$API_BODY" | jq . 2>/dev/null || echo "$API_BODY"
echo ""

if [ "$API_STATUS" = "200" ]; then
    echo "🎉 ========================================"
    echo "🎉 SUCCESS! API Key Generated"
    echo "🎉 ========================================"
    
    # Extract API Key
    API_KEY=$(echo "$API_BODY" | jq -r '.api_key' 2>/dev/null)
    if [ "$API_KEY" != "null" ] && [ -n "$API_KEY" ]; then
        echo "✅ API Key: $API_KEY"
        
        if [[ "$API_KEY" == browoko-* ]]; then
            echo "✅ Prefix korrekt: browoko-"
        else
            echo "⚠️ Prefix NICHT korrekt! Erwartet: browoko-, Ist: ${API_KEY:0:8}..."
        fi
    fi
else
    echo "❌ ========================================"
    echo "❌ FAILED"
    echo "❌ ========================================"
    
    # Check for JSON parse error indicator
    if echo "$API_BODY" | grep -q "<!DOCTYPE"; then
        echo "💡 Response ist HTML - Edge Function crasht oder falsche URL"
    fi
fi

echo ""
echo "🔍 ========================================"
echo "🔍 TEST COMPLETE"
echo "🔍 ========================================"
