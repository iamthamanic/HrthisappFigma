/**
 * @file BrowoKo_useLearningScreen.ts
 * @domain BrowoKo - Learning Screen
 * @description Custom hook for learning screen data and progress
 * @created Phase 3D - Hooks Migration
 */

import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useLearningStore } from '../stores/BrowoKo_learningStore';
import { useGamificationStore } from '../stores/gamificationStore';

/**
 * Custom Hook for LearningScreen
 * Manages data loading, filtering, and progress calculations
 */
export function useLearningScreen() {
  const { user, profile } = useAuthStore();
  const { 
    videos, 
    quizzes,
    tests,
    loadVideos, 
    loadQuizzes,
    loadTests,
    loading, 
    loadProgress, 
    getVideoProgress 
  } = useLearningStore();
  const { coins, xp } = useGamificationStore();

  // Load data on mount
  useEffect(() => {
    loadVideos();
    loadQuizzes();
    loadTests();
    if (user?.id) {
      loadProgress(user.id);
    }
  }, [user?.id, loadVideos, loadQuizzes, loadTests, loadProgress]);

  // Check if user is admin
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN';

  // Categorize quizzes
  const categorizedQuizzes = useMemo(() => ({
    mandatory: quizzes.filter(q => q.category === 'MANDATORY'),
    skills: quizzes.filter(q => q.category === 'SKILLS'),
    compliance: quizzes.filter(q => q.category === 'COMPLIANCE')
  }), [quizzes]);

  // Video progress helpers
  const getVideoProgressPercentage = (videoId: string): number => {
    const progressData = getVideoProgress(videoId);
    if (!progressData) return 0;
    
    const video = videos.find(v => v.id === videoId);
    if (!video || !video.duration_seconds) return 0;
    
    const percentage = (progressData.watched_seconds / video.duration_seconds) * 100;
    return Math.min(Math.round(percentage), 100);
  };

  const isVideoCompleted = (videoId: string): boolean => {
    const progressData = getVideoProgress(videoId);
    return progressData?.completed || false;
  };

  // Count completed videos
  const completedVideosCount = useMemo(() => 
    videos.filter(video => isVideoCompleted(video.id)).length,
    [videos, getVideoProgress]
  );

  return {
    // Data
    videos,
    quizzes,
    tests,
    categorizedQuizzes,
    coins,
    xp,
    
    // User info
    isAdmin,
    
    // Progress
    getVideoProgressPercentage,
    isVideoCompleted,
    completedVideosCount,
    
    // Loading
    loading
  };
}
