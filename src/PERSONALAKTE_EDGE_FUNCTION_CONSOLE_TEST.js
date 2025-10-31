/**
 * 🧪 PERSONALAKTE EDGE FUNCTION - CONSOLE TEST SCRIPT
 * 
 * Kopiere diesen Code in die Browser-Konsole, um die BrowoKoordinator-Personalakte
 * Edge Function zu testen!
 * 
 * DEPLOYMENT:
 * 1. Supabase Dashboard → Edge Functions
 * 2. "BrowoKoordinator-Personalakte" auswählen
 * 3. Kompletten Code aus /supabase/functions/BrowoKoordinator-Personalakte/index.ts kopieren
 * 4. Deploy klicken (mit --no-verify-jwt)
 * 5. Warten bis deployed
 * 6. Dann diesen Test ausführen!
 * 
 * VERSION: 1.0.0
 */

// ==================== CONFIGURATION ====================
const SUPABASE_URL = 'https://azmtojgikubegzusvhra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzUwNjYsImV4cCI6MjA1MTc1MTA2Nn0.asTpE_3u_qiKwbNzSA46x6nBf66PauFCCWZMgPZ_nW8';

const BASE_URL = `${SUPABASE_URL}/functions/v1/BrowoKoordinator-Personalakte`;

// Get current session
let ACCESS_TOKEN = null;
let CURRENT_USER_ID = null;

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
    CURRENT_USER_ID = session.user.id; // ✅ FIXED: session.user.id, not user.id!
    console.log('✅ Access token retrieved');
    console.log('👤 User ID:', CURRENT_USER_ID);
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
async function personalakteHealthCheck() {
  console.log('\n═══ 🏥 HEALTH CHECK ═══');
  return await apiCall('/health');
}

// 2. Get All Employees
async function personalakteGetEmployees(search = null, department_id = null) {
  console.log('\n═══ 👥 GET EMPLOYEES ═══');
  let endpoint = '/employees?limit=10&offset=0';
  if (search) {
    endpoint += `&search=${encodeURIComponent(search)}`;
  }
  if (department_id) {
    endpoint += `&department_id=${department_id}`;
  }
  return await apiCall(endpoint);
}

// 3. Get Employee Profile
async function personalakteGetProfile(userId = null) {
  console.log('\n═══ 👤 GET EMPLOYEE PROFILE ═══');
  const targetUserId = userId || CURRENT_USER_ID;
  return await apiCall(`/employees/${targetUserId}`);
}

// 4. Update Employee Profile
async function personalakteUpdateProfile(userId = null, updates = {}) {
  console.log('\n═══ ✏️ UPDATE EMPLOYEE PROFILE ═══');
  const targetUserId = userId || CURRENT_USER_ID;
  const defaultUpdates = {
    phone: '+49 123 456789',
    work_phone: '+49 40 123456 78',  // ✅ work_phone exists, mobile_phone does NOT!
    ...updates
  };
  return await apiCall(`/employees/${targetUserId}`, 'PUT', defaultUpdates);
}

// 5. Get Employee Documents
async function personalakteGetDocuments(userId = null, category = null) {
  console.log('\n═══ 📄 GET EMPLOYEE DOCUMENTS ═══');
  const targetUserId = userId || CURRENT_USER_ID;
  let endpoint = `/employees/${targetUserId}/documents`;
  if (category) {
    endpoint += `?category=${encodeURIComponent(category)}`;
  }
  return await apiCall(endpoint);
}

// 6. Get Employee Notes (HR/Admin only)
async function personalakteGetNotes(userId = null) {
  console.log('\n═══ 📝 GET EMPLOYEE NOTES ═══');
  const targetUserId = userId || CURRENT_USER_ID;
  return await apiCall(`/employees/${targetUserId}/notes`);
}

// 7. Add Employee Note (HR/Admin only)
async function personalakteAddNote(userId = null, noteText = null, is_private = true) {
  console.log('\n═══ ➕ ADD EMPLOYEE NOTE ═══');
  const targetUserId = userId || CURRENT_USER_ID;
  const defaultNoteText = noteText || 'Test Note: ' + new Date().toLocaleString();
  return await apiCall(`/employees/${targetUserId}/notes`, 'POST', {
    note_text: defaultNoteText,
    is_private: is_private
  });
}

// 8. Delete Employee Note (HR/Admin only)
async function personalakteDeleteNote(userId = null, noteId = null) {
  console.log('\n═══ 🗑️ DELETE EMPLOYEE NOTE ═══');
  if (!noteId) {
    console.error('❌ Note ID required!');
    return null;
  }
  const targetUserId = userId || CURRENT_USER_ID;
  return await apiCall(`/employees/${targetUserId}/notes/${noteId}`, 'DELETE');
}

// ==================== FULL TEST SUITE ====================

async function runPersonalakteTests() {
  console.log('🚀 STARTING PERSONALAKTE EDGE FUNCTION TESTS...\n');
  
  // Get access token
  await getAccessToken();
  if (!ACCESS_TOKEN) {
    console.error('❌ Cannot proceed without access token. Please log in!');
    return;
  }
  
  // Test 1: Health Check
  await personalakteHealthCheck();
  
  // Test 2: Get All Employees
  await personalakteGetEmployees();
  
  // Test 3: Get Own Profile
  await personalakteGetProfile();
  
  // Test 4: Update Own Profile
  await personalakteUpdateProfile();
  
  // Test 5: Get Own Documents
  await personalakteGetDocuments();
  
  // Test 6: Get Own Notes (HR/Admin only)
  await personalakteGetNotes();
  
  // Test 7: Add Note (HR/Admin only)
  const noteResult = await personalakteAddNote();
  const noteId = noteResult?.data?.note?.id;
  
  // Test 8: Delete Note (HR/Admin only)
  if (noteId) {
    await personalakteDeleteNote(CURRENT_USER_ID, noteId);
  }
  
  console.log('\n✅ ALL PERSONALAKTE TESTS COMPLETE!');
}

// ==================== QUICK TEST ====================

async function quickPersonalakteTest() {
  console.log('⚡ QUICK PERSONALAKTE TEST\n');
  
  await getAccessToken();
  if (!ACCESS_TOKEN) return;
  
  await personalakteHealthCheck();
  await personalakteGetEmployees();
  await personalakteGetProfile();
  await personalakteUpdateProfile();  // ✅ ADD UPDATE TEST!
  await personalakteGetDocuments();
  
  console.log('\n✅ QUICK TEST COMPLETE!');
}

// ==================== EXPORTED FUNCTIONS ====================

window.personalakteTests = {
  // Full test suite
  runAll: runPersonalakteTests,
  quickTest: quickPersonalakteTest,
  
  // Individual tests
  health: personalakteHealthCheck,
  getEmployees: personalakteGetEmployees,
  getProfile: personalakteGetProfile,
  updateProfile: personalakteUpdateProfile,
  getDocuments: personalakteGetDocuments,
  getNotes: personalakteGetNotes,
  addNote: personalakteAddNote,
  deleteNote: personalakteDeleteNote,
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║    🎯 PERSONALAKTE EDGE FUNCTION TEST SUITE LOADED!           ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  SCHNELLTEST:                                                  ║
║  → personalakteTests.quickTest()                               ║
║                                                                ║
║  VOLLSTÄNDIGER TEST:                                           ║
║  → personalakteTests.runAll()                                  ║
║                                                                ║
║  EINZELNE TESTS:                                               ║
║  → personalakteTests.health()              - Health Check      ║
║  → personalakteTests.getEmployees()        - Alle Mitarbeiter  ║
║  → personalakteTests.getProfile()          - Eigenes Profil    ║
║  → personalakteTests.updateProfile()       - Profil Update     ║
║  → personalakteTests.getDocuments()        - Dokumente         ║
║  → personalakteTests.getNotes()            - Notizen (HR)      ║
║  → personalakteTests.addNote()             - Notiz Add (HR)    ║
║  → personalakteTests.deleteNote(uid, nid)  - Notiz Delete (HR) ║
║                                                                ║
║  ERWEITERTE TESTS:                                             ║
║  → personalakteTests.getEmployees('Max')   - Mit Suche         ║
║  → personalakteTests.getProfile('USER_ID') - Anderer User      ║
║  → personalakteTests.getDocuments(null, 'VERTRAG')             ║
║  → personalakteTests.addNote(null, 'My note', false)           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
