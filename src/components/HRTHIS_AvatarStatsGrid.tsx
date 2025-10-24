import { Card, CardContent } from './ui/card';
import { Trophy, Star, Zap, Award } from './icons/HRTHISIcons';

interface AvatarStatsGridProps {
  currentLevel: number;
  currentXP: number;
  totalCoins: number;
  totalAchievements: number;
}

export default function AvatarStatsGrid({
  currentLevel,
  currentXP,
  totalCoins,
  totalAchievements
}: AvatarStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Level */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Level</p>
              <p className="text-2xl font-semibold text-gray-900">{currentLevel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Gesamt-XP</p>
              <p className="text-2xl font-semibold text-gray-900">{currentXP}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coins */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Coins</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCoins}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Erfolge</p>
              <p className="text-2xl font-semibold text-gray-900">{totalAchievements}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
