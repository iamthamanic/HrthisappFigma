/**
 * ERROR TYPES
 * ===========
 * Enhanced error types for better error handling
 * 
 * Part of Phase 3 - Priority 4 - Error Handling
 * 
 * Features:
 * - Network errors with retry support
 * - Timeout errors
 * - Conflict errors
 * - Rate limit errors
 * - Database errors
 * - Business logic errors
 */

import { ApiError } from '../../services/base/ApiError';

/**
 * Network Error
 * For connection issues, timeouts, etc.
 */
export class NetworkError extends ApiError {
  retryable: boolean;
  statusCode?: number;

  constructor(
    message: string,
    context: string,
    statusCode?: number,
    retryable: boolean = true,
    originalError?: any
  ) {
    super(message, 'NETWORK_ERROR', context, originalError);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

/**
 * Timeout Error
 * For request timeouts
 */
export class TimeoutError extends NetworkError {
  timeout: number;

  constructor(
    message: string,
    context: string,
    timeout: number,
    originalError?: any
  ) {
    super(message, context, 408, true, originalError);
    this.name = 'TimeoutError';
    this.code = 'TIMEOUT_ERROR';
    this.timeout = timeout;
  }
}

/**
 * Conflict Error
 * For data conflicts (409)
 */
export class ConflictError extends ApiError {
  conflictingData?: any;

  constructor(
    message: string,
    context: string,
    conflictingData?: any,
    originalError?: any
  ) {
    super(message, 'CONFLICT_ERROR', context, originalError);
    this.name = 'ConflictError';
    this.conflictingData = conflictingData;
  }
}

/**
 * Rate Limit Error
 * For rate limiting (429)
 */
export class RateLimitError extends ApiError {
  retryAfter?: number; // seconds
  limit?: number;
  remaining?: number;

  constructor(
    message: string,
    context: string,
    retryAfter?: number,
    limit?: number,
    remaining?: number,
    originalError?: any
  ) {
    super(message, 'RATE_LIMIT_ERROR', context, originalError);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Database Error
 * For database-related errors
 */
export class DatabaseError extends ApiError {
  query?: string;
  table?: string;

  constructor(
    message: string,
    context: string,
    query?: string,
    table?: string,
    originalError?: any
  ) {
    super(message, 'DATABASE_ERROR', context, originalError);
    this.name = 'DatabaseError';
    this.query = query;
    this.table = table;
  }
}

/**
 * Business Logic Error
 * For business rule violations
 */
export class BusinessLogicError extends ApiError {
  rule?: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    context: string,
    rule?: string,
    details?: Record<string, any>,
    originalError?: any
  ) {
    super(message, 'BUSINESS_LOGIC_ERROR', context, originalError);
    this.name = 'BusinessLogicError';
    this.rule = rule;
    this.details = details;
  }
}

/**
 * Insufficient Permissions Error
 * For permission/authorization issues
 */
export class InsufficientPermissionsError extends ApiError {
  requiredRole?: string;
  requiredPermission?: string;

  constructor(
    message: string,
    context: string,
    requiredRole?: string,
    requiredPermission?: string,
    originalError?: any
  ) {
    super(message, 'INSUFFICIENT_PERMISSIONS', context, originalError);
    this.name = 'InsufficientPermissionsError';
    this.requiredRole = requiredRole;
    this.requiredPermission = requiredPermission;
  }
}

/**
 * Data Integrity Error
 * For data consistency issues
 */
export class DataIntegrityError extends ApiError {
  field?: string;
  constraint?: string;

  constructor(
    message: string,
    context: string,
    field?: string,
    constraint?: string,
    originalError?: any
  ) {
    super(message, 'DATA_INTEGRITY_ERROR', context, originalError);
    this.name = 'DataIntegrityError';
    this.field = field;
    this.constraint = constraint;
  }
}

/**
 * Service Unavailable Error
 * For service downtime (503)
 */
export class ServiceUnavailableError extends NetworkError {
  estimatedRecovery?: Date;

  constructor(
    message: string,
    context: string,
    estimatedRecovery?: Date,
    originalError?: any
  ) {
    super(message, context, 503, true, originalError);
    this.name = 'ServiceUnavailableError';
    this.code = 'SERVICE_UNAVAILABLE';
    this.estimatedRecovery = estimatedRecovery;
  }
}

/**
 * Parse Error
 * For JSON/data parsing errors
 */
export class ParseError extends ApiError {
  data?: string;
  expectedFormat?: string;

  constructor(
    message: string,
    context: string,
    data?: string,
    expectedFormat?: string,
    originalError?: any
  ) {
    super(message, 'PARSE_ERROR', context, originalError);
    this.name = 'ParseError';
    this.data = data;
    this.expectedFormat = expectedFormat;
  }
}

/**
 * Helper function to create error from HTTP response
 */
export function createErrorFromResponse(
  response: Response,
  context: string,
  originalError?: any
): ApiError {
  const { status, statusText } = response;

  switch (status) {
    case 400:
      return new ValidationError(
        statusText || 'Bad Request',
        context,
        {},
        originalError
      );
    case 401:
      return new AuthenticationError(
        statusText || 'Unauthorized',
        context,
        originalError
      );
    case 403:
      return new InsufficientPermissionsError(
        statusText || 'Forbidden',
        context,
        undefined,
        undefined,
        originalError
      );
    case 404:
      return new NotFoundError(
        'Resource',
        context,
        originalError
      );
    case 408:
      return new TimeoutError(
        statusText || 'Request Timeout',
        context,
        30000,
        originalError
      );
    case 409:
      return new ConflictError(
        statusText || 'Conflict',
        context,
        undefined,
        originalError
      );
    case 429:
      return new RateLimitError(
        statusText || 'Too Many Requests',
        context,
        undefined,
        undefined,
        undefined,
        originalError
      );
    case 500:
      return new DatabaseError(
        statusText || 'Internal Server Error',
        context,
        undefined,
        undefined,
        originalError
      );
    case 503:
      return new ServiceUnavailableError(
        statusText || 'Service Unavailable',
        context,
        undefined,
        originalError
      );
    default:
      return new NetworkError(
        statusText || `HTTP Error ${status}`,
        context,
        status,
        status >= 500, // Server errors are retryable
        originalError
      );
  }
}

/**
 * Helper function to check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof NetworkError) {
    return error.retryable;
  }
  
  if (error instanceof TimeoutError) {
    return true;
  }
  
  if (error instanceof ServiceUnavailableError) {
    return true;
  }
  
  if (error instanceof RateLimitError) {
    return true;
  }
  
  return false;
}

/**
 * Helper function to get retry delay
 */
export function getRetryDelay(
  error: any,
  attemptNumber: number
): number {
  // If rate limited, use retry-after header
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000; // Convert to ms
  }
  
  // Exponential backoff: 1s, 2s, 4s, 8s, ...
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000); // Max 30s
}

// Re-export base error types
export { ApiError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError } from '../../services/base/ApiError';
