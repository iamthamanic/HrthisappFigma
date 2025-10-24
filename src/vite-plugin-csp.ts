import type { Plugin } from 'vite';

/**
 * VITE CSP PLUGIN
 * ===============
 * Adds Content Security Policy headers to the app
 * 
 * Part of Phase 4 - Priority 1 - Security Headers
 * 
 * Features:
 * - CSP headers for XSS protection
 * - YouTube/Video support
 * - Supabase connections allowed
 * - Development-friendly (allows unsafe-inline for now)
 * 
 * TODO: Remove 'unsafe-inline' and 'unsafe-eval' before production
 */

export function cspPlugin(): Plugin {
  return {
    name: 'vite-plugin-csp',
    transformIndexHtml(html) {
      // CSP Directives
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TODO: Remove unsafe-inline/eval
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob: https://*.supabase.co",
        "connect-src 'self' *.supabase.co wss://*.supabase.co https://www.youtube.com",
        "media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join('; ');

      // Add CSP meta tag
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${cspDirectives}">`
      );
    },
  };
}
