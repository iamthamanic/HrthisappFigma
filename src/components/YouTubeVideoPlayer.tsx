import { useState, useEffect, useRef } from 'react';
import { Check, Play, RotateCcw, Clock } from './icons/BrowoKoIcons';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeVideoPlayerProps {
  videoUrl: string;
  title: string;
  duration: number; // in minutes
  userId: string;
  videoId: string;
  xpReward?: number;
  coinReward?: number;
  initialProgress?: number; // watched seconds
  onComplete?: () => void;
  onProgress?: (watchedSeconds: number) => void;
}

export default function YouTubeVideoPlayer({
  videoUrl,
  title,
  duration,
  userId,
  videoId,
  xpReward = 50,
  coinReward = 10,
  initialProgress = 0,
  onComplete,
  onProgress,
}: YouTubeVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration * 60); // Convert to seconds
  const [progress, setProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(initialProgress);

  // Extract YouTube Video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const youtubeVideoId = extractYouTubeId(videoUrl);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!youtubeVideoId) {
      toast.error('Ungültige YouTube URL');
      return;
    }

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Load API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set callback
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [youtubeVideoId]);

  const initializePlayer = () => {
    if (!containerRef.current || !youtubeVideoId) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        start: Math.floor(initialProgress), // Resume from last position
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handlePlayerStateChange,
      },
    });
  };

  const handlePlayerReady = (event: any) => {
    setIsReady(true);
    const duration = event.target.getDuration();
    setTotalDuration(duration);
    console.log('🎬 YouTube Player ready, duration:', duration);
  };

  const handlePlayerStateChange = (event: any) => {
    const state = event.data;
    
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (state === 1) {
      // Playing
      setIsPlaying(true);
      startProgressTracking();
    } else if (state === 2) {
      // Paused
      setIsPlaying(false);
      stopProgressTracking();
      saveProgress();
    } else if (state === 0) {
      // Ended
      setIsPlaying(false);
      stopProgressTracking();
      handleVideoEnd();
    }
  };

  // Start tracking progress every 5 seconds
  const startProgressTracking = () => {
    if (progressIntervalRef.current) return;

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        setCurrentTime(current);
        
        // Update watched seconds (only increases, never decreases)
        setWatchedSeconds((prev) => Math.max(prev, current));
        
        // Calculate progress
        const progressPercentage = (current / totalDuration) * 100;
        setProgress(progressPercentage);

        // Auto-save progress every 5 seconds
        if (current > 0) {
          onProgress?.(Math.floor(current));
        }

        // Check for completion (95% watched)
        if (progressPercentage >= 95 && !hasCompleted) {
          handleVideoEnd();
        }
      }
    }, 5000); // Every 5 seconds
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const saveProgress = () => {
    if (playerRef.current && playerRef.current.getCurrentTime) {
      const current = playerRef.current.getCurrentTime();
      onProgress?.(Math.floor(current));
    }
  };

  const handleVideoEnd = () => {
    if (hasCompleted) return;

    setHasCompleted(true);
    stopProgressTracking();
    
    toast.success('🎉 Video abgeschlossen!', {
      description: `Du hast ${xpReward} XP und ${coinReward} Coins verdient!`,
    });

    onComplete?.();
  };

  const handleRestart = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
      setProgress(0);
      setCurrentTime(0);
      setHasCompleted(false);
    }
  };

  const handleResume = () => {
    if (playerRef.current && watchedSeconds > 0) {
      playerRef.current.seekTo(watchedSeconds);
      playerRef.current.playVideo();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!youtubeVideoId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">Ungültige YouTube URL</p>
      </Card>
    );
  }

  return (
    <Card>
      {/* YouTube Player Container */}
      <div className="relative bg-black rounded-t-lg overflow-hidden aspect-video">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Completion Badge */}
        {hasCompleted && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg z-10">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Abgeschlossen!</span>
          </div>
        )}
      </div>

      {/* Video Info & Controls */}
      <div className="p-4 bg-white border-t border-gray-200 space-y-4">
        {/* Title */}
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">Dauer: {duration} Min</p>
        </div>

        {/* Resume Button (if video was partially watched) */}
        {watchedSeconds > 30 && !hasCompleted && (
          <Button
            variant="outline"
            onClick={handleResume}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Dort weiterschauen, wo du aufgehört hast ({formatTime(watchedSeconds)})
          </Button>
        )}

        {/* Restart Button */}
        <Button
          variant="outline"
          onClick={handleRestart}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Von vorne beginnen
        </Button>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Fortschritt</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Watch Time Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Geschaute Zeit:</span>
          </div>
          <span className="font-medium">{formatTime(watchedSeconds)} / {formatTime(totalDuration)}</span>
        </div>

        {/* Completion Status */}
        {hasCompleted && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <Check className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">Video abgeschlossen!</p>
              <p className="text-sm">+{xpReward} XP, +{coinReward} Coins</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
