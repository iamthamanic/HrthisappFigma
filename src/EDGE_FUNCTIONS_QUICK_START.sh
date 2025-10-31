#!/bin/bash

# BrowoKoordinator - Edge Functions Quick Start Script
# 
# Dieses Script hilft beim schnellen Deployment aller Edge Functions

set -e

echo "🚀 BrowoKoordinator - Edge Functions Quick Start"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
echo "📋 Checking prerequisites..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo ""
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Menu
echo "Select deployment option:"
echo "1) Deploy Zeiterfassung only (recommended first)"
echo "2) Deploy critical functions (Zeiterfassung, Dokumente, Notification)"
echo "3) Deploy all functions (12 functions)"
echo "4) Test health checks"
echo "5) View function logs"
echo "6) Cancel"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying Zeiterfassung..."
        supabase functions deploy BrowoKoordinator-Zeiterfassung
        echo ""
        echo -e "${GREEN}✅ Zeiterfassung deployed!${NC}"
        echo ""
        echo "Test health check:"
        echo "curl https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health"
        ;;
    
    2)
        echo ""
        echo "📦 Deploying critical functions..."
        supabase functions deploy BrowoKoordinator-Zeiterfassung
        supabase functions deploy BrowoKoordinator-Dokumente
        supabase functions deploy BrowoKoordinator-Notification
        echo ""
        echo -e "${GREEN}✅ Critical functions deployed!${NC}"
        ;;
    
    3)
        echo ""
        echo -e "${YELLOW}⚠️  WARNING: This will deploy ALL 12 functions!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo "📦 Deploying all functions..."
            
            supabase functions deploy BrowoKoordinator-Zeiterfassung
            supabase functions deploy BrowoKoordinator-Benefits
            supabase functions deploy BrowoKoordinator-Lernen
            supabase functions deploy BrowoKoordinator-Dokumente
            supabase functions deploy BrowoKoordinator-Notification
            supabase functions deploy BrowoKoordinator-Antragmanager
            supabase functions deploy BrowoKoordinator-Analytics
            supabase functions deploy BrowoKoordinator-Tasks
            supabase functions deploy BrowoKoordinator-Personalakte
            supabase functions deploy BrowoKoordinator-Kalender
            supabase functions deploy BrowoKoordinator-Organigram
            supabase functions deploy BrowoKoordinator-Field
            
            echo ""
            echo -e "${GREEN}✅ All functions deployed!${NC}"
        else
            echo "Deployment cancelled."
        fi
        ;;
    
    4)
        echo ""
        echo "🧪 Testing health checks..."
        read -p "Enter your Supabase Project ID: " project_id
        echo ""
        
        functions=(
            "BrowoKoordinator-Zeiterfassung"
            "BrowoKoordinator-Benefits"
            "BrowoKoordinator-Lernen"
            "BrowoKoordinator-Dokumente"
            "BrowoKoordinator-Notification"
            "BrowoKoordinator-Antragmanager"
            "BrowoKoordinator-Analytics"
            "BrowoKoordinator-Tasks"
            "BrowoKoordinator-Personalakte"
            "BrowoKoordinator-Kalender"
            "BrowoKoordinator-Organigram"
            "BrowoKoordinator-Field"
        )
        
        for func in "${functions[@]}"; do
            echo "Testing $func..."
            response=$(curl -s "https://${project_id}.supabase.co/functions/v1/${func}/health" 2>&1)
            
            if echo "$response" | grep -q '"status":"ok"'; then
                echo -e "${GREEN}✅ $func is healthy${NC}"
            else
                echo -e "${RED}❌ $func failed health check${NC}"
            fi
        done
        ;;
    
    5)
        echo ""
        echo "📋 Available functions:"
        echo "1) BrowoKoordinator-Zeiterfassung"
        echo "2) BrowoKoordinator-Benefits"
        echo "3) BrowoKoordinator-Lernen"
        echo "4) BrowoKoordinator-Dokumente"
        echo "5) BrowoKoordinator-Notification"
        echo "6) BrowoKoordinator-Antragmanager"
        echo "7) BrowoKoordinator-Analytics"
        echo "8) BrowoKoordinator-Tasks"
        echo "9) BrowoKoordinator-Personalakte"
        echo "10) BrowoKoordinator-Kalender"
        echo "11) BrowoKoordinator-Organigram"
        echo "12) BrowoKoordinator-Field"
        echo ""
        read -p "Enter function name: " func_name
        echo ""
        echo "📋 Showing logs for $func_name (Press Ctrl+C to exit)..."
        supabase functions logs "$func_name" --tail
        ;;
    
    6)
        echo "Cancelled."
        exit 0
        ;;
    
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo -e "${GREEN}Done!${NC}"
echo ""
echo "📚 Next steps:"
echo "1. Check EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md"
echo "2. Check EDGE_FUNCTIONS_MIGRATION_STATUS.md"
echo "3. Test your deployed functions"
echo "4. Integrate with frontend"
echo ""
