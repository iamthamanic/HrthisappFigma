import { memo, useMemo } from 'react';
import { Lock, Check } from './icons/BrowoKoIcons';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  xp_reward: number;
  coin_reward: number;
  requirement_type: string;
  requirement_value: number;
  category: 'LEARNING' | 'TIME' | 'SOCIAL' | 'SPECIAL';
}

export interface UserAchievement {
  achievement_id: string;
  earned_at: string;
  progress?: number;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  currentProgress?: number;
  onClick?: () => void;
}

const AchievementBadge = memo(function AchievementBadge({
  achievement,
  userAchievement,
  currentProgress = 0,
  onClick
}: AchievementBadgeProps) {
  const isUnlocked = !!userAchievement;
  
  // Memoize progress calculation
  const progress = useMemo(() => 
    Math.min(100, (currentProgress / achievement.requirement_value) * 100),
    [currentProgress, achievement.requirement_value]
  );

  // Memoize category color
  const categoryColor = useMemo(() => {
    switch (achievement.category) {
      case 'LEARNING': return 'bg-purple-100 text-purple-700';
      case 'TIME': return 'bg-blue-100 text-blue-700';
      case 'SOCIAL': return 'bg-green-100 text-green-700';
      case 'SPECIAL': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }, [achievement.category]);

  // Memoize requirement text
  const requirementText = useMemo(() => {
    switch (achievement.requirement_type) {
      case 'VIDEOS_WATCHED':
        return `${currentProgress} / ${achievement.requirement_value} Videos`;
      case 'QUIZZES_PASSED':
        return `${currentProgress} / ${achievement.requirement_value} Quizzes`;
      case 'DAYS_WORKED':
        return `${currentProgress} / ${achievement.requirement_value} Tage`;
      case 'COINS_EARNED':
        return `${currentProgress} / ${achievement.requirement_value} Coins`;
      case 'LEVEL_REACHED':
        return `Level ${currentProgress} / ${achievement.requirement_value}`;
      default:
        return `${currentProgress} / ${achievement.requirement_value}`;
    }
  }, [achievement.requirement_type, achievement.requirement_value, currentProgress]);

  // Memoize earned date formatting
  const earnedDate = useMemo(() => {
    if (!userAchievement) return null;
    return new Date(userAchievement.earned_at).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [userAchievement]);

  return (
    <button
      onClick={onClick}
      className={`relative text-left transition-all ${
        isUnlocked ? 'hover:scale-105' : 'hover:scale-102'
      }`}
    >
      <Card className={`overflow-hidden ${isUnlocked ? 'border-2' : ''}`} style={{
        borderColor: isUnlocked ? achievement.badge_color : undefined
      }}>
        <CardContent className="p-6">
          {/* Badge Icon */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 ${
                isUnlocked ? '' : 'grayscale opacity-40'
              }`}
              style={{
                backgroundColor: isUnlocked ? `${achievement.badge_color}20` : '#f3f4f6'
              }}
            >
              {isUnlocked ? (
                <span>{achievement.icon}</span>
              ) : (
                <Lock className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {achievement.name}
                </h3>
                {isUnlocked && (
                  <div className="shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <Badge className={`${categoryColor} text-xs`}>
                {achievement.category}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className={`text-sm mb-4 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
            {achievement.description}
          </p>

          {/* Progress or Rewards */}
          {isUnlocked ? (
            <div className="flex items-center gap-4 pt-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Belohnung:</span>
                <span className="text-sm font-semibold text-purple-600">
                  +{achievement.xp_reward} XP
                </span>
                <span className="text-sm font-semibold text-yellow-600">
                  +{achievement.coin_reward} Coins
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Fortschritt</span>
                <span>{requirementText}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Earned Date */}
          {isUnlocked && earnedDate && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500">
                Errungen am {earnedDate}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  );
});

export default AchievementBadge;
