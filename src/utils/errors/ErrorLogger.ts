/**
 * ERROR LOGGER
 * ============
 * Advanced error logging system
 * 
 * Part of Phase 3 - Priority 4 - Error Handling
 * 
 * Features:
 * - Console logging with colors
 * - Error categorization
 * - Stack trace analysis
 * - Error history tracking
 * - Performance metrics
 */

import { ApiError } from '../../services/base/ApiError';
import { getErrorSeverity, type ErrorSeverity } from './ErrorHandler';

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  error: any;
  context: string;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
}

/**
 * Error logger class
 */
class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 100;
  private enabled: boolean = true;

  /**
   * Log an error
   */
  log(error: any, context: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      error,
      context,
      severity: getErrorSeverity(error),
      message: this.getErrorMessage(error),
      stack: error?.stack,
      metadata,
    };

    // Add to logs
    this.logs.unshift(entry);

    // Trim logs if needed
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging
    this.logToConsole(entry);

    // Could send to external service here
    // this.sendToExternalService(entry);
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const color = this.getSeverityColor(entry.severity);
    const icon = this.getSeverityIcon(entry.severity);

    console.group(
      `%c${icon} [${entry.severity.toUpperCase()}] ${entry.context}`,
      `color: ${color}; font-weight: bold;`
    );

    console.error('Message:', entry.message);

    if (entry.error instanceof ApiError) {
      console.error('Error Code:', entry.error.code);
      if (entry.error.originalError) {
        console.error('Original Error:', entry.error.originalError);
      }
    }

    if (entry.metadata) {
      console.error('Metadata:', entry.metadata);
    }

    if (entry.stack) {
      console.error('Stack Trace:', entry.stack);
    }

    console.error('Timestamp:', entry.timestamp.toISOString());

    console.groupEnd();
  }

  /**
   * Get error message
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }

  /**
   * Get severity color
   */
  private getSeverityColor(severity: ErrorSeverity): string {
    switch (severity) {
      case 'low':
        return '#0ea5e9'; // Blue
      case 'medium':
        return '#f59e0b'; // Orange
      case 'high':
        return '#ef4444'; // Red
      case 'critical':
        return '#dc2626'; // Dark Red
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case 'low':
        return 'ℹ️';
      case 'medium':
        return '⚠️';
      case 'high':
        return '❌';
      case 'critical':
        return '🔥';
      default:
        return '❓';
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.logs.filter((log) => log.severity === severity);
  }

  /**
   * Get logs by context
   */
  getLogsByContext(context: string): ErrorLogEntry[] {
    return this.logs.filter((log) => log.context.includes(context));
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): ErrorLogEntry[] {
    return this.logs.slice(0, count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Enable logging
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Get error statistics
   */
  getStatistics(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byContext: Record<string, number>;
    last24Hours: number;
  } {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byContext: Record<string, number> = {};
    let last24Hours = 0;

    this.logs.forEach((log) => {
      // Count by severity
      bySeverity[log.severity]++;

      // Count by context
      if (!byContext[log.context]) {
        byContext[log.context] = 0;
      }
      byContext[log.context]++;

      // Count last 24 hours
      if (log.timestamp >= yesterday) {
        last24Hours++;
      }
    });

    return {
      total: this.logs.length,
      bySeverity,
      byContext,
      last24Hours,
    };
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Check if there are critical errors
   */
  hasCriticalErrors(): boolean {
    return this.logs.some((log) => log.severity === 'critical');
  }

  /**
   * Get error rate (errors per minute)
   */
  getErrorRate(minutes: number = 5): number {
    const now = new Date();
    const cutoff = new Date(now.getTime() - minutes * 60 * 1000);
    const recentErrors = this.logs.filter((log) => log.timestamp >= cutoff);
    return recentErrors.length / minutes;
  }
}

// Singleton instance
const errorLogger = new ErrorLogger();

/**
 * Log error (convenience function)
 */
export function logError(
  error: any,
  context: string,
  metadata?: Record<string, any>
): void {
  errorLogger.log(error, context, metadata);
}

/**
 * Get error logger instance
 */
export function getErrorLogger(): ErrorLogger {
  return errorLogger;
}

/**
 * Initialize error logger
 */
export function initErrorLogger(config?: {
  maxLogs?: number;
  enabled?: boolean;
}): void {
  if (config?.maxLogs !== undefined) {
    (errorLogger as any).maxLogs = config.maxLogs;
  }
  if (config?.enabled !== undefined) {
    if (config.enabled) {
      errorLogger.enable();
    } else {
      errorLogger.disable();
    }
  }
}

export default errorLogger;
