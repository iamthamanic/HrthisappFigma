#!/bin/bash

# ============================================
# HRthis v4.5.9 - Quick Fix "Failed to Fetch"
# ============================================

echo "🚀 HRthis v4.5.9 - Edge Function Deployment"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI nicht gefunden!${NC}"
    echo ""
    echo "📦 Installation:"
    echo "   npm install -g supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI gefunden${NC}"
echo ""

# Check if logged in
echo "🔐 Checking Supabase Login..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nicht eingeloggt. Öffne Browser für Login...${NC}"
    supabase login
else
    echo -e "${GREEN}✅ Bereits eingeloggt${NC}"
fi
echo ""

# Link project
echo "🔗 Linking Project..."
PROJECT_ID="azmtojgikubegzusvhra"
supabase link --project-ref $PROJECT_ID
echo ""

# Deploy Edge Function
echo "🚀 Deploying Edge Function 'server'..."
echo ""
supabase functions deploy server --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Edge Function deployed successfully!${NC}"
    echo ""
    
    # Test Health Check
    echo "🧪 Testing Health Check..."
    HEALTH_URL="https://$PROJECT_ID.supabase.co/functions/v1/make-server-f659121d/health"
    
    HEALTH_RESPONSE=$(curl -s $HEALTH_URL)
    
    if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
        echo -e "${GREEN}✅ Health Check PASSED${NC}"
        echo "   Response: $HEALTH_RESPONSE"
    else
        echo -e "${RED}❌ Health Check FAILED${NC}"
        echo "   Response: $HEALTH_RESPONSE"
    fi
    echo ""
    
    echo "============================================"
    echo -e "${GREEN}🎉 DEPLOYMENT ERFOLGREICH!${NC}"
    echo "============================================"
    echo ""
    echo "📋 Nächste Schritte:"
    echo ""
    echo "1. ✅ Gehe zu Supabase Dashboard"
    echo "   https://supabase.com/dashboard/project/$PROJECT_ID/settings/functions"
    echo ""
    echo "2. ✅ Setze Environment Variables für 'server':"
    echo "   SUPABASE_URL=https://$PROJECT_ID.supabase.co"
    echo "   SUPABASE_SERVICE_ROLE_KEY=<dein_service_role_key>"
    echo ""
    echo "3. ✅ Service Role Key findest du hier:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_ID/settings/api"
    echo "   → service_role (secret)"
    echo ""
    echo "4. ✅ Teste deine App:"
    echo "   - Equipment Verwaltung im Admin Panel"
    echo "   - User Creation in Team Management"
    echo ""
    echo "============================================"
    
else
    echo ""
    echo -e "${RED}❌ Deployment FAILED${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "1. Check Function Logs:"
    echo "   supabase functions logs server"
    echo ""
    echo "2. Try manual deploy:"
    echo "   supabase functions deploy server --legacy-bundle"
    echo ""
    echo "3. Check Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_ID/functions"
    echo ""
    exit 1
fi
