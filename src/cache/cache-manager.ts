import { SimpleCache, CacheConfig, CacheStats } from "./simple-cache.js";

/**
 * Cache warming function type
 */
export type CacheWarmer<T> = () => Promise<T>;

/**
 * Centralized cache manager for coordinating multiple cache instances
 */
export class CacheManager {
  private static instance: CacheManager;
  private caches = new Map<string, SimpleCache<any>>();
  private cleanupIntervals = new Map<string, NodeJS.Timeout>();
  private warmers = new Map<string, CacheWarmer<any>>();

  private constructor() {
    // Singleton pattern
  }

  /**
   * Get the singleton instance of CacheManager
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Register a cache instance with the manager
   */
  registerCache<T>(
    name: string,
    cache: SimpleCache<T>,
    options: {
      autoCleanup?: boolean;
      cleanupInterval?: number;
      warmer?: CacheWarmer<T>;
    } = {}
  ): void {
    this.caches.set(name, cache);

    // Set up automatic cleanup if requested
    const isTestEnvironment =
      typeof process !== "undefined" && process.env?.NODE_ENV === "test";
    if (options.autoCleanup !== false && !isTestEnvironment) {
      const interval = options.cleanupInterval || 300000; // 5 minutes default
      const intervalId = setInterval(() => {
        cache.cleanup();
      }, interval);

      this.cleanupIntervals.set(name, intervalId);
    }

    // Register cache warmer if provided
    if (options.warmer) {
      this.warmers.set(name, options.warmer);
    }
  }

  /**
   * Get a registered cache by name
   */
  getCache<T>(name: string): SimpleCache<T> | undefined {
    return this.caches.get(name);
  }

  /**
   * Get or create a cache with the specified configuration
   */
  getOrCreateCache<T>(
    name: string,
    defaultTtl = 30000,
    config: Partial<CacheConfig> = {}
  ): SimpleCache<T> {
    let cache = this.caches.get(name);

    if (!cache) {
      cache = new SimpleCache<T>(defaultTtl, config);
      this.registerCache(name, cache);
    }

    return cache;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Clean up expired entries in all caches
   */
  cleanupAll(): void {
    for (const cache of this.caches.values()) {
      cache.cleanup();
    }
  }

  /**
   * Get aggregated statistics from all caches
   */
  getGlobalStats(): {
    totalCaches: number;
    totalKeys: number;
    totalHits: number;
    totalMisses: number;
    globalHitRate: number;
    totalMemoryUsage: number;
    cacheStats: Record<string, CacheStats>;
  } {
    let totalKeys = 0;
    let totalHits = 0;
    let totalMisses = 0;
    let totalMemoryUsage = 0;
    const cacheStats: Record<string, CacheStats> = {};

    for (const [name, cache] of this.caches.entries()) {
      const stats = cache.getStats();
      cacheStats[name] = stats;

      totalKeys += stats.totalKeys;
      totalHits += stats.hitCount;
      totalMisses += stats.missCount;
      totalMemoryUsage += stats.totalMemoryUsage;
    }

    const totalRequests = totalHits + totalMisses;

    return {
      totalCaches: this.caches.size,
      totalKeys,
      totalHits,
      totalMisses,
      globalHitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalMemoryUsage,
      cacheStats,
    };
  }

  /**
   * Warm up caches using registered warmers
   */
  async warmCaches(cacheNames?: string[]): Promise<void> {
    const namesToWarm = cacheNames || Array.from(this.warmers.keys());

    const warmPromises = namesToWarm.map(async (name) => {
      const warmer = this.warmers.get(name);
      const cache = this.caches.get(name);

      if (warmer && cache) {
        try {
          const data = await warmer();
          cache.set(`warmed_${Date.now()}`, data);
        } catch (error) {
          console.warn(`Failed to warm cache '${name}':`, error);
        }
      }
    });

    await Promise.allSettled(warmPromises);
  }

  /**
   * Reset statistics for all caches
   */
  resetAllStats(): void {
    for (const cache of this.caches.values()) {
      cache.resetStats();
    }
  }

  /**
   * Remove a cache from management
   */
  unregisterCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (!cache) return false;

    // Clear cleanup interval
    const intervalId = this.cleanupIntervals.get(name);
    if (intervalId) {
      clearInterval(intervalId);
      this.cleanupIntervals.delete(name);
    }

    // Remove warmer
    this.warmers.delete(name);

    // Remove cache
    this.caches.delete(name);

    return true;
  }

  /**
   * Bulk invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let invalidatedCount = 0;

    for (const cache of this.caches.values()) {
      const keys = cache.keys();
      for (const key of keys) {
        if (pattern.test(key)) {
          cache.delete(key);
          invalidatedCount++;
        }
      }
    }

    return invalidatedCount;
  }

  /**
   * Get cache health information
   */
  getHealthInfo(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getGlobalStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check hit rates
    if (stats.globalHitRate < 0.5) {
      issues.push(
        `Low global hit rate: ${(stats.globalHitRate * 100).toFixed(1)}%`
      );
      recommendations.push(
        "Consider increasing TTL values or improving cache warming"
      );
    }

    // Check memory usage (warn if > 50MB)
    const memoryMB = stats.totalMemoryUsage / (1024 * 1024);
    if (memoryMB > 50) {
      issues.push(`High memory usage: ${memoryMB.toFixed(1)}MB`);
      recommendations.push(
        "Consider reducing cache size or implementing more aggressive cleanup"
      );
    }

    // Check individual cache performance
    for (const [name, cacheStats] of Object.entries(stats.cacheStats)) {
      if (cacheStats.hitRate < 0.3) {
        issues.push(
          `Cache '${name}' has very low hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`
        );
        recommendations.push(`Review caching strategy for '${name}' cache`);
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Shutdown the cache manager and clean up resources
   */
  shutdown(): void {
    // Clear all intervals
    for (const intervalId of this.cleanupIntervals.values()) {
      clearInterval(intervalId);
    }

    // Clear all data
    this.cleanupIntervals.clear();
    this.warmers.clear();
    this.clearAll();
    this.caches.clear();
  }
}
