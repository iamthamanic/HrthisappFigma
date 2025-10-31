/**
 * @file BrowoKo_videoHelper.ts
 * @domain BrowoKo - Video Helper Functions
 * @description Computed properties for video content (XP, coins, duration)
 * @created Phase 3E - Utils Migration
 */

import { VideoContent } from '../types/database';

/**
 * Get video duration in minutes
 */
export function getVideoDurationMinutes(video: VideoContent): number {
  if (!video.duration_seconds) return 0;
  return Math.round(video.duration_seconds / 60);
}

/**
 * Calculate XP reward based on video duration
 * Formula: 10 XP per minute (rounded)
 */
export function getVideoXPReward(video: VideoContent): number {
  const minutes = getVideoDurationMinutes(video);
  return minutes * 10;
}

/**
 * Calculate Coin reward based on video duration  
 * Formula: 2 Coins per minute (rounded)
 */
export function getVideoCoinReward(video: VideoContent): number {
  const minutes = getVideoDurationMinutes(video);
  return minutes * 2;
}

/**
 * Format video duration as human-readable string
 * e.g., "5 Min" or "1:30 Std"
 */
export function formatVideoDuration(durationSeconds: number): string {
  if (durationSeconds < 60) {
    return `${durationSeconds} Sek`;
  }
  
  const minutes = Math.floor(durationSeconds / 60);
  
  if (minutes < 60) {
    return `${minutes} Min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} Std`;
  }
  
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')} Std`;
}
