/**
 * 🧪 ANALYTICS EDGE FUNCTION - CONSOLE TEST SCRIPT
 * 
 * Kopiere diesen Code in die Browser-Konsole, um die BrowoKoordinator-Analytics
 * Edge Function zu testen!
 * 
 * DEPLOYMENT:
 * 1. Supabase Dashboard → Edge Functions
 * 2. "BrowoKoordinator-Analytics" auswählen
 * 3. Kompletten Code aus /supabase/functions/BrowoKoordinator-Analytics/index.ts kopieren
 * 4. Deploy klicken (mit --no-verify-jwt)
 * 5. Warten bis deployed
 * 6. Dann diesen Test ausführen!
 * 
 * VERSION: 1.0.0
 */

// ==================== CONFIGURATION ====================
const SUPABASE_URL = 'https://azmtojgikubegzusvhra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzUwNjYsImV4cCI6MjA1MTc1MTA2Nn0.asTpE_3u_qiKwbNzSA46x6nBf66PauFCCWZMgPZ_nW8';

const BASE_URL = `${SUPABASE_URL}/functions/v1/BrowoKoordinator-Analytics`;

// Get current session
let ACCESS_TOKEN = null;

async function getAccessToken() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error('❌ Not logged in. Please log in first!');
      return null;
    }
    
    ACCESS_TOKEN = session.access_token;
    console.log('✅ Access token retrieved');
    return ACCESS_TOKEN;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return null;
  }
}

// ==================== API CALL HELPER ====================
async function apiCall(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (endpoint !== '/health' && ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`📡 REQUEST: ${url}`);
  if (body) {
    console.log('   Body:', body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS:');
      console.log('   Response:', data);
    } else {
      console.error('❌ ERROR:');
      console.error('   Status:', response.status);
      console.error('   Response:', data);
    }
    
    return { error: !response.ok, status: response.status, data };
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error);
    return { error: true, status: 0, data: null };
  }
}

// ==================== TEST FUNCTIONS ====================

// 1. Health Check (NO AUTH)
async function analyticsHealthCheck() {
  console.log('\n═══ 🏥 HEALTH CHECK ═══');
  return await apiCall('/health');
}

// 2. Get Dashboard Stats
async function analyticsGetDashboard() {
  console.log('\n═══ 📊 DASHBOARD STATS ═══');
  return await apiCall('/dashboard');
}

// 3. Get Overview (HR/Admin only)
async function analyticsGetOverview() {
  console.log('\n═══ 📈 ANALYTICS OVERVIEW ═══');
  return await apiCall('/overview');
}

// 4. Get User Stats
async function analyticsGetUserStats(userId = null) {
  console.log('\n═══ 👤 USER STATS ═══');
  const endpoint = userId ? `/user-stats?userId=${userId}` : '/user-stats';
  return await apiCall(endpoint);
}

// 5. Get Time Tracking Stats
async function analyticsGetTimeTracking(period = 'month', userId = null) {
  console.log('\n═══ ⏱️ TIME TRACKING STATS ═══');
  let endpoint = `/time-tracking?period=${period}`;
  if (userId) {
    endpoint += `&userId=${userId}`;
  }
  return await apiCall(endpoint);
}

// 6. Get Leave Stats
async function analyticsGetLeaveStats(year = null, userId = null) {
  console.log('\n═══ 🏖️ LEAVE STATS ═══');
  const currentYear = year || new Date().getFullYear();
  let endpoint = `/leave-stats?year=${currentYear}`;
  if (userId) {
    endpoint += `&userId=${userId}`;
  }
  return await apiCall(endpoint);
}

// ==================== FULL TEST SUITE ====================

async function runAnalyticsTests() {
  console.log('🚀 STARTING ANALYTICS EDGE FUNCTION TESTS...\n');
  
  // Get access token
  await getAccessToken();
  if (!ACCESS_TOKEN) {
    console.error('❌ Cannot proceed without access token. Please log in!');
    return;
  }
  
  // Test 1: Health Check
  await analyticsHealthCheck();
  
  // Test 2: Dashboard Stats
  await analyticsGetDashboard();
  
  // Test 3: Overview (HR/Admin only)
  await analyticsGetOverview();
  
  // Test 4: User Stats
  await analyticsGetUserStats();
  
  // Test 5: Time Tracking (different periods)
  await analyticsGetTimeTracking('today');
  await analyticsGetTimeTracking('week');
  await analyticsGetTimeTracking('month');
  
  // Test 6: Leave Stats
  await analyticsGetLeaveStats();
  
  console.log('\n✅ ALL ANALYTICS TESTS COMPLETE!');
}

// ==================== QUICK TEST ====================

async function quickAnalyticsTest() {
  console.log('⚡ QUICK ANALYTICS TEST\n');
  
  await getAccessToken();
  if (!ACCESS_TOKEN) return;
  
  await analyticsHealthCheck();
  await analyticsGetDashboard();
  await analyticsGetUserStats();
  
  console.log('\n✅ QUICK TEST COMPLETE!');
}

// ==================== EXPORTED FUNCTIONS ====================

window.analyticsTests = {
  // Full test suite
  runAll: runAnalyticsTests,
  quickTest: quickAnalyticsTest,
  
  // Individual tests
  health: analyticsHealthCheck,
  getDashboard: analyticsGetDashboard,
  getOverview: analyticsGetOverview,
  getUserStats: analyticsGetUserStats,
  getTimeTracking: analyticsGetTimeTracking,
  getLeaveStats: analyticsGetLeaveStats,
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║      🎯 ANALYTICS EDGE FUNCTION TEST SUITE LOADED!            ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  SCHNELLTEST:                                                  ║
║  → analyticsTests.quickTest()                                  ║
║                                                                ║
║  VOLLSTÄNDIGER TEST:                                           ║
║  → analyticsTests.runAll()                                     ║
║                                                                ║
║  EINZELNE TESTS:                                               ║
║  → analyticsTests.health()              - Health Check         ║
║  → analyticsTests.getDashboard()        - Dashboard Stats     ║
║  → analyticsTests.getOverview()         - Overview (HR)       ║
║  → analyticsTests.getUserStats()        - User Stats          ║
║  → analyticsTests.getTimeTracking()     - Time Tracking       ║
║  → analyticsTests.getLeaveStats()       - Leave Stats         ║
║                                                                ║
║  ERWEITERTE TESTS:                                             ║
║  → analyticsTests.getUserStats('USER_ID')                     ║
║  → analyticsTests.getTimeTracking('week')                     ║
║  → analyticsTests.getLeaveStats(2025)                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
