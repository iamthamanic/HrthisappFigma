/**
 * NOTIFICATION TYPES (v4.0.0)
 * Type definitions for real-time notification system
 */

// Notification Type Enum
export type NotificationType =
  | 'LEAVE_REQUEST_PENDING'
  | 'LEAVE_REQUEST_APPROVED'
  | 'LEAVE_REQUEST_REJECTED'
  | 'DOCUMENT_UPLOADED'
  | 'BENEFIT_APPROVED'
  | 'BENEFIT_REJECTED'
  | 'COINS_AWARDED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'VIDEO_ADDED'
  | 'ANNOUNCEMENT_CREATED'
  | 'ORGANIGRAM_UPDATED';

// Notification Interface
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  link: string | null;
  related_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

// Create Notification Payload
export interface CreateNotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  link?: string;
  related_id?: string;
}

// Badge Count by Type
export interface NotificationBadgeCounts {
  overview: number;
  timeAndLeave: number;
  benefits: number;
  documents: number;
  learning: number;
  total: number;
}

// Notification Type to Navigation Mapping
export const NOTIFICATION_TYPE_NAVIGATION: Record<NotificationType, string> = {
  LEAVE_REQUEST_PENDING: '/time-and-leave',
  LEAVE_REQUEST_APPROVED: '/time-and-leave',
  LEAVE_REQUEST_REJECTED: '/time-and-leave',
  DOCUMENT_UPLOADED: '/documents',
  BENEFIT_APPROVED: '/benefits',
  BENEFIT_REJECTED: '/benefits',
  COINS_AWARDED: '/achievements',
  ACHIEVEMENT_UNLOCKED: '/achievements',
  VIDEO_ADDED: '/learning',
  ANNOUNCEMENT_CREATED: '/dashboard',
  ORGANIGRAM_UPDATED: '/organigram',
};

// Notification Type to Badge Category Mapping
export const NOTIFICATION_TYPE_TO_BADGE: Record<
  NotificationType,
  keyof NotificationBadgeCounts
> = {
  LEAVE_REQUEST_PENDING: 'timeAndLeave',
  LEAVE_REQUEST_APPROVED: 'timeAndLeave',
  LEAVE_REQUEST_REJECTED: 'timeAndLeave',
  DOCUMENT_UPLOADED: 'documents',
  BENEFIT_APPROVED: 'benefits',
  BENEFIT_REJECTED: 'benefits',
  COINS_AWARDED: 'overview',
  ACHIEVEMENT_UNLOCKED: 'overview',
  VIDEO_ADDED: 'learning',
  ANNOUNCEMENT_CREATED: 'overview',
  ORGANIGRAM_UPDATED: 'overview',
};
