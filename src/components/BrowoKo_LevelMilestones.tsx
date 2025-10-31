/**
 * @file BrowoKo_LevelMilestones.tsx
 * @domain HR - Learning & Gamification
 * @description Display level milestones and achievements
 * @namespace BrowoKo_
 */

import { Trophy, Star, Award, Crown } from './icons/BrowoKoIcons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface LevelMilestonesProps {
  currentLevel: number;
}

export default function LevelMilestones({ currentLevel }: LevelMilestonesProps) {
  const milestones = [
    { level: 5, icon: Star, title: 'Neuling', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { level: 10, icon: Trophy, title: 'Fortgeschritten', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { level: 25, icon: Award, title: 'Experte', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { level: 50, icon: Crown, title: 'Meister', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Level-Meilensteine</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.map((milestone) => {
            const Icon = milestone.icon;
            const isUnlocked = currentLevel >= milestone.level;
            
            return (
              <div
                key={milestone.level}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                  isUnlocked
                    ? `${milestone.bgColor} border-${milestone.color.split('-')[1]}-200`
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isUnlocked ? milestone.bgColor : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${isUnlocked ? milestone.color : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {milestone.title}
                    </span>
                    {isUnlocked && (
                      <Badge variant="secondary" className="text-xs">
                        Freigeschaltet
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    Level {milestone.level}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
