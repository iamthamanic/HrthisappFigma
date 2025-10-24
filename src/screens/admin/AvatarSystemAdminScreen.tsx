/**
 * @file AvatarSystemAdminScreen.tsx
 * @domain ADMIN - Avatar System Management
 * @description Gamification avatar items, levels, and achievements management
 * @version v4.4.0 - Context-Aware Buttons + Search
 */

import { useState } from 'react';
import { Sparkles, Gift, Trophy, Star, Plus, Search } from '../../components/icons/HRTHISIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function AvatarSystemAdminScreen() {
  const [activeAvatarTab, setActiveAvatarTab] = useState<'items' | 'levels' | 'achievements'>('items');
  
  // Search states
  const [itemsSearch, setItemsSearch] = useState('');
  const [levelsSearch, setLevelsSearch] = useState('');
  const [achievementsSearch, setAchievementsSearch] = useState('');

  // Mock data for levels (will be replaced with real data later)
  const levels = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    level: i + 1,
    xpRequired: (i + 1) * 100,
    name: `Level ${i + 1}`
  }));

  // Filter levels by search
  const filteredLevels = levels.filter(level =>
    level.name.toLowerCase().includes(levelsSearch.toLowerCase()) ||
    level.xpRequired.toString().includes(levelsSearch)
  );

  // Context-aware button config
  const getButtonConfig = () => {
    switch (activeAvatarTab) {
      case 'items':
        return {
          label: 'Neues Avatar Item hinzufügen',
          shortLabel: 'Avatar Item',
          icon: Sparkles,
          onClick: () => alert('Avatar Item Dialog kommt bald! 🎨')
        };
      case 'levels':
        return {
          label: 'Neues Level hinzufügen',
          shortLabel: 'Level',
          icon: Star,
          onClick: () => alert('Level Dialog kommt bald! ⭐')
        };
      case 'achievements':
        return {
          label: 'Neuer Skin hinzufügen',
          shortLabel: 'Skin',
          icon: Trophy,
          onClick: () => alert('Skin Dialog kommt bald! 🏆')
        };
      default:
        return {
          label: 'Neues Item',
          shortLabel: 'Item',
          icon: Gift,
          onClick: () => {}
        };
    }
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  return (
    <div className="w-full">
      {/* Header with Context-Aware Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Avatar-System Verwaltung</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gamification-Features konfigurieren
          </p>
        </div>
        <Button 
          className="w-full md:w-auto btn-touch"
          onClick={buttonConfig.onClick}
        >
          <ButtonIcon className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{buttonConfig.label}</span>
          <span className="sm:hidden">{buttonConfig.shortLabel}</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeAvatarTab} onValueChange={(value: any) => setActiveAvatarTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="items" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Avatar-Items</span>
            <span className="sm:hidden">Items</span>
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
            <Star className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Level-System</span>
            <span className="sm:hidden">Levels</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
            <Trophy className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Achievements</span>
            <span className="sm:hidden">Skins</span>
          </TabsTrigger>
        </TabsList>

        {/* Avatar Items Tab */}
        <TabsContent value="items" className="mt-6">
          <Card className="mobile-card md:desktop-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Avatar-Items Verwaltung
                </CardTitle>
                
                {/* Items Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Items durchsuchen..."
                    value={itemsSearch}
                    onChange={(e) => setItemsSearch(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-400 py-12">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Noch keine Avatar-Items</p>
                <p className="text-sm mb-4">Erstelle Avatar-Anpassungen für deine Mitarbeiter</p>
                <Button onClick={buttonConfig.onClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  {buttonConfig.label}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Level System Tab */}
        <TabsContent value="levels" className="mt-6">
          <Card className="mobile-card md:desktop-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  Level-Konfiguration
                </CardTitle>
                
                {/* Levels Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Levels durchsuchen..."
                    value={levelsSearch}
                    onChange={(e) => setLevelsSearch(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLevels.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Keine Levels gefunden</p>
                  <p className="text-sm">Versuche einen anderen Suchbegriff</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLevels.map((level) => (
                    <div
                      key={level.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="font-semibold text-blue-600">{level.level}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{level.name}</p>
                          <p className="text-sm text-gray-500">
                            {level.xpRequired} XP erforderlich
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full sm:w-auto touch-target"
                        onClick={() => alert(`Level ${level.level} bearbeiten - Dialog kommt bald! ⭐\n\nHier kannst du:\n- XP Anforderungen ändern\n- Level-Bild hochladen\n- Belohnungen konfigurieren`)}
                      >
                        Bearbeiten
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="mt-6">
          <Card className="mobile-card md:desktop-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  Achievements Verwaltung
                </CardTitle>
                
                {/* Achievements Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Skins durchsuchen..."
                    value={achievementsSearch}
                    onChange={(e) => setAchievementsSearch(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-400 py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Noch keine Skins</p>
                <p className="text-sm mb-4">Erstelle Avatar-Skins für besondere Auszeichnungen</p>
                <Button onClick={buttonConfig.onClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  {buttonConfig.label}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
