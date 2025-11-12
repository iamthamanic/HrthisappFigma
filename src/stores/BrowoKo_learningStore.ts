/**
 * LEARNING STORE
 * ==============
 * Global learning state management
 * 
 * REFACTORED: Now uses LearningService
 * - Removed direct Supabase calls
 * - Uses service layer for all learning operations
 * - Better error handling with custom errors
 * - Type-safe with Zod validation
 */

import { create } from 'zustand';
import { VideoContent, LearningProgress, QuizContent } from '../types/database';
import { supabase } from '../utils/supabase/client';
import { getServices } from '../services';
import { NotFoundError, ValidationError, ApiError } from '../services/base/ApiError';

interface QuizProgress {
  quiz_id: string;
  completed: boolean;
  best_score: number;
  attempts: number;
  last_attempt_at?: string;
}

interface LearningState {
  videos: VideoContent[];
  quizzes: QuizContent[];
  tests: any[]; // Tests from learning_tests table
  progress: LearningProgress[];
  videoProgress: Record<string, number>; // videoId -> progress percentage
  quizProgress: Record<string, QuizProgress>; // quizId -> progress
  loading: boolean;
  
  // Actions
  loadVideos: () => Promise<void>;
  loadQuizzes: () => Promise<void>;
  loadTests: () => Promise<void>;
  loadProgress: (userId: string) => Promise<void>;
  updateProgress: (userId: string, videoId: string, watchedSeconds: number) => Promise<void>;
  updateVideoProgress: (userId: string, videoId: string, progressPercent: number) => Promise<void>;
  markComplete: (userId: string, videoId: string) => Promise<void>;
  completeVideo: (userId: string, videoId: string) => Promise<void>;
  completeQuiz: (userId: string, quizId: string, score: number, passed: boolean) => Promise<void>;
  getVideoProgress: (videoId: string) => LearningProgress | undefined;
  
  // Admin Actions
  createVideo: (video: Omit<VideoContent, 'id' | 'created_at'>) => Promise<void>;
  updateVideo: (videoId: string, updates: Partial<VideoContent>) => Promise<void>;
  deleteVideo: (videoId: string) => Promise<void>;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  videos: [],
  quizzes: [],
  tests: [],
  progress: [],
  videoProgress: {},
  quizProgress: {},
  loading: false,

  loadVideos: async () => {
    set({ loading: true });
    try {
      // Use LearningService to load videos
      const services = getServices();
      
      // Get user's organization_id from auth
      const { data: { user } } = await supabase.auth.getUser();
      let organizationId: string | undefined;
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        organizationId = profile?.organization_id;
      }

      console.log('🔍 [LearningStore] Loading videos for org:', organizationId);
      const videos = organizationId 
        ? await services.learning.getAllVideos({ organization_id: organizationId })
        : await services.learning.getAllVideos(); // Fallback without filter

      console.log('✅ [LearningStore] Videos loaded:', videos.length, videos);
      set({ videos });
    } catch (error) {
      console.error('❌ [LearningStore] Load videos error:', error);
      set({ videos: [] });
    } finally {
      set({ loading: false });
    }
  },

  loadQuizzes: async () => {
    set({ loading: true });
    try {
      // Use LearningService to load quizzes
      const services = getServices();
      const quizzes = await services.learning.getAllQuizzes();

      set({ quizzes });
    } catch (error) {
      console.error('Load quizzes error:', error);
      set({ quizzes: [] });
    } finally {
      set({ loading: false });
    }
  },

  loadTests: async () => {
    set({ loading: true });
    try {
      // Use LearningService to load tests
      const services = getServices();
      const tests = await services.learning.getAllTests();

      set({ tests });
    } catch (error) {
      console.error('Load tests error:', error);
      set({ tests: [] });
    } finally {
      set({ loading: false });
    }
  },

  loadProgress: async (userId) => {
    set({ loading: true });
    try {
      // Use LearningService to load progress
      const services = getServices();
      const progress = await services.learning.getUserProgress(userId);

      set({ progress });
    } catch (error) {
      console.error('Load progress error:', error);
      set({ progress: [] });
    } finally {
      set({ loading: false });
    }
  },

  updateProgress: async (userId, videoId, watchedSeconds) => {
    try {
      // Use LearningService to update progress
      const services = getServices();
      const updatedProgress = await services.learning.updateVideoProgress(userId, videoId, watchedSeconds);

      // Update local state
      const { progress } = get();
      const index = progress.findIndex(p => p.video_id === videoId);
      if (index >= 0) {
        progress[index] = updatedProgress;
        set({ progress: [...progress] });
      } else {
        set({ progress: [...progress, updatedProgress] });
      }
    } catch (error) {
      console.error('Update progress error:', error);
      
      if (error instanceof ValidationError) {
        throw new Error('Ungültige Fortschrittsdaten');
      }
    }
  },

  markComplete: async (userId, videoId) => {
    try {
      // Use LearningService to mark video as complete
      const services = getServices();
      const updatedProgress = await services.learning.completeVideo(userId, videoId);

      // Award XP for completion (direct Supabase RPC - no service yet)
      await supabase.rpc('add_user_xp', {
        p_user_id: userId,
        p_xp_amount: 50,
        p_description: `Video abgeschlossen: ${videoId}`,
        p_source: 'video_completion'
      });

      // Update local state
      const { progress } = get();
      const index = progress.findIndex(p => p.video_id === videoId);
      if (index >= 0) {
        progress[index] = updatedProgress;
        set({ progress: [...progress] });
      } else {
        set({ progress: [...progress, updatedProgress] });
      }
    } catch (error) {
      console.error('Mark complete error:', error);
      
      if (error instanceof NotFoundError) {
        throw new Error('Video nicht gefunden');
      }
    }
  },

  updateVideoProgress: async (userId, videoId, progressPercent) => {
    // Update local state immediately
    set((state) => ({
      videoProgress: {
        ...state.videoProgress,
        [videoId]: progressPercent
      }
    }));

    // Optionally save to DB every 10% progress
    if (progressPercent % 10 === 0 || progressPercent >= 95) {
      try {
        const watchedSeconds = Math.floor((progressPercent / 100) * 60); // Rough estimate
        
        // Use LearningService
        const services = getServices();
        await services.learning.updateVideoProgress(userId, videoId, watchedSeconds);
      } catch (error) {
        console.error('Save progress error:', error);
      }
    }
  },

  completeVideo: async (userId, videoId) => {
    try {
      // Use LearningService to mark video as complete
      const services = getServices();
      await services.learning.completeVideo(userId, videoId);

      // Update local state
      set((state) => ({
        videoProgress: {
          ...state.videoProgress,
          [videoId]: 100
        }
      }));
    } catch (error) {
      console.error('Complete video error:', error);
      
      if (error instanceof NotFoundError) {
        throw new Error('Video nicht gefunden');
      }
      
      throw error;
    }
  },

  completeQuiz: async (userId, quizId, score, passed) => {
    try {
      // Get current progress
      const currentProgress = get().quizProgress[quizId];
      const newAttempts = (currentProgress?.attempts || 0) + 1;
      const newBestScore = Math.max(score, currentProgress?.best_score || 0);

      // Use LearningService to submit quiz attempt
      const services = getServices();
      await services.learning.submitQuizAttempt(userId, quizId, score, passed);

      // Update local state
      set((state) => ({
        quizProgress: {
          ...state.quizProgress,
          [quizId]: {
            quiz_id: quizId,
            completed: passed || currentProgress?.completed || false,
            best_score: newBestScore,
            attempts: newAttempts,
            last_attempt_at: new Date().toISOString(),
          }
        }
      }));
    } catch (error) {
      console.error('Complete quiz error:', error);
      
      if (error instanceof NotFoundError) {
        throw new Error('Quiz nicht gefunden');
      } else if (error instanceof ValidationError) {
        throw new Error('Ungültige Quiz-Daten');
      }
      
      throw error;
    }
  },

  getVideoProgress: (videoId) => {
    const { progress } = get();
    return progress.find(p => p.video_id === videoId);
  },

  // Admin Actions
  createVideo: async (video) => {
    set({ loading: true });
    try {
      // Use LearningService to create video
      const services = getServices();
      const newVideo = await services.learning.createVideo({
        title: video.title,
        youtube_url: video.youtube_url,
        description: video.description,
        duration_minutes: video.duration_minutes,
        thumbnail_url: video.thumbnail_url,
        category: video.category,
        xp_reward: video.xp_reward,
        coin_reward: video.coin_reward,
        organization_id: video.organization_id, // ✅ FIXED: Pass organization_id!
      });

      // Add to local state
      set((state) => ({
        videos: [...state.videos, newVideo],
      }));
    } catch (error) {
      console.error('Create video error:', error);
      
      if (error instanceof ValidationError) {
        throw new Error('Ungültige Video-Daten');
      }
      
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateVideo: async (videoId, updates) => {
    set({ loading: true });
    try {
      // Use LearningService to update video
      const services = getServices();
      const updatedVideo = await services.learning.updateVideo(videoId, updates);

      // Update local state
      set((state) => ({
        videos: state.videos.map((v) => (v.id === videoId ? updatedVideo : v)),
      }));
    } catch (error) {
      console.error('Update video error:', error);
      
      if (error instanceof NotFoundError) {
        throw new Error('Video nicht gefunden');
      } else if (error instanceof ValidationError) {
        throw new Error('Ungültige Video-Daten');
      }
      
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteVideo: async (videoId) => {
    set({ loading: true });
    try {
      // Use LearningService to delete video
      const services = getServices();
      await services.learning.deleteVideo(videoId);

      // Remove from local state
      set((state) => ({
        videos: state.videos.filter((v) => v.id !== videoId),
      }));
    } catch (error) {
      console.error('Delete video error:', error);
      
      if (error instanceof NotFoundError) {
        throw new Error('Video nicht gefunden');
      }
      
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
