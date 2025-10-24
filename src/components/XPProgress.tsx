import { memo, useMemo } from 'react';
import { Star, TrendingUp } from './icons/HRTHISIcons';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';

interface XPProgressProps {
  currentXP: number;
  currentLevel: number;
  showDetails?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

// Helper function outside component to avoid recreation
const getXPForLevel = (level: number) => {
  return Math.floor(50 * Math.pow(1.5, level - 1));
};

const getLevelTitle = (level: number) => {
  if (level >= 20) return 'Legende';
  if (level >= 15) return 'Meister';
  if (level >= 10) return 'Experte';
  if (level >= 5) return 'Fortgeschritten';
  if (level >= 3) return 'Anfänger';
  return 'Neuling';
};

const getLevelColor = (level: number) => {
  if (level >= 20) return { bg: 'from-purple-500 to-pink-600', text: 'text-purple-600' };
  if (level >= 15) return { bg: 'from-yellow-400 to-orange-500', text: 'text-yellow-600' };
  if (level >= 10) return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-600' };
  if (level >= 5) return { bg: 'from-green-500 to-emerald-500', text: 'text-green-600' };
  return { bg: 'from-gray-400 to-gray-500', text: 'text-gray-600' };
};

const XPProgress = memo(function XPProgress({
  currentXP,
  currentLevel,
  showDetails = true,
  variant = 'default'
}: XPProgressProps) {
  
  // Memoize calculations
  const xpData = useMemo(() => {
    const xpForCurrentLevel = getXPForLevel(currentLevel);
    const xpForNextLevel = getXPForLevel(currentLevel + 1);
    const xpNeeded = xpForNextLevel - currentXP;
    const progress = ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    
    return {
      xpForCurrentLevel,
      xpForNextLevel,
      xpNeeded,
      progress
    };
  }, [currentXP, currentLevel]);

  const levelTitle = useMemo(() => getLevelTitle(currentLevel), [currentLevel]);
  const colors = useMemo(() => getLevelColor(currentLevel), [currentLevel]);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${colors.bg} rounded-full flex items-center justify-center text-white font-semibold shadow-lg`}>
          {currentLevel}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Level {currentLevel}</span>
            <span>{currentXP} / {xpData.xpForNextLevel} XP</span>
          </div>
          <Progress value={xpData.progress} className="h-2" />
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Level Badge */}
            <div className={`w-20 h-20 bg-gradient-to-br ${colors.bg} rounded-2xl flex flex-col items-center justify-center text-white shadow-xl`}>
              <div className="text-3xl font-bold">{currentLevel}</div>
              <div className="text-xs opacity-90">Level</div>
            </div>

            {/* Progress Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{levelTitle}</h3>
                  <p className="text-sm text-gray-500">Level {currentLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentXP} XP</p>
                  <p className="text-xs text-gray-500">{xpData.xpNeeded} bis Level {currentLevel + 1}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <Progress value={xpData.progress} className="h-3 mb-2" />
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>{currentXP} Total XP</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{Math.round(xpData.progress)}% zum nächsten Level</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center text-white font-semibold shadow-lg`}>
            {currentLevel}
          </div>
          <div>
            <p className="text-sm text-gray-500">Level {currentLevel}</p>
            <p className="font-semibold text-gray-900">{levelTitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{currentXP} XP</p>
          <p className="text-xs text-gray-500">von {xpData.xpForNextLevel} XP</p>
        </div>
      </div>

      {showDetails && (
        <>
          <Progress value={xpData.progress} className="h-3 mb-2" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{xpData.xpNeeded} XP bis Level {currentLevel + 1}</span>
            <span>{Math.round(xpData.progress)}%</span>
          </div>
        </>
      )}
    </div>
  );
});

export default XPProgress;