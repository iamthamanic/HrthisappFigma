/**
 * CIRCUIT BREAKER PATTERN
 * ========================
 * Prevent cascading failures by stopping requests to failing services
 * 
 * Part of Phase 4 - Priority 4 - Resilience Patterns
 * 
 * Features:
 * - Three states: CLOSED, OPEN, HALF_OPEN
 * - Automatic failure detection
 * - Configurable thresholds
 * - Recovery testing
 * - Health monitoring
 * 
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({ failureThreshold: 5 });
 * const result = await breaker.execute(() => api.fetchData());
 * ```
 */

/**
 * Circuit Breaker States
 */
export enum CircuitState {
  /** Normal operation - requests flow through */
  CLOSED = 'CLOSED',
  
  /** Service is failing - requests are rejected immediately */
  OPEN = 'OPEN',
  
  /** Testing recovery - limited requests allowed */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  
  /** Number of successes in HALF_OPEN to close circuit (default: 2) */
  successThreshold?: number;
  
  /** Time in ms before trying HALF_OPEN state (default: 60000 = 1min) */
  resetTimeout?: number;
  
  /** Timeout for individual operations in ms (default: 10000 = 10s) */
  operationTimeout?: number;
  
  /** Rolling window size for failure tracking (default: 10) */
  windowSize?: number;
  
  /** Callback when circuit opens */
  onOpen?: () => void;
  
  /** Callback when circuit closes (recovers) */
  onClose?: () => void;
  
  /** Callback when circuit enters half-open state */
  onHalfOpen?: () => void;
}

/**
 * Circuit Breaker Statistics
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  nextAttemptTime?: number;
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public state: CircuitState,
    public nextAttemptTime?: number
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker Implementation
 * 
 * Protects services from cascading failures by monitoring failures
 * and stopping requests when a threshold is exceeded.
 * 
 * State Machine:
 * - CLOSED: Normal operation, all requests pass through
 * - OPEN: Too many failures, reject all requests
 * - HALF_OPEN: Testing recovery, allow limited requests
 * 
 * @example
 * ```typescript
 * // Create circuit breaker
 * const apiBreaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 60000,
 * });
 * 
 * // Use in service
 * async function fetchData() {
 *   return apiBreaker.execute(async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('API Error');
 *     return response.json();
 *   });
 * }
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttemptTime: number = 0;
  private options: Required<Omit<CircuitBreakerOptions, 'onOpen' | 'onClose' | 'onHalfOpen'>>;
  private onOpen?: () => void;
  private onClose?: () => void;
  private onHalfOpen?: () => void;
  
  // Statistics
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  
  // Rolling window for failure tracking
  private recentResults: boolean[] = []; // true = success, false = failure
  
  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      resetTimeout: options.resetTimeout ?? 60000,
      operationTimeout: options.operationTimeout ?? 10000,
      windowSize: options.windowSize ?? 10,
    };
    
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onHalfOpen = options.onHalfOpen;
  }
  
  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      
      if (now < this.nextAttemptTime) {
        // Still in cooldown period
        const waitTime = Math.ceil((this.nextAttemptTime - now) / 1000);
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN. Service unavailable. Try again in ${waitTime}s.`,
          CircuitState.OPEN,
          this.nextAttemptTime
        );
      }
      
      // Cooldown period expired, try half-open state
      this.transitionTo(CircuitState.HALF_OPEN);
    }
    
    this.totalRequests++;
    
    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      
      // Success!
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      
      throw error;
    }
  }
  
  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Circuit breaker operation timeout after ${this.options.operationTimeout}ms`)),
          this.options.operationTimeout
        )
      ),
    ]);
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();
    this.failureCount = 0;
    
    // Add to rolling window
    this.addToWindow(true);
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        // Enough successes, close the circuit
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.failureCount++;
    
    // Add to rolling window
    this.addToWindow(false);
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Failure in half-open state, reopen circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we should open the circuit
      if (this.shouldOpen()) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }
  
  /**
   * Check if circuit should open based on failure threshold
   */
  private shouldOpen(): boolean {
    // Check consecutive failures
    if (this.failureCount >= this.options.failureThreshold) {
      return true;
    }
    
    // Check failure rate in rolling window
    if (this.recentResults.length >= this.options.windowSize) {
      const failures = this.recentResults.filter(r => !r).length;
      const failureRate = failures / this.recentResults.length;
      
      // Open if more than 50% failures in window
      return failureRate > 0.5;
    }
    
    return false;
  }
  
  /**
   * Add result to rolling window
   */
  private addToWindow(success: boolean): void {
    this.recentResults.push(success);
    
    // Keep window size
    if (this.recentResults.length > this.options.windowSize) {
      this.recentResults.shift();
    }
  }
  
  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    
    switch (newState) {
      case CircuitState.OPEN:
        this.nextAttemptTime = Date.now() + this.options.resetTimeout;
        this.successCount = 0;
        console.error(
          `🔴 Circuit breaker OPENED (too many failures: ${this.failureCount}/${this.options.failureThreshold})`,
          { nextAttempt: new Date(this.nextAttemptTime) }
        );
        this.onOpen?.();
        break;
        
      case CircuitState.HALF_OPEN:
        this.successCount = 0;
        this.failureCount = 0;
        console.warn('🟡 Circuit breaker HALF-OPEN (testing recovery)');
        this.onHalfOpen?.();
        break;
        
      case CircuitState.CLOSED:
        this.failureCount = 0;
        this.successCount = 0;
        this.recentResults = [];
        console.log('🟢 Circuit breaker CLOSED (recovered)');
        this.onClose?.();
        break;
    }
  }
  
  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.state === CircuitState.OPEN ? this.nextAttemptTime : undefined,
    };
  }
  
  /**
   * Check if circuit is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }
  
  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    console.log('🔄 Circuit breaker manually reset');
  }
  
  /**
   * Force open circuit (for testing/maintenance)
   */
  forceOpen(duration: number = this.options.resetTimeout): void {
    this.nextAttemptTime = Date.now() + duration;
    this.transitionTo(CircuitState.OPEN);
    console.warn(`⚠️ Circuit breaker force opened for ${duration}ms`);
  }
}

/**
 * Global circuit breaker instances for common services
 */
export const circuitBreakers = {
  /** Circuit breaker for Supabase API calls */
  supabase: new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 2,
    resetTimeout: 60000,
    onOpen: () => console.error('🔴 Supabase circuit breaker opened'),
    onClose: () => console.log('🟢 Supabase circuit breaker closed'),
  }),
  
  /** Circuit breaker for external API calls */
  externalApi: new CircuitBreaker({
    failureThreshold: 3,
    successThreshold: 2,
    resetTimeout: 120000,
    onOpen: () => console.error('🔴 External API circuit breaker opened'),
    onClose: () => console.log('🟢 External API circuit breaker closed'),
  }),
  
  /** Circuit breaker for file uploads */
  fileUpload: new CircuitBreaker({
    failureThreshold: 3,
    successThreshold: 1,
    resetTimeout: 30000,
    operationTimeout: 30000, // Longer timeout for uploads
    onOpen: () => console.error('🔴 File upload circuit breaker opened'),
    onClose: () => console.log('🟢 File upload circuit breaker closed'),
  }),
};

/**
 * Create a circuit breaker wrapper for a function
 * 
 * @example
 * ```typescript
 * const fetchWithBreaker = createCircuitBreakerWrapper(
 *   () => fetch('/api/data'),
 *   { failureThreshold: 5 }
 * );
 * 
 * const data = await fetchWithBreaker();
 * ```
 */
export function createCircuitBreakerWrapper<T>(
  fn: () => Promise<T>,
  options: CircuitBreakerOptions = {}
): () => Promise<T> {
  const breaker = new CircuitBreaker(options);
  return () => breaker.execute(fn);
}
