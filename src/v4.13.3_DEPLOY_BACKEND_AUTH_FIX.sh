#!/bin/bash

# v4.13.3 - BACKEND AUTH FIX DEPLOYMENT
# ========================================
# Fixes: Hardcoded role checks in Training Compliance API
# Problem: API checked for ['ADMIN', 'SUPERADMIN', 'HR'] but DB has ['HR_SUPERADMIN', 'HR_MANAGER']
# Solution: Use isAdmin() helper function that checks for HR_SUPERADMIN and HR_MANAGER

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 v4.13.3 - BACKEND AUTH FIX DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Was wurde geändert:"
echo "   ✅ Fixed /training-progress/videos auth check"
echo "   ✅ Fixed /training-progress/tests auth check"
echo "   ✅ Fixed /external-trainings (POST) auth check"
echo "   ✅ Fixed /external-trainings/:id (PUT) auth check"
echo "   ✅ Fixed /external-trainings/:id (DELETE) auth check"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prüfe ob Supabase CLI installiert ist
if ! command -v supabase &> /dev/null; then
    echo "❌ ERROR: Supabase CLI nicht gefunden!"
    echo ""
    echo "Installiere mit: npm install -g supabase"
    exit 1
fi

echo "📦 1/3 - Deploying BrowoKoordinator-Lernen Edge Function..."
echo ""

cd supabase/functions

supabase functions deploy BrowoKoordinator-Lernen --no-verify-jwt

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment fehlgeschlagen!"
    echo ""
    echo "Mögliche Lösungen:"
    echo "  1. Login prüfen: supabase login"
    echo "  2. Projekt verknüpfen: supabase link --project-ref DEIN_PROJECT_ID"
    exit 1
fi

cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT ERFOLGREICH!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 2/3 - JETZT TESTEN:"
echo ""
echo "Option A: Frontend Test (empfohlen)"
echo "  1. Öffne deine Browo App im Browser"
echo "  2. Gehe zu: Admin → Lernverwaltung → Übersicht Tab"
echo "  3. Klicke auf 'Videos' Sub-Tab"
echo "  4. Du solltest JETZT Videos mit User-Listen sehen!"
echo ""
echo "Option B: Console Debug Test"
echo "  1. F12 → Console Tab"
echo "  2. Paste: v4.13.3_DEBUG_API_RESPONSE.js"
echo "  3. Prüfe Output - total_users sollte 6 sein"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 3/3 - ERWARTETES ERGEBNIS:"
echo ""
echo "  📹 Video 1: 'iso'"
echo "     • User 1: 0% | Nicht gestartet"
echo "     • User 2: 0% | Nicht gestartet"
echo "     • User 3: 0% | Nicht gestartet"
echo "     • ... (alle 6 Users)"
echo ""
echo "  📹 Video 2: 'Marketing Masterclass'"
echo "     • User 1: 0% | Nicht gestartet"
echo "     • User 2: 0% | Nicht gestartet"
echo "     • ... (alle 6 Users)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ FERTIG! Training Compliance Dashboard sollte jetzt funktionieren!"
echo ""
