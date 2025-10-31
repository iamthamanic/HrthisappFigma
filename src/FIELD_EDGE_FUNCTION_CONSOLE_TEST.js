/**
 * 🧪 FIELD EDGE FUNCTION - CONSOLE TEST SCRIPT
 * 
 * Kopiere diesen Code in die Browser-Konsole, um die BrowoKoordinator-Field
 * Edge Function zu testen!
 * 
 * DEPLOYMENT:
 * 1. Supabase Dashboard → Edge Functions
 * 2. "BrowoKoordinator-Field" auswählen
 * 3. Kompletten Code aus /supabase/functions/BrowoKoordinator-Field/index.ts kopieren
 * 4. Deploy klicken (mit --no-verify-jwt)
 * 5. Warten bis deployed
 * 6. Dann diesen Test ausführen!
 * 
 * VERSION: 1.0.0
 */

// ==================== CONFIGURATION ====================
const SUPABASE_URL = 'https://azmtojgikubegzusvhra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzUwNjYsImV4cCI6MjA1MTc1MTA2Nn0.asTpE_3u_qiKwbNzSA46x6nBf66PauFCCWZMgPZ_nW8';

const BASE_URL = `${SUPABASE_URL}/functions/v1/BrowoKoordinator-Field`;

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
async function fieldHealthCheck() {
  console.log('\n═══ 🏥 HEALTH CHECK ═══');
  return await apiCall('/health');
}

// 2. Get Vehicles
async function fieldGetVehicles() {
  console.log('\n═══ 🚗 GET VEHICLES ═══');
  return await apiCall('/vehicles');
}

// 3. Create Vehicle
async function fieldCreateVehicle(vehicleData) {
  console.log('\n═══ ➕ CREATE VEHICLE ═══');
  const defaultData = {
    kennzeichen: 'B-TEST-123',
    modell: 'VW Transporter',
    fahrzeugtyp: 'Transporter',
    ladekapazitaet: 1000,
    dienst_start: '2025-01-01',
    status: 'available',
    ...vehicleData,
  };
  return await apiCall('/vehicles', 'POST', defaultData);
}

// 4. Update Vehicle
async function fieldUpdateVehicle(vehicleId, updates) {
  console.log('\n═══ ✏️ UPDATE VEHICLE ═══');
  return await apiCall(`/vehicles/${vehicleId}`, 'PUT', updates);
}

// 5. Delete Vehicle
async function fieldDeleteVehicle(vehicleId) {
  console.log('\n═══ 🗑️ DELETE VEHICLE ═══');
  return await apiCall(`/vehicles/${vehicleId}`, 'DELETE');
}

// 6. Get Equipment
async function fieldGetEquipment() {
  console.log('\n═══ 🔧 GET EQUIPMENT ═══');
  return await apiCall('/equipment');
}

// 7. Create Equipment
async function fieldCreateEquipment(equipmentData) {
  console.log('\n═══ ➕ CREATE EQUIPMENT ═══');
  const defaultData = {
    name: 'Bohrmaschine Makita',
    category: 'Werkzeug',
    serial_number: 'SN-12345',
    condition: 'good',
    status: 'available',
    ...equipmentData,
  };
  return await apiCall('/equipment', 'POST', defaultData);
}

// 8. Update Equipment
async function fieldUpdateEquipment(equipmentId, updates) {
  console.log('\n═══ ✏️ UPDATE EQUIPMENT ═══');
  return await apiCall(`/equipment/${equipmentId}`, 'PUT', updates);
}

// 9. Delete Equipment
async function fieldDeleteEquipment(equipmentId) {
  console.log('\n═══ 🗑️ DELETE EQUIPMENT ═══');
  return await apiCall(`/equipment/${equipmentId}`, 'DELETE');
}

// 10. Checkout Item
async function fieldCheckout(itemType, itemId, notes) {
  console.log('\n═══ 📤 CHECKOUT ITEM ═══');
  return await apiCall('/checkout', 'POST', {
    item_type: itemType,
    item_id: itemId,
    notes: notes || 'Test checkout',
  });
}

// 11. Checkin Item
async function fieldCheckin(itemType, itemId, condition, notes) {
  console.log('\n═══ 📥 CHECKIN ITEM ═══');
  return await apiCall('/checkin', 'POST', {
    item_type: itemType,
    item_id: itemId,
    condition: condition || 'good',
    notes: notes || 'Test checkin',
  });
}

// 12. Get My Assignments
async function fieldGetMyAssignments() {
  console.log('\n═══ 📋 MY ASSIGNMENTS ═══');
  return await apiCall('/my-assignments');
}

// 13. Get History
async function fieldGetHistory(itemId, itemType) {
  console.log('\n═══ 📜 ASSIGNMENT HISTORY ═══');
  let endpoint = '/history';
  if (itemId && itemType) {
    endpoint += `?itemId=${itemId}&itemType=${itemType}`;
  }
  return await apiCall(endpoint);
}

// ==================== FULL TEST SUITE ====================

async function runFieldTests() {
  console.log('🚀 STARTING FIELD EDGE FUNCTION TESTS...\n');
  
  // Get access token
  await getAccessToken();
  if (!ACCESS_TOKEN) {
    console.error('❌ Cannot proceed without access token. Please log in!');
    return;
  }
  
  // Test 1: Health Check
  await fieldHealthCheck();
  
  // Test 2: Get Vehicles
  await fieldGetVehicles();
  
  // Test 3: Create Vehicle
  const vehicleResult = await fieldCreateVehicle();
  const vehicleId = vehicleResult?.data?.vehicle?.id;
  
  if (vehicleId) {
    // Test 4: Update Vehicle
    await fieldUpdateVehicle(vehicleId, {
      modell: 'VW Transporter T6',
      ladekapazitaet: 1200,
    });
    
    // Test 5: Checkout Vehicle
    const checkoutResult = await fieldCheckout('vehicle', vehicleId, 'Test checkout');
    
    // Test 6: Get My Assignments
    await fieldGetMyAssignments();
    
    // Test 7: Checkin Vehicle
    await fieldCheckin('vehicle', vehicleId, 'good', 'Test checkin - alles okay');
    
    // Test 8: Get History
    await fieldGetHistory(vehicleId, 'vehicle');
    
    // Test 9: Delete Vehicle
    await fieldDeleteVehicle(vehicleId);
  }
  
  // Test 10: Get Equipment
  await fieldGetEquipment();
  
  // Test 11: Create Equipment
  const equipmentResult = await fieldCreateEquipment();
  const equipmentId = equipmentResult?.data?.equipment?.id;
  
  if (equipmentId) {
    // Test 12: Update Equipment
    await fieldUpdateEquipment(equipmentId, {
      condition: 'excellent',
    });
    
    // Test 13: Delete Equipment
    await fieldDeleteEquipment(equipmentId);
  }
  
  console.log('\n✅ ALL FIELD TESTS COMPLETE!');
}

// ==================== QUICK TEST ====================

async function quickFieldTest() {
  console.log('⚡ QUICK FIELD TEST\n');
  
  await getAccessToken();
  if (!ACCESS_TOKEN) return;
  
  await fieldHealthCheck();
  await fieldGetVehicles();
  await fieldGetEquipment();
  await fieldGetMyAssignments();
  
  console.log('\n✅ QUICK TEST COMPLETE!');
}

// ==================== EXPORTED FUNCTIONS ====================

window.fieldTests = {
  // Full test suite
  runAll: runFieldTests,
  quickTest: quickFieldTest,
  
  // Individual tests
  health: fieldHealthCheck,
  getVehicles: fieldGetVehicles,
  createVehicle: fieldCreateVehicle,
  updateVehicle: fieldUpdateVehicle,
  deleteVehicle: fieldDeleteVehicle,
  getEquipment: fieldGetEquipment,
  createEquipment: fieldCreateEquipment,
  updateEquipment: fieldUpdateEquipment,
  deleteEquipment: fieldDeleteEquipment,
  checkout: fieldCheckout,
  checkin: fieldCheckin,
  getMyAssignments: fieldGetMyAssignments,
  getHistory: fieldGetHistory,
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         🎯 FIELD EDGE FUNCTION TEST SUITE LOADED!             ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  SCHNELLTEST:                                                  ║
║  → fieldTests.quickTest()                                      ║
║                                                                ║
║  VOLLSTÄNDIGER TEST:                                           ║
║  → fieldTests.runAll()                                         ║
║                                                                ║
║  EINZELNE TESTS:                                               ║
║  → fieldTests.health()                - Health Check           ║
║  → fieldTests.getVehicles()           - Hole Fahrzeuge         ║
║  → fieldTests.createVehicle(data)     - Erstelle Fahrzeug      ║
║  → fieldTests.updateVehicle(id, data) - Update Fahrzeug        ║
║  → fieldTests.deleteVehicle(id)       - Lösche Fahrzeug        ║
║  → fieldTests.getEquipment()          - Hole Ausrüstung        ║
║  → fieldTests.createEquipment(data)   - Erstelle Ausrüstung    ║
║  → fieldTests.checkout(type, id)      - Checkout Item          ║
║  → fieldTests.checkin(type, id)       - Checkin Item           ║
║  → fieldTests.getMyAssignments()      - Meine Zuweisungen      ║
║  → fieldTests.getHistory()            - Verlauf                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
