#!/bin/bash
# 🚀 Quick Deploy - Edge Function CORS Fix
# Run this in your terminal to deploy the fixed Edge Function

echo "🚀 Deploying Edge Function with CORS fix..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "📥 Install Supabase CLI first:"
    echo ""
    echo "Mac:"
    echo "  brew install supabase/tap/supabase"
    echo ""
    echo "Windows:"
    echo "  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "  scoop install supabase"
    echo ""
    echo "Or download from: https://github.com/supabase/cli/releases"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Login (if not already logged in)
echo "🔐 Checking login status..."
supabase projects list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in. Logging in now..."
    supabase login
else
    echo "✅ Already logged in"
fi
echo ""

# Link project (if not already linked)
echo "🔗 Linking project..."
supabase link --project-ref azmtojgikubegzusvhra
echo ""

# Deploy function
echo "📦 Deploying function..."
supabase functions deploy make-server-f659121d
echo ""

# Test health endpoint
echo "🧪 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s https://azmtojgikubegzusvhra.supabase.co/functions/v1/make-server-f659121d/health \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzOTEsImV4cCI6MjA3NDk2MDM5MX0.bls9aJ-M1Wi-387R9mveOuiQCkmVPjTc6IntZjM1YMk")

echo "Response: $HEALTH_RESPONSE"
echo ""

if [[ $HEALTH_RESPONSE == *'"status":"ok"'* ]]; then
    echo "✅ ✅ ✅ DEPLOYMENT SUCCESSFUL! ✅ ✅ ✅"
    echo ""
    echo "🎉 CORS fix deployed and working!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Open Figma Make"
    echo "2. Go to Admin → Team Management → Neuer Mitarbeiter"
    echo "3. Try creating a user"
    echo "4. Check Console (F12) - should see '📡 Response status: 200'"
    echo ""
else
    echo "⚠️ Health endpoint returned unexpected response"
    echo "Wait 30 seconds and try again:"
    echo ""
    echo "curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/make-server-f659121d/health \\"
    echo "  -H \"Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzOTEsImV4cCI6MjA3NDk2MDM5MX0.bls9aJ-M1Wi-387R9mveOuiQCkmVPjTc6IntZjM1YMk\""
    echo ""
fi
