#!/bin/bash

# ============================================
# v4.13.3 - Training Compliance System
# Edge Function Deployment Script
# ============================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 BROWO KOORDINATOR - v4.13.3 DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Feature: Training Compliance Dashboard"
echo "Edge Function: BrowoKoordinator-Lernen"
echo "New API Endpoints: 6"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ ERROR: Supabase CLI is not installed!"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "📋 Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo ""
    echo "❌ ERROR: Not logged in to Supabase!"
    echo ""
    echo "Login with:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Confirm deployment
echo "═══════════════════════════════════════════════════════════"
echo "🎯 READY TO DEPLOY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "This will deploy the following:"
echo ""
echo "  • Edge Function: BrowoKoordinator-Lernen"
echo "  • New Routes:"
echo "      - GET  /training-progress/videos"
echo "      - GET  /training-progress/tests"
echo "      - GET  /external-trainings"
echo "      - POST /external-trainings"
echo "      - PUT  /external-trainings/:id"
echo "      - DELETE /external-trainings/:id"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "❌ Deployment cancelled"
    echo ""
    exit 0
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 DEPLOYING..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# Deploy Edge Function
echo "📦 Deploying BrowoKoordinator-Lernen..."
echo ""

if supabase functions deploy BrowoKoordinator-Lernen --no-verify-jwt; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ DEPLOYMENT SUCCESSFUL! 🎉"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Edge Function deployed: BrowoKoordinator-Lernen"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "🧪 NEXT STEPS - TESTING"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "1. Test Health Endpoint:"
    echo "   curl https://[project-id].supabase.co/functions/v1/BrowoKoordinator-Lernen/health"
    echo ""
    echo "2. Open Frontend:"
    echo "   → Login als Admin"
    echo "   → Admin → Lernverwaltung → Übersicht Tab"
    echo ""
    echo "3. Test Features:"
    echo "   ✅ Videos Sub-Tab (Training Progress)"
    echo "   ✅ Tests Sub-Tab (Test Results)"
    echo "   ✅ Sonstige Sub-Tab (External Trainings)"
    echo "   ✅ Add External Training"
    echo "   ✅ Certificate Upload"
    echo "   ✅ CSV Export"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📖 DOCUMENTATION"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Full Guide: v4.13.3_DEPLOYMENT_SUCCESS_GUIDE.md"
    echo ""
    echo "API Routes:"
    echo "  • /training-progress/videos  - Video progress for all users"
    echo "  • /training-progress/tests   - Test results for all users"
    echo "  • /external-trainings        - External trainings CRUD"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    exit 0
else
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "❌ DEPLOYMENT FAILED"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Error deploying BrowoKoordinator-Lernen edge function"
    echo ""
    echo "Common Issues:"
    echo ""
    echo "1. Not linked to project:"
    echo "   → Run: supabase link --project-ref [YOUR_PROJECT_REF]"
    echo ""
    echo "2. Wrong directory:"
    echo "   → Make sure you're in the project root"
    echo "   → Edge function should be at: ./supabase/functions/BrowoKoordinator-Lernen/"
    echo ""
    echo "3. Syntax error in code:"
    echo "   → Check: ./supabase/functions/BrowoKoordinator-Lernen/index.ts"
    echo ""
    echo "4. Supabase CLI outdated:"
    echo "   → Update: npm update -g supabase"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    exit 1
fi
