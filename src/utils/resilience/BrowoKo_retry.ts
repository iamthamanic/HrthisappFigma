/**
 * RETRY WITH EXPONENTIAL BACKOFF
 * ================================
 * Automatically retry failed operations with exponential backoff
 * 
 * Part of Phase 4 - Priority 4 - Resilience Patterns
 * 
 * Features:
 * - Exponential backoff with jitter
 * - Configurable retry conditions
 * - Timeout support
 * - Rate limit awareness
 * - Detailed error logging
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => api.fetchData(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */

import {
  NetworkError,
  TimeoutError,
  ServiceUnavailableError,
  RateLimitError,
  isRetryableError,
  getRetryDelay as getDefaultRetryDelay,
} from '../errors/ErrorTypes';

/**
 * Retry Configuration Options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  
  /** Operation timeout in milliseconds (default: 10000) */
  timeout?: number;
  
  /** Custom function to determine if error should be retried */
  shouldRetry?: (error: any) => boolean;
  
  /** Custom function to calculate retry delay */
  getRetryDelay?: (error: any, attemptNumber: number) => number;
  
  /** Callback called before each retry attempt */
  onRetry?: (error: any, attemptNumber: number, delay: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  timeout: 10000,
  shouldRetry: isRetryableError,
  getRetryDelay: getDefaultRetryDelay,
};

/**
 * Retry statistics
 */
export interface RetryStats {
  totalAttempts: number;
  successfulAttempt?: number;
  totalDelay: number;
  errors: any[];
}

/**
 * Add timeout to a promise
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  context: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(`Operation timed out after ${ms}ms`, context, ms)),
        ms
      )
    ),
  ]);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(
  attemptNumber: number,
  initialDelay: number,
  backoffMultiplier: number,
  maxDelay: number
): number {
  // Calculate base delay with exponential backoff
  const baseDelay = Math.min(
    initialDelay * Math.pow(backoffMultiplier, attemptNumber - 1),
    maxDelay
  );
  
  // Add jitter (±20% randomness to prevent thundering herd)
  const jitterRange = baseDelay * 0.2;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  
  return Math.max(0, Math.round(baseDelay + jitter));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration
 * @returns Promise with the function result
 * @throws Last error if all retries fail
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const data = await retryWithBackoff(() => fetchData());
 * 
 * // With custom options
 * const data = await retryWithBackoff(
 *   () => fetchData(),
 *   {
 *     maxRetries: 5,
 *     initialDelay: 2000,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms due to:`, error.message);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const stats: RetryStats = {
    totalAttempts: 0,
    totalDelay: 0,
    errors: [],
  };
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    stats.totalAttempts++;
    
    try {
      // Add timeout wrapper if specified
      const result = opts.timeout
        ? await withTimeout(fn(), opts.timeout, 'retryWithBackoff')
        : await fn();
      
      // Success! Record stats and return
      stats.successfulAttempt = attempt + 1;
      
      if (attempt > 0) {
        console.log(
          `✅ Retry successful on attempt ${attempt + 1}/${opts.maxRetries + 1}`,
          stats
        );
      }
      
      return result;
    } catch (error) {
      lastError = error;
      stats.errors.push(error);
      
      // Check if we should retry
      const shouldRetry = attempt < opts.maxRetries && opts.shouldRetry(error);
      
      if (!shouldRetry) {
        // Don't retry, throw the error
        if (attempt === 0) {
          // First attempt failed and not retryable
          throw error;
        } else {
          // Exhausted retries
          console.error(
            `❌ All retry attempts exhausted (${stats.totalAttempts}/${opts.maxRetries + 1})`,
            { error, stats }
          );
          throw error;
        }
      }
      
      // Calculate delay using custom function or default
      let delay: number;
      
      if (options.getRetryDelay) {
        delay = options.getRetryDelay(error, attempt + 1);
      } else {
        // Use rate limit delay if available, otherwise exponential backoff
        if (error instanceof RateLimitError && error.retryAfter) {
          delay = error.retryAfter * 1000;
        } else {
          delay = calculateBackoffDelay(
            attempt + 1,
            opts.initialDelay,
            opts.backoffMultiplier,
            opts.maxDelay
          );
        }
      }
      
      // Enforce max delay
      delay = Math.min(delay, opts.maxDelay);
      stats.totalDelay += delay;
      
      // Log retry
      console.warn(
        `⚠️ Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`,
        {
          error: error.message || String(error),
          context: error.context,
          delay,
        }
      );
      
      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(error, attempt + 1, delay);
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Create a retry-wrapped version of a function
 * 
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryWrapper(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3 }
 * );
 * 
 * const data = await fetchWithRetry();
 * ```
 */
export function createRetryWrapper<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): () => Promise<T> {
  return () => retryWithBackoff(fn, options);
}

/**
 * Retry multiple operations in parallel with individual retry logic
 * 
 * @example
 * ```typescript
 * const [users, posts, comments] = await retryAllSettled([
 *   () => fetchUsers(),
 *   () => fetchPosts(),
 *   () => fetchComments(),
 * ]);
 * ```
 */
export async function retryAllSettled<T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(
    fns.map(fn => retryWithBackoff(fn, options))
  );
}

/**
 * Retry with different strategies
 */
export const RetryStrategies = {
  /**
   * Aggressive retry - Quick retries for time-sensitive operations
   */
  AGGRESSIVE: {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
    timeout: 5000,
  } as RetryOptions,
  
  /**
   * Balanced retry - Default strategy
   */
  BALANCED: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    timeout: 10000,
  } as RetryOptions,
  
  /**
   * Conservative retry - Slow retries for expensive operations
   */
  CONSERVATIVE: {
    maxRetries: 2,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 3,
    timeout: 30000,
  } as RetryOptions,
  
  /**
   * No retry - For operations that should never be retried
   */
  NONE: {
    maxRetries: 0,
  } as RetryOptions,
};
