/**
 * CACHE MANAGER
 * =============
 * Intelligent caching system with multiple strategies
 * 
 * Part of Phase 3 - Priority 5 - Caching
 * 
 * Features:
 * - Multiple eviction strategies (TTL, LRU, LFU, FIFO)
 * - Automatic cache invalidation
 * - Cache statistics and monitoring
 * - Size-based eviction
 * - Tag-based invalidation
 */

import {
  CacheEntry,
  CacheStrategy,
  TTLStrategy,
  HybridStrategy,
  getStrategy,
} from './CacheStrategies';

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize?: number; // Maximum number of entries
  maxMemory?: number; // Maximum memory in bytes
  strategy?: 'ttl' | 'lru' | 'lfu' | 'fifo' | 'hybrid' | 'adaptive';
  strategyOptions?: any;
  enableStats?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  memoryUsage: number;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * Cache Manager
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private tags: Map<string, Set<string>>; // tag -> keys
  private strategy: CacheStrategy;
  private config: Required<CacheConfig>;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.tags = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };

    this.config = {
      maxSize: config.maxSize ?? 1000,
      maxMemory: config.maxMemory ?? 50 * 1024 * 1024, // 50MB default
      strategy: config.strategy ?? 'hybrid',
      strategyOptions: config.strategyOptions ?? {},
      enableStats: config.enableStats ?? true,
    };

    this.strategy = getStrategy(this.config.strategy, this.config.strategyOptions);
  }

  /**
   * GET - Retrieve value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Check if entry should be evicted
    if (this.strategy.shouldEvict(entry)) {
      this.cache.delete(key);
      if (this.config.enableStats) {
        this.stats.misses++;
        this.stats.evictions++;
      }
      return null;
    }

    // Update access metadata
    this.strategy.onAccess(entry);
    this.cache.set(key, entry);

    if (this.config.enableStats) {
      this.stats.hits++;
    }

    return entry.value as T;
  }

  /**
   * SET - Store value in cache
   */
  set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
      size?: number;
    }
  ): void {
    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictOne();
    }

    // Create cache entry
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: options?.ttl,
      size: options?.size,
    };

    this.cache.set(key, entry);

    // Add tags
    if (options?.tags) {
      for (const tag of options.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(key);
      }
    }
  }

  /**
   * HAS - Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (this.strategy.shouldEvict(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * DELETE - Remove entry from cache
   */
  delete(key: string): boolean {
    // Remove from tags
    for (const [tag, keys] of this.tags.entries()) {
      keys.delete(key);
      if (keys.size === 0) {
        this.tags.delete(tag);
      }
    }

    return this.cache.delete(key);
  }

  /**
   * CLEAR - Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.tags.clear();
  }

  /**
   * INVALIDATE BY TAG - Remove all entries with a specific tag
   */
  invalidateByTag(tag: string): number {
    const keys = this.tags.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) {
        count++;
      }
    }

    this.tags.delete(tag);
    return count;
  }

  /**
   * INVALIDATE BY PREFIX - Remove all entries with keys starting with prefix
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * CLEANUP - Remove expired entries
   */
  cleanup(): number {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.strategy.shouldEvict(entry)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (this.config.enableStats) {
      this.stats.evictions += count;
    }

    return count;
  }

  /**
   * EVICT ONE - Evict one entry based on strategy
   */
  private evictOne(): void {
    const entries = Array.from(this.cache.values());
    const toEvict = this.strategy.selectForEviction(entries);

    if (toEvict) {
      this.cache.delete(toEvict.key);
      if (this.config.enableStats) {
        this.stats.evictions++;
      }
    }
  }

  /**
   * GET STATS - Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const total = this.stats.hits + this.stats.misses;

    let memoryUsage = 0;
    let oldest = Infinity;
    let newest = 0;

    for (const entry of entries) {
      if (entry.size) {
        memoryUsage += entry.size;
      }
      if (entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
      if (entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      evictions: this.stats.evictions,
      memoryUsage,
      oldestEntry: oldest < Infinity ? oldest : undefined,
      newestEntry: newest > 0 ? newest : undefined,
    };
  }

  /**
   * RESET STATS - Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * GET ALL KEYS - Get all cache keys
   */
  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * GET KEYS BY TAG - Get all keys with a specific tag
   */
  getKeysByTag(tag: string): string[] {
    return Array.from(this.tags.get(tag) || []);
  }

  /**
   * OPTIMIZE - Run optimization (cleanup + defragmentation)
   */
  optimize(): {
    cleanedUp: number;
    remaining: number;
  } {
    const cleanedUp = this.cleanup();
    const remaining = this.cache.size;

    return { cleanedUp, remaining };
  }
}

/**
 * Global cache instance (singleton)
 */
let globalCache: CacheManager | null = null;

/**
 * Get global cache instance
 */
export function getGlobalCache(config?: CacheConfig): CacheManager {
  if (!globalCache) {
    globalCache = new CacheManager(config);
  }
  return globalCache;
}

/**
 * Reset global cache
 */
export function resetGlobalCache(): void {
  globalCache = null;
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    tags?: string[];
  }
): T {
  const cache = getGlobalCache();

  return (async (...args: Parameters<T>) => {
    // Generate cache key
    const key = options?.keyGenerator
      ? options.keyGenerator(...args)
      : `${fn.name}:${JSON.stringify(args)}`;

    // Check cache
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Store in cache
    cache.set(key, result, {
      ttl: options?.ttl,
      tags: options?.tags,
    });

    return result;
  }) as T;
}

export default CacheManager;
