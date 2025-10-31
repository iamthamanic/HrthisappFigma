/**
 * TIMEOUT UTILITIES
 * ==================
 * Advanced timeout handling for async operations
 * 
 * Part of Phase 4 - Priority 4 - Resilience Patterns
 * 
 * Features:
 * - Configurable timeouts
 * - Abort controller integration
 * - Progress tracking
 * - Multiple timeout strategies
 * 
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetchData(),
 *   5000,
 *   'fetchData'
 * );
 * ```
 */

import { TimeoutError } from '../errors/ErrorTypes';

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  /** Timeout duration in milliseconds */
  timeout: number;
  
  /** Context/operation name for error messages */
  context: string;
  
  /** Custom error message */
  errorMessage?: string;
  
  /** AbortController for cancellation */
  abortController?: AbortController;
  
  /** Callback called when timeout occurs */
  onTimeout?: () => void;
}

/**
 * Add timeout to a promise
 * 
 * @param promise - Promise to add timeout to
 * @param timeout - Timeout in milliseconds
 * @param context - Context for error message
 * @returns Promise that rejects on timeout
 * 
 * @example
 * ```typescript
 * const data = await withTimeout(
 *   fetch('/api/data'),
 *   5000,
 *   'API fetch'
 * );
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  context: string = 'operation'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new TimeoutError(
          `${context} timed out after ${timeout}ms`,
          context,
          timeout
        )
      );
    }, timeout);
    
    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Add timeout with abort controller
 * 
 * @example
 * ```typescript
 * const { promise, abort } = withAbortableTimeout(
 *   fetch('/api/data'),
 *   5000,
 *   'API fetch'
 * );
 * 
 * // Can manually abort
 * abort();
 * 
 * const data = await promise;
 * ```
 */
export function withAbortableTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  context: string = 'operation'
): { promise: Promise<T>; abort: () => void } {
  const abortController = new AbortController();
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      abortController.abort();
      reject(
        new TimeoutError(
          `${context} timed out after ${timeout}ms`,
          context,
          timeout
        )
      );
    }, timeout);
  });
  
  const wrappedPromise = Promise.race([promise, timeoutPromise])
    .finally(() => clearTimeout(timeoutId));
  
  return {
    promise: wrappedPromise,
    abort: () => {
      clearTimeout(timeoutId);
      abortController.abort();
    },
  };
}

/**
 * Add timeout with progress tracking
 * 
 * @example
 * ```typescript
 * const data = await withProgressTimeout(
 *   longRunningOperation(),
 *   30000,
 *   'Long operation',
 *   (elapsed) => {
 *     console.log(`Progress: ${elapsed}ms elapsed`);
 *   }
 * );
 * ```
 */
export function withProgressTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  context: string,
  onProgress?: (elapsedMs: number) => void,
  progressInterval: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout;
    let progressIntervalId: NodeJS.Timeout;
    
    // Progress tracking
    if (onProgress) {
      progressIntervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        onProgress(elapsed);
      }, progressInterval);
    }
    
    // Timeout
    timeoutId = setTimeout(() => {
      if (progressIntervalId) clearInterval(progressIntervalId);
      reject(
        new TimeoutError(
          `${context} timed out after ${timeout}ms`,
          context,
          timeout
        )
      );
    }, timeout);
    
    // Wait for promise
    promise
      .then(result => {
        clearTimeout(timeoutId);
        if (progressIntervalId) clearInterval(progressIntervalId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (progressIntervalId) clearInterval(progressIntervalId);
        reject(error);
      });
  });
}

/**
 * Race multiple promises with timeout
 * 
 * @example
 * ```typescript
 * const fastest = await raceWithTimeout(
 *   [fetchFromCache(), fetchFromAPI()],
 *   5000,
 *   'Data fetch'
 * );
 * ```
 */
export function raceWithTimeout<T>(
  promises: Promise<T>[],
  timeout: number,
  context: string
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(
        new TimeoutError(
          `${context} - all operations timed out after ${timeout}ms`,
          context,
          timeout
        )
      );
    }, timeout);
  });
  
  return Promise.race([...promises, timeoutPromise]);
}

/**
 * Execute multiple promises with individual timeouts
 * 
 * @example
 * ```typescript
 * const results = await allWithTimeout(
 *   [
 *     { promise: fetchUsers(), timeout: 5000 },
 *     { promise: fetchPosts(), timeout: 10000 },
 *   ],
 *   'Batch fetch'
 * );
 * ```
 */
export async function allWithTimeout<T>(
  items: Array<{ promise: Promise<T>; timeout: number }>,
  context: string
): Promise<T[]> {
  return Promise.all(
    items.map(({ promise, timeout }, index) =>
      withTimeout(promise, timeout, `${context}[${index}]`)
    )
  );
}

/**
 * Timeout strategies for different scenarios
 */
export const TimeoutStrategies = {
  /** Quick operations (UI interactions, cache reads) */
  QUICK: 2000, // 2s
  
  /** Normal operations (API calls, database queries) */
  NORMAL: 10000, // 10s
  
  /** Slow operations (file uploads, complex queries) */
  SLOW: 30000, // 30s
  
  /** Very slow operations (large file uploads, batch processing) */
  VERY_SLOW: 60000, // 60s
  
  /** Background operations (sync, cleanup) */
  BACKGROUND: 120000, // 2min
};

/**
 * Create timeout configuration for different operation types
 */
export function createTimeoutConfig(
  type: 'quick' | 'normal' | 'slow' | 'very_slow' | 'background',
  context: string
): TimeoutConfig {
  const timeoutMap = {
    quick: TimeoutStrategies.QUICK,
    normal: TimeoutStrategies.NORMAL,
    slow: TimeoutStrategies.SLOW,
    very_slow: TimeoutStrategies.VERY_SLOW,
    background: TimeoutStrategies.BACKGROUND,
  };
  
  return {
    timeout: timeoutMap[type],
    context,
  };
}

/**
 * Adaptive timeout that adjusts based on past execution times
 */
export class AdaptiveTimeout {
  private executionTimes: number[] = [];
  private maxSamples: number;
  private multiplier: number;
  private minTimeout: number;
  private maxTimeout: number;
  
  constructor(
    minTimeout: number = 1000,
    maxTimeout: number = 60000,
    multiplier: number = 2,
    maxSamples: number = 10
  ) {
    this.minTimeout = minTimeout;
    this.maxTimeout = maxTimeout;
    this.multiplier = multiplier;
    this.maxSamples = maxSamples;
  }
  
  /**
   * Execute function with adaptive timeout
   */
  async execute<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    const timeout = this.calculateTimeout();
    const startTime = Date.now();
    
    try {
      const result = await withTimeout(fn(), timeout, context);
      
      // Record execution time
      const executionTime = Date.now() - startTime;
      this.recordExecutionTime(executionTime);
      
      return result;
    } catch (error) {
      // Don't record timeout errors in execution times
      if (!(error instanceof TimeoutError)) {
        const executionTime = Date.now() - startTime;
        this.recordExecutionTime(executionTime);
      }
      throw error;
    }
  }
  
  /**
   * Calculate adaptive timeout based on past executions
   */
  private calculateTimeout(): number {
    if (this.executionTimes.length === 0) {
      return this.maxTimeout;
    }
    
    // Calculate average execution time
    const avgTime = this.executionTimes.reduce((sum, t) => sum + t, 0) / this.executionTimes.length;
    
    // Calculate standard deviation
    const variance = this.executionTimes.reduce(
      (sum, t) => sum + Math.pow(t - avgTime, 2),
      0
    ) / this.executionTimes.length;
    const stdDev = Math.sqrt(variance);
    
    // Timeout = avg + (multiplier * stdDev)
    const adaptiveTimeout = Math.round(avgTime + (this.multiplier * stdDev));
    
    // Clamp to min/max
    return Math.max(
      this.minTimeout,
      Math.min(this.maxTimeout, adaptiveTimeout)
    );
  }
  
  /**
   * Record execution time
   */
  private recordExecutionTime(time: number): void {
    this.executionTimes.push(time);
    
    // Keep only recent samples
    if (this.executionTimes.length > this.maxSamples) {
      this.executionTimes.shift();
    }
  }
  
  /**
   * Get current timeout value
   */
  getCurrentTimeout(): number {
    return this.calculateTimeout();
  }
  
  /**
   * Reset execution history
   */
  reset(): void {
    this.executionTimes = [];
  }
}
