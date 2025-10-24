# Cache Control Headers for HRthis System
# For Vercel, Netlify, and other static hosting platforms

# Cache static assets aggressively (1 year)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Cache JavaScript bundles with versioning (1 year)
/*.js
  Cache-Control: public, max-age=31536000, immutable

/assets/js/*
  Cache-Control: public, max-age=31536000, immutable

# Cache CSS bundles (1 year)
/*.css
  Cache-Control: public, max-age=31536000, immutable

/assets/css/*
  Cache-Control: public, max-age=31536000, immutable

# Cache fonts (1 year)
/*.woff
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable

/*.ttf
  Cache-Control: public, max-age=31536000, immutable

# Cache SVG assets (1 year)
/*.svg
  Cache-Control: public, max-age=31536000, immutable

# Cache images (30 days)
/*.jpg
  Cache-Control: public, max-age=2592000

/*.jpeg
  Cache-Control: public, max-age=2592000

/*.png
  Cache-Control: public, max-age=2592000

/*.gif
  Cache-Control: public, max-age=2592000

/*.webp
  Cache-Control: public, max-age=2592000

# Cache favicon (30 days)
/*.ico
  Cache-Control: public, max-age=2592000

# Don't cache HTML (always fetch fresh)
/*.html
  Cache-Control: no-cache, must-revalidate, max-age=0

/index.html
  Cache-Control: no-cache, must-revalidate, max-age=0

/
  Cache-Control: no-cache, must-revalidate, max-age=0

# Don't cache Service Worker (must always be fresh)
/service-worker.js
  Cache-Control: no-cache, must-revalidate, max-age=0

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
