/**
 * NOTIFICATION STORE (v4.0.0)
 * Zustand store with Supabase Realtime for notifications
 */

import { create } from 'zustand';
import { supabase } from '../utils/supabase/client';
import { getServices } from '../services';
import { notificationService } from '../services/BrowoKo_notificationService';
import type {
  Notification,
  NotificationType,
  NotificationBadgeCounts,
} from '../types/notifications';
import { NOTIFICATION_TYPE_TO_BADGE } from '../types/notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationState {
  // State
  notifications: Notification[];
  badgeCounts: NotificationBadgeCounts;
  loading: boolean;
  initialized: boolean;
  realtimeChannel: RealtimeChannel | null;

  // Actions
  initialize: (userId: string) => Promise<void>;
  cleanup: () => void;
  refreshCounts: () => void;
  markTypeAsRead: (type: NotificationType) => Promise<void>;
  markPageAsRead: (page: keyof NotificationBadgeCounts) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial State
  notifications: [],
  badgeCounts: {
    overview: 0,
    timeAndLeave: 0,
    benefits: 0,
    documents: 0,
    learning: 0,
    total: 0,
  },
  loading: false,
  initialized: false,
  realtimeChannel: null,

  /**
   * Initialize notification system
   * - Load initial notifications
   * - Calculate badge counts
   * - Subscribe to realtime updates
   */
  initialize: async (userId: string) => {
    if (get().initialized) return;

    set({ loading: true });

    try {
      console.log('[NotificationStore] Initializing for user:', userId);

      // Load unread notifications
      const notifications = await notificationService.getAll(userId, true);
      
      console.log('[NotificationStore] Loaded notifications:', notifications.length);

      // Calculate badge counts
      const badgeCounts = calculateBadgeCounts(notifications);

      set({
        notifications,
        badgeCounts,
        loading: false,
        initialized: true,
      });

      // Subscribe to realtime updates via RealtimeService
      const services = getServices();
      
      // Single subscription for all events (INSERT, UPDATE, DELETE)
      const unsubscribe = services.realtime.subscribeToTable(
        'notifications',
        `user_id=eq.${userId}`,
        ['INSERT', 'UPDATE', 'DELETE'],
        (payload) => {
          const eventType = payload.eventType || 'INSERT';
          
          if (eventType === 'INSERT') {
            console.log('[NotificationStore] New notification:', payload.new);
            
            const newNotification = payload.new as Notification;
            const state = get();

            // Add to notifications list
            const updatedNotifications = [newNotification, ...state.notifications];

            // Recalculate badge counts
            const updatedBadgeCounts = calculateBadgeCounts(updatedNotifications);

            set({
              notifications: updatedNotifications,
              badgeCounts: updatedBadgeCounts,
            });
          } else if (eventType === 'UPDATE') {
            console.log('[NotificationStore] Notification updated:', payload.new);
            
            const updatedNotification = payload.new as Notification;
            const state = get();

            // Update in notifications list
            const updatedNotifications = state.notifications.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            );

            // Recalculate badge counts
            const updatedBadgeCounts = calculateBadgeCounts(updatedNotifications);

            set({
              notifications: updatedNotifications,
              badgeCounts: updatedBadgeCounts,
            });
          } else if (eventType === 'DELETE') {
            console.log('[NotificationStore] Notification deleted:', payload.old);
            
            const deletedId = (payload.old as Notification).id;
            const state = get();

            // Remove from notifications list
            const updatedNotifications = state.notifications.filter(
              (n) => n.id !== deletedId
            );

            // Recalculate badge counts
            const updatedBadgeCounts = calculateBadgeCounts(updatedNotifications);

            set({
              notifications: updatedNotifications,
              badgeCounts: updatedBadgeCounts,
            });
          }
        }
      );

      // Store unsubscribe function
      set({ realtimeChannel: { unsubscribe } as any });
    } catch (error) {
      console.error('[NotificationStore] Initialization error:', error);
      
      // Check if error is due to missing table (migration not run)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation "notifications" does not exist') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('table') ||
          errorMessage.includes('notifications')) {
        console.warn('⚠️ Notifications table does not exist yet. Run migration 053_notifications_system.sql');
        console.warn('ℹ️ App will continue to work without notifications.');
      }
      
      // Set to initialized anyway to prevent retry loops
      // App continues to work without notifications (graceful degradation)
      set({ 
        loading: false, 
        initialized: true, // Mark as initialized to prevent retry
        notifications: [],
        badgeCounts: {
          overview: 0,
          timeAndLeave: 0,
          benefits: 0,
          documents: 0,
          learning: 0,
          total: 0,
        }
      });
    }
  },

  /**
   * Cleanup realtime subscription
   */
  cleanup: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel && (realtimeChannel as any).unsubscribe) {
      console.log('[NotificationStore] Cleaning up realtime channel');
      (realtimeChannel as any).unsubscribe();
      set({ realtimeChannel: null, initialized: false });
    }
  },

  /**
   * Refresh badge counts (manual refresh)
   */
  refreshCounts: () => {
    const { notifications } = get();
    const badgeCounts = calculateBadgeCounts(notifications);
    set({ badgeCounts });
  },

  /**
   * Mark all notifications of a specific type as read
   */
  markTypeAsRead: async (type: NotificationType) => {
    const state = get();
    const userId = state.notifications[0]?.user_id;
    if (!userId) return;

    try {
      await notificationService.markTypeAsRead(userId, type);

      // Update local state
      const updatedNotifications = state.notifications.map((n) =>
        n.type === type ? { ...n, read: true, read_at: new Date().toISOString() } : n
      );

      const updatedBadgeCounts = calculateBadgeCounts(updatedNotifications);

      set({
        notifications: updatedNotifications,
        badgeCounts: updatedBadgeCounts,
      });
    } catch (error) {
      console.error('[NotificationStore] Mark type as read error:', error);
    }
  },

  /**
   * Mark all notifications for a page/category as read
   */
  markPageAsRead: async (page: keyof NotificationBadgeCounts) => {
    const state = get();
    const userId = state.notifications[0]?.user_id;
    if (!userId) return;

    try {
      // Get all notification types for this page
      const typesToMark = Object.entries(NOTIFICATION_TYPE_TO_BADGE)
        .filter(([, badge]) => badge === page)
        .map(([type]) => type as NotificationType);

      // Mark each type as read
      for (const type of typesToMark) {
        await notificationService.markTypeAsRead(userId, type);
      }

      // Update local state
      const updatedNotifications = state.notifications.map((n) =>
        typesToMark.includes(n.type)
          ? { ...n, read: true, read_at: new Date().toISOString() }
          : n
      );

      const updatedBadgeCounts = calculateBadgeCounts(updatedNotifications);

      set({
        notifications: updatedNotifications,
        badgeCounts: updatedBadgeCounts,
      });
    } catch (error) {
      console.error('[NotificationStore] Mark page as read error:', error);
    }
  },
}));

/**
 * Helper: Calculate badge counts from notifications
 */
function calculateBadgeCounts(
  notifications: Notification[]
): NotificationBadgeCounts {
  const counts: NotificationBadgeCounts = {
    overview: 0,
    timeAndLeave: 0,
    benefits: 0,
    documents: 0,
    learning: 0,
    total: 0,
  };

  notifications.forEach((notification) => {
    if (notification.read) return;

    const badge = NOTIFICATION_TYPE_TO_BADGE[notification.type];
    if (badge) {
      counts[badge]++;
      counts.total++;
    }
  });

  return counts;
}
