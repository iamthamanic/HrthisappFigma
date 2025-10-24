import { PlayCircle, BookOpen, CheckCircle2, XCircle } from '../icons/HRTHISIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { getVideoDurationMinutes, getVideoXPReward } from '../../utils/HRTHIS_videoHelper';
import { getYouTubeThumbnail, isYouTubeVideo } from '../../utils/youtubeHelper';

/**
 * TEAM MEMBER LEARNING TAB COMPONENT
 * ===================================
 * Displays learning progress (videos & quizzes) for a team member
 * 
 * Features:
 * - Videos progress with thumbnails
 * - Progress bars and completion status
 * - Quiz attempts with scores
 * - Pass/Fail badges
 * 
 * Extracted from: TeamMemberDetailsScreen.tsx (Lines 258-374)
 */

export interface LearningProgress {
  id: string;
  video_id: string;
  watched_seconds: number;
  completed: boolean;
  completed_at?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
}

export interface Video {
  id: string;
  title: string;
  video_url: string;
  duration_seconds: number;
}

export interface Quiz {
  id: string;
  title: string;
}

export interface TeamMemberLearningTabProps {
  learningProgress: LearningProgress[];
  quizAttempts: QuizAttempt[];
  loadingProgress: boolean;
  videos: Video[];
  quizzes: Quiz[];
}

export function TeamMemberLearningTab({
  learningProgress,
  quizAttempts,
  loadingProgress,
  videos,
  quizzes,
}: TeamMemberLearningTabProps) {
  
  // Helper function to get video progress percentage
  const getVideoProgressPercentage = (videoId: string): number => {
    const progress = learningProgress.find(p => p.video_id === videoId);
    if (!progress) return 0;

    const video = videos.find(v => v.id === videoId);
    if (!video || !video.duration_seconds) return 0;

    const percentage = (progress.watched_seconds / video.duration_seconds) * 100;
    return Math.min(Math.round(percentage), 100);
  };

  // Helper function to check if video is completed
  const isVideoCompleted = (videoId: string): boolean => {
    const progress = learningProgress.find(p => p.video_id === videoId);
    return progress?.completed || false;
  };

  // Get best quiz score
  const getBestQuizScore = (quizId: string) => {
    const attempts = quizAttempts.filter(a => a.quiz_id === quizId);
    if (attempts.length === 0) return undefined;

    return attempts.reduce((best, current) =>
      current.score > best.score ? current : best
    , attempts[0]);
  };

  return (
    <div className="space-y-6">
      {/* Videos Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Schulungsvideos ({learningProgress.filter(p => p.completed).length}/{videos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProgress ? (
            <div className="text-center py-8 text-gray-400">Lädt...</div>
          ) : videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((video) => {
                const progress = learningProgress.find(p => p.video_id === video.id);
                const progressPercentage = getVideoProgressPercentage(video.id);
                const completed = isVideoCompleted(video.id);

                return (
                  <div key={video.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20 h-14 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {isYouTubeVideo(video.video_url) ? (
                        <img src={getYouTubeThumbnail(video.video_url)} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <PlayCircle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4>{video.title}</h4>
                        <Badge variant={completed ? 'default' : 'secondary'}>
                          {completed ? 'Abgeschlossen' : progress ? `${progressPercentage}%` : 'Nicht gestartet'}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{getVideoDurationMinutes(video)} Min</span>
                        <span>•</span>
                        <span>{getVideoXPReward(video)} XP</span>
                        {completed && progress?.completed_at && (
                          <>
                            <span>•</span>
                            <span>✓ {new Date(progress.completed_at).toLocaleDateString('de-DE')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Videos verfügbar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Tests ({quizAttempts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quizAttempts.length > 0 ? (
            <div className="space-y-3">
              {quizAttempts.map((attempt) => {
                const quiz = quizzes.find(q => q.id === attempt.quiz_id);
                if (!quiz) return null;

                return (
                  <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4>{quiz.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(attempt.completed_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-gray-900">{attempt.score}%</div>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                      <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                        {attempt.passed ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Bestanden</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Nicht bestanden</>
                        )}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Tests absolviert</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
