// File: supabase/functions/BrowoKoordinator-Server/errors.ts
/**
 * BrowoKoordinator - Error Classes & Handler
 * ===========================================
 * Centralized error handling for all Edge Function routes
 */

/**
 * Base Error Class for all custom errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * 401 Unauthorized
 * User is not authenticated or token is invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", details?: Record<string, any>) {
    super(message, 401, details);
  }
}

/**
 * 403 Forbidden
 * User is authenticated but lacks required permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", details?: Record<string, any>) {
    super(message, 403, details);
  }
}

/**
 * 404 Not Found
 * Requested resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Not found", details?: Record<string, any>) {
    super(message, 404, details);
  }
}

/**
 * 400 Bad Request
 * Invalid request data or parameters
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details?: Record<string, any>) {
    super(message, 400, details);
  }
}

/**
 * Central Error Response Handler
 * Converts errors into proper JSON responses
 */
export function errorResponse(error: unknown): Response {
  console.error("Error:", error);

  // Handle our custom AppError instances
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details }),
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        statusCode: 500,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle unknown errors
  return new Response(
    JSON.stringify({
      error: "Unknown error occurred",
      statusCode: 500,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
