import { Card, CardContent } from './ui/card';
import { PlayCircle, BookOpen, Award, TrendingUp } from './icons/BrowoKoIcons';

interface LearningStatsGridProps {
  videosCount: number;
  quizzesCount: number;
  xp: number;
  completedVideosCount: number;
}

export function LearningStatsGrid({ 
  videosCount, 
  quizzesCount, 
  xp, 
  completedVideosCount 
}: LearningStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Videos</p>
              <p className="text-xl font-semibold text-gray-900">{videosCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Quizzes</p>
              <p className="text-xl font-semibold text-gray-900">{quizzesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">XP</p>
              <p className="text-xl font-semibold text-gray-900">{xp || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Abgeschlossen</p>
              <p className="text-xl font-semibold text-gray-900">{completedVideosCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
