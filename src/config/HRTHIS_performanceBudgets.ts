/**
 * PERFORMANCE BUDGETS - HRthis System
 * ====================================
 * 
 * These budgets are enforced in CI/CD pipeline and alert when exceeded.
 * 
 * Baseline measurements (2025-01-10):
 * - Bundle Size: ~850-1000 KB (estimated, needs measurement)
 * - LCP: ~3-4s (estimated)
 * - Lighthouse: ~60-70 (estimated)
 * 
 * Targets after Phase 5:
 * - Bundle Size: <512 KB
 * - LCP: <2.5s
 * - Lighthouse: >90
 * 
 * @version 1.0.0
 * @since 2025-01-10
 */

export const PERFORMANCE_BUDGETS = {
  // ============================================================================
  // BUNDLE SIZE BUDGETS
  // ============================================================================
  
  bundles: {
    // Main application bundle (app code)
    main: {
      js: 512 * 1024,      // 512 KB max
      css: 100 * 1024,     // 100 KB max
    },
    
    // Vendor bundle (React, Supabase, etc.)
    vendor: {
      js: 300 * 1024,      // 300 KB max
    },
    
    // Lazy-loaded chunks
    chunks: {
      perChunk: 200 * 1024, // 200 KB max per chunk
      totalChunks: 20,      // Max 20 chunks
    },
    
    // Total initial load budget
    initialLoad: {
      total: 512 * 1024,   // 512 KB total for first paint
    },
  },

  // ============================================================================
  // WEB VITALS TARGETS (Core Web Vitals)
  // ============================================================================
  
  vitals: {
    // Largest Contentful Paint (LCP)
    // Measures loading performance
    // Target: <2.5s (GOOD), 2.5-4s (NEEDS IMPROVEMENT), >4s (POOR)
    LCP: {
      good: 2500,        // < 2.5s
      needsImprovement: 4000,
      poor: 4001,
    },
    
    // First Input Delay (FID)
    // Measures interactivity
    // Target: <100ms (GOOD), 100-300ms (NEEDS IMPROVEMENT), >300ms (POOR)
    FID: {
      good: 100,         // < 100ms
      needsImprovement: 300,
      poor: 301,
    },
    
    // Cumulative Layout Shift (CLS)
    // Measures visual stability
    // Target: <0.1 (GOOD), 0.1-0.25 (NEEDS IMPROVEMENT), >0.25 (POOR)
    CLS: {
      good: 0.1,         // < 0.1
      needsImprovement: 0.25,
      poor: 0.26,
    },
    
    // Time to First Byte (TTFB)
    // Measures server response time
    // Target: <600ms (GOOD), 600-1000ms (NEEDS IMPROVEMENT), >1000ms (POOR)
    TTFB: {
      good: 600,         // < 600ms
      needsImprovement: 1000,
      poor: 1001,
    },
    
    // First Contentful Paint (FCP)
    // Measures when first content appears
    // Target: <1.8s (GOOD), 1.8-3s (NEEDS IMPROVEMENT), >3s (POOR)
    FCP: {
      good: 1800,        // < 1.8s
      needsImprovement: 3000,
      poor: 3001,
    },
    
    // Interaction to Next Paint (INP)
    // Measures responsiveness to user interactions
    // Target: <200ms (GOOD), 200-500ms (NEEDS IMPROVEMENT), >500ms (POOR)
    INP: {
      good: 200,         // < 200ms
      needsImprovement: 500,
      poor: 501,
    },
  },

  // ============================================================================
  // LIGHTHOUSE SCORE TARGETS
  // ============================================================================
  
  lighthouse: {
    // Performance score (0-100)
    performance: {
      excellent: 90,     // >= 90 (Green)
      good: 50,          // 50-89 (Orange)
      poor: 49,          // < 50 (Red)
    },
    
    // Accessibility score (0-100)
    accessibility: {
      excellent: 90,
      good: 50,
      poor: 49,
    },
    
    // Best Practices score (0-100)
    bestPractices: {
      excellent: 90,
      good: 50,
      poor: 49,
    },
    
    // SEO score (0-100)
    seo: {
      excellent: 90,
      good: 50,
      poor: 49,
    },
  },

  // ============================================================================
  // API PERFORMANCE BUDGETS
  // ============================================================================
  
  api: {
    // Percentile targets for API response times
    p50: 100,     // 50th percentile: < 100ms (median)
    p95: 200,     // 95th percentile: < 200ms
    p99: 500,     // 99th percentile: < 500ms
    timeout: 30000, // 30s max timeout
    
    // Specific operation targets
    operations: {
      // Authentication
      login: 1000,           // < 1s
      logout: 500,           // < 500ms
      
      // Data fetching
      getUserProfile: 500,   // < 500ms
      getDocuments: 1000,    // < 1s
      getLeaves: 1000,       // < 1s
      getTeams: 1000,        // < 1s
      
      // Data mutations
      createDocument: 2000,  // < 2s
      updateProfile: 1000,   // < 1s
      deleteItem: 500,       // < 500ms
      
      // Heavy operations
      exportData: 5000,      // < 5s
      uploadFile: 10000,     // < 10s
    },
  },

  // ============================================================================
  // ASSET BUDGETS
  // ============================================================================
  
  assets: {
    // Image budgets
    images: {
      maxSize: 200 * 1024,        // 200 KB per image
      totalSize: 2 * 1024 * 1024, // 2 MB total
      formats: ['webp', 'jpg', 'png'], // Preferred formats
    },
    
    // Font budgets
    fonts: {
      maxSize: 100 * 1024,        // 100 KB per font
      totalSize: 300 * 1024,      // 300 KB total
      formats: ['woff2', 'woff'], // Preferred formats
    },
    
    // Icon budgets
    icons: {
      maxSize: 50 * 1024,         // 50 KB total for icons
      // Using lucide-react - should tree-shake
    },
  },

  // ============================================================================
  // RENDER PERFORMANCE BUDGETS
  // ============================================================================
  
  rendering: {
    // Frame rate targets
    fps: {
      target: 60,        // 60 FPS target
      minimum: 30,       // 30 FPS minimum acceptable
    },
    
    // Re-render budgets
    rerenders: {
      perSecond: 10,     // Max 10 re-renders per second
      perInteraction: 3, // Max 3 re-renders per user interaction
    },
    
    // Component render time
    componentRenderTime: {
      small: 16,         // < 16ms (one frame at 60 FPS)
      medium: 50,        // < 50ms
      large: 100,        // < 100ms
    },
    
    // List rendering
    virtualizedLists: {
      itemHeight: 100,   // Consistent item heights
      overscan: 5,       // Render 5 extra items
      bufferSize: 10,    // Buffer 10 items
    },
  },

  // ============================================================================
  // MEMORY BUDGETS
  // ============================================================================
  
  memory: {
    // JavaScript heap size
    heapSize: {
      warning: 50 * 1024 * 1024,  // 50 MB warning
      critical: 100 * 1024 * 1024, // 100 MB critical
    },
    
    // DOM nodes
    domNodes: {
      warning: 1500,     // > 1500 nodes warning
      critical: 3000,    // > 3000 nodes critical
    },
    
    // Event listeners
    eventListeners: {
      warning: 50,       // > 50 listeners warning
      critical: 100,     // > 100 listeners critical
    },
  },

  // ============================================================================
  // NETWORK BUDGETS
  // ============================================================================
  
  network: {
    // Request counts
    requests: {
      initial: 20,       // Max 20 requests on initial load
      perPage: 10,       // Max 10 additional requests per page
    },
    
    // Request sizes
    requestSize: {
      xhr: 100 * 1024,   // 100 KB per XHR request
      fetch: 100 * 1024, // 100 KB per fetch request
    },
    
    // Concurrent requests
    concurrent: 6,       // Max 6 concurrent requests (HTTP/2)
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a value meets the "good" threshold
 */
export function isGood(metric: keyof typeof PERFORMANCE_BUDGETS.vitals, value: number): boolean {
  const thresholds = PERFORMANCE_BUDGETS.vitals[metric];
  if (typeof thresholds === 'object' && 'good' in thresholds) {
    return value <= thresholds.good;
  }
  return false;
}

/**
 * Check if a value needs improvement
 */
export function needsImprovement(metric: keyof typeof PERFORMANCE_BUDGETS.vitals, value: number): boolean {
  const thresholds = PERFORMANCE_BUDGETS.vitals[metric];
  if (typeof thresholds === 'object' && 'good' in thresholds && 'needsImprovement' in thresholds) {
    return value > thresholds.good && value <= thresholds.needsImprovement;
  }
  return false;
}

/**
 * Check if a value is poor
 */
export function isPoor(metric: keyof typeof PERFORMANCE_BUDGETS.vitals, value: number): boolean {
  const thresholds = PERFORMANCE_BUDGETS.vitals[metric];
  if (typeof thresholds === 'object' && 'needsImprovement' in thresholds) {
    return value > thresholds.needsImprovement;
  }
  return false;
}

/**
 * Get performance rating for a metric
 */
export function getPerformanceRating(
  metric: keyof typeof PERFORMANCE_BUDGETS.vitals,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  if (isGood(metric, value)) return 'good';
  if (needsImprovement(metric, value)) return 'needs-improvement';
  return 'poor';
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format milliseconds to human-readable string
 */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get color for performance rating
 */
export function getPerformanceColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  const colors = {
    'good': '#10b981',           // Green
    'needs-improvement': '#f59e0b', // Orange
    'poor': '#ef4444',           // Red
  };
  return colors[rating];
}

/**
 * Calculate Lighthouse score color
 */
export function getLighthouseColor(score: number): string {
  if (score >= PERFORMANCE_BUDGETS.lighthouse.performance.excellent) return '#10b981'; // Green
  if (score >= PERFORMANCE_BUDGETS.lighthouse.performance.good) return '#f59e0b';      // Orange
  return '#ef4444'; // Red
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type PerformanceBudgets = typeof PERFORMANCE_BUDGETS;
export type VitalMetric = keyof typeof PERFORMANCE_BUDGETS.vitals;
export type PerformanceRating = 'good' | 'needs-improvement' | 'poor';
