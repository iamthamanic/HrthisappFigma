/**
 * SECURITY HEADERS
 * ================
 * Configure security-related HTTP headers
 * 
 * Part of Phase 4 - Priority 1 - Security Headers
 * 
 * Features:
 * - X-Frame-Options (prevent clickjacking)
 * - X-Content-Type-Options (prevent MIME sniffing)
 * - X-XSS-Protection (XSS protection)
 * - Referrer-Policy (control referrer information)
 * - Permissions-Policy (disable unused browser features)
 */

export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy - disable unused features
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
  ].join(', '),
};

/**
 * Apply security headers (for client-side via meta tags)
 * This is a fallback for SPAs - ideally set on server
 */
export function applySecurityHeaders(): void {
  const head = document.head;
  
  // X-Frame-Options (via meta tag)
  const frameOptions = document.createElement('meta');
  frameOptions.httpEquiv = 'X-Frame-Options';
  frameOptions.content = 'DENY';
  head.appendChild(frameOptions);
  
  // X-Content-Type-Options (via meta tag)
  const contentType = document.createElement('meta');
  contentType.httpEquiv = 'X-Content-Type-Options';
  contentType.content = 'nosniff';
  head.appendChild(contentType);
  
  // Referrer-Policy
  const referrer = document.createElement('meta');
  referrer.name = 'referrer';
  referrer.content = 'strict-origin-when-cross-origin';
  head.appendChild(referrer);
  
  console.log('✅ Security headers applied (client-side)');
}

/**
 * Get security headers as object (for server-side)
 */
export function getSecurityHeaders(): Record<string, string> {
  return SECURITY_HEADERS;
}
