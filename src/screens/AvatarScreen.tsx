import { useState, useEffect } from 'react';
import { Sparkles } from '../components/icons/BrowoKoIcons';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AvatarDisplay from '../components/AvatarDisplay';
import AvatarEditor, { AvatarConfig } from '../components/AvatarEditor';
import XPProgress from '../components/XPProgress';
import AvatarStatsGrid from '../components/BrowoKo_AvatarStatsGrid';
import LevelMilestones from '../components/BrowoKo_LevelMilestones';

export default function AvatarScreen() {
  const { user } = useAuthStore();
  const { 
    avatar, 
    loadAvatar, 
    updateAvatar, 
    coinBalance,
    loadCoinBalance,
    userAchievements,
    loadUserAchievements
  } = useGamificationStore();

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAvatar(user.id);
      loadCoinBalance(user.id);
      loadUserAchievements(user.id);
    }
  }, [user?.id, loadAvatar, loadCoinBalance, loadUserAchievements]);

  const handleSaveAvatar = async (config: AvatarConfig) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      await updateAvatar(user.id, {
        emoji: config.emoji,
        skin_color: config.skinColor,
        hair_color: config.hairColor,
        background_color: config.backgroundColor,
      });
      
      setTimeout(() => {
        alert('✅ Avatar gespeichert!');
      }, 300);
    } catch (error) {
      console.error('Save avatar error:', error);
      alert('❌ Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const currentXP = avatar?.total_xp || 0;
  const currentLevel = avatar?.level || 1;
  const totalCoins = coinBalance?.current_balance || 0;
  const totalAchievements = userAchievements.length;

  // Calculate next level info
  const getXPForLevel = (level: number) => {
    return Math.floor(50 * Math.pow(1.5, level - 1));
  };

  const xpForNextLevel = getXPForLevel(currentLevel + 1);

  // Level milestones
  const levelMilestones = [
    { level: 1, title: 'Neuling', unlocked: currentLevel >= 1 },
    { level: 3, title: 'Anfänger', unlocked: currentLevel >= 3 },
    { level: 5, title: 'Fortgeschritten', unlocked: currentLevel >= 5 },
    { level: 10, title: 'Experte', unlocked: currentLevel >= 10 },
    { level: 15, title: 'Meister', unlocked: currentLevel >= 15 },
    { level: 20, title: 'Legende', unlocked: currentLevel >= 20 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Mein Avatar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Passe deinen Avatar an und verfolge deinen Fortschritt
          </p>
        </div>
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Stats Overview */}
      <AvatarStatsGrid
        currentLevel={currentLevel}
        currentXP={currentXP}
        totalCoins={totalCoins}
        totalAchievements={totalAchievements}
      />

      {/* XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Level-Fortschritt</CardTitle>
        </CardHeader>
        <CardContent>
          <XPProgress 
            currentXP={currentXP}
            xpForNextLevel={xpForNextLevel}
            currentLevel={currentLevel}
          />
        </CardContent>
      </Card>

      {/* Avatar Customization */}
      <Tabs defaultValue="display" className="w-full">
        <TabsList>
          <TabsTrigger value="display">Aktueller Avatar</TabsTrigger>
          <TabsTrigger value="edit">Anpassen</TabsTrigger>
          <TabsTrigger value="milestones">Meilensteine</TabsTrigger>
        </TabsList>

        <TabsContent value="display" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dein Avatar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <AvatarDisplay
                emoji={avatar?.emoji}
                skinColor={avatar?.skin_color}
                hairColor={avatar?.hair_color}
                backgroundColor={avatar?.background_color}
                size="xl"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Avatar anpassen</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarEditor
                initialConfig={{
                  emoji: avatar?.emoji || '😀',
                  skinColor: avatar?.skin_color || '#FFD700',
                  hairColor: avatar?.hair_color || '#8B4513',
                  backgroundColor: avatar?.background_color || '#E3F2FD',
                }}
                onSave={handleSaveAvatar}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <LevelMilestones milestones={levelMilestones} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
