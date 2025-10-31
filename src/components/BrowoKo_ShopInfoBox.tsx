/**
 * @file BrowoKo_ShopInfoBox.tsx
 * @domain HR - Learning & Gamification
 * @description Info box showing current coins balance
 * @namespace BrowoKo_
 */

import { Sparkles } from './icons/BrowoKoIcons';
import { Alert, AlertDescription } from './ui/alert';

interface ShopInfoBoxProps {
  coins: number;
}

export default function ShopInfoBox({ coins }: ShopInfoBoxProps) {
  return (
    <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-purple-900 mb-1">
            Dein Coins-Guthaben
          </h4>
          <AlertDescription className="text-purple-700">
            Du hast aktuell <strong>{coins} Coins</strong>. Sammle mehr Coins durch das Absolvieren von Videos und Quizzes!
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
