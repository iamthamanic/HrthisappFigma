/**
 * BASE API SERVICE
 * ================
 * Base class for all domain services
 * 
 * Provides common functionality:
 * - Error handling and transformation
 * - Request/response logging
 * - Supabase client access
 * - Common utilities
 * 
 * All domain services (AuthService, UserService, etc.) extend this class.
 * 
 * Usage:
 * ```typescript
 * export class AuthService extends ApiService {
 *   async signIn(email: string, password: string) {
 *     this.logRequest('signIn', 'AuthService', { email });
 *     
 *     try {
 *       const { data, error } = await this.supabase.auth.signInWithPassword({
 *         email,
 *         password,
 *       });
 *       
 *       if (error) throw error;
 *       
 *       this.logResponse('AuthService.signIn', data);
 *       return data;
 *     } catch (error: any) {
 *       this.handleError(error, 'AuthService.signIn');
 *     }
 *   }
 * }
 * ```
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  NetworkError,
  ServerError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from './ApiError';

/**
 * BASE SERVICE CLASS
 * ==================
 */
export abstract class ApiService {
  protected supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * HANDLE ERROR
   * ============
   * Transform and throw appropriate error type
   * 
   * Converts Supabase errors to our custom error types
   * for consistent error handling across the app.
   */
  protected handleError(error: any, context: string): never {
    console.error(`[${context}] Error:`, error);

    // If it's already our custom error, just throw it
    if (error instanceof ApiError) {
      throw error;
    }

    // Network/Connection errors
    if (
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('NetworkError')
    ) {
      throw new NetworkError(
        error.message || 'Netzwerkfehler',
        context,
        error
      );
    }

    // Timeout errors
    if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
      throw new TimeoutError(
        error.message || 'Request timeout',
        context,
        30000, // 30s default
        error
      );
    }

    // Authentication errors (Supabase auth errors)
    if (
      error.message?.includes('Invalid login credentials') ||
      error.message?.includes('Email not confirmed') ||
      error.message?.includes('Invalid email or password') ||
      error.status === 401
    ) {
      throw new AuthenticationError(
        error.message || 'Authentifizierung fehlgeschlagen',
        context,
        error
      );
    }

    // Authorization errors
    if (
      error.message?.includes('permission denied') ||
      error.message?.includes('not authorized') ||
      error.status === 403
    ) {
      throw new AuthorizationError(
        error.message || 'Keine Berechtigung',
        context,
        undefined,
        error
      );
    }

    // Not found errors
    if (error.status === 404 || error.code === 'PGRST116') {
      throw new NotFoundError('Ressource', context, error);
    }

    // Conflict errors (duplicate, unique constraint violations)
    if (
      error.status === 409 ||
      error.code === '23505' || // PostgreSQL unique violation
      error.message?.includes('duplicate key') ||
      error.message?.includes('already exists')
    ) {
      throw new ConflictError(
        error.message || 'Konflikt: Eintrag existiert bereits',
        context,
        error
      );
    }

    // Server errors (5xx)
    if (error.status >= 500 && error.status < 600) {
      throw new ServerError(
        error.message || 'Serverfehler',
        context,
        error.status,
        error
      );
    }

    // Generic API error for anything else
    throw new ApiError(
      error.message || 'Ein Fehler ist aufgetreten',
      error.code || 'UNKNOWN_ERROR',
      context,
      error
    );
  }

  /**
   * LOG REQUEST
   * ===========
   * Log request details in development mode
   */
  protected logRequest(method: string, context: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${context}] ${method}`, data || '');
    }
  }

  /**
   * LOG RESPONSE
   * ============
   * Log response details in development mode
   */
  protected logResponse(context: string, data: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${context}] Response:`, data);
    }
  }

  /**
   * VALIDATE REQUIRED
   * =================
   * Validate that required fields are present
   * 
   * Usage:
   * ```typescript
   * this.validateRequired({ email, password }, ['email', 'password']);
   * ```
   */
  protected validateRequired(
    data: Record<string, any>,
    requiredFields: string[]
  ): void {
    const missing = requiredFields.filter(
      (field) => !data[field] || data[field] === ''
    );

    if (missing.length > 0) {
      throw new ApiError(
        `Missing required fields: ${missing.join(', ')}`,
        'VALIDATION_ERROR',
        'ApiService.validateRequired'
      );
    }
  }

  /**
   * RETRY WITH BACKOFF
   * ==================
   * Retry a function with exponential backoff
   * 
   * Usage:
   * ```typescript
   * const result = await this.retryWithBackoff(
   *   () => this.supabase.from('users').select(),
   *   3, // max retries
   *   1000 // initial delay (ms)
   * );
   * ```
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i);
          console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * BATCH PROCESS
   * =============
   * Process items in batches
   * 
   * Usage:
   * ```typescript
   * await this.batchProcess(
   *   userIds,
   *   async (batch) => {
   *     await this.supabase.from('users').update({ active: true }).in('id', batch);
   *   },
   *   10 // batch size
   * );
   * ```
   */
  protected async batchProcess<T>(
    items: T[],
    processFn: (batch: T[]) => Promise<void>,
    batchSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await processFn(batch);
    }
  }

  /**
   * SAFE QUERY
   * ==========
   * Execute a Supabase query with error handling
   * 
   * Usage:
   * ```typescript
   * const users = await this.safeQuery(
   *   () => this.supabase.from('users').select(),
   *   'UserService.getUsers'
   * );
   * ```
   */
  protected async safeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<T> {
    try {
      const { data, error } = await queryFn();

      if (error) {
        this.handleError(error, context);
      }

      if (!data) {
        throw new NotFoundError('Data', context);
      }

      return data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, context);
    }
  }
}
