/**
 * @file HRTHIS_ShopEmptyState.tsx
 * @domain HR - Learning & Gamification
 * @description Empty state for learning shop
 * @namespace HRTHIS_
 */

import { ShoppingBag, Sparkles } from './icons/HRTHISIcons';

interface ShopEmptyStateProps {
  selectedCategory: 'all' | 'avatar' | 'powerup' | 'theme';
  coins: number;
}

export default function ShopEmptyState({ selectedCategory, coins }: ShopEmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-6">
        <ShoppingBag className="w-10 h-10 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Shop kommt bald!
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {selectedCategory === 'all' 
          ? 'Der Lern-Shop wird bald verfügbar sein. Hier kannst du dann exklusive Items mit deinen Coins kaufen!'
          : 'Keine Items in dieser Kategorie verfügbar.'}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">
          Du hast bereits {coins} Coins gesammelt
        </span>
      </div>
    </div>
  );
}
