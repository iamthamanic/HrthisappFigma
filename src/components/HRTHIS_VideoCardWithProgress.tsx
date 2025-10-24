/**
 * @file HRTHIS_VideoCardWithProgress.tsx
 * @domain HR - Learning Management
 * @description Video card with progress indicator and YouTube thumbnail support
 * @namespace HRTHIS_
 * @performance Optimized with React.memo() and useMemo() hooks
 */

import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { PlayCircle, Clock, Award, CheckCircle2 } from './icons/HRTHISIcons';
import { useNavigate } from 'react-router-dom';
import { getYouTubeThumbnail, isYouTubeVideo } from '../utils/youtubeHelper';
import { getVideoDurationMinutes, getVideoXPReward } from '../utils/HRTHIS_videoHelper';

interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string;
  duration_seconds?: number;
}

interface VideoCardWithProgressProps {
  video: Video;
  progressPercentage: number;
  isCompleted: boolean;
  showThumbnail?: boolean;
}

export const VideoCardWithProgress = memo(function VideoCardWithProgress({ 
  video, 
  progressPercentage, 
  isCompleted,
  showThumbnail = true 
}: VideoCardWithProgressProps) {
  const navigate = useNavigate();
  
  // Memoize expensive calculations - prevents recalculation on every render
  const isYouTube = useMemo(() => isYouTubeVideo(video.video_url), [video.video_url]);
  const thumbnail = useMemo(() => 
    isYouTube ? getYouTubeThumbnail(video.video_url) : null, 
    [isYouTube, video.video_url]
  );
  const duration = useMemo(() => getVideoDurationMinutes(video), [video]);
  const xpReward = useMemo(() => getVideoXPReward(video), [video]);
  
  // Memoize click handler - prevents function recreation on every render
  const handleClick = useCallback(() => {
    navigate(`/learning/video/${video.id}`);
  }, [navigate, video.id]);

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* YouTube Thumbnail */}
      {showThumbnail && isYouTube && (
        <div className="relative aspect-video bg-gray-900">
          <img
            src={thumbnail || ''}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <PlayCircle className="w-8 h-8 text-white" fill="white" />
            </div>
          </div>
          
          {/* Completion Badge */}
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium shadow-lg">
              <CheckCircle2 className="w-3 h-3" />
              Abgeschlossen
            </div>
          )}
          
          {/* Progress Bar on Thumbnail */}
          {progressPercentage > 0 && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
              <div 
                className="h-full bg-red-600 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <Badge>{video.category}</Badge>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {!isYouTube && !isCompleted && (
              <PlayCircle className="w-5 h-5 text-blue-500" />
            )}
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {video.description}
        </p>
        
        {/* Progress Bar */}
        {progressPercentage > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Fortschritt</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {duration} Min
          </div>
          <div className="flex items-center gap-1 text-amber-600">
            <Award className="w-4 h-4" />
            {xpReward} XP
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
