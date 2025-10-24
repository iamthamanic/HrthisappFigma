import { create } from 'zustand';
import { supabase } from '../utils/supabase/client';

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  available: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface RewardState {
  rewards: Reward[];
  loading: boolean;
  error: string | null;

  // Actions
  loadRewards: () => Promise<void>;
  createReward: (reward: Omit<Reward, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>;
  updateReward: (id: string, updates: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
}

export const useRewardStore = create<RewardState>((set, get) => ({
  rewards: [],
  loading: false,
  error: null,

  loadRewards: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('cost', { ascending: true });

      if (error) {
        // If table doesn't exist, silently fail with empty array
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          // Silently handle missing table - rewards feature is optional
          set({ rewards: [], loading: false, error: null });
          return;
        }
        throw error;
      }

      set({ rewards: data || [], loading: false });
    } catch (error: any) {
      console.error('Load rewards error:', error);
      set({ error: error.message, loading: false, rewards: [] });
    }
  },

  createReward: async (reward) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rewards')
        .insert({
          ...reward,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          const errorMsg = 'Rewards-Tabelle nicht gefunden. Bitte führe die Migration 008_rewards_system.sql aus.';
          set({ error: errorMsg, loading: false });
          throw new Error(errorMsg);
        }
        throw error;
      }

      set((state) => ({
        rewards: [...state.rewards, data],
        loading: false,
      }));
    } catch (error: any) {
      console.error('Create reward error:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateReward: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('rewards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          const errorMsg = 'Rewards-Tabelle nicht gefunden. Bitte führe die Migration 008_rewards_system.sql aus.';
          set({ error: errorMsg, loading: false });
          throw new Error(errorMsg);
        }
        throw error;
      }

      set((state) => ({
        rewards: state.rewards.map((r) => (r.id === id ? data : r)),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Update reward error:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteReward: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          const errorMsg = 'Rewards-Tabelle nicht gefunden. Bitte führe die Migration 008_rewards_system.sql aus.';
          set({ error: errorMsg, loading: false });
          throw new Error(errorMsg);
        }
        throw error;
      }

      set((state) => ({
        rewards: state.rewards.filter((r) => r.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Delete reward error:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
