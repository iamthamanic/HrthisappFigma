/**
 * v4.13.3 - Training Compliance System
 * Verbesserter Console Quick Test
 * 
 * ANLEITUNG:
 * 1. Öffne deine BROWO KOORDINATOR APP im Browser (NICHT Figma!)
 * 2. Drücke F12 (DevTools öffnen)
 * 3. Console Tab
 * 4. Kopiere dieses komplette Script
 * 5. Paste in Console
 * 6. Enter
 * 7. Warte auf Ergebnisse
 */

(async function testTrainingComplianceSystem() {
  console.clear();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 v4.13.3 - TRAINING COMPLIANCE SYSTEM - QUICK TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // ==================== AUTO-DETECT PROJECT ID ====================
  
  let projectId = null;
  
  // Method 1: Extract from current hostname
  const hostname = window.location.hostname;
  console.log('🔍 Detecting Project ID from hostname:', hostname);
  
  // Check if we're on Supabase hosted app
  if (hostname.includes('.supabase.co')) {
    const match = hostname.match(/([a-z0-9]+)\.supabase\.co/);
    if (match) {
      projectId = match[1];
      console.log('✅ Found Project ID from hostname:', projectId);
    }
  }
  
  // Method 2: Try to get from utils/supabase/info
  if (!projectId) {
    try {
      // Try dynamic import
      const infoModule = await import('./utils/supabase/info');
      if (infoModule && infoModule.projectId) {
        projectId = infoModule.projectId;
        console.log('✅ Found Project ID from info module:', projectId);
      }
    } catch (e) {
      console.log('⚠️  Could not import info module');
    }
  }
  
  // Method 3: Check localStorage for Supabase keys
  if (!projectId) {
    const keys = Object.keys(localStorage);
    const supabaseKey = keys.find(k => k.startsWith('sb-') && k.includes('-auth-token'));
    if (supabaseKey) {
      // Extract project ID from key like "sb-xyzkxdhlpumfewowbqyq-auth-token"
      const match = supabaseKey.match(/sb-([a-z0-9]+)-auth-token/);
      if (match) {
        projectId = match[1];
        console.log('✅ Found Project ID from localStorage key:', projectId);
      }
    }
  }

  // ==================== GET AUTH TOKEN ====================
  
  let token = null;
  
  // Try to get token from localStorage
  const keys = Object.keys(localStorage);
  const authKey = keys.find(k => k.includes('auth-token'));
  
  if (authKey) {
    try {
      const data = JSON.parse(localStorage.getItem(authKey));
      token = data?.access_token || data?.user?.access_token;
      
      if (token) {
        console.log('✅ Found Auth Token');
      }
    } catch (e) {
      console.log('⚠️  Could not parse auth token');
    }
  }

  console.log('');
  console.log('📋 Configuration:');
  console.log('  Project ID:', projectId || '❌ NOT FOUND');
  console.log('  Auth Token:', token ? '✅ Found' : '❌ Not found');
  console.log('');

  // ==================== MANUAL INPUT IF NEEDED ====================
  
  if (!projectId) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ PROJECT ID NOT FOUND AUTOMATICALLY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Bitte gib deine Project ID manuell ein:');
    console.log('');
    console.log('1. Gehe zu Supabase Dashboard');
    console.log('2. Settings → General → Reference ID');
    console.log('3. Kopiere die Project ID');
    console.log('4. Führe diesen Befehl aus (ersetze YOUR_PROJECT_ID):');
    console.log('');
    console.log('  projectId = "YOUR_PROJECT_ID";');
    console.log('');
    console.log('5. Dann führe diesen Test nochmal aus');
    console.log('');
    return;
  }

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Lernen`;
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
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
      
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
      console.error(`  ❌ Network Error:`, error.message);
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

  const healthResult = await testEndpoint(
    'Health Check',
    `${baseUrl}/health`
  );

  // If health check fails, stop here
  if (!healthResult.success) {
    console.log('═══════════════════════════════════════════════════════════');
    console.error('❌ HEALTH CHECK FAILED!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Mögliche Ursachen:');
    console.log('');
    console.log('1. Edge Function nicht deployed:');
    console.log('   → supabase functions deploy BrowoKoordinator-Lernen --no-verify-jwt');
    console.log('');
    console.log('2. Falsche Project ID:');
    console.log('   → Überprüfe Project ID in Supabase Dashboard');
    console.log('');
    console.log('3. CORS oder Network Problem:');
    console.log('   → Check Supabase Logs für Errors');
    console.log('');
    console.log('Test Results:');
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    return;
  }

  // If no token, stop here
  if (!token) {
    console.log('═══════════════════════════════════════════════════════════');
    console.warn('⚠️  WARNING: No auth token found!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Health Check war erfolgreich, aber für weitere Tests benötigst du:');
    console.log('');
    console.log('1. Login als Admin in der App');
    console.log('2. Führe diesen Test dann nochmal aus');
    console.log('');
    console.log('Test Results:');
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log('');
    console.log('✅ Health Check erfolgreich! Edge Function ist deployed!');
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
    console.log('⚠️  SOME TESTS FAILED - CHECK DETAILS ABOVE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Common Issues:');
    console.log('');
    console.log('401 Unauthorized:');
    console.log('  → User is not Admin/HR/SUPERADMIN');
    console.log('  → Check user role in database');
    console.log('');
    console.log('Failed to fetch:');
    console.log('  → Network or CORS issue');
    console.log('  → Check Supabase logs for errors');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');

  // Return results for further inspection
  return results;
})();
