/**
 * @file BrowoKo_xpSystem.ts
 * @domain Browo Koordinator - XP System Utilities
 * @description Level calculation, XP rewards, and gamification logic
 * @created Phase 3E - Utils Migration
 */

/**
 * Calculate XP required for a specific level
 */
export function getXPForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.5, level - 1));
}

/**
 * Calculate total XP needed from level 1 to target level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(xp: number): number {
  let level = 1;
  let totalXP = 0;
  
  while (totalXP <= xp) {
    totalXP += getXPForLevel(level);
    if (totalXP > xp) break;
    level++;
  }
  
  return level;
}

/**
 * Calculate progress percentage to next level
 */
export function getProgressToNextLevel(currentXP: number, currentLevel: number): number {
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
  const xpForNextLevel = getTotalXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  
  return (xpInCurrentLevel / xpNeededForLevel) * 100;
}

/**
 * Get level title based on level
 */
export function getLevelTitle(level: number): string {
  if (level >= 20) return 'Legende';
  if (level >= 15) return 'Meister';
  if (level >= 10) return 'Experte';
  if (level >= 5) return 'Fortgeschritten';
  if (level >= 3) return 'Anfänger';
  return 'Neuling';
}

/**
 * Get level color gradient
 */
export function getLevelColor(level: number): { bg: string; text: string } {
  if (level >= 20) return { bg: 'from-purple-500 to-pink-600', text: 'text-purple-600' };
  if (level >= 15) return { bg: 'from-yellow-400 to-orange-500', text: 'text-yellow-600' };
  if (level >= 10) return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-600' };
  if (level >= 5) return { bg: 'from-green-500 to-emerald-500', text: 'text-green-600' };
  return { bg: 'from-gray-400 to-gray-500', text: 'text-gray-600' };
}

/**
 * XP Rewards for different actions
 */
export const XP_REWARDS = {
  // Learning
  VIDEO_WATCHED: 10,
  QUIZ_PASSED: 15,
  QUIZ_PERFECT: 30,
  
  // Time Tracking
  DAY_WORKED: 5,
  WEEK_STREAK: 25,
  MONTH_STREAK: 100,
  
  // Social
  TEAM_INTERACTION: 5,
  HELP_COLLEAGUE: 10,
  
  // Achievements
  ACHIEVEMENT_UNLOCKED: 50,
  
  // Special
  PROFILE_COMPLETE: 20,
  FIRST_LOGIN: 10,
} as const;

/**
 * Add XP to user and calculate new level
 */
export async function addXPToUser(
  supabase: any,
  userId: string,
  xpAmount: number,
  description: string
): Promise<{ newLevel: number; leveledUp: boolean }> {
  try {
    // Get current avatar
    const { data: avatar, error: fetchError } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentXP = avatar.total_xp || 0;
    const currentLevel = avatar.level || 1;
    const newXP = currentXP + xpAmount;
    const newLevel = getLevelFromXP(newXP);
    const leveledUp = newLevel > currentLevel;

    // Update avatar
    const { error: updateError } = await supabase
      .from('user_avatars')
      .update({
        total_xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log XP event
    await supabase
      .from('xp_events')
      .insert({
        user_id: userId,
        xp_amount: xpAmount,
        description: description,
        source: 'SYSTEM',
        metadata: {
          old_level: currentLevel,
          new_level: newLevel,
          leveled_up: leveledUp
        }
      });

    return { newLevel, leveledUp };
  } catch (error) {
    console.error('Add XP error:', error);
    throw error;
  }
}
