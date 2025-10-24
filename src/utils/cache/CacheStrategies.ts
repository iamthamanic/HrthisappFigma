/**
 * CACHE STRATEGIES
 * ================
 * Cache eviction and expiration strategies
 * 
 * Part of Phase 3 - Priority 5 - Caching
 * 
 * Strategies:
 * - TTL (Time To Live)
 * - LRU (Least Recently Used)
 * - LFU (Least Frequently Used)
 * - FIFO (First In First Out)
 */

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number; // Creation time
  lastAccessed: number; // Last access time
  accessCount: number; // Number of accesses
  ttl?: number; // Time to live in ms
  size?: number; // Optional size in bytes
}

/**
 * Cache strategy interface
 */
export interface CacheStrategy {
  /**
   * Check if entry should be evicted
   */
  shouldEvict<T>(entry: CacheEntry<T>): boolean;

  /**
   * Get entry to evict from a list
   */
  selectForEviction<T>(entries: CacheEntry<T>[]): CacheEntry<T> | null;

  /**
   * Update entry metadata on access
   */
  onAccess<T>(entry: CacheEntry<T>): void;
}

/**
 * TTL (Time To Live) Strategy
 * Evicts entries after a specified time
 */
export class TTLStrategy implements CacheStrategy {
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.defaultTTL = defaultTTL;
  }

  shouldEvict<T>(entry: CacheEntry<T>): boolean {
    const ttl = entry.ttl || this.defaultTTL;
    const age = Date.now() - entry.timestamp;
    return age > ttl;
  }

  selectForEviction<T>(entries: CacheEntry<T>[]): CacheEntry<T> | null {
    // Find oldest expired entry
    const now = Date.now();
    let oldest: CacheEntry<T> | null = null;
    let oldestAge = -1;

    for (const entry of entries) {
      const ttl = entry.ttl || this.defaultTTL;
      const age = now - entry.timestamp;

      if (age > ttl && age > oldestAge) {
        oldest = entry;
        oldestAge = age;
      }
    }

    return oldest || entries[0]; // Fallback to first entry
  }

  onAccess<T>(entry: CacheEntry<T>): void {
    // TTL doesn't change on access
  }
}

/**
 * LRU (Least Recently Used) Strategy
 * Evicts entries that haven't been accessed recently
 */
export class LRUStrategy implements CacheStrategy {
  private maxAge: number;

  constructor(maxAge: number = 30 * 60 * 1000) {
    // Default 30 minutes
    this.maxAge = maxAge;
  }

  shouldEvict<T>(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.lastAccessed;
    return age > this.maxAge;
  }

  selectForEviction<T>(entries: CacheEntry<T>[]): CacheEntry<T> | null {
    if (entries.length === 0) return null;

    // Find least recently used
    let lru = entries[0];
    for (const entry of entries) {
      if (entry.lastAccessed < lru.lastAccessed) {
        lru = entry;
      }
    }

    return lru;
  }

  onAccess<T>(entry: CacheEntry<T>): void {
    entry.lastAccessed = Date.now();
  }
}

/**
 * LFU (Least Frequently Used) Strategy
 * Evicts entries that are accessed least frequently
 */
export class LFUStrategy implements CacheStrategy {
  private minAccessCount: number;

  constructor(minAccessCount: number = 2) {
    this.minAccessCount = minAccessCount;
  }

  shouldEvict<T>(entry: CacheEntry<T>): boolean {
    return entry.accessCount < this.minAccessCount;
  }

  selectForEviction<T>(entries: CacheEntry<T>[]): CacheEntry<T> | null {
    if (entries.length === 0) return null;

    // Find least frequently used
    let lfu = entries[0];
    for (const entry of entries) {
      if (entry.accessCount < lfu.accessCount) {
        lfu = entry;
      }
    }

    return lfu;
  }

  onAccess<T>(entry: CacheEntry<T>): void {
    entry.accessCount++;
  }
}

/**
 * FIFO (First In First Out) Strategy
 * Evicts entries in order of insertion
 */
export class FIFOStrategy implements CacheStrategy {
  private maxAge: number;

  constructor(maxAge: number = 10 * 60 * 1000) {
    // Default 10 minutes
    this.maxAge = maxAge;
  }

  shouldEvict<T>(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > this.maxAge;
  }

  selectForEviction<T>(entries: CacheEntry<T>[]): CacheEntry<T> | null {
    if (entries.length === 0) return null;

    // Find oldest entry
    let oldest = entries[0];
    for (const entry of entries) {
      if (entry.timestamp < oldest.timestamp) {
        oldest = entry;
      }
    }

    return oldest;
  }

  onAccess<T>(entry: CacheEntry<T>): void {
    // FIFO doesn't change on access
  }
}

/**
 * Hybrid Strategy (TTL + LRU)
 * Combines TTL and LRU for balanced caching
 */
export class HybridStrategy implements CacheStrategy {
  private ttlStrategy: TTLStrategy;
  private lruStrategy: LRUStrategy;

  constructor(ttl: number = 5 * 60 * 1000, maxAge: number = 30 * 60 * 1000) {
    this.ttlStrategy = new TTLStrategy(ttl);
    this.lruStrategy = new LRUStrategy(maxAge);
  }

  shouldEvict<T>(entry: CacheEntry<T>): boolean {
    // Evict if either strategy says so
    return (
      this.ttlStrategy.shouldEvict(entry) || this.lruStrategy.shouldEvict(entry)
    );
  }

  selectForEviction<T>(entries: CacheEntry<T>[]): CacheEntry<T> | null {
    // First try TTL
    const ttlEvict = this.ttlStrategy.selectForEviction(entries);
    if (ttlEvict && this.ttlStrategy.shouldEvict(ttlEvict)) {
      return ttlEvict;
    }

    // Then try LRU
    return this.lruStrategy.selectForEviction(entries);
  }

  onAccess<T>(entry: CacheEntry<T>): void {
    this.lruStrategy.onAccess(entry);
  }
}

/**
 * Adaptive Strategy
 * Adjusts based on cache hit rate
 */
export class AdaptiveStrategy implements CacheStrategy {
  private strategy: CacheStrategy;
  private hits: number = 0;
  private misses: number = 0;
  private ttlStrategy: TTLStrategy;
  private lruStrategy: LRUStrategy;

  constructor() {
    this.ttlStrategy = new TTLStrategy();
    this.lruStrategy = new LRUStrategy();
    this.strategy = this.ttlStrategy; // Start with TTL
  }

  shouldEvict<T>(entry: CacheEntry<T>): boolean {
    return this.strategy.shouldEvict(entry);
  }

  selectForEviction<T>(entries: CacheEntry<T>[]): CacheEntry<T> | null {
    this.adapt();
    return this.strategy.selectForEviction(entries);
  }

  onAccess<T>(entry: CacheEntry<T>): void {
    this.strategy.onAccess(entry);
  }

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  private adapt(): void {
    const total = this.hits + this.misses;
    if (total < 100) return; // Need enough data

    const hitRate = this.hits / total;

    // If hit rate is low, switch to LRU (more aggressive)
    if (hitRate < 0.5) {
      this.strategy = this.lruStrategy;
    } else {
      this.strategy = this.ttlStrategy;
    }
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
}

/**
 * Get strategy by name
 */
export function getStrategy(
  name: 'ttl' | 'lru' | 'lfu' | 'fifo' | 'hybrid' | 'adaptive',
  options?: any
): CacheStrategy {
  switch (name) {
    case 'ttl':
      return new TTLStrategy(options?.ttl);
    case 'lru':
      return new LRUStrategy(options?.maxAge);
    case 'lfu':
      return new LFUStrategy(options?.minAccessCount);
    case 'fifo':
      return new FIFOStrategy(options?.maxAge);
    case 'hybrid':
      return new HybridStrategy(options?.ttl, options?.maxAge);
    case 'adaptive':
      return new AdaptiveStrategy();
    default:
      return new TTLStrategy();
  }
}
