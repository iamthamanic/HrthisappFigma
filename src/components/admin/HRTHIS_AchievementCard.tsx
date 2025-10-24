/**
 * ============================================
 * ACHIEVEMENT CARD COMPONENT (v3.9.1)
 * ============================================
 * Description: Card für Admin Achievement Management
 * ============================================
 */

import { Edit, Trash2 } from '../icons/HRTHISIcons';
import { Button } from '../ui/button';
import * as Icons from '../icons/HRTHISIcons';
import type { CoinAchievement } from '../../types/database';

interface AchievementCardProps {
  achievement: CoinAchievement;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AchievementCard({
  achievement,
  onEdit,
  onDelete,
}: AchievementCardProps) {
  // Get Icon Component
  const IconComponent = (Icons as any)[achievement.icon] || Icons.Trophy;

  // Badge color mapping
  const badgeColorClass =
    achievement.badge_color === 'bronze'
      ? 'bg-gradient-to-br from-amber-400 to-amber-700'
      : achievement.badge_color === 'silver'
      ? 'bg-gradient-to-br from-gray-300 to-gray-600'
      : achievement.badge_color === 'gold'
      ? 'bg-gradient-to-br from-yellow-300 to-yellow-600'
      : 'bg-gradient-to-br from-purple-400 to-purple-700';

  // Category badge
  const categoryBadgeColor =
    achievement.category === 'MILESTONE'
      ? 'bg-blue-100 text-blue-800'
      : achievement.category === 'EVENT'
      ? 'bg-green-100 text-green-800'
      : 'bg-purple-100 text-purple-800';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {/* Badge */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${badgeColorClass}`}>
          <IconComponent className="w-7 h-7 text-white" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>

      {/* Required Coins */}
      <div className="flex items-center gap-2 mb-3">
        <Icons.Coins className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-medium text-gray-700">
          {achievement.required_coins} Coins erforderlich
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${categoryBadgeColor}`}>
          {achievement.category}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {achievement.unlock_type}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
          {achievement.badge_color}
        </span>
      </div>

      {/* Unlock Description */}
      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Nach Unlock: </span>
          {achievement.unlock_description}
        </p>
      </div>

      {/* Sort Order */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Sortierung: <span className="font-medium">{achievement.sort_order}</span>
          {' • '}
          Status: <span className="font-medium">{achievement.is_active ? '✅ Aktiv' : '⏸️ Inaktiv'}</span>
        </p>
      </div>
    </div>
  );
}
