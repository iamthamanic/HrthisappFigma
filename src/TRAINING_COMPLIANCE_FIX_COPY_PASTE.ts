/**
 * 🔧 TRAINING COMPLIANCE DASHBOARD FIX
 * v4.13.3 - COPY & PASTE THIS INTO SUPABASE DASHBOARD
 * 
 * ANLEITUNG:
 * 1. Öffne Supabase Dashboard → Edge Functions → BrowoKoordinator-Lernen
 * 2. Scrolle runter zu Zeile ~1746 (suche nach "TRAINING COMPLIANCE API")
 * 3. Ersetze die beiden Routen mit dem Code unten
 * 4. Deploy die Edge Function
 * 
 * FIXES:
 * ✅ progress_percent → watched_seconds (richtige DB-Spalte)
 * ✅ department_id → department (TEXT nicht UUID)  
 * ✅ team_id entfernt (existiert nicht in users Tabelle)
 * ✅ duration_seconds zu video query hinzugefügt (für % Berechnung)
 */

// ==================== TRAINING COMPLIANCE API (v4.13.3) ====================

// GET VIDEO PROGRESS FOR ALL USERS
app.get('/BrowoKoordinator-Lernen/training-progress/videos', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user || !isAdmin(user.role)) {
      console.warn('[Lernen] Unauthorized training progress request:', { userId: user?.id, role: user?.role });
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const supabase = getSupabaseClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    console.log('[Lernen] Organization ID:', userData.organization_id);

    // Get all videos in organization (FIXED: need duration_seconds to calculate %)
    const { data: videos } = await supabase
      .from('video_content')
      .select('id, title, duration_seconds')
      .eq('organization_id', userData.organization_id)
      .order('title');

    console.log('[Lernen] Videos found:', videos?.length || 0, videos);

    // Get all users in organization (FIXED: department not department_id, no team_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, department, location_id')
      .eq('organization_id', userData.organization_id)
      .order('last_name');

    console.log('[Lernen] Users found:', users?.length || 0);

    // Get progress for all users (FIXED: watched_seconds not progress_percent!)
    const { data: progress } = await supabase
      .from('learning_progress')
      .select('user_id, video_id, watched_seconds, completed, last_watched_at')
      .in('user_id', users?.map(u => u.id) || []);

    console.log('[Lernen] Progress entries found:', progress?.length || 0);

    // Build progress matrix (FIXED: department is TEXT not UUID, no team_id)
    const progressMatrix = videos?.map(video => ({
      video_id: video.id,
      video_title: video.title,
      users: users?.map(u => {
        const userProgress = progress?.find(p => p.user_id === u.id && p.video_id === video.id);
        
        // Calculate progress percentage from watched_seconds
        const progressPercent = (video.duration_seconds && userProgress?.watched_seconds)
          ? Math.min(100, Math.round((userProgress.watched_seconds / video.duration_seconds) * 100))
          : 0;
        
        return {
          user_id: u.id,
          user_name: `${u.first_name} ${u.last_name}`,
          department: u.department,
          location_id: u.location_id,
          progress_percent: progressPercent,
          completed: userProgress?.completed || false,
          last_watched_at: userProgress?.last_watched_at || null,
        };
      }) || [],
    })) || [];

    return c.json({
      success: true,
      videos: progressMatrix,
      stats: {
        total_videos: videos?.length || 0,
        total_users: users?.length || 0,
        total_completions: progress?.filter(p => p.completed).length || 0,
      },
    });

  } catch (error) {
    console.error('[Lernen] Get video progress error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// GET TEST PROGRESS FOR ALL USERS (FIXED - uses new test_attempts table)
app.get('/BrowoKoordinator-Lernen/training-progress/tests', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user || !isAdmin(user.role)) {
      console.warn('[Lernen] Unauthorized test progress request:', { userId: user?.id, role: user?.role });
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const supabase = getSupabaseClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    // Get all tests in organization
    const { data: tests } = await supabase
      .from('tests')
      .select('id, title, pass_percentage')
      .eq('organization_id', userData.organization_id)
      .eq('is_active', true)
      .order('title');

    // Get all users in organization (FIXED: department not department_id, no team_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, department, location_id')
      .eq('organization_id', userData.organization_id)
      .order('last_name');

    // Get test attempts for all users
    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('user_id, test_id, percentage, passed, completed_at')
      .in('user_id', users?.map(u => u.id) || []);

    // Build progress matrix
    const progressMatrix = tests?.map(test => ({
      test_id: test.id,
      test_title: test.title,
      passing_score: test.pass_percentage,
      users: users?.map(u => {
        const userAttempts = attempts?.filter(a => a.user_id === u.id && a.test_id === test.id) || [];
        const bestAttempt = userAttempts.reduce((best, curr) => 
          (!best || (curr.percentage || 0) > (best.percentage || 0)) ? curr : best
        , null as any);

        return {
          user_id: u.id,
          user_name: `${u.first_name} ${u.last_name}`,
          department: u.department,
          location_id: u.location_id,
          attempts: userAttempts.length,
          best_score: bestAttempt?.percentage || 0,
          passed: bestAttempt?.passed || false,
          last_attempt_at: bestAttempt?.completed_at || null,
        };
      }) || [],
    })) || [];

    return c.json({
      success: true,
      tests: progressMatrix,
      stats: {
        total_tests: tests?.length || 0,
        total_users: users?.length || 0,
        total_passes: attempts?.filter(a => a.passed).length || 0,
      },
    });

  } catch (error) {
    console.error('[Lernen] Get test progress error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});
