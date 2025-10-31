/**
 * @file BrowoKo_useLeaveReminders.ts
 * @domain BrowoKo - Leave Reminders
 * @description Manages pre-leave reminder notifications
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { LeaveRequest } from '../types/database';

interface ReminderSettings {
  enabled: boolean;
  daysBefore: number; // Send reminder X days before leave starts
  notifyRoles: ('ADMIN' | 'HR' | 'TEAMLEAD')[]; // Which roles to notify
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  daysBefore: 3,
  notifyRoles: ['HR', 'TEAMLEAD'],
};

export function useLeaveReminders(customSettings?: Partial<ReminderSettings>) {
  const [settings] = useState<ReminderSettings>({
    ...DEFAULT_SETTINGS,
    ...customSettings,
  });

  // Check and send reminders for upcoming leaves
  const checkAndSendReminders = useCallback(async () => {
    if (!settings.enabled) return;

    try {
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + settings.daysBefore);

      // Get approved leaves starting on target date that haven't sent reminder yet
      const { data: upcomingLeaves, error } = await supabase
        .from('leave_requests')
        .select('*, users!leave_requests_user_id_fkey(first_name, last_name, email)')
        .eq('status', 'APPROVED')
        .eq('reminder_sent', false)
        .gte('start_date', targetDate.toISOString().split('T')[0])
        .lte('start_date', targetDate.toISOString().split('T')[0]);

      if (error) throw error;
      if (!upcomingLeaves || upcomingLeaves.length === 0) return;

      // Send reminders for each leave
      for (const leave of upcomingLeaves) {
        await sendReminderNotification(leave, settings.notifyRoles);
        
        // Mark reminder as sent
        await supabase
          .from('leave_requests')
          .update({ reminder_sent: true })
          .eq('id', leave.id);
      }

      console.log(`✅ Sent ${upcomingLeaves.length} leave reminders`);
    } catch (error) {
      console.error('Error checking/sending reminders:', error);
    }
  }, [settings]);

  // Send reminder notification
  const sendReminderNotification = async (
    leave: LeaveRequest & { users?: any },
    notifyRoles: string[]
  ) => {
    try {
      // Get users with specified roles
      const { data: recipients, error } = await supabase
        .from('users')
        .select('id')
        .in('role', notifyRoles)
        .eq('is_active', true);

      if (error) throw error;
      if (!recipients || recipients.length === 0) return;

      const userName = leave.users
        ? `${leave.users.first_name} ${leave.users.last_name}`
        : 'Mitarbeiter';

      const startDate = new Date(leave.start_date).toLocaleDateString('de-DE');
      const endDate = new Date(leave.end_date).toLocaleDateString('de-DE');
      const typeLabel = leave.type === 'VACATION' ? 'Urlaub' : 'Abwesenheit';

      const notifications = recipients.map(recipient => ({
        user_id: recipient.id,
        title: 'Bevorstehender Urlaub',
        message: `${userName} ist bald abwesend (${typeLabel}): ${startDate} - ${endDate}`,
        type: 'leave',
        read: false,
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Error sending reminder notification:', error);
    }
  };

  // Manual trigger for testing
  const triggerReminderCheck = useCallback(() => {
    return checkAndSendReminders();
  }, [checkAndSendReminders]);

  // Auto-check on mount and daily
  useEffect(() => {
    if (!settings.enabled) return;

    // Initial check
    checkAndSendReminders();

    // Set up daily check (every 24 hours at midnight)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // First timeout until midnight
    const midnightTimeout = setTimeout(() => {
      checkAndSendReminders();

      // Then set up daily interval
      const dailyInterval = setInterval(checkAndSendReminders, 24 * 60 * 60 * 1000);

      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [settings.enabled, checkAndSendReminders]);

  return {
    settings,
    triggerReminderCheck,
  };
}

/**
 * Helper to update reminder settings
 * Can be used in admin settings
 */
export function useReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);

  const updateSettings = (newSettings: Partial<ReminderSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetToDefaults,
    defaults: DEFAULT_SETTINGS,
  };
}
