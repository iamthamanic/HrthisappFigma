/**
 * LEARNING SERVICE
 * ================
 * Handles all learning-related operations
 * 
 * Replaces direct Supabase calls in stores for:
 * - Video management (CRUD)
 * - Quiz management (CRUD)
 * - Learning progress tracking
 * - Quiz attempts
 * - User learning stats
 */

import { ApiService } from './base/ApiService';
import { NotFoundError, ValidationError, ApiError } from './base/ApiError';
import type { Video, Quiz, LearningProgress, QuizAttempt } from '../types/database';

export interface CreateVideoData {
  title: string;
  description?: string;
  youtube_url: string;
  duration_minutes?: number;
  thumbnail_url?: string;
  category?: string;
  xp_reward?: number;
  coin_reward?: number;
  organization_id?: string;
}

export interface UpdateVideoData {
  title?: string;
  description?: string;
  youtube_url?: string;
  duration_minutes?: number;
  thumbnail_url?: string;
  category?: string;
  xp_reward?: number;
  coin_reward?: number;
}

export interface CreateQuizData {
  video_id?: string;
  title: string;
  description?: string;
  questions: any[]; // JSON array of questions
  passing_score?: number;
  xp_reward?: number;
  coin_reward?: number;
  organization_id?: string;
}

export interface UpdateQuizData {
  title?: string;
  description?: string;
  questions?: any[];
  passing_score?: number;
  xp_reward?: number;
  coin_reward?: number;
}

export interface SubmitQuizAttemptData {
  quiz_id: string;
  user_id: string;
  score: number;
  answers: any[]; // JSON array of answers
  passed: boolean;
}

export interface VideoFilters {
  category?: string;
  organization_id?: string;
  search?: string;
}

export interface UserLearningStats {
  total_videos_watched: number;
  total_quizzes_completed: number;
  total_xp_earned: number;
  total_coins_earned: number;
  completion_rate: number;
}

/**
 * LEARNING SERVICE
 * ================
 * Manages videos, quizzes, and learning progress
 */
export class LearningService extends ApiService {
  // ========================================
  // VIDEO MANAGEMENT
  // ========================================

  /**
   * Get all videos with optional filters
   */
  async getAllVideos(filters?: VideoFilters): Promise<Video[]> {
    this.logRequest('getAllVideos', 'LearningService', { filters });

    try {
      let query = this.supabase
        .from('video_content')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.organization_id) {
          // Include videos with matching org_id OR videos without org_id (legacy)
          query = query.or(`organization_id.eq.${filters.organization_id},organization_id.is.null`);
        }
        if (filters.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          );
        }
      }

      const { data: videos, error } = await query;

      if (error) {
        this.handleError(error, 'LearningService.getAllVideos');
      }

      this.logResponse('LearningService.getAllVideos', { count: videos?.length || 0 });
      return (videos || []) as Video[];
    } catch (error: any) {
      this.handleError(error, 'LearningService.getAllVideos');
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(videoId: string): Promise<Video> {
    this.logRequest('getVideoById', 'LearningService', { videoId });

    if (!videoId) {
      throw new ValidationError(
        'Video ID ist erforderlich',
        'LearningService.getVideoById',
        { videoId: 'Video ID ist erforderlich' }
      );
    }

    try {
      const { data: video, error } = await this.supabase
        .from('video_content')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) {
        throw new NotFoundError('Video', 'LearningService.getVideoById', error);
      }

      if (!video) {
        throw new NotFoundError('Video', 'LearningService.getVideoById');
      }

      this.logResponse('LearningService.getVideoById', { title: video.title });
      return video as Video;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.getVideoById');
    }
  }

  /**
   * Create new video
   */
  async createVideo(data: CreateVideoData): Promise<Video> {
    this.logRequest('createVideo', 'LearningService', data);

    // Validate input
    const errors: Record<string, string> = {};

    if (!data.title) errors.title = 'Titel ist erforderlich';
    if (!data.youtube_url) errors.youtube_url = 'YouTube URL ist erforderlich';

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'LearningService.createVideo',
        errors
      );
    }

    try {
      const { data: video, error } = await this.supabase
        .from('video_content')
        .insert({
          title: data.title,
          description: data.description || null,
          youtube_url: data.youtube_url,
          duration_minutes: data.duration_minutes || null,
          thumbnail_url: data.thumbnail_url || null,
          category: data.category || null,
          xp_reward: data.xp_reward || 10,
          coin_reward: data.coin_reward || 5,
          organization_id: data.organization_id || null,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.createVideo');
      }

      if (!video) {
        throw new ApiError(
          'Video konnte nicht erstellt werden',
          'CREATION_FAILED',
          'LearningService.createVideo'
        );
      }

      this.logResponse('LearningService.createVideo', { id: video.id });
      return video as Video;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'LearningService.createVideo');
    }
  }

  /**
   * Update video
   */
  async updateVideo(videoId: string, updates: UpdateVideoData): Promise<Video> {
    this.logRequest('updateVideo', 'LearningService', { videoId, updates });

    if (!videoId) {
      throw new ValidationError(
        'Video ID ist erforderlich',
        'LearningService.updateVideo',
        { videoId: 'Video ID ist erforderlich' }
      );
    }

    try {
      const { data: video, error } = await this.supabase
        .from('video_content')
        .update(updates)
        .eq('id', videoId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.updateVideo');
      }

      if (!video) {
        throw new NotFoundError('Video', 'LearningService.updateVideo');
      }

      this.logResponse('LearningService.updateVideo', { id: video.id });
      return video as Video;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.updateVideo');
    }
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId: string): Promise<void> {
    this.logRequest('deleteVideo', 'LearningService', { videoId });

    if (!videoId) {
      throw new ValidationError(
        'Video ID ist erforderlich',
        'LearningService.deleteVideo',
        { videoId: 'Video ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('video_content')
        .delete()
        .eq('id', videoId);

      if (error) {
        this.handleError(error, 'LearningService.deleteVideo');
      }

      this.logResponse('LearningService.deleteVideo', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.deleteVideo');
    }
  }

  /**
   * Get videos for a specific organization (alias for getAllVideos)
   * Used by CreateTestDialog to load videos for linking
   * NOTE: Also returns videos WITHOUT organization_id (legacy videos)
   */
  async getVideos(organizationId: string): Promise<Video[]> {
    this.logRequest('getVideos', 'LearningService', { organizationId });

    try {
      const { data: videos, error } = await this.supabase
        .from('video_content')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) {
        this.handleError(error, 'LearningService.getVideos');
      }

      this.logResponse('LearningService.getVideos', { 
        count: videos?.length || 0,
        organizationId 
      });
      
      return (videos || []) as Video[];
    } catch (error: any) {
      this.handleError(error, 'LearningService.getVideos');
    }
  }

  // ========================================
  // QUIZ MANAGEMENT
  // ========================================

  /**
   * Get all quizzes
   */
  async getAllQuizzes(videoId?: string): Promise<Quiz[]> {
    this.logRequest('getAllQuizzes', 'LearningService', { videoId });

    try {
      let query = this.supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (videoId) {
        query = query.eq('video_id', videoId);
      }

      const { data: quizzes, error } = await query;

      if (error) {
        this.handleError(error, 'LearningService.getAllQuizzes');
      }

      this.logResponse('LearningService.getAllQuizzes', { count: quizzes?.length || 0 });
      return (quizzes || []) as Quiz[];
    } catch (error: any) {
      this.handleError(error, 'LearningService.getAllQuizzes');
    }
  }

  /**
   * Get quiz by ID
   */
  async getQuizById(quizId: string): Promise<Quiz> {
    this.logRequest('getQuizById', 'LearningService', { quizId });

    if (!quizId) {
      throw new ValidationError(
        'Quiz ID ist erforderlich',
        'LearningService.getQuizById',
        { quizId: 'Quiz ID ist erforderlich' }
      );
    }

    try {
      const { data: quiz, error } = await this.supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) {
        throw new NotFoundError('Quiz', 'LearningService.getQuizById', error);
      }

      if (!quiz) {
        throw new NotFoundError('Quiz', 'LearningService.getQuizById');
      }

      this.logResponse('LearningService.getQuizById', { title: quiz.title });
      return quiz as Quiz;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.getQuizById');
    }
  }

  /**
   * Create new quiz
   */
  async createQuiz(data: CreateQuizData): Promise<Quiz> {
    this.logRequest('createQuiz', 'LearningService', data);

    // Validate input
    const errors: Record<string, string> = {};

    if (!data.title) errors.title = 'Titel ist erforderlich';
    if (!data.questions || data.questions.length === 0) {
      errors.questions = 'Mindestens eine Frage ist erforderlich';
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'LearningService.createQuiz',
        errors
      );
    }

    try {
      const { data: quiz, error } = await this.supabase
        .from('quizzes')
        .insert({
          video_id: data.video_id || null,
          title: data.title,
          description: data.description || null,
          questions: data.questions,
          passing_score: data.passing_score || 70,
          xp_reward: data.xp_reward || 20,
          coin_reward: data.coin_reward || 10,
          organization_id: data.organization_id || null,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.createQuiz');
      }

      if (!quiz) {
        throw new ApiError(
          'Quiz konnte nicht erstellt werden',
          'CREATION_FAILED',
          'LearningService.createQuiz'
        );
      }

      this.logResponse('LearningService.createQuiz', { id: quiz.id });
      return quiz as Quiz;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'LearningService.createQuiz');
    }
  }

  /**
   * Update quiz
   */
  async updateQuiz(quizId: string, updates: UpdateQuizData): Promise<Quiz> {
    this.logRequest('updateQuiz', 'LearningService', { quizId, updates });

    if (!quizId) {
      throw new ValidationError(
        'Quiz ID ist erforderlich',
        'LearningService.updateQuiz',
        { quizId: 'Quiz ID ist erforderlich' }
      );
    }

    try {
      const { data: quiz, error } = await this.supabase
        .from('quizzes')
        .update(updates)
        .eq('id', quizId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.updateQuiz');
      }

      if (!quiz) {
        throw new NotFoundError('Quiz', 'LearningService.updateQuiz');
      }

      this.logResponse('LearningService.updateQuiz', { id: quiz.id });
      return quiz as Quiz;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.updateQuiz');
    }
  }

  /**
   * Delete quiz
   */
  async deleteQuiz(quizId: string): Promise<void> {
    this.logRequest('deleteQuiz', 'LearningService', { quizId });

    if (!quizId) {
      throw new ValidationError(
        'Quiz ID ist erforderlich',
        'LearningService.deleteQuiz',
        { quizId: 'Quiz ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) {
        this.handleError(error, 'LearningService.deleteQuiz');
      }

      this.logResponse('LearningService.deleteQuiz', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.deleteQuiz');
    }
  }

  // ========================================
  // LEARNING PROGRESS
  // ========================================

  /**
   * Get user's learning progress for a video
   */
  async getVideoProgress(userId: string, videoId: string): Promise<LearningProgress | null> {
    this.logRequest('getVideoProgress', 'LearningService', { userId, videoId });

    if (!userId || !videoId) {
      throw new ValidationError(
        'User ID und Video ID sind erforderlich',
        'LearningService.getVideoProgress',
        {
          userId: !userId ? 'User ID ist erforderlich' : '',
          videoId: !videoId ? 'Video ID ist erforderlich' : '',
        }
      );
    }

    try {
      const { data: progress, error } = await this.supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not an error)
        this.handleError(error, 'LearningService.getVideoProgress');
      }

      this.logResponse('LearningService.getVideoProgress', { completed: progress?.completed });
      return (progress as LearningProgress) || null;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error getting video progress:', error);
      return null;
    }
  }

  /**
   * Update user's learning progress for a video
   */
  async updateVideoProgress(
    userId: string,
    videoId: string,
    watchedSeconds: number,
    completed: boolean = false
  ): Promise<LearningProgress> {
    this.logRequest('updateVideoProgress', 'LearningService', {
      userId,
      videoId,
      watchedSeconds,
      completed,
    });

    if (!userId || !videoId) {
      throw new ValidationError(
        'User ID und Video ID sind erforderlich',
        'LearningService.updateVideoProgress',
        {
          userId: !userId ? 'User ID ist erforderlich' : '',
          videoId: !videoId ? 'Video ID ist erforderlich' : '',
        }
      );
    }

    try {
      const { data: learningProgress, error } = await this.supabase
        .from('learning_progress')
        .upsert({
          user_id: userId,
          video_id: videoId,
          watched_seconds: watchedSeconds,
          completed,
          last_watched_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.updateVideoProgress');
      }

      if (!learningProgress) {
        throw new ApiError(
          'Progress konnte nicht aktualisiert werden',
          'UPDATE_FAILED',
          'LearningService.updateVideoProgress'
        );
      }

      this.logResponse('LearningService.updateVideoProgress', { completed });
      return learningProgress as LearningProgress;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'LearningService.updateVideoProgress');
    }
  }

  /**
   * Get all learning progress for a user
   */
  async getUserLearningProgress(userId: string): Promise<LearningProgress[]> {
    this.logRequest('getUserLearningProgress', 'LearningService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'LearningService.getUserLearningProgress',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      const { data: progress, error } = await this.supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_watched_at', { ascending: false });

      if (error) {
        this.handleError(error, 'LearningService.getUserLearningProgress');
      }

      this.logResponse('LearningService.getUserLearningProgress', {
        count: progress?.length || 0,
      });
      return (progress || []) as LearningProgress[];
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.getUserLearningProgress');
    }
  }

  /**
   * Alias for getUserLearningProgress (for backwards compatibility with stores)
   */
  async getUserProgress(userId: string): Promise<LearningProgress[]> {
    return this.getUserLearningProgress(userId);
  }

  // ========================================
  // QUIZ ATTEMPTS
  // ========================================

  /**
   * Submit quiz attempt
   */
  async submitQuizAttempt(data: SubmitQuizAttemptData): Promise<QuizAttempt> {
    this.logRequest('submitQuizAttempt', 'LearningService', data);

    // Validate input
    const errors: Record<string, string> = {};

    if (!data.quiz_id) errors.quiz_id = 'Quiz ID ist erforderlich';
    if (!data.user_id) errors.user_id = 'User ID ist erforderlich';
    if (data.score === undefined) errors.score = 'Score ist erforderlich';

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'LearningService.submitQuizAttempt',
        errors
      );
    }

    try {
      const { data: attempt, error } = await this.supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: data.quiz_id,
          user_id: data.user_id,
          score: data.score,
          answers: data.answers,
          passed: data.passed,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.submitQuizAttempt');
      }

      if (!attempt) {
        throw new ApiError(
          'Quiz Attempt konnte nicht erstellt werden',
          'CREATION_FAILED',
          'LearningService.submitQuizAttempt'
        );
      }

      this.logResponse('LearningService.submitQuizAttempt', {
        id: attempt.id,
        passed: attempt.passed,
      });
      return attempt as QuizAttempt;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'LearningService.submitQuizAttempt');
    }
  }

  /**
   * Get quiz attempts for user
   */
  async getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]> {
    this.logRequest('getQuizAttempts', 'LearningService', { userId, quizId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'LearningService.getQuizAttempts',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      let query = this.supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (quizId) {
        query = query.eq('quiz_id', quizId);
      }

      const { data: attempts, error } = await query;

      if (error) {
        this.handleError(error, 'LearningService.getQuizAttempts');
      }

      this.logResponse('LearningService.getQuizAttempts', { count: attempts?.length || 0 });
      return (attempts || []) as QuizAttempt[];
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.getQuizAttempts');
    }
  }

  // ========================================
  // USER STATS
  // ========================================

  /**
   * Get user learning statistics
   */
  async getUserLearningStats(userId: string): Promise<UserLearningStats> {
    this.logRequest('getUserLearningStats', 'LearningService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'LearningService.getUserLearningStats',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      // Get completed videos
      const { data: completedVideos, error: videosError } = await this.supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true);

      if (videosError) {
        this.handleError(videosError, 'LearningService.getUserLearningStats');
      }

      // Get passed quizzes
      const { data: passedQuizzes, error: quizzesError } = await this.supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('passed', true);

      if (quizzesError) {
        this.handleError(quizzesError, 'LearningService.getUserLearningStats');
      }

      // Get total videos
      const { data: allVideos, error: allVideosError } = await this.supabase
        .from('video_content')
        .select('id');

      if (allVideosError) {
        this.handleError(allVideosError, 'LearningService.getUserLearningStats');
      }

      const totalVideosWatched = completedVideos?.length || 0;
      const totalQuizzesCompleted = passedQuizzes?.length || 0;
      const totalVideos = allVideos?.length || 1;

      const stats: UserLearningStats = {
        total_videos_watched: totalVideosWatched,
        total_quizzes_completed: totalQuizzesCompleted,
        total_xp_earned: 0, // TODO: Calculate from rewards
        total_coins_earned: 0, // TODO: Calculate from rewards
        completion_rate: (totalVideosWatched / totalVideos) * 100,
      };

      this.logResponse('LearningService.getUserLearningStats', stats);
      return stats;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.getUserLearningStats');
    }
  }

  // ========================================
  // TEST MANAGEMENT (v4.13.1)
  // ========================================

  /**
   * Get all tests with optional filters
   */
  async getAllTests(filters?: { organization_id?: string; is_template?: boolean }): Promise<any[]> {
    this.logRequest('getAllTests', 'LearningService', { filters });

    try {
      let query = this.supabase
        .from('tests')
        .select('*')
        .eq('is_active', true);

      if (filters?.organization_id) {
        query = query.eq('organization_id', filters.organization_id);
      }

      if (filters?.is_template !== undefined) {
        query = query.eq('is_template', filters.is_template);
      }

      const { data: tests, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [getAllTests] Supabase error:', error);
        this.handleError(error, 'LearningService.getAllTests');
        throw error;
      }

      console.log('✅ [getAllTests] Success:', { count: tests?.length || 0 });
      this.logResponse('LearningService.getAllTests', { count: tests?.length || 0 });
      return tests || [];
    } catch (error: any) {
      console.error('❌ [getAllTests] Exception:', error);
      this.handleError(error, 'LearningService.getAllTests');
      throw error;
    }
  }

  /**
   * Get single test by ID
   */
  async getTest(testId: string): Promise<any> {
    this.logRequest('getTest', 'LearningService', { testId });

    if (!testId) {
      throw new ValidationError(
        'Test ID ist erforderlich',
        'LearningService.getTest',
        { testId: 'Test ID ist erforderlich' }
      );
    }

    try {
      const { data: test, error } = await this.supabase
        .from('tests')
        .select('*, test_blocks(*)')
        .eq('id', testId)
        .single();

      if (error) {
        this.handleError(error, 'LearningService.getTest');
      }

      if (!test) {
        throw new NotFoundError('Test nicht gefunden', 'LearningService.getTest', testId);
      }

      this.logResponse('LearningService.getTest', { id: test.id });
      return test;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, 'LearningService.getTest');
    }
  }

  /**
   * Create new test
   */
  async createTest(data: {
    title: string;
    description?: string;
    pass_percentage?: number;
    reward_coins?: number;
    max_attempts?: number;
    time_limit_minutes?: number;
    is_template?: boolean;
    template_category?: string;
    organization_id?: string;
  }): Promise<any> {
    this.logRequest('createTest', 'LearningService', data);

    // Validation
    if (!data.title?.trim()) {
      throw new ValidationError(
        'Titel ist erforderlich',
        'LearningService.createTest',
        { title: 'Titel ist erforderlich' }
      );
    }

    try {
      const { data: test, error } = await this.supabase
        .from('tests')
        .insert({
          title: data.title,
          description: data.description || null,
          pass_percentage: data.pass_percentage || 80,
          reward_coins: data.reward_coins || 0,
          max_attempts: data.max_attempts || 3,
          time_limit_minutes: data.time_limit_minutes || null,
          is_template: data.is_template || false,
          template_category: data.template_category || null,
          organization_id: data.organization_id || null,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.createTest');
      }

      if (!test) {
        throw new ApiError(
          'Test konnte nicht erstellt werden',
          'CREATION_FAILED',
          'LearningService.createTest'
        );
      }

      this.logResponse('LearningService.createTest', { id: test.id });
      return test;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'LearningService.createTest');
    }
  }

  /**
   * Update test
   */
  async updateTest(testId: string, updates: {
    title?: string;
    description?: string;
    pass_percentage?: number;
    reward_coins?: number;
    max_attempts?: number;
    time_limit_minutes?: number;
    is_template?: boolean;
    template_category?: string;
    blocks?: any;
    xp_reward?: number;
    passing_score?: number;
    coin_reward?: number;
    published?: boolean;
  }): Promise<any> {
    this.logRequest('updateTest', 'LearningService', { testId, updates });

    if (!testId) {
      throw new ValidationError(
        'Test ID ist erforderlich',
        'LearningService.updateTest',
        { testId: 'Test ID ist erforderlich' }
      );
    }

    try {
      const { data: test, error } = await this.supabase
        .from('tests')
        .update(updates)
        .eq('id', testId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.updateTest');
      }

      if (!test) {
        throw new NotFoundError('Test nicht gefunden', 'LearningService.updateTest', testId);
      }

      this.logResponse('LearningService.updateTest', { id: test.id });
      return test;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, 'LearningService.updateTest');
    }
  }

  /**
   * Delete test (soft delete)
   */
  async deleteTest(testId: string): Promise<void> {
    this.logRequest('deleteTest', 'LearningService', { testId });

    if (!testId) {
      throw new ValidationError(
        'Test ID ist erforderlich',
        'LearningService.deleteTest',
        { testId: 'Test ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('tests')
        .update({ is_active: false })
        .eq('id', testId);

      if (error) {
        this.handleError(error, 'LearningService.deleteTest');
      }

      this.logResponse('LearningService.deleteTest', { testId });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.deleteTest');
    }
  }

  /**
   * Get test blocks for a test
   */
  async getTestBlocks(testId: string): Promise<any[]> {
    this.logRequest('getTestBlocks', 'LearningService', { testId });

    if (!testId) {
      throw new ValidationError(
        'Test ID ist erforderlich',
        'LearningService.getTestBlocks',
        { testId: 'Test ID ist erforderlich' }
      );
    }

    try {
      const { data: blocks, error } = await this.supabase
        .from('test_blocks')
        .select('*')
        .eq('test_id', testId)
        .order('position', { ascending: true });

      if (error) {
        this.handleError(error, 'LearningService.getTestBlocks');
      }

      this.logResponse('LearningService.getTestBlocks', { count: blocks?.length || 0 });
      return blocks || [];
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.getTestBlocks');
    }
  }

  /**
   * Create test block
   */
  async createTestBlock(data: {
    test_id: string;
    type: string;
    title: string;
    description?: string;
    content: any;
    points?: number;
    is_required?: boolean;
    time_limit_seconds?: number;
    position?: number;
  }): Promise<any> {
    this.logRequest('createTestBlock', 'LearningService', data);

    // Validation
    const errors: Record<string, string> = {};
    if (!data.test_id) errors.test_id = 'Test ID ist erforderlich';
    if (!data.type) errors.type = 'Block-Typ ist erforderlich';
    if (!data.title?.trim()) errors.title = 'Titel ist erforderlich';

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'LearningService.createTestBlock',
        errors
      );
    }

    try {
      const { data: block, error } = await this.supabase
        .from('test_blocks')
        .insert({
          test_id: data.test_id,
          type: data.type,
          title: data.title,
          description: data.description || null,
          content: data.content,
          points: data.points || 10,
          is_required: data.is_required !== undefined ? data.is_required : true,
          time_limit_seconds: data.time_limit_seconds || null,
          position: data.position || 0,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.createTestBlock');
      }

      if (!block) {
        throw new ApiError(
          'Test-Block konnte nicht erstellt werden',
          'CREATION_FAILED',
          'LearningService.createTestBlock'
        );
      }

      this.logResponse('LearningService.createTestBlock', { id: block.id });
      return block;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'LearningService.createTestBlock');
    }
  }

  /**
   * Update test block
   */
  async updateTestBlock(blockId: string, updates: {
    title?: string;
    description?: string;
    content?: any;
    points?: number;
    is_required?: boolean;
    time_limit_seconds?: number;
    position?: number;
  }): Promise<any> {
    this.logRequest('updateTestBlock', 'LearningService', { blockId, updates });

    if (!blockId) {
      throw new ValidationError(
        'Block ID ist erforderlich',
        'LearningService.updateTestBlock',
        { blockId: 'Block ID ist erforderlich' }
      );
    }

    try {
      const { data: block, error } = await this.supabase
        .from('test_blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.updateTestBlock');
      }

      if (!block) {
        throw new NotFoundError('Test-Block nicht gefunden', 'LearningService.updateTestBlock', blockId);
      }

      this.logResponse('LearningService.updateTestBlock', { id: block.id });
      return block;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, 'LearningService.updateTestBlock');
    }
  }

  /**
   * Delete test block
   */
  async deleteTestBlock(blockId: string): Promise<void> {
    this.logRequest('deleteTestBlock', 'LearningService', { blockId });

    if (!blockId) {
      throw new ValidationError(
        'Block ID ist erforderlich',
        'LearningService.deleteTestBlock',
        { blockId: 'Block ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('test_blocks')
        .delete()
        .eq('id', blockId);

      if (error) {
        this.handleError(error, 'LearningService.deleteTestBlock');
      }

      this.logResponse('LearningService.deleteTestBlock', { blockId });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.deleteTestBlock');
    }
  }

  /**
   * Assign test to video
   */
  async assignTestToVideo(testId: string, videoId: string): Promise<any> {
    this.logRequest('assignTestToVideo', 'LearningService', { testId, videoId });

    // Validation
    const errors: Record<string, string> = {};
    if (!testId) errors.testId = 'Test ID ist erforderlich';
    if (!videoId) errors.videoId = 'Video ID ist erforderlich';

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'LearningService.assignTestToVideo',
        errors
      );
    }

    try {
      // Check if video already has a test assigned to an EXISTING test (ignore orphaned assignments)
      const { data: existing, error: checkError } = await this.supabase
        .from('test_video_assignments')
        .select('*, tests!inner(id)')
        .eq('video_id', videoId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not an error)
        this.handleError(checkError, 'LearningService.assignTestToVideo');
      }

      if (existing) {
        throw new ApiError(
          'Video hat bereits einen Test zugewiesen',
          'ALREADY_ASSIGNED',
          'LearningService.assignTestToVideo'
        );
      }

      // ✅ CLEANUP: Remove any orphaned assignments for this video before creating new one
      const { error: cleanupError } = await this.supabase
        .from('test_video_assignments')
        .delete()
        .eq('video_id', videoId)
        .not('test_id', 'in', `(SELECT id FROM tests)`);
      
      if (cleanupError) {
        console.warn('⚠️ Could not cleanup orphaned assignments:', cleanupError);
        // Continue anyway - this is just a cleanup operation
      }

      const { data: assignment, error } = await this.supabase
        .from('test_video_assignments')
        .insert({
          test_id: testId,
          video_id: videoId,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'LearningService.assignTestToVideo');
      }

      if (!assignment) {
        throw new ApiError(
          'Zuweisung konnte nicht erstellt werden',
          'CREATION_FAILED',
          'LearningService.assignTestToVideo'
        );
      }

      this.logResponse('LearningService.assignTestToVideo', { id: assignment.id });
      return assignment;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'LearningService.assignTestToVideo');
    }
  }

  /**
   * Link test to video (alias for assignTestToVideo)
   * Used by CreateTestDialog
   */
  async linkTestToVideo(testId: string, videoId: string): Promise<any> {
    return this.assignTestToVideo(testId, videoId);
  }

  /**
   * Remove test assignment from video
   */
  async removeTestFromVideo(videoId: string): Promise<void> {
    this.logRequest('removeTestFromVideo', 'LearningService', { videoId });

    if (!videoId) {
      throw new ValidationError(
        'Video ID ist erforderlich',
        'LearningService.removeTestFromVideo',
        { videoId: 'Video ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('test_video_assignments')
        .delete()
        .eq('video_id', videoId);

      if (error) {
        this.handleError(error, 'LearningService.removeTestFromVideo');
      }

      this.logResponse('LearningService.removeTestFromVideo', { videoId });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'LearningService.removeTestFromVideo');
    }
  }
}