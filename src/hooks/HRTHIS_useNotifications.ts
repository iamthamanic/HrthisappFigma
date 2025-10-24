/**
 * USE NOTIFICATIONS HOOK (v4.0.0)
 * React hook for notification system integration
 */

import { useEffect } from 'react';
import { useNotificationStore } from '../stores/HRTHIS_notificationStore';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import type { NotificationBadgeCounts } from '../types/notifications';

export function useNotifications() {
  const { user } = useAuthStore();
  const { badgeCounts, initialize, cleanup, markPageAsRead } = useNotificationStore();

  // Initialize on mount
  useEffect(() => {
    if (user?.id) {
      console.log('[useNotifications] Initializing for user:', user.id);
      initialize(user.id);
    }

    return () => {
      cleanup();
    };
  }, [user?.id, initialize, cleanup]);

  return {
    badgeCounts,
    markPageAsRead,
  };
}

/**
 * Hook for specific page badge
 */
export function usePageBadge(page: keyof NotificationBadgeCounts) {
  const { badgeCounts, markPageAsRead } = useNotificationStore();

  const count = badgeCounts[page];

  const markAsRead = () => {
    markPageAsRead(page);
  };

  return {
    count,
    markAsRead,
  };
}
