// =====================================================================================
// BROWO KOORDINATOR AUDIT LOG SERVICE
// =====================================================================================
// Description: Service für Audit-Logs
// Version: 1.0.0
// =====================================================================================

import { supabase } from '../utils/supabase/client';

// =====================================================================================
// TYPES
// =====================================================================================

export type AuditLogCategory =
  | 'personal_data'
  | 'work_info'
  | 'time_tracking'
  | 'time_account'
  | 'absences'
  | 'documents'
  | 'benefits'
  | 'coins'
  | 'achievements'
  | 'learning'
  | 'permissions'
  | 'general';

export interface AuditLog {
  id: string;
  user_id: string | null;
  changed_by_name: string;
  changed_by_role: string;
  affected_user_id: string;
  affected_user_name: string;
  table_name: string;
  record_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  category: AuditLogCategory;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string;
  change_reason: string | null;
  valid_from: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogsByCategory {
  [key: string]: AuditLog[];
}

// =====================================================================================
// CATEGORY METADATA
// =====================================================================================

export const AUDIT_CATEGORY_METADATA: Record<
  AuditLogCategory,
  { label: string; icon: string; order: number }
> = {
  personal_data: {
    label: 'Persönliche Daten',
    icon: 'User',
    order: 1,
  },
  work_info: {
    label: 'Arbeitsinformationen',
    icon: 'Briefcase',
    order: 2,
  },
  absences: {
    label: 'Abwesenheiten',
    icon: 'Calendar',
    order: 3,
  },
  documents: {
    label: 'Dokumente',
    icon: 'FileText',
    order: 4,
  },
  benefits: {
    label: 'Benefits',
    icon: 'Gift',
    order: 5,
  },
  coins: {
    label: 'Coins',
    icon: 'Coins',
    order: 6,
  },
  achievements: {
    label: 'Achievements',
    icon: 'Award',
    order: 7,
  },
  learning: {
    label: 'Lernfortschritt',
    icon: 'GraduationCap',
    order: 8,
  },
  permissions: {
    label: 'Berechtigungen',
    icon: 'Shield',
    order: 9,
  },
  general: {
    label: 'Allgemein',
    icon: 'Info',
    order: 10,
  },
};

// =====================================================================================
// AUDIT LOG SERVICE
// =====================================================================================

class AuditLogService {
  /**
   * Get all audit logs for a specific user
   */
  async getUserAuditLogs(userId: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('affected_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[AuditLogService] Error fetching user audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user, grouped by category
   */
  async getUserAuditLogsByCategory(userId: string): Promise<AuditLogsByCategory> {
    try {
      const logs = await this.getUserAuditLogs(userId);

      const grouped: AuditLogsByCategory = {};

      logs.forEach((log) => {
        if (!grouped[log.category]) {
          grouped[log.category] = [];
        }
        grouped[log.category].push(log);
      });

      return grouped;
    } catch (error) {
      console.error('[AuditLogService] Error grouping audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific category and user
   */
  async getUserAuditLogsBySpecificCategory(
    userId: string,
    category: AuditLogCategory
  ): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('affected_user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[AuditLogService] Error fetching category audit logs:', error);
      throw error;
    }
  }

  /**
   * Get recent audit logs (last 30 days)
   */
  async getRecentAuditLogs(userId: string, days: number = 30): Promise<AuditLog[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('affected_user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[AuditLogService] Error fetching recent audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs count by category
   */
  async getAuditLogsCountByCategory(userId: string): Promise<Record<AuditLogCategory, number>> {
    try {
      const logs = await this.getUserAuditLogs(userId);

      const counts: Record<string, number> = {};

      Object.keys(AUDIT_CATEGORY_METADATA).forEach((category) => {
        counts[category] = 0;
      });

      logs.forEach((log) => {
        counts[log.category] = (counts[log.category] || 0) + 1;
      });

      return counts as Record<AuditLogCategory, number>;
    } catch (error) {
      console.error('[AuditLogService] Error counting audit logs:', error);
      throw error;
    }
  }

  /**
   * Manually create an audit log (für spezielle Fälle)
   */
  async createAuditLog(log: {
    affected_user_id: string;
    category: AuditLogCategory;
    description: string;
    table_name?: string;
    action?: 'INSERT' | 'UPDATE' | 'DELETE';
    field_name?: string;
    old_value?: string;
    new_value?: string;
    change_reason?: string;
  }): Promise<AuditLog | null> {
    try {
      // Get current user info
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user details
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, role')
        .eq('id', user.id)
        .single();

      const changedByName = userData
        ? `${userData.first_name} ${userData.last_name}`
        : 'Unbekannt';

      // Get affected user name
      const { data: affectedUserData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', log.affected_user_id)
        .single();

      const affectedUserName = affectedUserData
        ? `${affectedUserData.first_name} ${affectedUserData.last_name}`
        : 'Unbekannt';

      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          changed_by_name: changedByName,
          changed_by_role: userData?.role || 'user',
          affected_user_id: log.affected_user_id,
          affected_user_name: affectedUserName,
          table_name: log.table_name || 'manual',
          action: log.action || 'UPDATE',
          category: log.category,
          field_name: log.field_name,
          old_value: log.old_value,
          new_value: log.new_value,
          description: log.description,
          change_reason: log.change_reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[AuditLogService] Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Get all audit logs (Admin only)
   */
  async getAllAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[AuditLogService] Error fetching all audit logs:', error);
      throw error;
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(searchTerm: string, userId?: string): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .or(
          `description.ilike.%${searchTerm}%,changed_by_name.ilike.%${searchTerm}%,affected_user_name.ilike.%${searchTerm}%`
        )
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('affected_user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[AuditLogService] Error searching audit logs:', error);
      throw error;
    }
  }
}

export const auditLogService = new AuditLogService();
