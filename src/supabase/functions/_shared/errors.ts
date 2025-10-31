/**
 * BrowoKoordinator - Shared Error Handling
 * 
 * Provides consistent error responses and logging
 */

import { corsHeaders } from './cors.ts';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Format error response
 */
export function errorResponse(
  error: unknown,
  functionName: string
): Response {
  console.error(`[${functionName}] Error:`, error);

  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        context: error.context,
      }),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  // Unknown error
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Success response
 */
export function successResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Bad request response
 */
export function badRequestResponse(message: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Not found response
 */
export function notFoundResponse(message: string = 'Resource not found'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}
