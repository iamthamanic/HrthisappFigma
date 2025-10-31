/**
 * @file BrowoKo_ShopItemCard.tsx
 * @domain HR - Learning & Gamification
 * @description Shop item card for learning shop
 * @namespace BrowoKo_
 * @performance Optimized with React.memo() and useMemo() hooks
 */

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Coins } from './icons/BrowoKoIcons';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'avatar' | 'powerup' | 'theme';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ShopItemCardProps {
  item: ShopItem;
  affordable: boolean;
  onPurchase: () => void;
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-100 text-gray-700';
    case 'rare': return 'bg-blue-100 text-blue-700';
    case 'epic': return 'bg-purple-100 text-purple-700';
    case 'legendary': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const ShopItemCard = memo(function ShopItemCard({ item, affordable, onPurchase }: ShopItemCardProps) {
  // Memoize rarity color calculation
  const rarityColor = useMemo(() => getRarityColor(item.rarity), [item.rarity]);
  
  // Memoize button text
  const buttonText = useMemo(() => affordable ? 'Kaufen' : 'Zu teuer', [affordable]);

  return (
    <Card className={`${!affordable && 'opacity-60'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="text-4xl mb-2">{item.icon}</div>
          <Badge className={rarityColor}>
            {item.rarity}
          </Badge>
        </div>
        <CardTitle className="text-lg">{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{item.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-gray-900">{item.price}</span>
          </div>
          <Button 
            disabled={!affordable}
            size="sm"
            onClick={onPurchase}
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default ShopItemCard;
