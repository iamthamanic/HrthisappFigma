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
          query = query.eq('organization_id', filters.organization_id);
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
    progress: number,
    completed: boolean = false
  ): Promise<LearningProgress> {
    this.logRequest('updateVideoProgress', 'LearningService', {
      userId,
      videoId,
      progress,
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
          progress,
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
}
