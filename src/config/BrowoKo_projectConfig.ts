/**
 * PROJEKT-KONFIGURATION – Browo Koordinator System
 * ================================================
 * Zentrale Definition aller Projekt-Variablen gemäß Codex
 * 
 * Erstellt: 2025-01-08
 * Phase: 1 - Foundation
 */

export const PROJECT_CONFIG = {
  // Domain & Naming
  DOMAIN_PREFIX: 'BrowoKo_',
  IMPORT_ALIAS: '../', // Relative imports (../../) - @/ not supported in Figma Make
  
  // Style System
  STYLE_SYSTEM: 'Tailwind CSS v4 + CSS Variables',
  UI_PRIMITIVES: 'ShadCN UI',
  
  // Testing (deaktiviert für jetzt)
  TESTING_POLICY: 'off' as const, // TODO: Nach Refactoring auf 'on' setzen
  
  // Review Gates
  REVIEW_GATES: {
    minReviewers: 1,
    requiredRoles: ['ADMIN', 'SUPERADMIN'] as const,
    requiresAllChecks: true,
  },
  
  // Security Baseline
  SEC_BASELINE: {
    standard: 'OWASP ASVS Level 2',
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"], // TODO: Remove unsafe-inline
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", '*.supabase.co'],
      },
    },
    cors: {
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? ['https://your-production-domain.com']
        : ['http://localhost:5173', 'http://localhost:3000'],
    },
    dependencies: {
      scanFrequency: 'weekly' as const,
      maxHighVulnerabilities: 0,
      maxCriticalVulnerabilities: 0,
    },
    secrets: {
      management: 'Supabase Secrets',
      rotationPeriod: '90 days',
    },
  },
  
  // Observability Stack
  OBS_STACK: {
    logging: {
      format: 'JSON',
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      includeTraceId: true,
    },
    metrics: {
      enabled: true,
      provider: 'built-in', // TODO: Consider Sentry/DataDog
      trackWebVitals: true,
    },
    tracing: {
      enabled: true,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    },
  },
  
  // Performance Budgets
  PERF_BUDGETS: {
    web: {
      jsPerRoute: 200 * 1024, // 200 KB (gzip)
      lcp: 2000, // 2s (mobile)
      cls: 0.1,
      inp: 200, // ms
      longTaskThreshold: 200, // ms
      totalBundleSize: 512 * 1024, // 512 KB
    },
    backend: {
      p95Latency: 200, // ms
      errorRate: 0.001, // 0.1%
      startupTime: 1000, // 1s
    },
    database: {
      maxQueryTime: 100, // ms
      connectionPoolSize: 20,
      maxConnections: 100,
    },
  },
  
  // Routing Rules
  ROUTING_RULES: {
    mainTabsStrategy: 'routes' as const, // Level 1 = eigene Routen
    subTabsStrategy: 'query-params' as const, // Level 2+ = Query-Parameter
    deepLinkSupport: true,
    historyMode: 'browser' as const,
  },
  
  // File Size Limits
  FILE_LIMITS: {
    soft: 300, // lines
    hard: 500, // lines
    complexity: 10, // cyclomatic complexity
    duplication: 0.03, // 3%
  },
} as const;

export type ProjectConfig = typeof PROJECT_CONFIG;
