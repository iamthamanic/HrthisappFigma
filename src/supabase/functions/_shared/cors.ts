/**
 * BrowoKoordinator - Shared CORS Configuration
 * 
 * Provides consistent CORS headers across all Edge Functions
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreFlight() {
  return new Response('ok', { 
    headers: corsHeaders,
    status: 200
  });
}

/**
 * Add CORS headers to response
 */
export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
