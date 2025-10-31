/**
 * RESILIENCE PATTERNS - INDEX
 * ============================
 * Unified exports for all resilience patterns
 * 
 * Part of Phase 4 - Priority 4 - Resilience Patterns
 * 
 * Available patterns:
 * - Retry with exponential backoff
 * - Circuit breaker
 * - Timeout handling
 * - Combined resilience wrapper
 * 
 * @example
 * ```typescript
 * import { withResilience } from './utils/resilience';
 * 
 * const data = await withResilience(
 *   () => api.fetchData(),
 *   { retry: true, circuitBreaker: true, timeout: 5000 }
 * );
 * ```
 */

// Export retry utilities
export {
  retryWithBackoff,
  createRetryWrapper,
  retryAllSettled,
  RetryStrategies,
  type RetryOptions,
  type RetryStats,
} from './BrowoKo_retry';

// Export circuit breaker
export {
  CircuitBreaker,
  CircuitState,
  circuitBreakers,
  createCircuitBreakerWrapper,
  CircuitBreakerError,
  type CircuitBreakerOptions,
  type CircuitBreakerStats,
} from './BrowoKo_circuitBreaker';

// Export timeout utilities
export {
  withTimeout,
  withAbortableTimeout,
  withProgressTimeout,
  raceWithTimeout,
  allWithTimeout,
  AdaptiveTimeout,
  TimeoutStrategies,
  createTimeoutConfig,
  type TimeoutConfig,
} from './BrowoKo_timeout';

// Export error types
export {
  NetworkError,
  TimeoutError,
  ServiceUnavailableError,
  RateLimitError,
  isRetryableError,
} from '../errors/ErrorTypes';

/**
 * Combined resilience configuration
 */
export interface ResilienceConfig {
  /** Enable retry with backoff */
  retry?: boolean | {
    maxRetries?: number;
    initialDelay?: number;
    strategy?: 'aggressive' | 'balanced' | 'conservative';
  };
  
  /** Enable circuit breaker */
  circuitBreaker?: boolean | {
    failureThreshold?: number;
    resetTimeout?: number;
  };
  
  /** Timeout in milliseconds */
  timeout?: number | {
    duration: number;
    strategy?: 'quick' | 'normal' | 'slow';
  };
  
  /** Context name for logging */
  context?: string;
}

/**
 * Execute function with combined resilience patterns
 * 
 * This is the main entry point that combines retry, circuit breaker,
 * and timeout handling into a single, easy-to-use wrapper.
 * 
 * @param fn - Function to execute
 * @param config - Resilience configuration
 * @returns Promise with the function result
 * 
 * @example
 * ```typescript
 * // Simple usage with defaults
 * const data = await withResilience(() => fetchData());
 * 
 * // With custom configuration
 * const data = await withResilience(
 *   () => fetchData(),
 *   {
 *     retry: { strategy: 'aggressive' },
 *     circuitBreaker: { failureThreshold: 3 },
 *     timeout: 5000,
 *     context: 'fetchData'
 *   }
 * );
 * ```
 */
export async function withResilience<T>(
  fn: () => Promise<T>,
  config: ResilienceConfig = {}
): Promise<T> {
  const {
    retry = true,
    circuitBreaker: cbConfig = false,
    timeout: timeoutConfig,
    context = 'operation',
  } = config;
  
  // Import here to avoid circular dependencies
  const { retryWithBackoff, RetryStrategies } = await import('./BrowoKo_retry');
  const { circuitBreakers } = await import('./BrowoKo_circuitBreaker');
  const { withTimeout, TimeoutStrategies } = await import('./BrowoKo_timeout');
  
  // Build the execution chain
  let executor = fn;
  
  // Layer 1: Timeout (innermost)
  if (timeoutConfig) {
    const timeoutMs = typeof timeoutConfig === 'number'
      ? timeoutConfig
      : timeoutConfig.duration;
    
    const originalExecutor = executor;
    executor = () => withTimeout(originalExecutor(), timeoutMs, context);
  }
  
  // Layer 2: Circuit Breaker
  if (cbConfig) {
    const originalExecutor = executor;
    executor = () => circuitBreakers.supabase.execute(originalExecutor);
  }
  
  // Layer 3: Retry (outermost)
  if (retry) {
    const retryOptions = typeof retry === 'boolean'
      ? RetryStrategies.BALANCED
      : retry.strategy
        ? RetryStrategies[retry.strategy.toUpperCase() as keyof typeof RetryStrategies]
        : {
            maxRetries: retry.maxRetries,
            initialDelay: retry.initialDelay,
          };
    
    return retryWithBackoff(executor, retryOptions);
  }
  
  return executor();
}

/**
 * Resilience presets for common scenarios
 */
export const ResiliencePresets = {
  /**
   * Critical operations - Maximum resilience
   * - 5 retries with aggressive backoff
   * - Circuit breaker enabled
   * - 10s timeout
   */
  CRITICAL: {
    retry: { strategy: 'aggressive' as const, maxRetries: 5 },
    circuitBreaker: { failureThreshold: 3 },
    timeout: 10000,
  } as ResilienceConfig,
  
  /**
   * Standard operations - Balanced resilience
   * - 3 retries with balanced backoff
   * - Circuit breaker enabled
   * - 10s timeout
   */
  STANDARD: {
    retry: { strategy: 'balanced' as const },
    circuitBreaker: true,
    timeout: 10000,
  } as ResilienceConfig,
  
  /**
   * Quick operations - Minimal resilience
   * - 2 retries with aggressive backoff
   * - No circuit breaker
   * - 5s timeout
   */
  QUICK: {
    retry: { strategy: 'aggressive' as const, maxRetries: 2 },
    circuitBreaker: false,
    timeout: 5000,
  } as ResilienceConfig,
  
  /**
   * Background operations - Conservative resilience
   * - 2 retries with conservative backoff
   * - Circuit breaker enabled
   * - 60s timeout
   */
  BACKGROUND: {
    retry: { strategy: 'conservative' as const },
    circuitBreaker: true,
    timeout: 60000,
  } as ResilienceConfig,
  
  /**
   * No resilience - Direct execution
   */
  NONE: {
    retry: false,
    circuitBreaker: false,
  } as ResilienceConfig,
};
