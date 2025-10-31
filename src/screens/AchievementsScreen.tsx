import { useState, useEffect } from 'react';
import { Trophy, Award, Star, TrendingUp } from '../components/icons/BrowoKoIcons';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import AchievementBadge from '../components/AchievementBadge';

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const { 
    achievements, 
    userAchievements, 
    loadAchievements, 
    loadUserAchievements,
    getAchievementProgress 
  } = useGamificationStore();

  const [filter, setFilter] = useState<'all' | 'LEARNING' | 'TIME' | 'SOCIAL' | 'SPECIAL'>('all');

  useEffect(() => {
    loadAchievements();
    if (user?.id) {
      loadUserAchievements(user.id);
    }
  }, [user?.id, loadAchievements, loadUserAchievements]);

  // Calculate stats
  const totalAchievements = achievements.length;
  const unlockedAchievements = userAchievements.length;
  const completionRate = totalAchievements > 0 
    ? Math.round((unlockedAchievements / totalAchievements) * 100) 
    : 0;

  const totalXpEarned = userAchievements.reduce((sum, ua) => {
    const achievement = achievements.find(a => a.id === ua.achievement_id);
    return sum + (achievement?.xp_reward || 0);
  }, 0);

  const totalCoinsEarned = userAchievements.reduce((sum, ua) => {
    const achievement = achievements.find(a => a.id === ua.achievement_id);
    return sum + (achievement?.coin_reward || 0);
  }, 0);

  // Filter achievements
  const filteredAchievements = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter);

  // Sort: unlocked first, then by category
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aUnlocked = userAchievements.some(ua => ua.achievement_id === a.id);
    const bUnlocked = userAchievements.some(ua => ua.achievement_id === b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Erfolge & Abzeichen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sammle Achievements und verdiene Belohnungen!
          </p>
        </div>
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
          <Trophy className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Completion */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Fortschritt</p>
                <p className="text-3xl font-semibold text-gray-900">{completionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Progress value={completionRate} className="h-2 mb-2" />
            <p className="text-xs text-gray-500">
              {unlockedAchievements} von {totalAchievements} freigeschaltet
            </p>
          </CardContent>
        </Card>

        {/* Total Achievements */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Abzeichen</p>
                <p className="text-3xl font-semibold text-gray-900">{unlockedAchievements}</p>
                <p className="text-xs text-gray-500 mt-1">Errungen</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP Earned */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">XP verdient</p>
                <p className="text-3xl font-semibold text-gray-900">{totalXpEarned}</p>
                <p className="text-xs text-gray-500 mt-1">Durch Erfolge</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coins Earned */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Coins verdient</p>
                <p className="text-3xl font-semibold text-gray-900">{totalCoinsEarned}</p>
                <p className="text-xs text-gray-500 mt-1">Durch Erfolge</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🪙</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="all">
            Alle ({achievements.length})
          </TabsTrigger>
          <TabsTrigger value="LEARNING">
            📚 Lernen
          </TabsTrigger>
          <TabsTrigger value="TIME">
            ⏰ Zeit
          </TabsTrigger>
          <TabsTrigger value="SOCIAL">
            👥 Sozial
          </TabsTrigger>
          <TabsTrigger value="SPECIAL">
            ⭐ Spezial
          </TabsTrigger>
        </TabsList>

        {/* Achievements Grid */}
        <TabsContent value={filter} className="mt-0">
          {sortedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAchievements.map((achievement) => {
                const userAchievement = userAchievements.find(
                  ua => ua.achievement_id === achievement.id
                );
                const progress = getAchievementProgress?.(achievement.id) || 0;

                return (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    userAchievement={userAchievement}
                    currentProgress={progress}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Keine Achievements in dieser Kategorie</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span>
            Tipps zum Freischalten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              Schließe Videos und Quizzes ab, um Lern-Achievements zu erhalten
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              Stempel regelmäßig ein und aus für Zeit-Achievements
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              Interagiere mit deinem Team für Sozial-Achievements
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              Halte Ausschau nach speziellen Events für limitierte Achievements
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
