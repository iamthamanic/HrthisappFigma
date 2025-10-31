// ============================================================================
// DEBUG SCRIPT: API KEY GENERATION
// ============================================================================
// Kopiere dieses komplette Script in die Browser Console während du im
// Admin Panel (Settings > Automation) bist
// ============================================================================

(async function debugAPIKeyGeneration() {
  console.log('🔍 ========================================');
  console.log('🔍 DEBUG: API Key Generation');
  console.log('🔍 ========================================\n');

  // ============================================================================
  // STEP 1: Check Supabase Client
  // ============================================================================
  console.log('📊 Step 1: Checking Supabase Client...');
  
  // Try to import from your actual setup
  let supabase;
  try {
    // This assumes your app exports supabase globally or you can access it
    const { supabase: supabaseClient } = await import('./utils/supabase/client.ts');
    supabase = supabaseClient;
    console.log('✅ Supabase client loaded from utils');
  } catch (e) {
    console.log('⚠️ Could not load from utils, trying window object...');
    if (window.supabase) {
      supabase = window.supabase;
      console.log('✅ Supabase client found on window object');
    } else {
      console.error('❌ No Supabase client available!');
      return;
    }
  }

  // ============================================================================
  // STEP 2: Get Session
  // ============================================================================
  console.log('\n📊 Step 2: Getting Session...');
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('❌ Not logged in!', sessionError);
    return;
  }
  
  console.log('✅ Session found');
  console.log('   User ID:', session.user.id);
  console.log('   Email:', session.user.email);
  console.log('   Access Token (first 50 chars):', session.access_token.substring(0, 50) + '...');

  // ============================================================================
  // STEP 3: Get Project Info
  // ============================================================================
  console.log('\n📊 Step 3: Getting Project Info...');
  
  let projectId;
  try {
    const { projectId: pid } = await import('./utils/supabase/info.tsx');
    projectId = pid;
    console.log('✅ Project ID:', projectId);
  } catch (e) {
    console.error('❌ Could not load project info:', e);
    console.log('💡 Trying to extract from Supabase URL...');
    
    // Try to extract from SUPABASE_URL environment variable or connection
    const urlMatch = supabase.supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (urlMatch) {
      projectId = urlMatch[1];
      console.log('✅ Extracted Project ID:', projectId);
    } else {
      console.error('❌ Could not determine project ID');
      return;
    }
  }

  // ============================================================================
  // STEP 4: Construct URL
  // ============================================================================
  console.log('\n📊 Step 4: Constructing URL...');
  
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d`;
  const url = `${baseUrl}/automation/api-keys/generate`;
  
  console.log('📍 Base URL:', baseUrl);
  console.log('📍 Full URL:', url);

  // ============================================================================
  // STEP 5: Test Health Endpoint First
  // ============================================================================
  console.log('\n📊 Step 5: Testing Health Endpoint...');
  
  try {
    const healthUrl = `${baseUrl}/automation/health`;
    console.log('📍 Health URL:', healthUrl);
    
    const healthResponse = await fetch(healthUrl);
    const healthText = await healthResponse.text();
    
    console.log('📥 Health Status:', healthResponse.status);
    console.log('📥 Health Content-Type:', healthResponse.headers.get('content-type'));
    console.log('📥 Health Response (first 200 chars):', healthText.substring(0, 200));
    
    try {
      const healthData = JSON.parse(healthText);
      console.log('✅ Health Check Successful:', healthData);
    } catch (e) {
      console.error('❌ Health endpoint returned non-JSON!');
      console.error('   Response:', healthText);
      console.error('   This means the Edge Function is not running correctly!');
      return;
    }
  } catch (e) {
    console.error('❌ Health check failed:', e);
    console.error('   This means the Edge Function is not accessible!');
    return;
  }

  // ============================================================================
  // STEP 6: Try API Key Generation
  // ============================================================================
  console.log('\n📊 Step 6: Attempting API Key Generation...');
  
  const testName = 'Debug Test Key ' + new Date().toISOString();
  const requestBody = { name: testName };
  
  console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
  
  try {
    console.log('⏳ Sending POST request...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response Status:', response.status, response.statusText);
    console.log('📥 Response Content-Type:', response.headers.get('content-type'));
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response Length:', responseText.length, 'bytes');
    console.log('📥 Response First 10 chars:', JSON.stringify(responseText.substring(0, 10)));
    console.log('📥 Response (first 500 chars):', responseText.substring(0, 500));

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      
      if (response.ok && data.success) {
        console.log('\n🎉 ========================================');
        console.log('🎉 SUCCESS! API Key Generated');
        console.log('🎉 ========================================');
        console.log('✅ API Key:', data.api_key);
        console.log('✅ Key ID:', data.key_id || data.id);
        console.log('✅ Name:', data.name);
        console.log('\n⚠️ Copy this API Key now! It will not be shown again.');
        
        return {
          success: true,
          data: data
        };
      } else {
        console.error('\n❌ ========================================');
        console.error('❌ FAILED');
        console.error('❌ ========================================');
        console.error('Error:', data.error || data.details || 'Unknown error');
        console.error('Full Response:', data);
        
        return {
          success: false,
          error: data
        };
      }
    } catch (parseError) {
      console.error('\n❌ ========================================');
      console.error('❌ JSON PARSE ERROR');
      console.error('❌ ========================================');
      console.error('Parse Error:', parseError.message);
      console.error('Response is not valid JSON!');
      console.error('Response Type:', typeof responseText);
      console.error('Full Response:', responseText);
      
      // Check if it's HTML
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('\n💡 Response is HTML! This usually means:');
        console.error('   1. Wrong URL - Edge Function not found');
        console.error('   2. Edge Function crashed');
        console.error('   3. CORS error (Supabase returning error page)');
      }
      
      return {
        success: false,
        error: 'Response is not JSON',
        response: responseText
      };
    }
  } catch (fetchError) {
    console.error('\n❌ ========================================');
    console.error('❌ FETCH ERROR');
    console.error('❌ ========================================');
    console.error('Error:', fetchError.message);
    console.error('Stack:', fetchError.stack);
    
    return {
      success: false,
      error: fetchError.message
    };
  }
})();
