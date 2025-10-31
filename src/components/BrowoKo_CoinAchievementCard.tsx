/**
 * ============================================
 * COIN ACHIEVEMENT CARD (v3.9.0)
 * ============================================
 * Description: Displays coin achievement with progress
 * ============================================
 */

import { Lock, Check, Trophy, Plane, Utensils, Home, Crown, Award, Medal } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { CoinAchievementWithProgress } from '../types/database';

interface HRTHIS_CoinAchievementCardProps {
  achievement: CoinAchievementWithProgress;
  onClaim?: (achievementId: string) => void;
}

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Plane,
  Utensils,
  Home,
  Crown,
  Award,
  Medal,
};

// Badge color mapping
const BADGE_COLORS: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-800 border-orange-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-300',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  platinum: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function HRTHIS_CoinAchievementCard({
  achievement,
  onClaim,
}: HRTHIS_CoinAchievementCardProps) {
  const Icon = ICON_MAP[achievement.icon] || Trophy;
  const badgeColorClass = BADGE_COLORS[achievement.badge_color] || BADGE_COLORS.gold;

  const isLocked = !achievement.is_unlocked;
  const canClaim = achievement.is_unlocked && !achievement.is_claimed;

  return (
    <Card className={`p-6 ${isLocked ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isLocked
                ? 'bg-gray-100 text-gray-400'
                : `bg-gradient-to-br ${
                    achievement.badge_color === 'bronze'
                      ? 'from-orange-100 to-orange-200 text-orange-600'
                      : achievement.badge_color === 'silver'
                      ? 'from-gray-100 to-gray-200 text-gray-600'
                      : achievement.badge_color === 'gold'
                      ? 'from-yellow-100 to-yellow-200 text-yellow-600'
                      : 'from-purple-100 to-purple-200 text-purple-600'
                  }`
            }`}
          >
            {isLocked ? <Lock className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
          </div>

          {/* Title & Description */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{achievement.description}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2">
          {achievement.is_unlocked && (
            <Badge className={`${badgeColorClass} border`}>
              {achievement.is_claimed ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Eingelöst
                </>
              ) : (
                'Freigeschaltet!'
              )}
            </Badge>
          )}
          {!achievement.is_unlocked && (
            <Badge variant="outline" className="bg-gray-50">
              <Lock className="w-3 h-3 mr-1" />
              Gesperrt
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Bar (only for locked achievements) */}
      {isLocked && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Fortschritt</span>
            <span className="font-medium text-gray-900">
              {achievement.current_balance.toLocaleString('de-DE')} /{' '}
              {achievement.required_coins.toLocaleString('de-DE')} Coins
            </span>
          </div>
          <Progress value={achievement.progress_percentage} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            Noch {(achievement.required_coins - achievement.current_balance).toLocaleString('de-DE')}{' '}
            Coins benötigt
          </p>
        </div>
      )}

      {/* Unlock Info */}
      {achievement.is_unlocked && achievement.unlock_description && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-green-900 mb-1">
            {achievement.unlock_type === 'EVENT' && '🎉 Event-Teilnahme'}
            {achievement.unlock_type === 'ACCESS' && '🔓 Zugang freigeschaltet'}
            {achievement.unlock_type === 'BENEFIT' && '🎁 Benefit verfügbar'}
            {achievement.unlock_type === 'PRIVILEGE' && '⭐ Privileg erhalten'}
          </h4>
          <p className="text-sm text-green-800">{achievement.unlock_description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {achievement.category === 'MILESTONE' && '🏆 Meilenstein'}
            {achievement.category === 'EVENT' && '🎪 Event'}
            {achievement.category === 'EXCLUSIVE' && '💎 Exklusiv'}
            {achievement.category === 'SEASONAL' && '🎄 Saisonal'}
          </Badge>
          <span className="text-xs text-gray-500">
            {achievement.required_coins.toLocaleString('de-DE')} Coins erforderlich
          </span>
        </div>

        {/* Claim Button */}
        {canClaim && onClaim && (
          <Button
            size="sm"
            onClick={() => onClaim(achievement.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-1" />
            Einlösen
          </Button>
        )}

        {/* Unlocked Date */}
        {achievement.is_unlocked && achievement.unlocked_at && (
          <span className="text-xs text-gray-500">
            Freigeschaltet:{' '}
            {new Date(achievement.unlocked_at).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        )}
      </div>
    </Card>
  );
}
