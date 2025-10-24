/**
 * Vite Plugin - Cache Control Headers
 * Adds appropriate cache headers during development
 */

import type { Plugin } from 'vite';

export function headersPlugin(): Plugin {
  return {
    name: 'vite-plugin-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        
        // Static assets (JS, CSS, fonts, SVG) - cache 1 year
        if (url.match(/\.(js|css|woff|woff2|ttf|svg|ico)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        
        // Images - cache 30 days
        else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=2592000');
        }
        
        // HTML and Service Worker - no cache
        else if (url === '/' || url.match(/\.html$/) || url === '/service-worker.js') {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate, max-age=0');
        }
        
        // Security headers
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        next();
      });
    },
  };
}
