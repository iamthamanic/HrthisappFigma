/**
 * ERROR HANDLER
 * =============
 * Central error handling with retry logic
 * 
 * Part of Phase 3 - Priority 4 - Error Handling
 * 
 * Features:
 * - Automatic retry for retryable errors
 * - Exponential backoff
 * - Error logging
 * - User-friendly error messages
 */

import { toast } from 'sonner@2.0.3';
import {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  AuthenticationError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  BusinessLogicError,
  InsufficientPermissionsError,
  ServiceUnavailableError,
  isRetryableError,
  getRetryDelay,
} from './ErrorTypes';
import { logError } from './ErrorLogger';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: (error: any) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: isRetryableError,
};

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  let attemptNumber = 0;

  while (attemptNumber < finalConfig.maxAttempts) {
    attemptNumber++;

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = finalConfig.retryableErrors
        ? finalConfig.retryableErrors(error)
        : isRetryableError(error);

      if (!shouldRetry || attemptNumber >= finalConfig.maxAttempts) {
        break;
      }

      // Calculate delay
      const delay = getRetryDelay(error, attemptNumber);
      const cappedDelay = Math.min(delay, finalConfig.maxDelay);

      console.log(
        `[${context}] Retry attempt ${attemptNumber}/${finalConfig.maxAttempts} after ${cappedDelay}ms`,
        error
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, cappedDelay));
    }
  }

  // All retries failed - throw the last error
  throw lastError;
}

/**
 * Handle error and show user-friendly message
 */
export function handleError(error: any, context: string, showToast: boolean = true): void {
  // Log error
  logError(error, context);

  // Get user-friendly message
  const message = getUserFriendlyMessage(error, context);

  // Show toast notification
  if (showToast) {
    if (error instanceof ValidationError) {
      toast.error(message);
    } else if (error instanceof AuthenticationError) {
      toast.error(message);
    } else if (error instanceof InsufficientPermissionsError) {
      toast.error(message);
    } else if (error instanceof ConflictError) {
      toast.warning(message);
    } else if (error instanceof RateLimitError) {
      toast.warning(message);
    } else if (error instanceof NetworkError || error instanceof TimeoutError) {
      toast.error(message);
    } else if (error instanceof ServiceUnavailableError) {
      toast.error(message);
    } else if (error instanceof BusinessLogicError) {
      toast.error(message);
    } else {
      toast.error(message);
    }
  }
}

/**
 * Get user-friendly error message in German
 */
export function getUserFriendlyMessage(error: any, context?: string): string {
  // Handle known error types
  if (error instanceof ValidationError) {
    return 'Ungültige Eingabedaten. Bitte überprüfen Sie Ihre Eingaben.';
  }

  if (error instanceof AuthenticationError) {
    return 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.';
  }

  if (error instanceof InsufficientPermissionsError) {
    return 'Sie haben keine Berechtigung für diese Aktion.';
  }

  if (error instanceof ConflictError) {
    return 'Die Daten wurden bereits geändert. Bitte aktualisieren Sie die Seite.';
  }

  if (error instanceof RateLimitError) {
    const retryAfter = error.retryAfter || 60;
    return `Zu viele Anfragen. Bitte warten Sie ${retryAfter} Sekunden.`;
  }

  if (error instanceof TimeoutError) {
    return 'Die Anfrage dauerte zu lange. Bitte versuchen Sie es erneut.';
  }

  if (error instanceof ServiceUnavailableError) {
    return 'Der Service ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.';
  }

  if (error instanceof NetworkError) {
    return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
  }

  if (error instanceof DatabaseError) {
    return 'Datenbankfehler. Bitte versuchen Sie es später erneut.';
  }

  if (error instanceof BusinessLogicError) {
    // Use the error message if available
    return error.message || 'Geschäftslogik-Fehler. Bitte wenden Sie sich an den Support.';
  }

  if (error instanceof ApiError) {
    return error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
  }

  // Handle generic errors
  if (error instanceof Error) {
    return error.message || 'Ein unbekannter Fehler ist aufgetreten.';
  }

  // Fallback
  return 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
}

/**
 * Create error notification with action buttons
 */
export function showErrorWithActions(
  error: any,
  context: string,
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>
): void {
  const message = getUserFriendlyMessage(error, context);

  toast.error(message, {
    action: actions
      ? {
          label: actions[0].label,
          onClick: actions[0].onClick,
        }
      : undefined,
  });

  logError(error, context);
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
  showToast: boolean = true
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, showToast);
      throw error;
    }
  }) as T;
}

/**
 * Global error handler for uncaught errors
 */
export function setupGlobalErrorHandler(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    logError(event.reason, 'UnhandledRejection');
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    logError(event.error, 'UncaughtError');
    event.preventDefault();
  });
}

/**
 * Check if error requires authentication
 */
export function requiresAuthentication(error: any): boolean {
  return error instanceof AuthenticationError;
}

/**
 * Check if error requires permission upgrade
 */
export function requiresPermission(error: any): boolean {
  return error instanceof InsufficientPermissionsError;
}

/**
 * Get error severity level
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export function getErrorSeverity(error: any): ErrorSeverity {
  if (error instanceof ValidationError) return 'low';
  if (error instanceof ConflictError) return 'medium';
  if (error instanceof BusinessLogicError) return 'medium';
  if (error instanceof AuthenticationError) return 'high';
  if (error instanceof InsufficientPermissionsError) return 'high';
  if (error instanceof DatabaseError) return 'high';
  if (error instanceof ServiceUnavailableError) return 'critical';
  if (error instanceof NetworkError) return 'medium';

  return 'medium';
}
