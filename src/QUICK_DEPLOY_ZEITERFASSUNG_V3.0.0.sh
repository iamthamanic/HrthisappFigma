#!/bin/bash

# ============================================
# QUICK DEPLOY - ZEITERFASSUNG v3.0.0
# ============================================
# Work periods integration for day-level tracking
#
# WICHTIG:
#   - Deployed mit --no-verify-jwt Flag
#   - /health Endpoint bleibt PUBLIC für Monitoring
#   - Alle anderen Endpoints benötigen JWT Auth
#
# USAGE:
#   chmod +x QUICK_DEPLOY_ZEITERFASSUNG_V3.0.0.sh
#   ./QUICK_DEPLOY_ZEITERFASSUNG_V3.0.0.sh
#
# ALTERNATIV - Manuelles Deployment im Supabase Dashboard:
#   1. https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions
#   2. Edge Functions → BrowoKoordinator-Zeiterfassung
#   3. Edit Function
#   4. Copy & Paste Code von:
#      /supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts
#   5. Deploy (mit --no-verify-jwt!)
# ============================================

echo ""
echo "🚀 DEPLOYING ZEITERFASSUNG v3.0.0 - WORK_PERIODS INTEGRATION"
echo "=============================================================="
echo ""
echo "📝 NEUE FEATURES v3.0.0:"
echo "  ✅ Automatische work_period Verwaltung (Tages-Container)"
echo "  ✅ session_number Berechnung (1, 2, 3, ...)"
echo "  ✅ session_type Support (Default: 'regular')"
echo "  ✅ work_period.last_clock_out Update beim Clock-Out"
echo ""
echo "🐛 BUGS GEFIXT:"
echo "  ✅ 500 Error beim Clock-In (work_period_id gesetzt)"
echo "  ✅ Missing session_number (automatisch berechnet)"
echo "  ✅ Missing session_type (Default gesetzt)"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI nicht installiert!"
    echo ""
    echo "📋 INSTALLATION:"
    echo ""
    echo "  npm install -g supabase"
    echo ""
    echo "ODER verwende manuelles Deployment:"
    echo ""
    echo "1. Öffne: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions"
    echo "2. Gehe zu: Edge Functions → BrowoKoordinator-Zeiterfassung"
    echo "3. Klicke: 'Edit Function'"
    echo "4. Copy & Paste Code von:"
    echo "   /supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts"
    echo "5. Klicke: 'Deploy'"
    echo ""
    echo "⚠️  WICHTIG: Deploy mit --no-verify-jwt Flag!"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI gefunden"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Nicht eingeloggt in Supabase!"
    echo ""
    echo "📋 LOGIN:"
    echo ""
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Supabase Login erfolgreich"
echo ""

# Check if we're in the right directory
if [ ! -d "supabase/functions/BrowoKoordinator-Zeiterfassung" ]; then
    echo "❌ Falsches Verzeichnis!"
    echo ""
    echo "Bitte navigiere zum Projekt-Root:"
    echo ""
    echo "  cd /path/to/browo-koordinator"
    echo "  ./QUICK_DEPLOY_ZEITERFASSUNG_V3.0.0.sh"
    echo ""
    exit 1
fi

echo "✅ Projekt-Verzeichnis gefunden"
echo ""

# Display function info
echo "📦 FUNCTION INFO:"
echo "  Name: BrowoKoordinator-Zeiterfassung"
echo "  Version: v3.0.0"
echo "  Path: /supabase/functions/BrowoKoordinator-Zeiterfassung"
echo "  Flags: --no-verify-jwt"
echo ""

# Ask for confirmation
read -p "🚀 Deployment starten? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment abgebrochen!"
    exit 1
fi

echo ""
echo "📦 Deploying BrowoKoordinator-Zeiterfassung v3.0.0..."
echo ""

# Deploy with --no-verify-jwt flag
supabase functions deploy BrowoKoordinator-Zeiterfassung --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT ERFOLGREICH!"
    echo ""
    echo "=============================================================="
    echo "📊 NÄCHSTE SCHRITTE - VERSION PRÜFEN:"
    echo "=============================================================="
    echo ""
    echo "1. VERSION CHECK:"
    echo ""
    echo "   curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health"
    echo ""
    echo "   Sollte zeigen: \"version\": \"3.0.0\""
    echo ""
    echo "=============================================================="
    echo "🧪 TESTS DURCHFÜHREN:"
    echo "=============================================================="
    echo ""
    echo "2. Öffne Browser Console auf: https://browo-koordinator.app"
    echo ""
    echo "3. Führe folgende Tests aus:"
    echo ""
    echo "   // HELPER LADEN"
    echo "   const getToken = () => {"
    echo "     const authData = localStorage.getItem('sb-azmtojgikubegzusvhra-auth-token');"
    echo "     if (!authData) return null;"
    echo "     return JSON.parse(authData).access_token;"
    echo "   };"
    echo "   const baseUrl = 'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung';"
    echo ""
    echo "   // TEST 1: CLOCK-IN (v3.0.0)"
    echo "   fetch(\`\${baseUrl}/sessions/clock-in\`, {"
    echo "     method: 'POST',"
    echo "     headers: { 'Authorization': \`Bearer \${getToken()}\` }"
    echo "   }).then(r => r.json()).then(d => console.log('Clock-In:', d));"
    echo ""
    echo "   // TEST 2: BREAK-START"
    echo "   fetch(\`\${baseUrl}/sessions/break-start\`, {"
    echo "     method: 'POST',"
    echo "     headers: { 'Authorization': \`Bearer \${getToken()}\` }"
    echo "   }).then(r => r.json()).then(d => console.log('Break-Start:', d));"
    echo ""
    echo "   // TEST 3: BREAK-END"
    echo "   fetch(\`\${baseUrl}/sessions/break-end\`, {"
    echo "     method: 'POST',"
    echo "     headers: { 'Authorization': \`Bearer \${getToken()}\` }"
    echo "   }).then(r => r.json()).then(d => console.log('Break-End:', d));"
    echo ""
    echo "   // TEST 4: CLOCK-OUT"
    echo "   fetch(\`\${baseUrl}/sessions/clock-out\`, {"
    echo "     method: 'POST',"
    echo "     headers: { 'Authorization': \`Bearer \${getToken()}\` }"
    echo "   }).then(r => r.json()).then(d => console.log('Clock-Out:', d));"
    echo ""
    echo "=============================================================="
    echo "📊 SQL VERIFICATION:"
    echo "=============================================================="
    echo ""
    echo "4. Im Supabase SQL Editor:"
    echo ""
    echo "   SELECT "
    echo "     wp.*, "
    echo "     COUNT(ws.id) as session_count"
    echo "   FROM work_periods wp"
    echo "   LEFT JOIN work_sessions ws ON ws.work_period_id = wp.id"
    echo "   WHERE wp.date = CURRENT_DATE"
    echo "     AND wp.user_id = (SELECT id FROM users WHERE email = 'DEINE@EMAIL.de')"
    echo "   GROUP BY wp.id"
    echo "   ORDER BY wp.created_at DESC"
    echo "   LIMIT 1;"
    echo ""
    echo "=============================================================="
    echo "✅ ERFOLGS-KRITERIEN:"
    echo "=============================================================="
    echo ""
    echo "  ✅ Version 3.0.0 im /health Endpoint"
    echo "  ✅ Clock-In erstellt work_period (falls nicht existiert)"
    echo "  ✅ Clock-In verwendet work_period (falls existiert)"
    echo "  ✅ Session hat work_period_id, session_number, session_type"
    echo "  ✅ Clock-Out aktualisiert work_period.last_clock_out"
    echo "  ✅ Breaks funktionieren (Break-Start, Break-End)"
    echo ""
    echo "=============================================================="
    echo "📚 DOKUMENTATION:"
    echo "=============================================================="
    echo ""
    echo "  Vollständige Anleitung:"
    echo "  /DEPLOY_ZEITERFASSUNG_V3.0.0_WORK_PERIODS.md"
    echo ""
    echo "  Edge Function Code:"
    echo "  /supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts"
    echo ""
    echo "=============================================================="
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FEHLGESCHLAGEN!"
    echo ""
    echo "=============================================================="
    echo "📋 TROUBLESHOOTING:"
    echo "=============================================================="
    echo ""
    echo "1. Prüfe ob du eingeloggt bist:"
    echo ""
    echo "   supabase projects list"
    echo ""
    echo "2. Prüfe ob das richtige Projekt ausgewählt ist:"
    echo ""
    echo "   supabase link --project-ref azmtojgikubegzusvhra"
    echo ""
    echo "3. Versuche manuelles Deployment:"
    echo ""
    echo "   a) Öffne: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions"
    echo "   b) Edge Functions → BrowoKoordinator-Zeiterfassung → Edit"
    echo "   c) Copy & Paste Code von:"
    echo "      /supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts"
    echo "   d) Deploy (mit --no-verify-jwt!)"
    echo ""
    echo "=============================================================="
    echo ""
    exit 1
fi
