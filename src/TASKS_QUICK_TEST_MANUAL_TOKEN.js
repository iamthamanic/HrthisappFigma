/**
 * TASKS EDGE FUNCTION - QUICK TEST (MANUAL TOKEN)
 * 
 * Simple test script that uses manual token input
 * 
 * USAGE:
 * 1. Login to your app
 * 2. Open Browser Console (F12)
 * 3. Copy this file
 * 4. Paste into Console
 * 5. Run: quickTasksTest()
 * 
 * The script will automatically grab your access token!
 * 
 * @version 1.0.0
 * @date 2025-10-30
 */

const TASKS_CONFIG = {
  SUPABASE_URL: 'https://azmtojgikubegzusvhra.supabase.co',
  FUNCTION_URL: 'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Tasks',
};

// Get token from localStorage
function getToken() {
  try {
    const authData = JSON.parse(localStorage.getItem('sb-azmtojgikubegzusvhra-auth-token') || '{}');
    return authData.access_token || null;
  } catch (error) {
    console.error('Error reading token:', error);
    return null;
  }
}

// API Request Helper
async function taskRequest(endpoint, method = 'GET', body = null) {
  const token = getToken();
  
  if (!token) {
    console.error('❌ No access token found. Please login first!');
    return null;
  }
  
  const url = `${TASKS_CONFIG.FUNCTION_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`📡 ${method} ${endpoint}`);
  if (body) console.log('   Body:', body);

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS:', data);
      return data;
    } else {
      console.error('❌ ERROR:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error);
    return null;
  }
}

// Quick Test Function
async function quickTasksTest() {
  console.log('\n⚡ QUICK TASKS TEST\n');
  
  let testTaskId = null;
  
  // 1. Health Check
  console.log('\n═══ 🏥 HEALTH CHECK ═══');
  const health = await fetch(`${TASKS_CONFIG.FUNCTION_URL}/health`);
  const healthData = await health.json();
  console.log('✅', healthData);
  
  // 2. Get All Tasks
  console.log('\n═══ 📋 GET ALL TASKS ═══');
  const tasks = await taskRequest('/tasks?limit=10');
  
  // 3. Create Task
  console.log('\n═══ ➕ CREATE TASK ═══');
  const newTask = await taskRequest('/tasks', 'POST', {
    title: `Test Task - ${new Date().toLocaleTimeString('de-DE')}`,
    description: 'Test task created by quick test script',
    status: 'TODO',
    priority: 'MEDIUM',
  });
  
  if (newTask?.task) {
    testTaskId = newTask.task.id;
  }
  
  // 4. Get Task Details
  if (testTaskId) {
    console.log('\n═══ 🔍 GET TASK DETAILS ═══');
    await taskRequest(`/tasks/${testTaskId}`);
    
    // 5. Update Task
    console.log('\n═══ ✏️ UPDATE TASK ═══');
    await taskRequest(`/tasks/${testTaskId}`, 'PUT', {
      title: `Updated Task - ${new Date().toLocaleTimeString('de-DE')}`,
      priority: 'HIGH',
    });
    
    // 6. Add Comment
    console.log('\n═══ 💬 ADD COMMENT ═══');
    await taskRequest(`/tasks/${testTaskId}/comments`, 'POST', {
      comment_text: `Test comment - ${new Date().toLocaleTimeString('de-DE')}`,
    });
    
    // 7. Update Status
    console.log('\n═══ 🔄 UPDATE STATUS ═══');
    await taskRequest(`/tasks/${testTaskId}/status`, 'POST', {
      status: 'IN_PROGRESS',
    });
    
    // 8. Delete Task (Cleanup)
    console.log('\n═══ 🗑️ DELETE TASK ═══');
    await taskRequest(`/tasks/${testTaskId}`, 'DELETE');
  }
  
  console.log('\n✅ QUICK TEST COMPLETE!\n');
}

// Full Test Function
async function fullTasksTest() {
  console.log('\n🚀 FULL TASKS TEST\n');
  
  let testTaskId = null;
  
  console.log('═══ 🏥 HEALTH CHECK ═══');
  const health = await fetch(`${TASKS_CONFIG.FUNCTION_URL}/health`);
  console.log('✅', await health.json());
  
  console.log('\n═══ 📋 GET ALL TASKS ═══');
  await taskRequest('/tasks?limit=10');
  
  console.log('\n═══ ➕ CREATE TASK ═══');
  const newTask = await taskRequest('/tasks', 'POST', {
    title: `Full Test Task - ${new Date().toLocaleTimeString('de-DE')}`,
    description: 'Full test task',
    status: 'TODO',
    priority: 'MEDIUM',
  });
  
  if (newTask?.task) {
    testTaskId = newTask.task.id;
    
    console.log('\n═══ 🔍 GET DETAILS ═══');
    await taskRequest(`/tasks/${testTaskId}`);
    
    console.log('\n═══ ✏️ UPDATE TASK ═══');
    await taskRequest(`/tasks/${testTaskId}`, 'PUT', {
      description: 'Updated description',
      priority: 'HIGH',
    });
    
    console.log('\n═══ 🔄 UPDATE STATUS ═══');
    await taskRequest(`/tasks/${testTaskId}/status`, 'POST', {
      status: 'IN_PROGRESS',
    });
    
    console.log('\n═══ ⚡ UPDATE PRIORITY ═══');
    await taskRequest(`/tasks/${testTaskId}/priority`, 'POST', {
      priority: 'URGENT',
    });
    
    console.log('\n═══ 💬 ADD COMMENT ═══');
    await taskRequest(`/tasks/${testTaskId}/comments`, 'POST', {
      comment_text: 'Test comment',
    });
    
    console.log('\n═══ 💬 GET COMMENTS ═══');
    await taskRequest(`/tasks/${testTaskId}/comments`);
    
    console.log('\n═══ 👤 GET MY TASKS ═══');
    await taskRequest('/my-tasks');
    
    console.log('\n═══ 📎 ADD ATTACHMENT ═══');
    await taskRequest(`/tasks/${testTaskId}/attachments`, 'POST', {
      file_url: 'https://example.com/test.pdf',
      file_name: 'test-document.pdf',
      file_type: 'application/pdf',
    });
    
    console.log('\n═══ 🗑️ DELETE TASK ═══');
    await taskRequest(`/tasks/${testTaskId}`, 'DELETE');
  }
  
  console.log('\n✅ FULL TEST COMPLETE!\n');
}

// Export to window
window.quickTasksTest = quickTasksTest;
window.fullTasksTest = fullTasksTest;
window.taskRequest = taskRequest;

console.log('\n✅ Tasks Quick Test loaded!\n');
console.log('📋 COMMANDS:');
console.log('  quickTasksTest()  - Quick test (8 tests)');
console.log('  fullTasksTest()   - Full test (all features)');
console.log('\n💡 Run: quickTasksTest()');
