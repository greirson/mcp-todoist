/**
 * Cache entry structure for storing data with metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount?: number;
  lastAccessed?: number;
}

/**
 * Cache statistics interface for monitoring and debugging
 */
export interface CacheStats {
  totalKeys: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalMemoryUsage: number;
  oldestEntry?: number;
  newestEntry?: number;
  averageAccessCount: number;
}

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  defaultTtl: number;
  maxSize?: number;
  enableStats?: boolean;
  autoCleanupInterval?: number;
  enableAccessTracking?: boolean;
}

/**
 * Simple in-memory cache with TTL, LRU eviction, and statistics
 */
export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTtl: number;
  private hitCount = 0;
  private missCount = 0;
  private config: CacheConfig;

  constructor(defaultTtlMs: number = 30000, config: Partial<CacheConfig> = {}) {
    this.defaultTtl = defaultTtlMs;
    this.config = {
      defaultTtl: defaultTtlMs,
      enableStats: true,
      enableAccessTracking: true,
      autoCleanupInterval: 300000, // 5 minutes
      ...config,
    };
  }

  set(key: string, data: T, ttl?: number): void {
    // Enforce max size if configured
    if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.config.enableStats) {
        this.missCount++;
      }
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      if (this.config.enableStats) {
        this.missCount++;
      }
      return null;
    }

    // Update access tracking
    if (this.config.enableAccessTracking) {
      entry.accessCount = (entry.accessCount || 0) + 1;
      entry.lastAccessed = now;
    }

    if (this.config.enableStats) {
      this.hitCount++;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hitCount + this.missCount;

    return {
      totalKeys: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      totalMemoryUsage: this.estimateMemoryUsage(),
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((e) => e.timestamp))
          : undefined,
      newestEntry:
        entries.length > 0
          ? Math.max(...entries.map((e) => e.timestamp))
          : undefined,
      averageAccessCount:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + (e.accessCount || 0), 0) /
            entries.length
          : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Check if key exists without updating access stats
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    this.cleanup(); // Clean up expired entries first
    return Array.from(this.cache.keys());
  }

  /**
   * Evict least recently used entry to make room for new entries
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const lastAccessed = entry.lastAccessed || entry.timestamp;
      if (lastAccessed < lruTime) {
        lruTime = lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Estimate memory usage of the cache
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Rough estimation: key size + JSON size of data + metadata
      totalSize += key.length * 2; // UTF-16 characters
      try {
        totalSize += JSON.stringify(entry.data).length * 2;
      } catch {
        totalSize += 100; // Fallback for non-serializable data
      }
      totalSize += 64; // Estimated metadata overhead
    }

    return totalSize;
  }

  /**
   * Extend TTL for a specific key
   */
  extendTtl(key: string, additionalTtl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl += additionalTtl;
    return true;
  }

  /**
   * Update TTL for a specific key
   */
  updateTtl(key: string, newTtl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = newTtl;
    return true;
  }
}
