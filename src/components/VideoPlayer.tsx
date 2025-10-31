import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Check } from './icons/BrowoKoIcons';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  duration: number; // in minutes
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  initialProgress?: number;
}

export default function VideoPlayer({
  videoUrl,
  title,
  duration,
  onComplete,
  onProgress,
  initialProgress = 0
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [progress, setProgress] = useState(initialProgress);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Update progress
  useEffect(() => {
    if (totalDuration > 0) {
      const progressPercentage = (currentTime / totalDuration) * 100;
      setProgress(progressPercentage);
      onProgress?.(progressPercentage);

      // Mark as complete when 95% watched
      if (progressPercentage >= 95 && !hasCompleted) {
        setHasCompleted(true);
        onComplete?.();
      }
    }
  }, [currentTime, totalDuration, hasCompleted, onComplete, onProgress]);

  // Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Mute/Unmute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = (parseFloat(e.target.value) / 100) * totalDuration;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Restart
  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
    setHasCompleted(false);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setTotalDuration(videoRef.current.duration);
      // Restore progress if provided
      if (initialProgress > 0) {
        const seekTime = (initialProgress / 100) * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (!hasCompleted) {
      setHasCompleted(true);
      onComplete?.();
    }
  };

  return (
    <Card>
      <div className="relative bg-black rounded-lg overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Completion Badge */}
        {hasCompleted && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Abgeschlossen!</span>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>

              {/* Restart */}
              <button
                onClick={handleRestart}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={toggleMute}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Time Display */}
              <span className="text-white text-sm font-medium ml-2">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Click to play/pause */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={togglePlay}
        />
      </div>

      {/* Video Info */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">Dauer: {duration} Min</p>
          </div>
          {hasCompleted && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Video abgeschlossen</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Fortschritt</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </Card>
  );
}