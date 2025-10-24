import { useState } from 'react';
import { useGamificationStore } from '../stores/gamificationStore';
import { ShoppingBag, Sparkles, Coins, Star } from '../components/icons/HRTHISIcons';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import LoadingState from '../components/LoadingState';
import ShopItemCard from '../components/HRTHIS_ShopItemCard';
import ShopEmptyState from '../components/HRTHIS_ShopEmptyState';
import ShopInfoBox from '../components/HRTHIS_ShopInfoBox';
import { useLearningShop } from '../hooks/HRTHIS_useLearningShop';

export default function LearningShopScreen() {
  const { coins } = useGamificationStore();
  const { shopItems, loading } = useLearningShop();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'avatar' | 'powerup' | 'theme'>('all');

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  const canAfford = (price: number) => {
    return (coins || 0) >= price;
  };

  const handlePurchase = (itemId: string) => {
    // TODO: Implement purchase logic
    console.log('Purchase item:', itemId);
  };

  if (loading) {
    return <LoadingState loading={true} type="spinner" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7" />
            Lern-Shop
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kaufe exklusive Items mit deinen Coins
          </p>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-600" />
              <span className="text-xl font-semibold text-gray-900">{coins || 0}</span>
              <span className="text-sm text-gray-500">Coins</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>
            Alle Items
          </TabsTrigger>
          <TabsTrigger value="avatar" onClick={() => setSelectedCategory('avatar')}>
            <Sparkles className="w-4 h-4 mr-2" />
            Avatar
          </TabsTrigger>
          <TabsTrigger value="powerup" onClick={() => setSelectedCategory('powerup')}>
            <Star className="w-4 h-4 mr-2" />
            Power-Ups
          </TabsTrigger>
          <TabsTrigger value="theme" onClick={() => setSelectedCategory('theme')}>
            Themes
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                affordable={canAfford(item.price)}
                onPurchase={() => handlePurchase(item.id)}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <ShopEmptyState 
              selectedCategory={selectedCategory} 
              coins={coins || 0} 
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <ShopInfoBox />
    </div>
  );
}
