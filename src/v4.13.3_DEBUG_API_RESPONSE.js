/**
 * v4.13.3 - Debug API Response
 * 
 * ANLEITUNG:
 * 1. Öffne deine Browo Koordinator App
 * 2. Login als Admin
 * 3. F12 → Console Tab
 * 4. Kopiere und führe diesen Code aus
 * 5. Zeige mir das komplette Output
 */

(async function debugTrainingComplianceAPI() {
  console.clear();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🐛 v4.13.3 - DEBUG API RESPONSE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Get auth token
  const keys = Object.keys(localStorage);
  const authKey = keys.find(k => k.includes('auth-token'));
  
  if (!authKey) {
    console.error('❌ No auth token found! Please login first.');
    return;
  }

  let token;
  try {
    const data = JSON.parse(localStorage.getItem(authKey));
    token = data?.access_token || data?.user?.access_token;
  } catch (e) {
    console.error('❌ Could not parse auth token');
    return;
  }

  if (!token) {
    console.error('❌ No access token found in storage');
    return;
  }

  console.log('✅ Auth token found');
  console.log('');

  // Test 1: Fetch Videos Progress
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 1: GET /training-progress/videos');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    const response = await fetch(
      'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Lernen/training-progress/videos',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response OK:', response.ok);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Response JSON:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    console.log('📊 Analysis:');
    console.log('  success:', result.success);
    console.log('  progress array length:', result.progress?.length || 0);
    console.log('  stats:', result.stats);
    console.log('');

    if (result.progress && result.progress.length > 0) {
      console.log('📹 Videos found:');
      result.progress.forEach((video, idx) => {
        console.log(`  ${idx + 1}. Video ID: ${video.video_id}`);
        console.log(`     Title: ${video.video_title}`);
        console.log(`     Users: ${video.users?.length || 0}`);
        
        if (video.users && video.users.length > 0) {
          console.log(`     Sample user:`, video.users[0]);
        }
      });
    } else {
      console.warn('⚠️  No videos in progress array!');
      console.log('');
      console.log('This could mean:');
      console.log('  1. No videos exist in the database');
      console.log('  2. Videos are not assigned to your organization');
      console.log('  3. RLS policies are blocking access');
    }

  } catch (error) {
    console.error('❌ Fetch Error:', error);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 2: GET /training-progress/tests');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    const response = await fetch(
      'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Lernen/training-progress/tests',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response OK:', response.ok);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Response JSON:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    console.log('📊 Analysis:');
    console.log('  success:', result.success);
    console.log('  progress array length:', result.progress?.length || 0);
    console.log('  stats:', result.stats);
    console.log('');

    if (result.progress && result.progress.length > 0) {
      console.log('📝 Tests found:');
      result.progress.forEach((test, idx) => {
        console.log(`  ${idx + 1}. Test ID: ${test.test_id}`);
        console.log(`     Title: ${test.test_title}`);
        console.log(`     Users: ${test.users?.length || 0}`);
        
        if (test.users && test.users.length > 0) {
          console.log(`     Sample user:`, test.users[0]);
        }
      });
    } else {
      console.warn('⚠️  No tests in progress array!');
      console.log('');
      console.log('This could mean:');
      console.log('  1. No tests exist in the database');
      console.log('  2. Tests are not assigned to your organization');
      console.log('  3. RLS policies are blocking access');
    }

  } catch (error) {
    console.error('❌ Fetch Error:', error);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 3: Check Videos & Tests directly');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Test regular videos endpoint
  try {
    const response = await fetch(
      'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Lernen/videos',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📹 /videos endpoint status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('📹 Videos count:', result.videos?.length || 0);
      
      if (result.videos && result.videos.length > 0) {
        console.log('📹 Videos:');
        result.videos.forEach((v, idx) => {
          console.log(`  ${idx + 1}. "${v.title}" (ID: ${v.id})`);
          console.log(`     Organization: ${v.organization_id}`);
          console.log(`     YouTube: ${v.youtube_url || 'N/A'}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Videos endpoint error:', error);
  }

  console.log('');

  // Test regular quizzes endpoint
  try {
    const response = await fetch(
      'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Lernen/quizzes',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📝 /quizzes endpoint status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('📝 Quizzes count:', result.quizzes?.length || 0);
      
      if (result.quizzes && result.quizzes.length > 0) {
        console.log('📝 Quizzes:');
        result.quizzes.forEach((q, idx) => {
          console.log(`  ${idx + 1}. "${q.title}" (ID: ${q.id})`);
          console.log(`     Video: ${q.video_id || 'None'}`);
          console.log(`     Questions: ${q.quiz_questions?.length || 0}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Quizzes endpoint error:', error);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ DEBUG COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('1. Copy ALL of the above output');
  console.log('2. Send it to me');
  console.log('3. I will analyze and fix the issue');
})();
