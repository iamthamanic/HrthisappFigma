/**
 * ============================================
 * COIN ACHIEVEMENTS SERVICE (v3.9.0)
 * ============================================
 * Description: Service Layer für Coin Achievements System
 * ============================================
 */

import { supabase } from '../utils/supabase/client';
import type { CoinAchievement, CoinAchievementWithProgress, UserCoinAchievement } from '../types/database';

/**
 * Get all coin achievements with progress for a user
 */
export async function getCoinAchievementsWithProgress(
  userId: string
): Promise<CoinAchievementWithProgress[]> {
  const { data, error } = await supabase.rpc('get_coin_achievements_with_progress', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching coin achievements with progress:', error);
    throw new Error('Fehler beim Laden der Coin Achievements');
  }

  return data || [];
}

/**
 * Check and unlock achievements for a user
 * Call this after coin transactions to see if new achievements are unlocked
 */
export async function checkAndUnlockAchievements(userId: string): Promise<{
  achievement_id: string;
  title: string;
  required_coins: number;
  newly_unlocked: boolean;
}[]> {
  const { data, error } = await supabase.rpc('check_and_unlock_coin_achievements', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error checking/unlocking achievements:', error);
    throw new Error('Fehler beim Prüfen der Achievements');
  }

  return data || [];
}

/**
 * Mark an achievement as claimed
 */
export async function claimAchievement(
  userId: string,
  achievementId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_coin_achievements')
    .update({
      is_claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('achievement_id', achievementId);

  if (error) {
    console.error('Error claiming achievement:', error);
    throw new Error('Fehler beim Einlösen des Achievements');
  }
}

/**
 * Get all unlocked achievements for a user
 */
export async function getUnlockedAchievements(
  userId: string
): Promise<UserCoinAchievement[]> {
  const { data, error } = await supabase
    .from('user_coin_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error fetching unlocked achievements:', error);
    throw new Error('Fehler beim Laden der freigeschalteten Achievements');
  }

  return data || [];
}

/**
 * Get achievement statistics for a user
 */
export async function getAchievementStats(userId: string): Promise<{
  total_achievements: number;
  unlocked_achievements: number;
  claimed_achievements: number;
  next_achievement: CoinAchievementWithProgress | null;
}> {
  const achievements = await getCoinAchievementsWithProgress(userId);

  const unlocked = achievements.filter((a) => a.is_unlocked);
  const claimed = achievements.filter((a) => a.is_claimed);
  
  // Find next achievement (not unlocked, sorted by required coins)
  const nextAchievement = achievements
    .filter((a) => !a.is_unlocked)
    .sort((a, b) => a.required_coins - b.required_coins)[0] || null;

  return {
    total_achievements: achievements.length,
    unlocked_achievements: unlocked.length,
    claimed_achievements: claimed.length,
    next_achievement: nextAchievement,
  };
}

/**
 * ADMIN: Create a new coin achievement
 */
export async function createCoinAchievement(
  achievement: Omit<CoinAchievement, 'id' | 'created_at' | 'updated_at'>
): Promise<CoinAchievement> {
  const { data, error } = await supabase
    .from('coin_achievements')
    .insert(achievement)
    .select()
    .single();

  if (error) {
    console.error('Error creating coin achievement:', error);
    throw new Error('Fehler beim Erstellen des Achievements');
  }

  return data;
}

/**
 * ADMIN: Update a coin achievement
 */
export async function updateCoinAchievement(
  achievementId: string,
  updates: Partial<CoinAchievement>
): Promise<CoinAchievement> {
  const { data, error } = await supabase
    .from('coin_achievements')
    .update(updates)
    .eq('id', achievementId)
    .select()
    .single();

  if (error) {
    console.error('Error updating coin achievement:', error);
    throw new Error('Fehler beim Aktualisieren des Achievements');
  }

  return data;
}

/**
 * ADMIN: Delete a coin achievement
 */
export async function deleteCoinAchievement(achievementId: string): Promise<void> {
  const { error } = await supabase
    .from('coin_achievements')
    .delete()
    .eq('id', achievementId);

  if (error) {
    console.error('Error deleting coin achievement:', error);
    throw new Error('Fehler beim Löschen des Achievements');
  }
}

/**
 * ADMIN: Get all coin achievements
 */
export async function getAllCoinAchievements(): Promise<CoinAchievement[]> {
  const { data, error } = await supabase
    .from('coin_achievements')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching all coin achievements:', error);
    throw new Error('Fehler beim Laden der Achievements');
  }

  return data || [];
}

/**
 * ADMIN: Distribute coins to users (OLD API - DEPRECATED)
 * @deprecated Use distributeCoinsToUsers instead
 */
export async function distributeCoin(params: {
  recipient_type: 'SINGLE' | 'ALL';
  user_id?: string;
  amount: number;
  reason: string;
  distributed_by: string;
  organization_id: string;
}): Promise<{ success: boolean; count: number }> {
  const { recipient_type, user_id, amount, reason, distributed_by, organization_id } = params;

  try {
    if (recipient_type === 'SINGLE' && user_id) {
      // Single user distribution
      const { error } = await supabase.from('coin_transactions').insert({
        user_id,
        amount,
        reason: reason,
        type: 'EARNED',
        metadata: {
          distributed_by: distributed_by,
          transaction_type: 'ADMIN_GRANT',
        },
      });

      if (error) {
        console.error('Error distributing coins to single user:', error);
        throw new Error('Fehler beim Verteilen der Coins');
      }

      return { success: true, count: 1 };
    } else if (recipient_type === 'ALL') {
      // Get all users in organization
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', organization_id);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw new Error('Fehler beim Laden der Mitarbeiter');
      }

      if (!users || users.length === 0) {
        throw new Error('Keine Mitarbeiter gefunden');
      }

      // Create coin transactions for all users
      const transactions = users.map((u) => ({
        user_id: u.id,
        amount,
        reason: reason,
        type: 'EARNED',
        metadata: {
          distributed_by: distributed_by,
          transaction_type: 'ADMIN_GRANT',
        },
      }));

      const { error: insertError } = await supabase
        .from('coin_transactions')
        .insert(transactions);

      if (insertError) {
        console.error('Error distributing coins to all users:', insertError);
        throw new Error('Fehler beim Verteilen der Coins');
      }

      return { success: true, count: users.length };
    }

    throw new Error('Invalid recipient type');
  } catch (error) {
    console.error('Error in distributeCoin:', error);
    throw error;
  }
}

/**
 * ADMIN: Distribute coins to multiple users (NEW API v3.9.4)
 * NOTE: coin_transactions table schema: id, user_id, amount, reason, type, metadata, created_at
 * NO created_by column exists in the table!
 */
export async function distributeCoinsToUsers(params: {
  user_ids: string[];
  amount: number;
  reason: string;
  distributed_by: string;
}): Promise<{ success: boolean; count: number }> {
  const { user_ids, amount, reason, distributed_by } = params;

  try {
    if (!user_ids || user_ids.length === 0) {
      throw new Error('Keine Mitarbeiter ausgewählt');
    }

    // Create coin transactions for all selected users
    // Store distributed_by in metadata since created_by column doesn't exist
    const transactions = user_ids.map((userId) => ({
      user_id: userId,
      amount,
      reason: reason, // Column is 'reason', not 'description'
      type: 'EARNED' as const,
      metadata: {
        distributed_by: distributed_by,
        transaction_type: 'ADMIN_GRANT',
      },
    }));

    const { error } = await supabase
      .from('coin_transactions')
      .insert(transactions);

    if (error) {
      console.error('Error distributing coins to users:', error);
      throw new Error('Fehler beim Verteilen der Coins');
    }

    return { success: true, count: user_ids.length };
  } catch (error) {
    console.error('Error in distributeCoinsToUsers:', error);
    throw error;
  }
}

/**
 * Get coin balance for a specific user
 */
export async function getUserCoinBalance(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_user_coin_balance', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching user coin balance:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Get coin balances for multiple users (for sorting)
 */
export async function getUsersCoinBalances(
  userIds: string[]
): Promise<Record<string, number>> {
  if (!userIds || userIds.length === 0) {
    return {};
  }

  try {
    // Get all EARNED transactions (positive)
    const { data: earnedData, error: earnedError } = await supabase
      .from('coin_transactions')
      .select('user_id, amount')
      .eq('type', 'EARNED')
      .in('user_id', userIds);

    if (earnedError) throw earnedError;

    // Get all SPENT transactions (negative)
    const { data: spentData, error: spentError } = await supabase
      .from('coin_transactions')
      .select('user_id, amount')
      .eq('type', 'SPENT')
      .in('user_id', userIds);

    if (spentError) throw spentError;

    // Calculate balances
    const balances: Record<string, number> = {};
    
    // Initialize all users with 0
    userIds.forEach((id) => {
      balances[id] = 0;
    });

    // Add earned coins
    earnedData?.forEach((tx) => {
      balances[tx.user_id] = (balances[tx.user_id] || 0) + tx.amount;
    });

    // Subtract spent coins
    spentData?.forEach((tx) => {
      balances[tx.user_id] = (balances[tx.user_id] || 0) - tx.amount;
    });

    return balances;
  } catch (error) {
    console.error('Error fetching users coin balances:', error);
    return {};
  }
}
