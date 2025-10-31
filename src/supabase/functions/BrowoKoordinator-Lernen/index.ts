/**
 * BrowoKoordinator - Lernen Edge Function
 * Version: 1.0.0
 * 
 * Handles learning system: videos, quizzes, courses, progress tracking, XP & leveling
 * 
 * Routes:
 * - GET    /health                - Health check (NO AUTH)
 * - GET    /videos                - Get all videos with progress (AUTH REQUIRED)
 * - POST   /videos                - Create video (ADMIN)
 * - PUT    /videos/:id            - Update video (ADMIN)
 * - DELETE /videos/:id            - Delete video (ADMIN)
 * - GET    /quizzes               - Get all quizzes (AUTH REQUIRED)
 * - POST   /quizzes               - Create quiz (ADMIN)
 * - PUT    /quizzes/:id           - Update quiz (ADMIN)
 * - DELETE /quizzes/:id           - Delete quiz (ADMIN)
 * - POST   /quiz/submit           - Submit quiz answers (AUTH REQUIRED)
 * - POST   /video/complete        - Mark video as completed (AUTH REQUIRED)
 * - GET    /progress              - Get user's learning progress (AUTH REQUIRED)
 * - GET    /avatar                - Get learning avatar stats (AUTH REQUIRED)
 * - GET    /recommendations       - Get personalized recommendations (AUTH REQUIRED)
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
  return ['HR_SUPERADMIN', 'HR_MANAGER'].includes(role);
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
    version: '1.0.0',
    purpose: 'Learning Management System with XP & Leveling',
  });
});

// ==================== GET ALL VIDEOS ====================
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

    // Build query
    let query = supabase
      .from('video_content')
      .select('*')
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

// ==================== CREATE VIDEO ====================
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

    // Send notification to all users about new video
    // (Optional - could be enabled/disabled via config)
    
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

// ==================== UPDATE VIDEO ====================
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

// ==================== DELETE VIDEO ====================
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

    // Delete video (will cascade delete progress, quizzes, etc.)
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

// ==================== GET ALL QUIZZES ====================
app.get('/BrowoKoordinator-Lernen/quizzes', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized quizzes request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const videoId = c.req.query('video_id');

    console.log('[Lernen] Get quizzes:', { userId: user.id, videoId });

    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .order('created_at', { ascending: false });

    if (videoId) {
      query = query.eq('video_id', videoId);
    }

    const { data: quizzes, error: quizzesError } = await query;

    if (quizzesError) {
      console.error('[Lernen] Get quizzes error:', quizzesError);
      return c.json({ 
        error: 'Failed to fetch quizzes', 
        details: quizzesError.message 
      }, 500);
    }

    // Get user's attempts
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id);

    // Create attempts map
    const attemptsMap = new Map();
    attempts?.forEach((attempt: any) => {
      if (!attemptsMap.has(attempt.quiz_id)) {
        attemptsMap.set(attempt.quiz_id, []);
      }
      attemptsMap.get(attempt.quiz_id).push(attempt);
    });

    // Enrich quizzes with attempts
    const quizzesWithAttempts = quizzes?.map((quiz: any) => {
      const userAttempts = attemptsMap.get(quiz.id) || [];
      const bestAttempt = userAttempts.reduce((best: any, current: any) => {
        if (!best || current.score > best.score) return current;
        return best;
      }, null);

      return {
        ...quiz,
        user_attempts: {
          attempts: userAttempts,
          attempt_count: userAttempts.length,
          best_score: bestAttempt?.score || 0,
          passed: bestAttempt?.passed || false,
          last_attempt_at: userAttempts[userAttempts.length - 1]?.completed_at || null,
        },
      };
    });

    console.log('[Lernen] Quizzes fetched:', quizzesWithAttempts?.length || 0);

    return c.json({
      success: true,
      quizzes: quizzesWithAttempts || [],
      count: quizzesWithAttempts?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Get quizzes error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== CREATE QUIZ ====================
app.post('/BrowoKoordinator-Lernen/quizzes', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized create quiz');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const body = await c.req.json();
    const { video_id, title, description, passing_score, questions } = body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return c.json({ 
        error: 'Missing required fields: title, questions (array, min 1)' 
      }, 400);
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question_text || !question.question_type || !question.options || !question.correct_answer) {
        return c.json({ 
          error: 'Invalid question format. Required: question_text, question_type, options, correct_answer' 
        }, 400);
      }

      const validTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE'];
      if (!validTypes.includes(question.question_type)) {
        return c.json({ 
          error: 'Invalid question_type',
          validTypes 
        }, 400);
      }
    }

    console.log('[Lernen] Create quiz:', { userId: user.id, title, questionCount: questions.length });

    const supabase = getSupabaseClient();

    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        video_id: video_id || null,
        title,
        description: description || null,
        passing_score: passing_score || 80,
      })
      .select()
      .single();

    if (quizError) {
      console.error('[Lernen] Create quiz failed:', quizError);
      return c.json({ 
        error: 'Failed to create quiz', 
        details: quizError.message 
      }, 500);
    }

    // Create questions
    const questionsToInsert = questions.map((q: any, index: number) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      order_index: q.order_index !== undefined ? q.order_index : index,
    }));

    const { data: createdQuestions, error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)
      .select();

    if (questionsError) {
      console.error('[Lernen] Create questions failed:', questionsError);
      // Rollback quiz
      await supabase.from('quizzes').delete().eq('id', quiz.id);
      return c.json({ 
        error: 'Failed to create quiz questions', 
        details: questionsError.message 
      }, 500);
    }

    console.log('[Lernen] Quiz created:', quiz.id);

    return c.json({
      success: true,
      quiz: {
        ...quiz,
        quiz_questions: createdQuestions,
      },
      message: 'Quiz created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Create quiz error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== UPDATE QUIZ ====================
app.put('/BrowoKoordinator-Lernen/quizzes/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized update quiz');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const quizId = c.req.param('id');
    const body = await c.req.json();

    console.log('[Lernen] Update quiz:', { userId: user.id, quizId, updates: body });

    const supabase = getSupabaseClient();

    // Update quiz (basic fields only, not questions)
    const { title, description, passing_score, video_id } = body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (passing_score !== undefined) updateData.passing_score = passing_score;
    if (video_id !== undefined) updateData.video_id = video_id;

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .update(updateData)
      .eq('id', quizId)
      .select()
      .single();

    if (error) {
      console.error('[Lernen] Update quiz failed:', error);
      return c.json({ 
        error: 'Failed to update quiz', 
        details: error.message 
      }, 500);
    }

    console.log('[Lernen] Quiz updated:', quizId);

    return c.json({
      success: true,
      quiz,
      message: 'Quiz updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Update quiz error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== DELETE QUIZ ====================
app.delete('/BrowoKoordinator-Lernen/quizzes/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized delete quiz');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - Admin required' }, 403);
    }

    const quizId = c.req.param('id');

    console.log('[Lernen] Delete quiz:', { userId: user.id, quizId });

    const supabase = getSupabaseClient();

    // Delete quiz (will cascade delete questions and attempts)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) {
      console.error('[Lernen] Delete quiz failed:', error);
      return c.json({ 
        error: 'Failed to delete quiz', 
        details: error.message 
      }, 500);
    }

    console.log('[Lernen] Quiz deleted:', quizId);

    return c.json({
      success: true,
      message: 'Quiz deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Delete quiz error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== SUBMIT QUIZ ====================
app.post('/BrowoKoordinator-Lernen/quiz/submit', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Lernen] Unauthorized quiz submit');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { quiz_id, answers } = body;

    if (!quiz_id || !answers || typeof answers !== 'object') {
      return c.json({ 
        error: 'Missing required fields: quiz_id, answers (object)' 
      }, 400);
    }

    console.log('[Lernen] Submit quiz:', { userId: user.id, quiz_id });

    const supabase = getSupabaseClient();

    // Get quiz with questions
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('id', quiz_id)
      .single();

    if (quizError || !quiz) {
      console.error('[Lernen] Quiz not found:', quizError);
      return c.json({ 
        error: 'Quiz not found', 
        details: quizError?.message 
      }, 404);
    }

    // Calculate score
    const totalQuestions = quiz.quiz_questions.length;
    let correctAnswers = 0;

    quiz.quiz_questions.forEach((question: any) => {
      const userAnswer = answers[question.id];
      if (userAnswer && userAnswer.toString() === question.correct_answer.toString()) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= quiz.passing_score;

    // Create quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_id: quiz_id,
        score,
        passed,
        answers,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('[Lernen] Create attempt failed:', attemptError);
      return c.json({ 
        error: 'Failed to save quiz attempt', 
        details: attemptError.message 
      }, 500);
    }

    // Award XP and Coins if passed
    let xpResult = null;
    let coinsAwarded = 0;

    if (passed) {
      // Check if this is first time passing
      const { data: previousAttempts } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', user.id)
        .eq('quiz_id', quiz_id)
        .eq('passed', true)
        .neq('id', attempt.id);

      const isFirstPass = !previousAttempts || previousAttempts.length === 0;

      if (isFirstPass) {
        // Award 50 XP for first quiz pass
        xpResult = await awardXP(
          user.id,
          50,
          `Quiz bestanden: ${quiz.title}`,
          'quiz_completion'
        );

        // Award 10 coins for quiz pass
        coinsAwarded = 10;
        await awardCoins(
          user.id,
          coinsAwarded,
          `Quiz bestanden: ${quiz.title}`,
          { quiz_id: quiz_id, score }
        );
      }
    }

    console.log('[Lernen] Quiz submitted:', { 
      attempt_id: attempt.id, 
      score, 
      passed,
      xp_awarded: xpResult?.total_xp,
      coins_awarded: coinsAwarded,
    });

    return c.json({
      success: true,
      attempt: {
        id: attempt.id,
        score,
        passed,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        passing_score: quiz.passing_score,
      },
      rewards: xpResult ? {
        xp_awarded: 50,
        coins_awarded: coinsAwarded,
        new_total_xp: xpResult.total_xp,
        new_level: xpResult.level,
        leveled_up: xpResult.leveled_up,
      } : null,
      message: passed ? 'Glückwunsch! Quiz bestanden!' : 'Quiz nicht bestanden. Versuche es erneut!',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Lernen] Quiz submit error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== MARK VIDEO COMPLETE ====================
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

// ==================== GET PROGRESS ====================
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

    // Get quiz attempts
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
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
    const quizzesPassed = [...new Set(
      quizAttempts?.filter((a: any) => a.passed).map((a: any) => a.quiz_id)
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
        quizzes: {
          passed: quizzesPassed,
          attempted: [...new Set(quizAttempts?.map((a: any) => a.quiz_id))].length || 0,
          average_score: quizAttempts?.length > 0
            ? Math.round(quizAttempts.reduce((sum: number, a: any) => sum + a.score, 0) / quizAttempts.length)
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

// ==================== GET AVATAR ====================
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

// ==================== GET RECOMMENDATIONS ====================
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

// ==================== START SERVER ====================

Deno.serve(app.fetch);
