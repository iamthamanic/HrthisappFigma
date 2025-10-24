import { create } from 'zustand';
import { UserAvatar, CoinTransaction, CoinBalance, Achievement, UserAchievement } from '../types/database';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface GamificationState {
  avatar: UserAvatar | null;
  coinBalance: CoinBalance | null;
  recentTransactions: CoinTransaction[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  achievementProgress: Record<string, number>;
  coins: number;
  xp: number;
  level: number;
  loading: boolean;
  
  // Actions
  loadAvatar: (userId: string) => Promise<void>;
  updateAvatar: (userId: string, updates: Partial<UserAvatar>) => Promise<void>;
  loadCoinBalance: (userId: string) => Promise<void>;
  loadRecentTransactions: (userId: string) => Promise<void>;
  addCoins: (userId: string, amount: number, reason: string) => Promise<void>;
  spendCoins: (userId: string, amount: number, reason: string) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  loadUserStats: (userId: string) => Promise<void>; // New unified function
  
  // Achievement Actions
  loadAchievements: () => Promise<void>;
  loadUserAchievements: (userId: string) => Promise<void>;
  checkAndUnlockAchievements: (userId: string) => Promise<void>;
  unlockAchievement: (userId: string, achievementId: string) => Promise<void>;
  getAchievementProgress: (achievementId: string) => number;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  avatar: null,
  coinBalance: null,
  recentTransactions: [],
  achievements: [],
  userAchievements: [],
  achievementProgress: {},
  coins: 0,
  xp: 0,
  level: 1,
  loading: false,

  loadAvatar: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('user_avatars')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Create avatar if doesn't exist
      if (!data) {
        const { data: newAvatar, error: createError } = await supabase
          .from('user_avatars')
          .insert({
            user_id: userId,
            level: 1,
            total_xp: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        set({ 
          avatar: newAvatar, 
          level: newAvatar.level || 1,
          xp: newAvatar.total_xp || 0
        });
      } else {
        set({ 
          avatar: data, 
          level: data.level || 1,
          xp: data.total_xp || 0
        });
      }
    } catch (error) {
      console.error('Load avatar error:', error);
    } finally {
      set({ loading: false });
    }
  },

  updateAvatar: async (userId, updates) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('user_avatars')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      set({ avatar: data });
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadCoinBalance: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('amount, type, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      // Current year (e.g., 2025)
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(`${currentYear}-01-01T00:00:00Z`);

      // ALL TIME calculations
      const total_earned = data
        ?.filter(t => t.type === 'EARNED')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const total_spent = data
        ?.filter(t => t.type === 'SPENT')
        .reduce((sum, t) => Math.abs(t.amount), 0) || 0;

      // THIS YEAR ONLY calculations
      const yearly_earned = data
        ?.filter(t => t.type === 'EARNED' && new Date(t.created_at) >= yearStart)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const yearly_spent = data
        ?.filter(t => t.type === 'SPENT' && new Date(t.created_at) >= yearStart)
        .reduce((sum, t) => Math.abs(t.amount), 0) || 0;

      const current_balance = total_earned - total_spent;

      set({
        coinBalance: {
          total_earned,
          total_spent,
          current_balance,
          yearly_earned,
          yearly_spent,
          current_year: currentYear,
        },
        coins: current_balance,
      });
    } catch (error) {
      console.error('Load coin balance error:', error);
    }
  },

  loadRecentTransactions: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      set({ recentTransactions: data || [] });
    } catch (error) {
      console.error('Load recent transactions error:', error);
    } finally {
      set({ loading: false });
    }
  },

  addCoins: async (userId, amount, reason) => {
    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          reason: reason,
          type: 'EARNED',
        })
        .select()
        .single();

      if (error) throw error;

      // Reload balance
      await get().loadCoinBalance(userId);
      await get().loadRecentTransactions(userId);
    } catch (error) {
      console.error('Add coins error:', error);
      throw error;
    }
  },

  spendCoins: async (userId, amount, reason) => {
    try {
      // Check balance first
      const { coinBalance } = get();
      if (!coinBalance || coinBalance.current_balance < amount) {
        throw new Error('Insufficient coins');
      }

      const { data, error } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: -amount,
          reason: reason,
          type: 'SPENT',
        })
        .select()
        .single();

      if (error) throw error;

      // Reload balance
      await get().loadCoinBalance(userId);
      await get().loadRecentTransactions(userId);
    } catch (error) {
      console.error('Spend coins error:', error);
      throw error;
    }
  },

  fetchUserStats: async () => {
    const { coinBalance, avatar } = get();
    set({
      coins: coinBalance?.current_balance || 0,
      xp: avatar?.total_xp || 0,
      level: avatar?.level || 1,
    });
  },

  loadUserStats: async (userId) => {
    set({ loading: true });
    try {
      // Load all stats in parallel
      await Promise.all([
        get().loadAvatar(userId),
        get().loadCoinBalance(userId),
        get().loadUserAchievements(userId)
      ]);
      
      // Update computed stats
      await get().fetchUserStats();
    } catch (error) {
      console.error('Load user stats error:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Achievement Functions
  loadAchievements: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ achievements: data || [] });
    } catch (error) {
      console.error('Load achievements error:', error);
    } finally {
      set({ loading: false });
    }
  },

  loadUserAchievements: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      set({ userAchievements: data || [] });
    } catch (error) {
      console.error('Load user achievements error:', error);
    } finally {
      set({ loading: false });
    }
  },

  checkAndUnlockAchievements: async (userId) => {
    const { achievements, userAchievements, achievementProgress } = get();
    
    // Check each achievement
    for (const achievement of achievements) {
      // Skip if already unlocked
      if (userAchievements.some(ua => ua.achievement_id === achievement.id)) {
        continue;
      }

      const progress = achievementProgress[achievement.id] || 0;

      // Check if requirement is met
      if (progress >= achievement.requirement_value) {
        await get().unlockAchievement(userId, achievement.id);
      }
    }
  },

  unlockAchievement: async (userId, achievementId) => {
    try {
      const { achievements } = get();
      const achievement = achievements.find(a => a.id === achievementId);
      
      if (!achievement) return;

      // Insert user achievement
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      set((state) => ({
        userAchievements: [...state.userAchievements, data]
      }));

      // Award XP and Coins
      if (achievement.xp_reward > 0) {
        // Add XP (would need XP tracking)
      }

      if (achievement.coin_reward > 0) {
        await get().addCoins(userId, achievement.coin_reward, `Achievement: ${achievement.name}`);
      }

      // Show toast notification
      toast.success(`🏆 Achievement freigeschaltet!`, {
        description: `${achievement.name} - +${achievement.xp_reward} XP, +${achievement.coin_reward} Coins`,
        duration: 5000,
      });

      console.log(`Achievement unlocked: ${achievement.name}`);
    } catch (error) {
      console.error('Unlock achievement error:', error);
    }
  },

  getAchievementProgress: (achievementId) => {
    const { achievementProgress } = get();
    return achievementProgress[achievementId] || 0;
  },
}));
