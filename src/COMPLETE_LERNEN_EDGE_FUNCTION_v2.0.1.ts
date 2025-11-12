/**
 * BrowoKoordinator - Lernen Edge Function
 * Version: 2.0.1 - TRAINING COMPLIANCE DASHBOARD FIXED
 * 
 * ✅ FIXES in v2.0.1:
 * - Fixed training-progress/videos: progress_percent → watched_seconds
 * - Fixed training-progress/videos: department_id → department (TEXT)
 * - Fixed training-progress/videos: removed team_id (doesn't exist)
 * - Fixed training-progress/tests: same column fixes
 * - Added duration_seconds to video query for % calculation
 * 
 * 🎯 COPY THIS ENTIRE FILE (Cmd+A, Cmd+C) and paste into Supabase Dashboard:
 * Edge Functions → BrowoKoordinator-Lernen → Edit → Replace ALL code → Deploy
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== SUPABASE CLIENT ====================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const getSupabaseUserClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
};

// ==================== LOGGING ====================

app.use('*', logger(console.log));

// ==================== CORS ====================

app.use(
  '/*',
  cors({
    origin: '*',
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'apikey'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
  })
);

// ==================== AUTH MIDDLEWARE ====================

async function verifyAuth(authHeader: string | null): Promise<{ id: string; email?: string; role?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = getSupabaseUserClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Lernen] Auth error:', error);
      return null;
    }

    // Get user role from users table
    const { data: userData } = await getSupabaseClient()
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
    };
  } catch (error) {
    console.error('[Lernen] Auth verification failed:', error);
    return null;
  }
}

function isAdmin(role?: string): boolean {
  if (!role) return false;
  return ['SUPERADMIN', 'ADMIN', 'HR_SUPERADMIN', 'HR_MANAGER'].includes(role);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate level from total XP
 * Formula: Level = floor(sqrt(total_xp / 100)) + 1
 */
function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

/**
 * Calculate XP needed for next level
 */
function calculateXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

/**
 * Award XP to user
 */
async function awardXP(userId: string, xpAmount: number, description: string, source: string): Promise<{ level: number; total_xp: number; leveled_up: boolean }> {
  const supabase = getSupabaseClient();

  // Get current avatar stats
  const { data: avatar, error: avatarError } = await supabase
    .from('user_avatars')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (avatarError || !avatar) {
    // Create avatar if doesn't exist
    const { data: newAvatar } = await supabase
      .from('user_avatars')
      .insert({
        user_id: userId,
        level: 1,
        total_xp: xpAmount,
      })
      .select()
      .single();

    // Log XP event
    await supabase.from('xp_events').insert({
      user_id: userId,
      xp_amount: xpAmount,
      description,
      source,
    });

    return {
      level: 1,
      total_xp: xpAmount,
      leveled_up: false,
    };
  }

  const oldLevel = avatar.level;
  const newTotalXP = avatar.total_xp + xpAmount;
  const newLevel = calculateLevel(newTotalXP);
  const leveledUp = newLevel > oldLevel;

  // Update avatar
  await supabase
    .from('user_avatars')
    .update({
      total_xp: newTotalXP,
      level: newLevel,
    })
    .eq('user_id', userId);

  // Log XP event
  await supabase.from('xp_events').insert({
    user_id: userId,
    xp_amount: xpAmount,
    description,
    source,
  });

  // If leveled up, send notification
  if (leveledUp) {
    await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/BrowoKoordinator-Notification/create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          title: `Level ${newLevel} erreicht!`,
          message: `Glückwunsch! Du bist jetzt Level ${newLevel}!`,
          type: 'ACHIEVEMENT_UNLOCKED',
          link: '/learning',
          data: {
            level: newLevel,
            xp: newTotalXP,
          },
        }),
      }
    ).catch((err) => console.error('[Lernen] Failed to send level-up notification:', err));
  }

  return {
    level: newLevel,
    total_xp: newTotalXP,
    leveled_up: leveledUp,
  };
}

/**
 * Award coins to user
 */
async function awardCoins(userId: string, coinAmount: number, reason: string, metadata: Record<string, any> = {}): Promise<void> {
  const supabase = getSupabaseClient();

  // Create coin transaction
  await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount: coinAmount,
    reason,
    type: 'EARNED',
    metadata,
  });

  // Send notification
  await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/BrowoKoordinator-Notification/create`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title: 'Coins erhalten!',
        message: `Du hast ${coinAmount} Coins erhalten: ${reason}`,
        type: 'COINS_AWARDED',
        link: '/benefits',
        data: {
          coins: coinAmount,
          reason,
        },
      }),
    }
  ).catch((err) => console.error('[Lernen] Failed to send coins notification:', err));
}

// ==================== ROUTES ====================

// Health Check (NO AUTH)
app.get('/BrowoKoordinator-Lernen/health', (c) => {
  return c.json({
    status: 'ok',
    function: 'BrowoKoordinator-Lernen',
    timestamp: new Date().toISOString(),
    version: '2.0.1',
    purpose: 'Learning Management System with Tests & XP',
    system: 'TRAINING COMPLIANCE FIXED (v4.13.3)',
  });
});

// ==================== VIDEO ROUTES ====================

app.get('/BrowoKoordinator-Lernen/videos', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized videos request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');
    const search = c.req.query('search');

    console.log('[Lernen] Get videos:', { userId: user.id, category, search });

    const supabase = getSupabaseClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      console.error('[Lernen] User has no organization_id:', user.id);
      return c.json({ error: 'Organization not found' }, 404);
    }

    // Build query - FILTER BY ORGANIZATION!
    let query = supabase
      .from('video_content')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: videos, error: videosError } = await query;

    if (videosError) {
      console.error('[Lernen] Get videos error:', videosError);
      return c.json({ 
        error: 'Failed to fetch videos', 
        details: videosError.message 
      }, 500);
    }

    // Get user's progress for all videos
    const { data: progressData } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', user.id);

    // Create progress map
    const progressMap = new Map();
    progressData?.forEach((p: any) => {
      progressMap.set(p.video_id, p);
    });

    // Enrich videos with progress
    const videosWithProgress = videos?.map((video: any) => {
      const progress = progressMap.get(video.id);
      return {
        ...video,
        user_progress: progress ? {
          watched_seconds: progress.watched_seconds,
          completed: progress.completed,
          completed_at: progress.completed_at,
          last_watched_at: progress.last_watched_at,
          progress_percentage: video.duration_seconds > 0 
            ? Math.min(100, Math.round((progress.watched_seconds / video.duration_seconds) * 100))
            : 0,
        } : {
          watched_seconds: 0,
          completed: false,
          completed_at: null,
          last_watched_at: null,
          progress_percentage: 0,
        },
      };
    });

    console.log('[Lernen] Videos fetched:', videosWithProgress?.length || 0);

    return c.json({
      success: true,
      videos: videosWithProgress || [],
      count: videosWithProgress?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Get videos error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

app.post('/BrowoKoordinator-Lernen/videos', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized create video');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const body = await c.req.json();
    const { 
      title, 
      description, 
      video_url, 
      thumbnail_url, 
      duration_seconds, 
      category, 
      is_mandatory, 
      order_index 
    } = body;

    if (!title || !video_url || !category) {
      return c.json({ 
        error: 'Missing required fields: title, video_url, category' 
      }, 400);
    }

    // Validate category
    const validCategories = ['MANDATORY', 'COMPLIANCE', 'SKILLS', 'ONBOARDING', 'BONUS'];
    if (!validCategories.includes(category)) {
      return c.json({ 
        error: 'Invalid category',
        validCategories 
      }, 400);
    }

    console.log('[Lernen] Create video:', { userId: user.id, title, category });

    const supabase = getSupabaseClient();

    // Create video
    const { data: video, error } = await supabase
      .from('video_content')
      .insert({
        title,
        description: description || null,
        video_url,
        thumbnail_url: thumbnail_url || null,
        duration_seconds: duration_seconds || 0,
        category,
        is_mandatory: is_mandatory || false,
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Create video failed:', error);
      return c.json({ 
        error: 'Failed to create video', 
        details: error.message 
      }, 500);
    }

    console.log('[Lernen] Video created:', video.id);

    return c.json({
      success: true,
      video,
      message: 'Video created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Create video error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

app.put('/BrowoKoordinator-Lernen/videos/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized update video');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const videoId = c.req.param('id');
    const body = await c.req.json();

    // Validate category if provided
    if (body.category) {
      const validCategories = ['MANDATORY', 'COMPLIANCE', 'SKILLS', 'ONBOARDING', 'BONUS'];
      if (!validCategories.includes(body.category)) {
        return c.json({ 
          error: 'Invalid category',
          validCategories 
        }, 400);
      }
    }

    console.log('[Lernen] Update video:', { userId: user.id, videoId, updates: body });

    const supabase = getSupabaseClient();

    // Update video
    const { data: video, error } = await supabase
      .from('video_content')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Update video failed:', error);
      return c.json({ 
        error: 'Failed to update video', 
        details: error.message 
      }, 500);
    }

    console.log('[Lernen] Video updated:', videoId);

    return c.json({
      success: true,
      video,
      message: 'Video updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Update video error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

app.delete('/BrowoKoordinator-Lernen/videos/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized delete video');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const videoId = c.req.param('id');

    console.log('[Lernen] Delete video:', { userId: user.id, videoId });

    const supabase = getSupabaseClient();

    // Delete video (will cascade delete progress, test assignments, etc.)
    const { error } = await supabase
      .from('video_content')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('[Lernen] Delete video failed:', error);
      return c.json({ 
        error: 'Failed to delete video', 
        details: error.message 
      }, 500);
    }

    console.log('[Lernen] Video deleted:', videoId);

    return c.json({
      success: true,
      message: 'Video deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Delete video error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== NEW TESTS ROUTES (v4.13.x) ====================

// GET ALL TESTS
app.get('/BrowoKoordinator-Lernen/tests', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized tests request');
      return c.json({ error: 'Unauthorized' }, 401);
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
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('*, test_blocks(*)')
      .eq('organization_id', userData.organization_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (testsError) {
      console.error('[Lernen] Get tests error:', testsError);
      return c.json({ 
        error: 'Failed to fetch tests', 
        details: testsError.message 
      }, 500);
    }

    // Get user's attempts
    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', user.id);

    // Create attempts map
    const attemptsMap = new Map();
    attempts?.forEach((attempt: any) => {
      if (!attemptsMap.has(attempt.test_id)) {
        attemptsMap.set(attempt.test_id, []);
      }
      attemptsMap.get(attempt.test_id).push(attempt);
    });

    // Enrich tests with user attempts
    const testsWithAttempts = tests?.map((test: any) => {
      const userAttempts = attemptsMap.get(test.id) || [];
      const bestAttempt = userAttempts.reduce((best: any, current: any) => {
        if (!best || current.percentage > best.percentage) return current;
        return best;
      }, null);

      return {
        ...test,
        user_attempts: {
          attempts: userAttempts,
          attempt_count: userAttempts.length,
          best_score: bestAttempt?.percentage || 0,
          passed: bestAttempt?.passed || false,
          last_attempt_at: userAttempts[userAttempts.length - 1]?.completed_at || null,
        },
      };
    });

    console.log('[Lernen] Tests fetched:', testsWithAttempts?.length || 0);

    return c.json({
      success: true,
      tests: testsWithAttempts || [],
      count: testsWithAttempts?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Get tests error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// CREATE TEST WITH BLOCKS
app.post('/BrowoKoordinator-Lernen/tests', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized create test');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const body = await c.req.json();
    const { 
      title, 
      description, 
      pass_percentage, 
      reward_coins, 
      max_attempts,
      time_limit_minutes,
      is_template,
      template_category,
      blocks 
    } = body;

    if (!title || !blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return c.json({ 
        error: 'Missing required fields: title, blocks (array, min 1)' 
      }, 400);
    }

    // Validate blocks
    const validBlockTypes = [
      'MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_TEXT', 
      'LONG_TEXT', 'FILL_BLANKS', 'ORDERING', 'MATCHING', 'SLIDER', 'FILE_UPLOAD'
    ];
    
    for (const block of blocks) {
      if (!block.type || !block.title || !block.content) {
        return c.json({ 
          error: 'Invalid block format. Required: type, title, content' 
        }, 400);
      }

      if (!validBlockTypes.includes(block.type)) {
        return c.json({ 
          error: 'Invalid block type',
          validTypes: validBlockTypes 
        }, 400);
      }
    }

    console.log('[Lernen] Create test:', { userId: user.id, title, blockCount: blocks.length });

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

    // Create test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        organization_id: userData.organization_id,
        title,
        description: description || null,
        pass_percentage: pass_percentage || 80,
        reward_coins: reward_coins || 0,
        max_attempts: max_attempts || 3,
        time_limit_minutes: time_limit_minutes || null,
        is_template: is_template || false,
        template_category: template_category || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (testError) {
      console.error('[Lernen] Create test failed:', testError);
      return c.json({ 
        error: 'Failed to create test', 
        details: testError.message 
      }, 500);
    }

    // Create test blocks
    const blocksToInsert = blocks.map((block: any, index: number) => ({
      test_id: test.id,
      type: block.type,
      title: block.title,
      description: block.description || null,
      content: block.content,
      points: block.points || 10,
      is_required: block.is_required !== undefined ? block.is_required : true,
      time_limit_seconds: block.time_limit_seconds || null,
      position: block.position !== undefined ? block.position : index,
    }));

    const { data: createdBlocks, error: blocksError } = await supabase
      .from('test_blocks')
      .insert(blocksToInsert)
      .select();

    if (blocksError) {
      console.error('[Lernen] Create blocks failed:', blocksError);
      // Rollback test
      await supabase.from('tests').delete().eq('id', test.id);
      return c.json({ 
        error: 'Failed to create test blocks', 
        details: blocksError.message 
      }, 500);
    }

    console.log('[Lernen] Test created:', test.id);

    return c.json({
      success: true,
      test: {
        ...test,
        test_blocks: createdBlocks,
      },
      message: 'Test created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Create test error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// UPDATE TEST
app.put('/BrowoKoordinator-Lernen/tests/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized update test');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const testId = c.req.param('id');
    const body = await c.req.json();

    console.log('[Lernen] Update test:', { userId: user.id, testId, updates: body });

    const supabase = getSupabaseClient();

    // Update test (basic fields only, not blocks)
    const { title, description, pass_percentage, reward_coins, max_attempts, time_limit_minutes } = body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (pass_percentage !== undefined) updateData.pass_percentage = pass_percentage;
    if (reward_coins !== undefined) updateData.reward_coins = reward_coins;
    if (max_attempts !== undefined) updateData.max_attempts = max_attempts;
    if (time_limit_minutes !== undefined) updateData.time_limit_minutes = time_limit_minutes;
    updateData.updated_by = user.id;

    const { data: test, error } = await supabase
      .from('tests')
      .update(updateData)
      .eq('id', testId)
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Update test failed:', error);
      return c.json({ 
        error: 'Failed to update test', 
        details: error.message 
      }, 500);
    }

    console.log('[Lernen] Test updated:', testId);

    return c.json({
      success: true,
      test,
      message: 'Test updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Update test error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// DELETE TEST
app.delete('/BrowoKoordinator-Lernen/tests/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized delete test');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const testId = c.req.param('id');

    console.log('[Lernen] Delete test:', { userId: user.id, testId });

    const supabase = getSupabaseClient();

    // Soft delete (set is_active = false)
    const { error } = await supabase
      .from('tests')
      .update({ is_active: false })
      .eq('id', testId);

    if (error) {
      console.error('[Lernen] Delete test failed:', error);
      return c.json({ 
        error: 'Failed to delete test', 
        details: error.message 
      }, 500);
    }

    console.log('[Lernen] Test deleted:', testId);

    return c.json({
      success: true,
      message: 'Test deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Delete test error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== TEST BLOCKS ROUTES ====================

// GET TEST BLOCKS
app.get('/BrowoKoordinator-Lernen/test-blocks/:test_id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized get test blocks');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const testId = c.req.param('test_id');
    const supabase = getSupabaseClient();

    const { data: blocks, error } = await supabase
      .from('test_blocks')
      .select('*')
      .eq('test_id', testId)
      .order('position', { ascending: true });

    if (error) {
      console.error('[Lernen] Get test blocks error:', error);
      return c.json({ 
        error: 'Failed to fetch test blocks', 
        details: error.message 
      }, 500);
    }

    return c.json({
      success: true,
      blocks: blocks || [],
      count: blocks?.length || 0,
    });

  } catch (error) {
    console.error('[Lernen] Get test blocks error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// CREATE TEST BLOCK
app.post('/BrowoKoordinator-Lernen/test-blocks', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const body = await c.req.json();
    const { test_id, type, title, description, content, points, is_required, time_limit_seconds, position } = body;

    if (!test_id || !type || !title || !content) {
      return c.json({ error: 'Missing required fields: test_id, type, title, content' }, 400);
    }

    const supabase = getSupabaseClient();

    const { data: block, error } = await supabase
      .from('test_blocks')
      .insert({
        test_id,
        type,
        title,
        description: description || null,
        content,
        points: points || 10,
        is_required: is_required !== undefined ? is_required : true,
        time_limit_seconds: time_limit_seconds || null,
        position: position || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Create test block error:', error);
      return c.json({ error: 'Failed to create test block', details: error.message }, 500);
    }

    return c.json({
      success: true,
      block,
    });

  } catch (error) {
    console.error('[Lernen] Create test block error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// UPDATE TEST BLOCK
app.put('/BrowoKoordinator-Lernen/test-blocks/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const blockId = c.req.param('id');
    const body = await c.req.json();

    const supabase = getSupabaseClient();

    const { data: block, error } = await supabase
      .from('test_blocks')
      .update(body)
      .eq('id', blockId)
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Update test block error:', error);
      return c.json({ error: 'Failed to update test block', details: error.message }, 500);
    }

    return c.json({
      success: true,
      block,
    });

  } catch (error) {
    console.error('[Lernen] Update test block error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// DELETE TEST BLOCK
app.delete('/BrowoKoordinator-Lernen/test-blocks/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const blockId = c.req.param('id');
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('test_blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      console.error('[Lernen] Delete test block error:', error);
      return c.json({ error: 'Failed to delete test block', details: error.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Test block deleted',
    });

  } catch (error) {
    console.error('[Lernen] Delete test block error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== SUBMIT TEST ====================
app.post('/BrowoKoordinator-Lernen/test/submit', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized test submit');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { test_id, answers, time_taken_seconds } = body;

    if (!test_id || !answers || !Array.isArray(answers)) {
      return c.json({ 
        error: 'Missing required fields: test_id, answers (array)' 
      }, 400);
    }

    console.log('[Lernen] Submit test:', { userId: user.id, test_id });

    const supabase = getSupabaseClient();

    // Get test with blocks
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*, test_blocks(*)')
      .eq('id', test_id)
      .single();

    if (testError || !test) {
      console.error('[Lernen] Test not found:', testError);
      return c.json({ 
        error: 'Test not found', 
        details: testError?.message 
      }, 404);
    }

    // Check max attempts
    const { data: previousAttempts } = await supabase
      .from('test_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('test_id', test_id)
      .not('completed_at', 'is', null);

    const attemptCount = previousAttempts?.length || 0;

    if (test.max_attempts > 0 && attemptCount >= test.max_attempts) {
      return c.json({ 
        error: 'Maximum attempts reached',
        max_attempts: test.max_attempts,
        current_attempts: attemptCount,
      }, 400);
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    const gradedAnswers = answers.map((answer: any) => {
      const block = test.test_blocks.find((b: any) => b.id === answer.block_id);
      if (!block) return null;

      totalPoints += block.points;

      // TODO: Implement grading logic for each block type
      // For now, simple comparison for MULTIPLE_CHOICE and TRUE_FALSE
      let isCorrect = false;
      
      if (block.type === 'MULTIPLE_CHOICE' || block.type === 'TRUE_FALSE') {
        isCorrect = answer.answer === block.content.correct_answer;
      } else if (block.type === 'MULTIPLE_SELECT') {
        // Check if all correct answers selected
        const correctAnswers = block.content.correct_answers || [];
        const userAnswers = answer.answer || [];
        isCorrect = correctAnswers.length === userAnswers.length && 
          correctAnswers.every((a: any) => userAnswers.includes(a));
      }
      // Add more block type grading logic as needed

      if (isCorrect) {
        earnedPoints += block.points;
      }

      return {
        block_id: answer.block_id,
        answer: answer.answer,
        is_correct: isCorrect,
        points_earned: isCorrect ? block.points : 0,
      };
    }).filter(Boolean);

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= test.pass_percentage;

    // Create attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        test_id: test_id,
        attempt_number: attemptCount + 1,
        answers: gradedAnswers,
        total_points: earnedPoints,
        max_points: totalPoints,
        percentage: percentage,
        passed: passed,
        completed_at: new Date().toISOString(),
        time_taken_seconds: time_taken_seconds || null,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('[Lernen] Create attempt failed:', attemptError);
      return c.json({ 
        error: 'Failed to save test attempt', 
        details: attemptError.message 
      }, 500);
    }

    // Award XP and Coins if passed (first time only)
    let xpResult = null;
    let coinsAwarded = 0;

    if (passed) {
      const isFirstPass = attemptCount === 0; // First attempt and passed

      if (isFirstPass) {
        // Award 50 XP for test pass
        xpResult = await awardXP(
          user.id,
          50,
          `Test bestanden: ${test.title}`,
          'test_completion'
        );

        // Award coins from test reward
        if (test.reward_coins > 0) {
          coinsAwarded = test.reward_coins;
          await awardCoins(
            user.id,
            coinsAwarded,
            `Test bestanden: ${test.title}`,
            { test_id: test_id, percentage }
          );
        }
      }
    }

    console.log('[Lernen] Test submitted:', { 
      attempt_id: attempt.id, 
      percentage, 
      passed,
      xp_awarded: xpResult?.total_xp,
      coins_awarded: coinsAwarded,
    });

    return c.json({
      success: true,
      attempt: {
        id: attempt.id,
        percentage: Math.round(percentage),
        passed,
        total_points: earnedPoints,
        max_points: totalPoints,
        pass_percentage: test.pass_percentage,
        attempt_number: attemptCount + 1,
        max_attempts: test.max_attempts,
      },
      rewards: xpResult ? {
        xp_awarded: 50,
        coins_awarded: coinsAwarded,
        new_total_xp: xpResult.total_xp,
        new_level: xpResult.level,
        leveled_up: xpResult.leveled_up,
      } : null,
      message: passed ? 'Glückwunsch! Test bestanden!' : 'Test nicht bestanden. Versuche es erneut!',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Test submit error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== TEST ASSIGNMENTS ROUTES ====================

// GET TEST-VIDEO ASSIGNMENTS
app.get('/BrowoKoordinator-Lernen/test-assignments', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user || !isAdmin(user.role)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const supabase = getSupabaseClient();

    const { data: assignments, error } = await supabase
      .from('test_video_assignments')
      .select(`
        *,
        test:tests(id, title),
        video:videos(id, title)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('[Lernen] Get test assignments error:', error);
      return c.json({ error: 'Failed to fetch test assignments', details: error.message }, 500);
    }

    return c.json({
      success: true,
      assignments: assignments || [],
      count: assignments?.length || 0,
    });

  } catch (error) {
    console.error('[Lernen] Get test assignments error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// CREATE TEST-VIDEO ASSIGNMENT
app.post('/BrowoKoordinator-Lernen/test-assignments', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user || !isAdmin(user.role)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const body = await c.req.json();
    const { test_id, video_id } = body;

    if (!test_id || !video_id) {
      return c.json({ error: 'Missing required fields: test_id, video_id' }, 400);
    }

    const supabase = getSupabaseClient();

    const { data: assignment, error } = await supabase
      .from('test_video_assignments')
      .insert({
        test_id,
        video_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Create test assignment error:', error);
      return c.json({ error: 'Failed to create test assignment', details: error.message }, 500);
    }

    return c.json({
      success: true,
      assignment,
    });

  } catch (error) {
    console.error('[Lernen] Create test assignment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// DELETE TEST-VIDEO ASSIGNMENT
app.delete('/BrowoKoordinator-Lernen/test-assignments/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user || !isAdmin(user.role)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const assignmentId = c.req.param('id');
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('test_video_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('[Lernen] Delete test assignment error:', error);
      return c.json({ error: 'Failed to delete test assignment', details: error.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Test assignment deleted',
    });

  } catch (error) {
    console.error('[Lernen] Delete test assignment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== VIDEO COMPLETE (KEEP FROM OLD SYSTEM) ====================
app.post('/BrowoKoordinator-Lernen/video/complete', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized video complete');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { video_id, watch_time_seconds } = body;

    if (!video_id) {
      return c.json({ 
        error: 'Missing required field: video_id' 
      }, 400);
    }

    console.log('[Lernen] Complete video:', { userId: user.id, video_id, watch_time_seconds });

    const supabase = getSupabaseClient();

    // Get video
    const { data: video, error: videoError } = await supabase
      .from('video_content')
      .select('*')
      .eq('id', video_id)
      .single();

    if (videoError || !video) {
      console.error('[Lernen] Video not found:', videoError);
      return c.json({ 
        error: 'Video not found', 
        details: videoError?.message 
      }, 404);
    }

    // Check if already completed
    const { data: existingProgress } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('video_id', video_id)
      .single();

    const alreadyCompleted = existingProgress?.completed;

    // Update or create progress
    const { data: progress, error: progressError } = await supabase
      .from('learning_progress')
      .upsert({
        user_id: user.id,
        video_id,
        watched_seconds: watch_time_seconds || video.duration_seconds,
        completed: true,
        completed_at: new Date().toISOString(),
        last_watched_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (progressError) {
      console.error('[Lernen] Update progress failed:', progressError);
      return c.json({ 
        error: 'Failed to update progress', 
        details: progressError.message 
      }, 500);
    }

    // Award XP if first completion
    let xpResult = null;
    if (!alreadyCompleted) {
      xpResult = await awardXP(
        user.id,
        10,
        `Video abgeschlossen: ${video.title}`,
        'video_completion'
      );
    }

    console.log('[Lernen] Video completed:', { 
      video_id, 
      xp_awarded: xpResult?.total_xp,
      first_completion: !alreadyCompleted,
    });

    return c.json({
      success: true,
      progress,
      rewards: xpResult ? {
        xp_awarded: 10,
        new_total_xp: xpResult.total_xp,
        new_level: xpResult.level,
        leveled_up: xpResult.leveled_up,
      } : null,
      message: !alreadyCompleted ? 'Video abgeschlossen! +10 XP' : 'Video erneut angesehen',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Video complete error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== PROGRESS ROUTES (KEEP FROM OLD SYSTEM) ====================
app.get('/BrowoKoordinator-Lernen/progress', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized progress request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Lernen] Get progress:', { userId: user.id });

    const supabase = getSupabaseClient();

    // Get video progress
    const { data: videoProgress } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', user.id);

    // Get test attempts
    const { data: testAttempts } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', user.id);

    // Get avatar stats
    const { data: avatar } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Calculate statistics
    const videosCompleted = videoProgress?.filter((p: any) => p.completed).length || 0;
    const testsPassed = [...new Set(
      testAttempts?.filter((a: any) => a.passed).map((a: any) => a.test_id)
    )].length || 0;

    const totalXP = avatar?.total_xp || 0;
    const currentLevel = avatar?.level || 1;
    const xpForNextLevel = calculateXPForNextLevel(currentLevel);
    const xpForCurrentLevel = calculateXPForNextLevel(currentLevel - 1);
    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

    console.log('[Lernen] Progress fetched');

    return c.json({
      success: true,
      progress: {
        videos: {
          completed: videosCompleted,
          in_progress: videoProgress?.filter((p: any) => !p.completed && p.watched_seconds > 0).length || 0,
          total_watched_seconds: videoProgress?.reduce((sum: number, p: any) => sum + p.watched_seconds, 0) || 0,
        },
        tests: {
          passed: testsPassed,
          attempted: [...new Set(testAttempts?.map((a: any) => a.test_id))].length || 0,
          average_score: testAttempts?.length > 0
            ? Math.round(testAttempts.reduce((sum: number, a: any) => sum + a.percentage, 0) / testAttempts.length)
            : 0,
        },
        avatar: {
          level: currentLevel,
          total_xp: totalXP,
          xp_in_current_level: xpInCurrentLevel,
          xp_needed_for_next_level: xpNeededForNextLevel,
          progress_to_next_level: Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100),
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Get progress error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

app.get('/BrowoKoordinator-Lernen/avatar', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized avatar request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Lernen] Get avatar:', { userId: user.id });

    const supabase = getSupabaseClient();

    // Get or create avatar
    let { data: avatar, error: avatarError } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (avatarError || !avatar) {
      // Create default avatar
      const { data: newAvatar } = await supabase
        .from('user_avatars')
        .insert({
          user_id: user.id,
          level: 1,
          total_xp: 0,
        })
        .select()
        .single();
      
      avatar = newAvatar;
    }

    const currentLevel = avatar.level;
    const totalXP = avatar.total_xp;
    const xpForNextLevel = calculateXPForNextLevel(currentLevel);
    const xpForCurrentLevel = calculateXPForNextLevel(currentLevel - 1);
    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

    console.log('[Lernen] Avatar fetched');

    return c.json({
      success: true,
      avatar: {
        ...avatar,
        xp_in_current_level: xpInCurrentLevel,
        xp_needed_for_next_level: xpNeededForNextLevel,
        progress_to_next_level: Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Get avatar error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

app.get('/BrowoKoordinator-Lernen/recommendations', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized recommendations request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Lernen] Get recommendations:', { userId: user.id });

    const supabase = getSupabaseClient();

    // Get completed videos
    const { data: completedProgress } = await supabase
      .from('learning_progress')
      .select('video_id')
      .eq('user_id', user.id)
      .eq('completed', true);

    const completedVideoIds = completedProgress?.map((p: any) => p.video_id) || [];

    // Get all videos not completed
    let query = supabase
      .from('video_content')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(10);

    if (completedVideoIds.length > 0) {
      query = query.not('id', 'in', `(${completedVideoIds.join(',')})`);
    }

    const { data: recommendations, error } = await query;

    if (error) {
      console.error('[Lernen] Get recommendations error:', error);
      return c.json({ 
        error: 'Failed to fetch recommendations', 
        details: error.message 
      }, 500);
    }

    // Prioritize mandatory videos
    const sortedRecommendations = recommendations?.sort((a: any, b: any) => {
      if (a.is_mandatory && !b.is_mandatory) return -1;
      if (!a.is_mandatory && b.is_mandatory) return 1;
      return 0;
    });

    console.log('[Lernen] Recommendations fetched:', sortedRecommendations?.length || 0);

    return c.json({
      success: true,
      recommendations: sortedRecommendations || [],
      count: sortedRecommendations?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Recommendations error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== TRAINING COMPLIANCE API (v4.13.3 - FIXED) ====================

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

// ==================== EXTERNAL TRAININGS CRUD ====================

// GET External Trainings
app.get('/BrowoKoordinator-Lernen/external-trainings', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    let query = supabase
      .from('external_trainings')
      .select(`
        *,
        user:users!external_trainings_user_id_fkey(id, first_name, last_name, email, department, location_id)
      `)
      .eq('organization_id', userData.organization_id)
      .order('completed_at', { ascending: false });

    const { data: trainings, error } = await query;

    if (error) {
      console.error('[Lernen] Get external trainings error:', error);
      return c.json({ error: 'Failed to fetch external trainings', details: error.message }, 500);
    }

    return c.json({
      success: true,
      trainings: trainings || [],
      count: trainings?.length || 0,
    });

  } catch (error) {
    console.error('[Lernen] Get external trainings error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// POST External Training
app.post('/BrowoKoordinator-Lernen/external-trainings', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user || !isAdmin(user.role)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const body = await c.req.json();
    const { user_id, training_name, category, provider, completed_at, expires_at, certificate_url, notes } = body;

    if (!user_id || !training_name || !completed_at) {
      return c.json({ error: 'Missing required fields' }, 400);
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

    const { data: training, error } = await supabase
      .from('external_trainings')
      .insert({
        user_id,
        training_name,
        category,
        provider,
        completed_at,
        expires_at,
        certificate_url,
        notes,
        organization_id: userData.organization_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Create external training error:', error);
      return c.json({ error: 'Failed to create external training', details: error.message }, 500);
    }

    return c.json({
      success: true,
      training,
    });

  } catch (error) {
    console.error('[Lernen] Create external training error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// PUT External Training
app.put('/BrowoKoordinator-Lernen/external-trainings/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user || !isAdmin(user.role)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const { training_name, category, provider, completed_at, expires_at, certificate_url, notes } = body;

    const supabase = getSupabaseClient();

    const { data: training, error } = await supabase
      .from('external_trainings')
      .update({
        training_name,
        category,
        provider,
        completed_at,
        expires_at,
        certificate_url,
        notes,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Update external training error:', error);
      return c.json({ error: 'Failed to update external training', details: error.message }, 500);
    }

    return c.json({
      success: true,
      training,
    });

  } catch (error) {
    console.error('[Lernen] Update external training error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// DELETE External Training
app.delete('/BrowoKoordinator-Lernen/external-trainings/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user || !isAdmin(user.role)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const id = c.req.param('id');
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('external_trainings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Lernen] Delete external training error:', error);
      return c.json({ error: 'Failed to delete external training', details: error.message }, 500);
    }

    return c.json({
      success: true,
      message: 'External training deleted',
    });

  } catch (error) {
    console.error('[Lernen] Delete external training error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
