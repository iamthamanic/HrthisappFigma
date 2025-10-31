/**
 * BrowoKoordinator - Shared Logger
 * 
 * Provides consistent logging across all Edge Functions
 */

export class Logger {
  constructor(private functionName: string) {}

  info(message: string, context?: Record<string, any>) {
    console.log(`[${this.functionName}] INFO: ${message}`, context || '');
  }

  error(message: string, error?: unknown, context?: Record<string, any>) {
    console.error(`[${this.functionName}] ERROR: ${message}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });
  }

  warn(message: string, context?: Record<string, any>) {
    console.warn(`[${this.functionName}] WARN: ${message}`, context || '');
  }

  debug(message: string, context?: Record<string, any>) {
    console.debug(`[${this.functionName}] DEBUG: ${message}`, context || '');
  }
}

/**
 * Create logger for function
 */
export function createLogger(functionName: string): Logger {
  return new Logger(functionName);
}
