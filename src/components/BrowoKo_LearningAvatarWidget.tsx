/**
 * ============================================
 * LEARNING AVATAR WIDGET (v3.10.4)
 * ============================================
 * Description: Avatar Widget für Lernzentrum mit Stats & Quick Access
 * Features:
 * - Shows user profile picture (priority)
 * - Fallback to emoji avatar
 * - Fallback to initials
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User, Trophy, Coins, Settings, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import AvatarDisplay from './AvatarDisplay';

export default function HRTHIS_LearningAvatarWidget() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { avatar, coins, level, xp, loadAvatar, loadCoinBalance } = useGamificationStore();
  const [open, setOpen] = useState(false);

  // 🔥 VERSION CHECK - THIS SHOULD ALWAYS APPEAR IN CONSOLE!
  console.log('🔥🔥🔥 [LearningAvatarWidget] NEW VERSION v4.7.3-PROFILE-PIC-FIX! 🔥🔥🔥');
  console.log('📸 Profile Picture Debug:', {
    hasProfile: !!profile,
    hasProfilePicture: !!profile?.profile_picture,
    profilePicture: profile?.profile_picture || 'NOT SET',
    firstName: profile?.first_name || 'N/A',
    lastName: profile?.last_name || 'N/A'
  });

  // Load data on mount
  useEffect(() => {
    if (profile?.id) {
      loadAvatar(profile.id);
      loadCoinBalance(profile.id);
    }
  }, [profile?.id, loadAvatar, loadCoinBalance]);

  // Calculate XP Progress
  const baseXP = 100;
  const nextLevelXP = Math.floor(baseXP * Math.pow(1.5, level - 1));
  const currentLevelXP = level > 1 ? Math.floor(baseXP * Math.pow(1.5, level - 2)) : 0;
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpForNextLevel = nextLevelXP - currentLevelXP;
  const xpProgress = Math.min(100, Math.round((xpInCurrentLevel / xpForNextLevel) * 100));

  // User initials for fallback
  const userInitials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`
    : 'U';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-2 hover:bg-gray-100 transition-colors relative"
        >
          {/* Avatar Display */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
              {(() => {
                // Debug logging
                console.log('🖼️ [LearningAvatar] Profile Picture:', profile?.profile_picture);
                console.log('👤 [LearningAvatar] Profile Data:', profile);
                console.log('📸 [LearningAvatar] Has Picture?', !!profile?.profile_picture);
                
                return profile?.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ [LearningAvatar] Image failed to load:', profile.profile_picture);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-lg font-semibold text-blue-600">{userInitials}</span>
                );
              })()}
            </div>
            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs font-bold text-white">{level}</span>
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            {/* Large Avatar */}
            <div className="w-16 h-16 rounded-full border-2 border-blue-500 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center flex-shrink-0">
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : avatar ? (
                <AvatarDisplay avatar={avatar} size={64} showBackground={false} />
              ) : (
                <span className="text-2xl font-semibold text-blue-600">{userInitials}</span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-sm text-gray-600 truncate">{profile?.email}</p>
              <Badge className="mt-1 bg-blue-600 hover:bg-blue-600">Level {level}</Badge>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Fortschritt</span>
              <span className="font-medium text-gray-900">
                {xpInCurrentLevel} / {xpForNextLevel} XP
              </span>
            </div>
            <Progress value={xpProgress} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {xpForNextLevel - xpInCurrentLevel} XP bis Level {level + 1}
            </p>
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="p-4 space-y-3">
          {/* Coins */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm text-gray-700">Coins</span>
            </div>
            <span className="font-semibold text-gray-900">{coins.toLocaleString('de-DE')}</span>
          </div>

          {/* Achievements - Placeholder for now */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Achievements</span>
            </div>
            <span className="text-sm text-gray-500">Bald verfügbar</span>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              navigate('/avatar');
            }}
          >
            <User className="w-4 h-4 mr-2" />
            Avatar bearbeiten
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              navigate('/achievements');
            }}
          >
            <Award className="w-4 h-4 mr-2" />
            Achievements ansehen
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              navigate('/settings');
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
