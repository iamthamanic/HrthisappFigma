/**
 * v4.13.3 - Training Compliance System
 * Quick Console Test
 * 
 * ANLEITUNG:
 * 1. Öffne Browser Console (F12)
 * 2. Kopiere dieses komplette Script
 * 3. Paste & Enter
 * 4. Warte auf Ergebnisse
 */

(async function testTrainingComplianceSystem() {
  console.clear();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 v4.13.3 - TRAINING COMPLIANCE SYSTEM - QUICK TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Configuration
  const config = {
    // Automatisch aus localStorage auslesen
    projectId: localStorage.getItem('sb-project-id') || 'YOUR_PROJECT_ID',
    getAuthToken: () => {
      // Try to get token from localStorage
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.includes('auth-token'));
      if (authKey) {
        try {
          const data = JSON.parse(localStorage.getItem(authKey));
          return data?.access_token || data?.user?.access_token;
        } catch (e) {
          return null;
        }
      }
      return null;
    }
  };

  const baseUrl = `https://${config.projectId}.supabase.co/functions/v1/BrowoKoordinator-Lernen`;
  const token = config.getAuthToken();

  console.log('📋 Configuration:');
  console.log('  Project ID:', config.projectId);
  console.log('  Auth Token:', token ? '✅ Found' : '❌ Not found');
  console.log('  Base URL:', baseUrl);
  console.log('');

  // Test Results
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Helper: Test API Endpoint
  async function testEndpoint(name, url, options = {}) {
    console.log(`🧪 Testing: ${name}`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      if (response.ok) {
        console.log(`  ✅ Status: ${response.status} OK (${duration}ms)`);
        console.log(`  📦 Response:`, data);
        results.passed++;
        results.tests.push({ name, status: 'PASS', duration, response: data });
        return { success: true, data };
      } else {
        console.error(`  ❌ Status: ${response.status} ${response.statusText}`);
        console.error(`  📦 Error:`, data);
        results.failed++;
        results.tests.push({ name, status: 'FAIL', duration, error: data });
        return { success: false, error: data };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`  ❌ Error:`, error.message);
      results.failed++;
      results.tests.push({ name, status: 'ERROR', duration, error: error.message });
      return { success: false, error: error.message };
    } finally {
      console.log('');
    }
  }

  // ==================== TEST 1: HEALTH CHECK ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 1: Health Check (No Auth Required)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  await testEndpoint(
    'Health Check',
    `${baseUrl}/health`
  );

  // If no token, stop here
  if (!token) {
    console.log('═══════════════════════════════════════════════════════════');
    console.warn('⚠️  WARNING: No auth token found!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Cannot test authenticated endpoints without token.');
    console.log('');
    console.log('To get token:');
    console.log('1. Login as Admin');
    console.log('2. Run this test again');
    console.log('');
    console.log('Test Results:');
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    return;
  }

  // ==================== TEST 2: TRAINING PROGRESS (VIDEOS) ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 2: Training Progress - Videos (Auth Required)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  await testEndpoint(
    'Training Progress - Videos',
    `${baseUrl}/training-progress/videos`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // ==================== TEST 3: TRAINING PROGRESS (TESTS) ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 3: Training Progress - Tests (Auth Required)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  await testEndpoint(
    'Training Progress - Tests',
    `${baseUrl}/training-progress/tests`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // ==================== TEST 4: EXTERNAL TRAININGS (GET) ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 4: External Trainings - GET (Auth Required)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  await testEndpoint(
    'External Trainings - GET',
    `${baseUrl}/external-trainings`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // ==================== TEST 5: EXISTING VIDEOS ENDPOINT ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 5: Videos Endpoint (Baseline Check)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  await testEndpoint(
    'Videos Endpoint',
    `${baseUrl}/videos`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // ==================== TEST 6: EXISTING QUIZZES ENDPOINT ====================
  console.log('══════════════════════════════════════════════════���════════');
  console.log('TEST 6: Quizzes Endpoint (Baseline Check)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  await testEndpoint(
    'Quizzes Endpoint',
    `${baseUrl}/quizzes`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // ==================== FINAL SUMMARY ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const totalTests = results.passed + results.failed;
  const successRate = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log('');

  // Detailed Results
  console.log('Detailed Results:');
  console.table(results.tests.map(t => ({
    Test: t.name,
    Status: t.status,
    Duration: `${t.duration}ms`,
    Result: t.status === 'PASS' ? '✅' : '❌'
  })));

  // Final Status
  if (results.failed === 0) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED! DEPLOYMENT SUCCESSFUL! 🎉');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Training Compliance System is fully operational!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Open Admin → Lernverwaltung → Übersicht');
    console.log('2. Test all 3 sub-tabs (Videos, Tests, Sonstige)');
    console.log('3. Try adding an external training');
    console.log('4. Test CSV export');
  } else {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  SOME TESTS FAILED - INVESTIGATION NEEDED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Common Issues:');
    console.log('');
    console.log('1. 404 Not Found:');
    console.log('   → Edge Function not deployed or wrong URL');
    console.log('   → Solution: supabase functions deploy BrowoKoordinator-Lernen --no-verify-jwt');
    console.log('');
    console.log('2. 401 Unauthorized:');
    console.log('   → User is not Admin/HR/SUPERADMIN');
    console.log('   → Solution: Check user role in database');
    console.log('');
    console.log('3. Failed to fetch:');
    console.log('   → Network or CORS issue');
    console.log('   → Solution: Check Supabase logs for errors');
    console.log('');
    console.log('Check documentation:');
    console.log('- v4.13.3_POST_DEPLOYMENT_VERIFICATION.md');
    console.log('- v4.13.3_DEPLOYMENT_SUCCESS_GUIDE.md');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');

  // Return results for further inspection
  return results;
})();
