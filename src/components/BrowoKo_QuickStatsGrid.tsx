/**
 * @file BrowoKo_QuickStatsGrid.tsx
 * @domain HR - Dashboard
 * @description Quick stats grid with 2 cards (Urlaub, Coins)
 * @created Phase 2.2 - Priority 4 Refactoring
 * @updated v4.10.15 - Time tracking removed
 */

import { useNavigate } from 'react-router-dom';
import { Umbrella, Coins } from './icons/BrowoKoIcons';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';

interface QuickStatsGridProps {
  // Vacation
  remainingVacationDays: number;
  totalVacationDays: number;
  usedVacationDays: number;
  
  // Gamification
  coins: number;
  xpProgress: number;
  currentXP: number;
  nextLevelXP: number;
}

export function QuickStatsGrid({
  remainingVacationDays,
  totalVacationDays,
  usedVacationDays,
  coins,
  xpProgress,
  currentXP,
  nextLevelXP,
}: QuickStatsGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Urlaub */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/calendar')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Urlaub</p>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Umbrella className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-semibold text-gray-900">
              {remainingVacationDays}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              von {totalVacationDays} Tagen
            </p>
            <div className="mt-3">
              <p className="text-xs text-gray-500">
                Genommen: <span className="font-medium">{usedVacationDays} Tage</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coins */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/benefits')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Coins</p>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg flex items-center justify-center border border-orange-200">
              <Coins className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-semibold text-gray-900">
              {(coins || 0).toLocaleString('de-DE')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Aktueller Kontostand
            </p>
            <div className="mt-3">
              <Progress value={Math.min(xpProgress, 100)} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">
                XP: {currentXP} / {nextLevelXP}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
