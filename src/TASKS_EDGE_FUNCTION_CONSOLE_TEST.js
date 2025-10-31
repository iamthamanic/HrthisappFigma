/**
 * TASKS EDGE FUNCTION - BROWSER CONSOLE TEST
 * 
 * Test all 16 endpoints of the BrowoKoordinator-Tasks Edge Function
 * 
 * USAGE:
 * 1. Open Browser Console (F12)
 * 2. Copy this ENTIRE file
 * 3. Paste into Console and press Enter
 * 4. Run tests:
 *    - tasksTests.quickTest()      // Quick test (5 core endpoints)
 *    - tasksTests.runAll()          // Full test (all 16 endpoints)
 *    - tasksTests.health()          // Health check only
 * 
 * @version 1.0.0
 * @date 2025-10-30
 */

// ==================== CONFIGURATION ====================

const CONFIG = {
  SUPABASE_URL: 'https://azmtojgikubegzusvhra.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXRvamdpa3ViZWd6dXN2aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MjAzMjUsImV4cCI6MjA1MzM5NjMyNX0.jCb7AG3rWlCNaG5IzPZKRdXy_1bpbRhtZsOHmKCa71w',
  FUNCTION_URL: 'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Tasks',
};

let ACCESS_TOKEN = null;
let USER_ID = null;
let TEST_TASK_ID = null;
let TEST_COMMENT_ID = null;

// ==================== HELPER FUNCTIONS ====================

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${CONFIG.FUNCTION_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`📡 REQUEST: ${url}`);
  if (body) {
    console.log('   Body:', body);
  }

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

  return { ok: response.ok, status: response.status, data };
}

// ==================== AUTH ====================

async function getAccessToken() {
  console.log('🔑 Getting access token...');
  
  try {
    // Get session from Supabase Auth API directly
    const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || ''}`,
      },
    });
    
    if (!response.ok) {
      console.error('❌ No active session. Please login first!');
      console.error('   Status:', response.status);
      return;
    }
    
    const user = await response.json();
    
    // Get access token from localStorage
    const authData = JSON.parse(localStorage.getItem('sb-azmtojgikubegzusvhra-auth-token') || '{}');
    
    if (!authData.access_token) {
      console.error('❌ No access token found. Please login first!');
      return;
    }
    
    ACCESS_TOKEN = authData.access_token;
    USER_ID = user.id;
    
    console.log('✅ Access token retrieved');
    console.log('👤 User ID:', USER_ID);
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    console.error('   Please make sure you are logged in!');
  }
}

// ==================== TEST FUNCTIONS ====================

async function tasksHealthCheck() {
  console.log('\n═══ 🏥 HEALTH CHECK ═══');
  
  const url = `${CONFIG.FUNCTION_URL}/health`;
  console.log(`📡 REQUEST: ${url}`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('✅ SUCCESS:');
  console.log('   Response:', data);
  
  return data;
}

async function tasksGetAll() {
  console.log('\n═══ 📋 GET ALL TASKS ═══');
  const result = await apiRequest('/tasks?limit=10&offset=0');
  return result.data;
}

async function tasksCreateTask() {
  console.log('\n═══ ➕ CREATE TASK ═══');
  
  const taskData = {
    title: `Test Task - ${new Date().toLocaleTimeString('de-DE')}`,
    description: 'This is a test task created by the console test script',
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
  };
  
  const result = await apiRequest('/tasks', 'POST', taskData);
  
  if (result.ok && result.data.task) {
    TEST_TASK_ID = result.data.task.id;
    console.log('💾 Saved TEST_TASK_ID:', TEST_TASK_ID);
  }
  
  return result.data;
}

async function tasksGetDetails() {
  console.log('\n═══ 🔍 GET TASK DETAILS ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}`);
  return result.data;
}

async function tasksUpdateTask() {
  console.log('\n═══ ✏️ UPDATE TASK ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const updateData = {
    title: `Updated Task - ${new Date().toLocaleTimeString('de-DE')}`,
    description: 'Updated description',
    priority: 'HIGH',
  };
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}`, 'PUT', updateData);
  return result.data;
}

async function tasksUpdateStatus() {
  console.log('\n═══ 🔄 UPDATE TASK STATUS ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}/status`, 'POST', { 
    status: 'IN_PROGRESS' 
  });
  
  return result.data;
}

async function tasksUpdatePriority() {
  console.log('\n═══ ⚡ UPDATE TASK PRIORITY ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}/priority`, 'POST', { 
    priority: 'URGENT' 
  });
  
  return result.data;
}

async function tasksAddComment() {
  console.log('\n═══ 💬 ADD COMMENT ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const commentData = {
    comment_text: `Test comment added at ${new Date().toLocaleTimeString('de-DE')}`,
  };
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}/comments`, 'POST', commentData);
  
  if (result.ok && result.data.comment) {
    TEST_COMMENT_ID = result.data.comment.id;
    console.log('💾 Saved TEST_COMMENT_ID:', TEST_COMMENT_ID);
  }
  
  return result.data;
}

async function tasksGetComments() {
  console.log('\n═══ 💬 GET COMMENTS ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}/comments`);
  return result.data;
}

async function tasksGetMyTasks() {
  console.log('\n═══ 👤 GET MY TASKS ═══');
  const result = await apiRequest('/my-tasks');
  return result.data;
}

async function tasksAssignUser() {
  console.log('\n═══ 👥 ASSIGN USER TO TASK ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  // Assign task to self
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}/assign`, 'POST', {
    user_id: USER_ID,
  });
  
  return result.data;
}

async function tasksUnassignUser() {
  console.log('\n═══ 👥 UNASSIGN USER FROM TASK ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}/unassign`, 'POST', {
    user_id: USER_ID,
  });
  
  return result.data;
}

async function tasksAddAttachment() {
  console.log('\n═══ 📎 ADD ATTACHMENT ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const attachmentData = {
    file_url: 'https://example.com/test-file.pdf',
    file_name: 'test-document.pdf',
    file_type: 'application/pdf',
    file_size: 1024,
  };
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}/attachments`, 'POST', attachmentData);
  return result.data;
}

async function tasksDeleteTask() {
  console.log('\n═══ 🗑️ DELETE TASK ═══');
  
  if (!TEST_TASK_ID) {
    console.warn('⚠️ No TEST_TASK_ID - skipping');
    return;
  }
  
  const result = await apiRequest(`/tasks/${TEST_TASK_ID}`, 'DELETE');
  
  if (result.ok) {
    console.log('🧹 Cleanup complete - task deleted');
    TEST_TASK_ID = null;
  }
  
  return result.data;
}

// ==================== FULL TEST SUITE ====================

async function runTasksTests() {
  console.log('🚀 STARTING FULL TASKS EDGE FUNCTION TEST\n');
  
  await getAccessToken();
  if (!ACCESS_TOKEN) return;
  
  // Test 1: Health Check
  await tasksHealthCheck();
  
  // Test 2: Get All Tasks
  await tasksGetAll();
  
  // Test 3: Create Task
  await tasksCreateTask();
  
  // Test 4: Get Task Details
  await tasksGetDetails();
  
  // Test 5: Update Task
  await tasksUpdateTask();
  
  // Test 6: Update Status
  await tasksUpdateStatus();
  
  // Test 7: Update Priority
  await tasksUpdatePriority();
  
  // Test 8: Add Comment
  await tasksAddComment();
  
  // Test 9: Get Comments
  await tasksGetComments();
  
  // Test 10: Assign User
  await tasksAssignUser();
  
  // Test 11: Get My Tasks
  await tasksGetMyTasks();
  
  // Test 12: Unassign User
  await tasksUnassignUser();
  
  // Test 13: Add Attachment
  await tasksAddAttachment();
  
  // Test 14: Delete Task (Cleanup)
  await tasksDeleteTask();
  
  console.log('\n✅ ALL TASKS TESTS COMPLETE!');
}

async function quickTasksTest() {
  console.log('⚡ QUICK TASKS TEST\n');
  
  await getAccessToken();
  if (!ACCESS_TOKEN) return;
  
  await tasksHealthCheck();
  await tasksGetAll();
  await tasksCreateTask();
  await tasksGetDetails();
  await tasksDeleteTask();
  
  console.log('\n✅ QUICK TEST COMPLETE!');
}

// ==================== EXPORTED FUNCTIONS ====================

window.tasksTests = {
  // Full test suite
  runAll: runTasksTests,
  quickTest: quickTasksTest,
  
  // Individual tests
  health: tasksHealthCheck,
  getAll: tasksGetAll,
  create: tasksCreateTask,
  getDetails: tasksGetDetails,
  update: tasksUpdateTask,
  updateStatus: tasksUpdateStatus,
  updatePriority: tasksUpdatePriority,
  addComment: tasksAddComment,
  getComments: tasksGetComments,
  getMyTasks: tasksGetMyTasks,
  assign: tasksAssignUser,
  unassign: tasksUnassignUser,
  addAttachment: tasksAddAttachment,
  deleteTask: tasksDeleteTask,
};

console.log('✅ Tasks Test Suite loaded!');
console.log('\n📋 AVAILABLE COMMANDS:');
console.log('  tasksTests.quickTest()    - Quick test (5 core endpoints)');
console.log('  tasksTests.runAll()       - Full test (all 16 endpoints)');
console.log('  tasksTests.health()       - Health check only');
console.log('\n💡 TIP: Run tasksTests.quickTest() to start!');
