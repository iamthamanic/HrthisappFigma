import { create } from 'zustand';
import { Notification } from '../types/database';
import { supabase } from '../utils/supabase/client';
import { getServices } from '../services';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  
  // Actions
  loadNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (userId: string, title: string, message: string, type: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  
  // Category counts
  getUnreadCountByCategory: (category: string) => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  loadNotifications: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const unreadCount = data?.filter(n => !n.read).length || 0;
      set({ notifications: data || [], unreadCount });
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const { notifications } = get();
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      const unreadCount = updated.filter(n => !n.read).length;
      set({ notifications: updated, unreadCount });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      const { notifications } = get();
      const updated = notifications.map(n => ({ ...n, read: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const { notifications } = get();
      const updated = notifications.filter(n => n.id !== notificationId);
      const unreadCount = updated.filter(n => !n.read).length;
      set({ notifications: updated, unreadCount });
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  },

  createNotification: async (userId, title, message, type) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const { notifications, unreadCount } = get();
      set({ 
        notifications: [data, ...notifications],
        unreadCount: unreadCount + 1
      });
    } catch (error) {
      console.error('Create notification error:', error);
    }
  },

  subscribeToNotifications: (userId) => {
    // Subscribe to real-time updates via RealtimeService
    const services = getServices();
    const unsubscribe = services.realtime.subscribeToTable(
      'notifications',
      `user_id=eq.${userId}`,
      ['INSERT'],
      (payload) => {
        const { notifications, unreadCount } = get();
        set({
          notifications: [payload.new as Notification, ...notifications],
          unreadCount: unreadCount + 1,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  },

  getUnreadCountByCategory: (category) => {
    const { notifications } = get();
    return notifications.filter(n => !n.read && n.type === category).length;
  },
}));
