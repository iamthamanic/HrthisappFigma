/**
 * @file BrowoKo_QuickStatsGrid.tsx
 * @domain HR - Dashboard
 * @description Quick stats grid with 4 cards (Urlaub, Coins, Lernzentrum EXP, Tasks)
 * @created Phase 2.2 - Priority 4 Refactoring
 * @updated v4.10.15 - Time tracking removed
 * @updated v4.10.16 - Expanded to 4 cards in one row
 */

import { useNavigate } from 'react-router-dom';
import { Umbrella, Coins, BookOpen, ListTodo } from 'lucide-react';
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
  
  // Tasks
  completedTasks: number;
  totalTasks: number;
}

export function QuickStatsGrid({
  remainingVacationDays,
  totalVacationDays,
  usedVacationDays,
  coins,
  xpProgress,
  currentXP,
  nextLevelXP,
  completedTasks,
  totalTasks,
}: QuickStatsGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Urlaub */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/calendar')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Urlaub</p>
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <Umbrella className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">
              {remainingVacationDays}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              von {totalVacationDays} Tagen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coins */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/benefits')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Coins</p>
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg flex items-center justify-center border border-orange-200">
              <Coins className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">
              {(coins || 0).toLocaleString('de-DE')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Kontostand
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lernzentrum EXP */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/learning')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Lernzentrum</p>
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">
              {currentXP}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              XP (Level {Math.floor(currentXP / 100)})
            </p>
            <div className="mt-2">
              <Progress value={Math.min(xpProgress, 100)} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/tasks')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Tasks</p>
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">
              {completedTasks}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              von {totalTasks} erledigt
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
