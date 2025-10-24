/**
 * API ERROR TYPES
 * ===============
 * Custom error types for better error handling across the application
 * 
 * These errors provide:
 * - Structured error information
 * - Error codes for programmatic handling
 * - Context about where the error occurred
 * - Original error preservation for debugging
 * 
 * Usage:
 * ```typescript
 * throw new ValidationError(
 *   'Invalid email format',
 *   'AuthService.signIn',
 *   { email: 'Email must be valid' }
 * );
 * ```
 */

/**
 * BASE API ERROR
 * ==============
 * Base class for all API errors
 */
export class ApiError extends Error {
  code: string;
  context: string;
  originalError?: any;
  timestamp: Date;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context: string = 'API',
    originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date();

    // Maintain proper stack trace (only available in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    // Override in subclasses for custom user messages
    return this.message;
  }
}

/**
 * NETWORK ERROR
 * =============
 * Thrown when network requests fail
 */
export class NetworkError extends ApiError {
  constructor(message: string, context: string, originalError?: any) {
    super(message, 'NETWORK_ERROR', context, originalError);
    this.name = 'NetworkError';
  }

  getUserMessage(): string {
    return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
  }
}

/**
 * VALIDATION ERROR
 * ================
 * Thrown when input validation fails
 */
export class ValidationError extends ApiError {
  validationErrors: Record<string, string>;

  constructor(
    message: string,
    context: string,
    validationErrors: Record<string, string> = {},
    originalError?: any
  ) {
    super(message, 'VALIDATION_ERROR', context, originalError);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }

  getUserMessage(): string {
    const errors = Object.values(this.validationErrors).filter(Boolean);
    if (errors.length > 0) {
      return errors.join(', ');
    }
    return this.message;
  }
}

/**
 * AUTHENTICATION ERROR
 * ====================
 * Thrown when authentication fails
 */
export class AuthenticationError extends ApiError {
  constructor(message: string, context: string, originalError?: any) {
    super(message, 'AUTH_ERROR', context, originalError);
    this.name = 'AuthenticationError';
  }

  getUserMessage(): string {
    return 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.';
  }
}

/**
 * AUTHORIZATION ERROR
 * ===================
 * Thrown when user lacks permissions
 */
export class AuthorizationError extends ApiError {
  requiredRole?: string;

  constructor(
    message: string,
    context: string,
    requiredRole?: string,
    originalError?: any
  ) {
    super(message, 'AUTHORIZATION_ERROR', context, originalError);
    this.name = 'AuthorizationError';
    this.requiredRole = requiredRole;
  }

  getUserMessage(): string {
    return 'Sie haben keine Berechtigung für diese Aktion.';
  }
}

/**
 * NOT FOUND ERROR
 * ===============
 * Thrown when a resource is not found
 */
export class NotFoundError extends ApiError {
  resource: string;

  constructor(resource: string, context: string, originalError?: any) {
    super(`${resource} nicht gefunden`, 'NOT_FOUND', context, originalError);
    this.name = 'NotFoundError';
    this.resource = resource;
  }

  getUserMessage(): string {
    return `${this.resource} wurde nicht gefunden.`;
  }
}

/**
 * CONFLICT ERROR
 * ==============
 * Thrown when there's a conflict (e.g., duplicate entry)
 */
export class ConflictError extends ApiError {
  constructor(message: string, context: string, originalError?: any) {
    super(message, 'CONFLICT', context, originalError);
    this.name = 'ConflictError';
  }

  getUserMessage(): string {
    return 'Ein Konflikt ist aufgetreten. Möglicherweise existiert dieser Eintrag bereits.';
  }
}

/**
 * RATE LIMIT ERROR
 * ================
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends ApiError {
  retryAfter?: number; // seconds

  constructor(
    message: string,
    context: string,
    retryAfter?: number,
    originalError?: any
  ) {
    super(message, 'RATE_LIMIT', context, originalError);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  getUserMessage(): string {
    if (this.retryAfter) {
      return `Zu viele Anfragen. Bitte versuchen Sie es in ${this.retryAfter} Sekunden erneut.`;
    }
    return 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.';
  }
}

/**
 * SERVER ERROR
 * ============
 * Thrown when server returns 5xx error
 */
export class ServerError extends ApiError {
  statusCode?: number;

  constructor(
    message: string,
    context: string,
    statusCode?: number,
    originalError?: any
  ) {
    super(message, 'SERVER_ERROR', context, originalError);
    this.name = 'ServerError';
    this.statusCode = statusCode;
  }

  getUserMessage(): string {
    return 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
  }
}

/**
 * TIMEOUT ERROR
 * =============
 * Thrown when request times out
 */
export class TimeoutError extends ApiError {
  timeout: number; // milliseconds

  constructor(
    message: string,
    context: string,
    timeout: number,
    originalError?: any
  ) {
    super(message, 'TIMEOUT', context, originalError);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }

  getUserMessage(): string {
    return 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.';
  }
}
