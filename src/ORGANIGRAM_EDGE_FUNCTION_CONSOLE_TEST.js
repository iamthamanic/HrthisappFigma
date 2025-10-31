/**
 * 🧪 ORGANIGRAM EDGE FUNCTION - CONSOLE TEST SCRIPT
 * 
 * Kopiere diesen Code in die Browser-Konsole, um die BrowoKoordinator-Organigram
 * Edge Function zu testen!
 * 
 * DEPLOYMENT:
 * 1. Supabase Dashboard → Edge Functions
 * 2. "BrowoKoordinator-Organigram" auswählen
 * 3. Kompletten Code aus /supabase/functions/BrowoKoordinator-Organigram/index.ts kopieren
 * 4. Deploy klicken
 * 5. Warten bis deployed
 * 6. Dann diesen Test ausführen!
 * 
 * VERSION: 1.0.0
 */

// ==================== CONFIGURATION ====================
const SUPABASE_URL = 'https://azmtojgikubegzusvhra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzUwNjYsImV4cCI6MjA1MTc1MTA2Nn0.asTpE_3u_qiKwbNzSA46x6nBf66PauFCCWZMgPZ_nW8';

const BASE_URL = `${SUPABASE_URL}/functions/v1/BrowoKoordinator-Organigram`;

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
async function orgHealthCheck() {
  console.log('\n═══ 🏥 HEALTH CHECK ═══');
  return await apiCall('/health');
}

// 2. Get Draft Organigram
async function orgGetDraft() {
  console.log('\n═══ 📝 GET DRAFT ═══');
  return await apiCall('/draft');
}

// 3. Get Live Organigram
async function orgGetLive() {
  console.log('\n═══ 🌐 GET LIVE ═══');
  return await apiCall('/live');
}

// 4. Create Node
async function orgCreateNode(nodeData) {
  console.log('\n═══ ➕ CREATE NODE ═══');
  const defaultData = {
    node_type: 'executive',
    title: 'CEO',
    description: 'Chief Executive Officer',
    position_x: 400,
    position_y: 100,
    width: 280,
    height: 180,
    metadata: { test: true },
    ...nodeData,
  };
  return await apiCall('/nodes', 'POST', defaultData);
}

// 5. Update Node
async function orgUpdateNode(nodeId, updates) {
  console.log('\n═══ ✏️ UPDATE NODE ═══');
  return await apiCall(`/nodes/${nodeId}`, 'PUT', updates);
}

// 6. Delete Node
async function orgDeleteNode(nodeId) {
  console.log('\n═══ 🗑️ DELETE NODE ═══');
  return await apiCall(`/nodes/${nodeId}`, 'DELETE');
}

// 7. Create Connection
async function orgCreateConnection(connectionData) {
  console.log('\n═══ 🔗 CREATE CONNECTION ═══');
  const defaultData = {
    source_node_id: 'SOURCE_NODE_ID_HERE',
    source_position: 'bottom',
    target_node_id: 'TARGET_NODE_ID_HERE',
    target_position: 'top',
    line_style: 'curved',
    color: '#6B7280',
    stroke_width: 2,
    ...connectionData,
  };
  return await apiCall('/connections', 'POST', defaultData);
}

// 8. Delete Connection
async function orgDeleteConnection(connectionId) {
  console.log('\n═══ 🗑️ DELETE CONNECTION ═══');
  return await apiCall(`/connections/${connectionId}`, 'DELETE');
}

// 9. Publish Draft to Live
async function orgPublish() {
  console.log('\n═══ 🚀 PUBLISH DRAFT TO LIVE ═══');
  return await apiCall('/publish', 'POST');
}

// 10. Get History
async function orgGetHistory() {
  console.log('\n═══ 📜 GET VERSION HISTORY ═══');
  return await apiCall('/history');
}

// 11. Restore Version
async function orgRestoreVersion(version) {
  console.log('\n═══ ⏮️ RESTORE VERSION ═══');
  return await apiCall(`/restore/${version}`, 'POST');
}

// 12. Auto-save
async function orgAutoSave(nodes, connections) {
  console.log('\n═══ 💾 AUTO-SAVE ═══');
  return await apiCall('/auto-save', 'POST', { nodes, connections });
}

// ==================== FULL TEST SUITE ====================

async function runOrganigramTests() {
  console.log('🚀 STARTING ORGANIGRAM EDGE FUNCTION TESTS...\n');
  
  // Get access token
  await getAccessToken();
  if (!ACCESS_TOKEN) {
    console.error('❌ Cannot proceed without access token. Please log in!');
    return;
  }
  
  // Test 1: Health Check
  await orgHealthCheck();
  
  // Test 2: Get Draft
  await orgGetDraft();
  
  // Test 3: Get Live
  await orgGetLive();
  
  // Test 4: Create Node
  const createResult = await orgCreateNode();
  const createdNodeId = createResult?.data?.node?.id;
  
  if (createdNodeId) {
    // Test 5: Update Node
    await orgUpdateNode(createdNodeId, {
      title: 'CEO (Updated)',
      description: 'Updated description',
      position_x: 450,
    });
    
    // Test 6: Create another node for connection
    const node2Result = await orgCreateNode({
      node_type: 'department',
      title: 'HR Department',
      position_x: 200,
      position_y: 300,
    });
    const node2Id = node2Result?.data?.node?.id;
    
    if (node2Id) {
      // Test 7: Create Connection
      const connectionResult = await orgCreateConnection({
        source_node_id: createdNodeId,
        source_position: 'bottom',
        target_node_id: node2Id,
        target_position: 'top',
      });
      const connectionId = connectionResult?.data?.connection?.id;
      
      // Test 8: Auto-save
      const draftResult = await orgGetDraft();
      if (draftResult?.data?.draft) {
        await orgAutoSave(
          draftResult.data.draft.nodes,
          draftResult.data.draft.connections
        );
      }
      
      // Test 9: Publish
      await orgPublish();
      
      // Test 10: Get History
      await orgGetHistory();
      
      // Test 11: Delete Connection
      if (connectionId) {
        await orgDeleteConnection(connectionId);
      }
    }
    
    // Test 12: Delete Node
    await orgDeleteNode(createdNodeId);
    if (node2Id) {
      await orgDeleteNode(node2Id);
    }
  }
  
  console.log('\n✅ ALL ORGANIGRAM TESTS COMPLETE!');
}

// ==================== QUICK TEST ====================

async function quickOrganigramTest() {
  console.log('⚡ QUICK ORGANIGRAM TEST\n');
  
  await getAccessToken();
  if (!ACCESS_TOKEN) return;
  
  await orgHealthCheck();
  await orgGetDraft();
  await orgGetLive();
  await orgGetHistory();
  
  console.log('\n✅ QUICK TEST COMPLETE!');
}

// ==================== EXPORTED FUNCTIONS ====================

window.organigramTests = {
  // Full test suite
  runAll: runOrganigramTests,
  quickTest: quickOrganigramTest,
  
  // Individual tests
  health: orgHealthCheck,
  getDraft: orgGetDraft,
  getLive: orgGetLive,
  createNode: orgCreateNode,
  updateNode: orgUpdateNode,
  deleteNode: orgDeleteNode,
  createConnection: orgCreateConnection,
  deleteConnection: orgDeleteConnection,
  publish: orgPublish,
  getHistory: orgGetHistory,
  restoreVersion: orgRestoreVersion,
  autoSave: orgAutoSave,
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║       🎯 ORGANIGRAM EDGE FUNCTION TEST SUITE LOADED!          ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  SCHNELLTEST:                                                  ║
║  → organigramTests.quickTest()                                 ║
║                                                                ║
║  VOLLSTÄNDIGER TEST:                                           ║
║  → organigramTests.runAll()                                    ║
║                                                                ║
║  EINZELNE TESTS:                                               ║
║  → organigramTests.health()           - Health Check           ║
║  → organigramTests.getDraft()         - Hole Draft             ║
║  → organigramTests.getLive()          - Hole Live              ║
║  → organigramTests.createNode(data)   - Erstelle Node          ║
║  → organigramTests.updateNode(id, up) - Update Node            ║
║  → organigramTests.deleteNode(id)     - Lösche Node            ║
║  → organigramTests.createConnection() - Erstelle Connection    ║
║  → organigramTests.publish()          - Publish to Live        ║
║  → organigramTests.getHistory()       - Version History        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
