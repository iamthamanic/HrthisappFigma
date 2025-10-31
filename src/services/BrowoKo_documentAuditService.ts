/**
 * DOCUMENT AUDIT SERVICE
 * ======================
 * Verwaltet Audit-Logs für Dokumente
 * Trackt alle Aktionen: Upload, Download, View, Update, Delete
 */

import { ApiService } from './base/ApiService';
import { ValidationError } from './base/ApiError';

export type AuditAction = 'UPLOAD' | 'DOWNLOAD' | 'VIEW' | 'UPDATE' | 'DELETE';

export interface DocumentAuditLog {
  id: string;
  document_id: string;
  user_id: string | null;
  action: AuditAction;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CreateAuditLogData {
  document_id: string;
  user_id?: string;
  action: AuditAction;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogFilters {
  document_id?: string;
  user_id?: string;
  action?: AuditAction;
  start_date?: string;
  end_date?: string;
}

export interface AuditReport {
  id: string;
  action: AuditAction;
  created_at: string;
  document_title: string | null;
  document_category: string | null;
  user_name: string | null;
  user_email: string | null;
  details: Record<string, any>;
  ip_address?: string;
}

/**
 * DOCUMENT AUDIT SERVICE
 * ======================
 * Verwaltet Audit-Logs für Compliance und Nachvollziehbarkeit
 */
export class DocumentAuditService extends ApiService {
  /**
   * Erstelle einen Audit-Log-Eintrag
   */
  async createAuditLog(data: CreateAuditLogData): Promise<DocumentAuditLog> {
    this.logRequest('createAuditLog', 'DocumentAuditService', data);

    if (!data.document_id) {
      throw new ValidationError(
        'Document ID ist erforderlich',
        'DocumentAuditService.createAuditLog',
        { document_id: 'Document ID ist erforderlich' }
      );
    }

    if (!data.action) {
      throw new ValidationError(
        'Action ist erforderlich',
        'DocumentAuditService.createAuditLog',
        { action: 'Action ist erforderlich' }
      );
    }

    try {
      const { data: auditLog, error } = await this.supabase
        .from('document_audit_logs')
        .insert({
          document_id: data.document_id,
          user_id: data.user_id || null,
          action: data.action,
          details: data.details || {},
          ip_address: data.ip_address || null,
          user_agent: data.user_agent || null,
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'DocumentAuditService.createAuditLog');
      }

      this.logResponse('DocumentAuditService.createAuditLog', { id: auditLog?.id });
      return auditLog as DocumentAuditLog;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'DocumentAuditService.createAuditLog');
    }
  }

  /**
   * Hole Audit-Logs mit optionalen Filtern
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<DocumentAuditLog[]> {
    this.logRequest('getAuditLogs', 'DocumentAuditService', { filters });

    try {
      let query = this.supabase
        .from('document_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.document_id) {
          query = query.eq('document_id', filters.document_id);
        }
        if (filters.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters.action) {
          query = query.eq('action', filters.action);
        }
        if (filters.start_date) {
          query = query.gte('created_at', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('created_at', filters.end_date);
        }
      }

      const { data: logs, error } = await query;

      if (error) {
        this.handleError(error, 'DocumentAuditService.getAuditLogs');
      }

      this.logResponse('DocumentAuditService.getAuditLogs', { count: logs?.length || 0 });
      return (logs || []) as DocumentAuditLog[];
    } catch (error: any) {
      this.handleError(error, 'DocumentAuditService.getAuditLogs');
    }
  }

  /**
   * Hole Audit-Report mit User- und Dokument-Informationen
   */
  async getAuditReport(filters?: AuditLogFilters): Promise<AuditReport[]> {
    this.logRequest('getAuditReport', 'DocumentAuditService', { filters });

    try {
      let query = this.supabase
        .from('document_audit_report')
        .select('*');

      // Apply filters
      if (filters) {
        if (filters.document_id) {
          query = query.eq('document_id', filters.document_id);
        }
        if (filters.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters.action) {
          query = query.eq('action', filters.action);
        }
        if (filters.start_date) {
          query = query.gte('created_at', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('created_at', filters.end_date);
        }
      }

      const { data: report, error } = await query;

      if (error) {
        this.handleError(error, 'DocumentAuditService.getAuditReport');
      }

      this.logResponse('DocumentAuditService.getAuditReport', { count: report?.length || 0 });
      return (report || []) as AuditReport[];
    } catch (error: any) {
      this.handleError(error, 'DocumentAuditService.getAuditReport');
    }
  }

  /**
   * Hole Audit-Logs für ein bestimmtes Dokument
   */
  async getDocumentAuditHistory(documentId: string): Promise<DocumentAuditLog[]> {
    this.logRequest('getDocumentAuditHistory', 'DocumentAuditService', { documentId });

    if (!documentId) {
      throw new ValidationError(
        'Document ID ist erforderlich',
        'DocumentAuditService.getDocumentAuditHistory',
        { documentId: 'Document ID ist erforderlich' }
      );
    }

    return await this.getAuditLogs({ document_id: documentId });
  }

  /**
   * Hole Audit-Logs für einen bestimmten User
   */
  async getUserAuditHistory(userId: string): Promise<DocumentAuditLog[]> {
    this.logRequest('getUserAuditHistory', 'DocumentAuditService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'DocumentAuditService.getUserAuditHistory',
        { userId: 'User ID ist erforderlich' }
      );
    }

    return await this.getAuditLogs({ user_id: userId });
  }

  /**
   * Logge einen Document-Download
   */
  async logDownload(documentId: string, userId?: string): Promise<void> {
    await this.createAuditLog({
      document_id: documentId,
      user_id: userId,
      action: 'DOWNLOAD',
      details: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Logge einen Document-View
   */
  async logView(documentId: string, userId?: string): Promise<void> {
    await this.createAuditLog({
      document_id: documentId,
      user_id: userId,
      action: 'VIEW',
      details: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Hole Audit-Statistiken
   */
  async getAuditStats(filters?: AuditLogFilters): Promise<{
    total: number;
    by_action: Record<AuditAction, number>;
    by_user: Record<string, number>;
  }> {
    this.logRequest('getAuditStats', 'DocumentAuditService', { filters });

    try {
      const logs = await this.getAuditLogs(filters);

      const total = logs.length;
      const byAction: Record<string, number> = {};
      const byUser: Record<string, number> = {};

      logs.forEach((log) => {
        // Count by action
        byAction[log.action] = (byAction[log.action] || 0) + 1;

        // Count by user
        if (log.user_id) {
          byUser[log.user_id] = (byUser[log.user_id] || 0) + 1;
        }
      });

      const stats = {
        total,
        by_action: byAction as Record<AuditAction, number>,
        by_user: byUser,
      };

      this.logResponse('DocumentAuditService.getAuditStats', stats);
      return stats;
    } catch (error: any) {
      this.handleError(error, 'DocumentAuditService.getAuditStats');
    }
  }
}
