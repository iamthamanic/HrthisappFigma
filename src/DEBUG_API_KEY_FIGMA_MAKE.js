// ============================================================================
// SIMPLIFIED DEBUG SCRIPT FOR FIGMA MAKE
// ============================================================================
// Kopiere dieses Script in die Browser Console
// ============================================================================

(async function debugAPIKeyInFigmaMake() {
  console.log('🔍 ========================================');
  console.log('🔍 DEBUG: API Key Generation (Figma Make)');
  console.log('🔍 ========================================\n');

  // ============================================================================
  // STEP 1: Get credentials from localStorage
  // ============================================================================
  console.log('📊 Step 1: Getting credentials from localStorage...\n');

  let accessToken = null;
  let projectId = null;

  // Try to get Supabase auth token
  try {
    const authData = localStorage.getItem('sb-hhhnumvllmzkyjsgefhd-auth-token');
    if (authData) {
      const parsed = JSON.parse(authData);
      accessToken = parsed.access_token;
      console.log('✅ Access Token found:', accessToken.substring(0, 50) + '...');
    } else {
      console.error('❌ No auth token in localStorage!');
      console.log('💡 Available localStorage keys:', Object.keys(localStorage));
      return;
    }
  } catch (e) {
    console.error('❌ Error reading auth token:', e);
    return;
  }

  // Get project ID - for Figma Make it's in the environment
  projectId = 'hhhnumvllmzkyjsgefhd'; // Your project ID
  console.log('✅ Project ID:', projectId);

  if (!accessToken) {
    console.error('\n❌ No access token found! Please login first.');
    return;
  }

  // ============================================================================
  // STEP 2: Test Health Endpoint
  // ============================================================================
  console.log('\n📊 Step 2: Testing Health Endpoint...\n');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d`;
  const healthUrl = `${baseUrl}/automation/health`;

  console.log('📍 Health URL:', healthUrl);

  try {
    const healthResponse = await fetch(healthUrl);
    const healthText = await healthResponse.text();

    console.log('📥 Status:', healthResponse.status);
    console.log('📥 Content-Type:', healthResponse.headers.get('content-type'));
    console.log('📥 Response:', healthText.substring(0, 200));

    if (healthResponse.ok) {
      try {
        const healthData = JSON.parse(healthText);
        console.log('✅ Health Check OK:', healthData);
      } catch (e) {
        console.error('❌ Health endpoint returned non-JSON!');
        console.error('Response:', healthText);
        console.error('\n💡 Edge Function ist wahrscheinlich nicht deployed!');
        return;
      }
    } else {
      console.error('❌ Health check failed with status:', healthResponse.status);
      return;
    }
  } catch (e) {
    console.error('❌ Health check error:', e.message);
    return;
  }

  // ============================================================================
  // STEP 3: Try API Key Generation
  // ============================================================================
  console.log('\n📊 Step 3: Attempting API Key Generation...\n');

  const apiUrl = `${baseUrl}/automation/api-keys/generate`;
  const testName = 'Debug Test ' + new Date().toISOString();

  console.log('📍 API URL:', apiUrl);
  console.log('📤 Request:', { name: testName });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: testName })
    });

    console.log('\n📥 Response Status:', response.status, response.statusText);
    console.log('📥 Content-Type:', response.headers.get('content-type'));

    const responseText = await response.text();
    console.log('📥 Response Length:', responseText.length, 'bytes');
    console.log('📥 First 10 chars:', JSON.stringify(responseText.substring(0, 10)));

    if (responseText.substring(0, 500).length > 0) {
      console.log('📥 Response (first 500 chars):', responseText.substring(0, 500));
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);

      if (response.ok && data.success) {
        console.log('\n🎉 ========================================');
        console.log('🎉 SUCCESS! API Key Generated');
        console.log('🎉 ========================================');
        console.log('✅ API Key:', data.api_key);
        console.log('✅ Begins with browoko-?', data.api_key.startsWith('browoko-'));
        console.log('\n⚠️ Copy this key now! It will not be shown again.');
      } else {
        console.error('\n❌ ========================================');
        console.error('❌ API ERROR');
        console.error('❌ ========================================');
        console.error('Status:', response.status);
        console.error('Error:', data.error || 'Unknown error');
        console.error('Details:', data.details || 'No details');
        console.error('Full Response:', data);
      }
    } catch (parseError) {
      console.error('\n❌ ========================================');
      console.error('❌ JSON PARSE ERROR');
      console.error('❌ ========================================');
      console.error('Parse Error:', parseError.message);
      console.error('Response Type:', typeof responseText);
      console.error('Full Response:', responseText);

      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('\n💡 Response is HTML! Possible causes:');
        console.error('   1. Edge Function not deployed');
        console.error('   2. Wrong URL');
        console.error('   3. Edge Function crashed');
      }
    }
  } catch (fetchError) {
    console.error('\n❌ ========================================');
    console.error('❌ FETCH ERROR');
    console.error('❌ ========================================');
    console.error('Error:', fetchError.message);
    console.error('Stack:', fetchError.stack);
  }

  console.log('\n🔍 ========================================');
  console.log('🔍 DEBUG COMPLETE');
  console.log('🔍 ========================================');
})();
