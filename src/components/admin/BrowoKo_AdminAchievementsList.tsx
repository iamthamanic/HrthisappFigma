/**
 * ============================================
 * ADMIN ACHIEVEMENTS LIST (v3.9.1)
 * ============================================
 * Description: Liste aller Coin Achievements für Admin Management
 * ============================================
 */

import { Trophy } from '../icons/BrowoKoIcons';
import { Button } from '../ui/button';
import AchievementCard from './BrowoKo_AchievementCard';
import type { CoinAchievement } from '../../types/database';

interface AdminAchievementsListProps {
  achievements: CoinAchievement[];
  onEdit: (achievement: CoinAchievement) => void;
  onDelete: (achievementId: string) => void;
  onCreateNew: () => void;
}

export default function AdminAchievementsList({
  achievements,
  onEdit,
  onDelete,
  onCreateNew,
}: AdminAchievementsListProps) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Trophy className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Noch keine Achievements vorhanden
        </h3>
        <p className="text-gray-500 mb-6">
          Erstelle dein erstes Coin Achievement für deine Mitarbeiter
        </p>
        <Button onClick={onCreateNew}>
          Erstes Achievement erstellen
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          onEdit={() => onEdit(achievement)}
          onDelete={() => onDelete(achievement.id)}
        />
      ))}
    </div>
  );
}
