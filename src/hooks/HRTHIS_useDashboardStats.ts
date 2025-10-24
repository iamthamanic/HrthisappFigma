/**
 * @file HRTHIS_useDashboardStats.ts
 * @domain HRTHIS - Dashboard
 * @description Custom hook for dashboard statistics (vacation, gamification)
 * @created Phase 2.2 - Priority 4 Refactoring
 * @updated v4.10.15 - Time tracking removed
 */

import { useEffect, useState } from 'react';
import { useGamificationStore } from '../stores/gamificationStore';
import { useAuthStore } from '../stores/HRTHIS_authStore';

export function useDashboardStats() {
  const { user, profile } = useAuthStore();
  const { coins, xp, level, loadUserStats } = useGamificationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        await loadUserStats(user.id);
      } catch (error) {
        console.error('Load dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Calculate vacation
  const totalVacationDays = profile?.vacation_days || 30;
  const usedVacationDays = 0; // TODO: Get from leave requests
  const remainingVacationDays = totalVacationDays - usedVacationDays;

  // Calculate XP progress to next level
  const nextLevelXP = (level || 1) * 100;
  const currentXP = xp || 0;
  const xpProgress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 0;

  return {
    loading,
    
    // Vacation
    totalVacationDays,
    usedVacationDays,
    remainingVacationDays,
    
    // Gamification
    coins,
    xp,
    level,
    nextLevelXP,
    currentXP,
    xpProgress,
  };
}
