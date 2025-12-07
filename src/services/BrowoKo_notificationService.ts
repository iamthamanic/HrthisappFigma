/**
 * NOTIFICATION SERVICE (v4.0.0)
 * CRUD operations for notifications with real-time support
 */

import { supabase } from '../utils/supabase/client';
import type {
  Notification,
  CreateNotificationPayload,
  NotificationType,
} from '../types/notifications';

class NotificationService {
  /**
   * Create a notification
   */
  async create(payload: CreateNotificationPayload): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.user_id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data || {},
          link: payload.link || null,
          related_id: payload.related_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[NotificationService.create] Error:', error);
        return null;
      }

      return data as Notification;
    } catch (error) {
      console.error('[NotificationService.create] Exception:', error);
      return null;
    }
  }

  /**
   * Create bulk notifications (for multiple users)
   */
  async createBulk(
    userIds: string[],
    payload: Omit<CreateNotificationPayload, 'user_id'>
  ): Promise<Notification[]> {
    try {
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        link: payload.link || null,
        related_id: payload.related_id || null,
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('[NotificationService.createBulk] Error:', error);
        return [];
      }

      return data as Notification[];
    } catch (error) {
      console.error('[NotificationService.createBulk] Exception:', error);
      return [];
    }
  }

  /**
   * Get all notifications for user
   */
  async getAll(userId: string, unreadOnly = false): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) {
        // Silent fail - table doesn't exist or network error
        // This is expected when migrations haven't been run
        return [];
      }

      return data as Notification[];
    } catch (error) {
      // Silent fail - table doesn't exist or network error
      // This is expected when migrations haven't been run
      return [];
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(
    userId: string,
    type?: NotificationType
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        p_user_id: userId,
        p_type: type || null,
      });

      if (error) {
        console.error('[NotificationService.getUnreadCount] Error:', error);
        return 0;
      }

      return data as number;
    } catch (error) {
      console.error('[NotificationService.getUnreadCount] Exception:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        console.error('[NotificationService.markAsRead] Error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService.markAsRead] Exception:', error);
      return false;
    }
  }

  /**
   * Mark all notifications of type as read
   */
  async markTypeAsRead(
    userId: string,
    type: NotificationType
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('mark_notifications_read_by_type', {
        p_user_id: userId,
        p_type: type,
      });

      if (error) {
        console.error('[NotificationService.markTypeAsRead] Error:', error);
        return 0;
      }

      return data as number;
    } catch (error) {
      console.error('[NotificationService.markTypeAsRead] Exception:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('[NotificationService.delete] Error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService.delete] Exception:', error);
      return false;
    }
  }

  /**
   * Delete all read notifications for user
   */
  async deleteAllRead(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', true)
        .select();

      if (error) {
        console.error('[NotificationService.deleteAllRead] Error:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('[NotificationService.deleteAllRead] Exception:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();