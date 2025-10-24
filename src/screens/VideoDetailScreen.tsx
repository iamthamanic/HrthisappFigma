import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Coins, Clock, CheckCircle, Play } from '../components/icons/HRTHISIcons';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { useLearningStore } from '../stores/HRTHIS_learningStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import VideoPlayer from '../components/VideoPlayer';
import YouTubeVideoPlayer from '../components/YouTubeVideoPlayer';
import { getVideoDurationMinutes, getVideoXPReward, getVideoCoinReward } from '../utils/HRTHIS_videoHelper';

export default function VideoDetailScreen() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { videos, videoProgress, updateVideoProgress, completeVideo, updateProgress, getVideoProgress } = useLearningStore();
  const { addCoins } = useGamificationStore();

  const [hasRewarded, setHasRewarded] = useState(false);

  // Find video
  const video = videos.find(v => v.id === videoId);
  const progressData = videoId ? getVideoProgress(videoId) : undefined;
  const progress = videoProgress[videoId || ''] || 0;
  const isCompleted = progressData?.completed || false;
  const initialWatchedSeconds = progressData?.watched_seconds || 0;

  // Calculate rewards from video (if video exists)
  const xpReward = video ? getVideoXPReward(video) : 0;
  const coinReward = video ? getVideoCoinReward(video) : 0;
  const durationMinutes = video ? getVideoDurationMinutes(video) : 0;

  useEffect(() => {
    if (!video) {
      navigate('/learning');
    }
  }, [video, navigate]);

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Video nicht gefunden</p>
      </div>
    );
  }

  // Handle video completion
  const handleComplete = async () => {
    if (!user?.id || !videoId || hasRewarded) return;

    try {
      // Mark video as complete
      await completeVideo(user.id, videoId);

      // Award XP and Coins
      if (coinReward > 0) {
        await addCoins(user.id, coinReward, `Video abgeschlossen: ${video.title}`);
      }

      // Check for achievements
      const { checkAndUnlockAchievements } = useGamificationStore.getState();
      await checkAndUnlockAchievements(user.id);

      setHasRewarded(true);

      // Show success message
      setTimeout(() => {
        alert(`🎉 Glückwunsch! Du hast ${coinReward} Coins verdient!`);
      }, 500);
    } catch (error) {
      console.error('Error completing video:', error);
    }
  };

  // Handle progress update (for YouTube player - receives watched seconds)
  const handleProgressUpdate = (watchedSeconds: number) => {
    if (user?.id && videoId) {
      updateProgress(user.id, videoId, watchedSeconds);
    }
  };

  // Handle progress update (for old player - receives percent)
  const handleProgress = (progressPercent: number) => {
    if (user?.id && videoId) {
      updateVideoProgress(user.id, videoId, progressPercent);
    }
  };

  // Check if video is YouTube URL
  const isYouTubeVideo = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MANDATORY': return 'bg-red-100 text-red-700';
      case 'COMPLIANCE': return 'bg-yellow-100 text-yellow-700';
      case 'SKILLS': return 'bg-blue-100 text-blue-700';
      case 'ONBOARDING': return 'bg-green-100 text-green-700';
      case 'BONUS': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/learning')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Übersicht
        </Button>
        {isCompleted && (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-4 h-4 mr-1" />
            Abgeschlossen
          </Badge>
        )}
      </div>

      {/* Video Player - YouTube or Regular */}
      {isYouTubeVideo(video.video_url) ? (
        <YouTubeVideoPlayer
          videoUrl={video.video_url}
          title={video.title}
          duration={durationMinutes}
          userId={user?.id || ''}
          videoId={videoId || ''}
          xpReward={xpReward}
          coinReward={coinReward}
          initialProgress={initialWatchedSeconds}
          onComplete={handleComplete}
          onProgress={handleProgressUpdate}
        />
      ) : (
        <VideoPlayer
          videoUrl={video.video_url}
          title={video.title}
          duration={durationMinutes}
          onComplete={handleComplete}
          onProgress={handleProgress}
          initialProgress={progress}
        />
      )}

      {/* Video Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>{video.title}</CardTitle>
              <Badge className={getCategoryColor(video.category)}>
                {video.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{video.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{durationMinutes} Minuten</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600">{xpReward} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-gray-600">{coinReward} Coins</span>
              </div>
            </div>

            {/* Learning Objectives */}
            {video.learning_objectives && video.learning_objectives.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Lernziele</h4>
                <ul className="space-y-2">
                  {video.learning_objectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rewards Card */}
        <Card>
          <CardHeader>
            <CardTitle>Belohnungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isCompleted ? (
              <>
                <p className="text-sm text-gray-600">
                  Schließe dieses Video ab, um Belohnungen zu erhalten:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">XP</span>
                    </div>
                    <span className="text-lg font-semibold text-purple-600">
                      +{xpReward}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-900">Coins</span>
                    </div>
                    <span className="text-lg font-semibold text-yellow-600">
                      +{coinReward}
                    </span>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    💡 Schaue das Video bis zum Ende (95%) um die Belohnungen zu erhalten
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-medium text-gray-900 mb-1">Video abgeschlossen!</p>
                <p className="text-sm text-gray-600">Du hast alle Belohnungen erhalten</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Related Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Ähnliche Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {videos
              .filter(v => v.category === video.category && v.id !== video.id)
              .slice(0, 3)
              .map(relatedVideo => (
                <button
                  key={relatedVideo.id}
                  onClick={() => navigate(`/learning/video/${relatedVideo.id}`)}
                  className="text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {relatedVideo.title}
                  </h4>
                  <p className="text-xs text-gray-500">{getVideoDurationMinutes(relatedVideo)} Min</p>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}