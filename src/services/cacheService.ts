/**
 * Cache Service for API responses
 * 
 * Provides in-memory caching with TTL (time-to-live) support.
 * Used to avoid repeated expensive API calls for data that doesn't change frequently.
 */

// Cache entry with timestamp and data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache storage - keyed by cache type and stringified params
const cache = new Map<string, CacheEntry<unknown>>();

// TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes - for rapidly changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - default
  LONG: 15 * 60 * 1000,      // 15 minutes - for slow-changing data
  VERY_LONG: 60 * 60 * 1000, // 1 hour - for essentially static data
} as const;

/**
 * Generate a stable cache key from parameters
 * Handles objects, arrays, and primitives consistently
 */
function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  // Sort keys for consistent ordering
  const sortedParams: Record<string, unknown> = {};
  Object.keys(params)
    .sort()
    .forEach(key => {
      const value = params[key];
      // Skip undefined values
      if (value !== undefined) {
        // Sort arrays for consistent keys
        if (Array.isArray(value)) {
          sortedParams[key] = [...value].sort().join(',');
        } else {
          sortedParams[key] = value;
        }
      }
    });
  
  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

/**
 * Get cached data if available and not expired
 */
export function getFromCache<T>(prefix: string, params: Record<string, unknown>): T | null {
  const key = generateCacheKey(prefix, params);
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  const age = Math.round((Date.now() - entry.timestamp) / 1000);
  console.log(`✅ Cache HIT for ${prefix} (age: ${age}s)`);
  return entry.data;
}

/**
 * Store data in cache with TTL
 */
export function setInCache<T>(
  prefix: string, 
  params: Record<string, unknown>, 
  data: T, 
  ttl: number = CacheTTL.MEDIUM
): void {
  const key = generateCacheKey(prefix, params);
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };
  cache.set(key, entry);
  console.log(`💾 Cache SET for ${prefix} (TTL: ${ttl / 1000}s)`);
}

/**
 * Helper function to get cached data or fetch it
 * This is the main function to use for caching API calls
 */
export async function getCachedOrFetch<T>(
  prefix: string,
  params: Record<string, unknown>,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = getFromCache<T>(prefix, params);
  if (cached !== null) {
    return cached;
  }
  
  // Cache miss - fetch the data
  console.log(`🔄 Cache MISS for ${prefix} - fetching...`);
  const data = await fetchFn();
  
  // Store in cache
  setInCache(prefix, params, data, ttl);
  
  return data;
}

/**
 * Clear all cache entries for a specific prefix
 */
export function clearCacheByPrefix(prefix: string): number {
  let cleared = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix + ':')) {
      cache.delete(key);
      cleared++;
    }
  }
  console.log(`🗑️ Cleared ${cleared} cache entries for prefix: ${prefix}`);
  return cleared;
}

/**
 * Clear all Animl-related cache entries
 */
export function clearAnimlCache(): number {
  const prefixes = [
    'animl-deployments',
    'animl-category-counts',
    'animl-grouped-counts',
    'animl-image-labels',
  ];
  
  let totalCleared = 0;
  for (const prefix of prefixes) {
    totalCleared += clearCacheByPrefix(prefix);
  }
  
  console.log(`🗑️ Cleared ${totalCleared} total Animl cache entries`);
  return totalCleared;
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): number {
  const size = cache.size;
  cache.clear();
  console.log(`🗑️ Cleared all ${size} cache entries`);
  return size;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  entriesByPrefix: Record<string, number>;
  totalSizeEstimate: string;
} {
  const entriesByPrefix: Record<string, number> = {};
  
  for (const key of cache.keys()) {
    const prefix = key.split(':')[0];
    entriesByPrefix[prefix] = (entriesByPrefix[prefix] || 0) + 1;
  }
  
  // Rough size estimate (won't be exact)
  let sizeEstimate = 0;
  for (const entry of cache.values()) {
    sizeEstimate += JSON.stringify(entry).length;
  }
  
  const sizeStr = sizeEstimate > 1024 * 1024 
    ? `${(sizeEstimate / (1024 * 1024)).toFixed(2)} MB`
    : sizeEstimate > 1024
    ? `${(sizeEstimate / 1024).toFixed(2)} KB`
    : `${sizeEstimate} bytes`;
  
  return {
    totalEntries: cache.size,
    entriesByPrefix,
    totalSizeEstimate: sizeStr,
  };
}

/**
 * Debug helper - list all cache keys
 */
export function listCacheKeys(): string[] {
  return Array.from(cache.keys());
}

// Expose debug functions on window for console access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__cacheDebug = {
    clearAll: clearAllCache,
    clearAniml: clearAnimlCache,
    getStats: getCacheStats,
    listKeys: listCacheKeys,
    showCacheKeys: () => {
      const keys = listCacheKeys();
      console.log(`📋 ${keys.length} cache entries:`);
      keys.forEach(k => console.log(`  - ${k}`));
      return keys;
    },
  };
  console.warn('💡 Cache debug available: __cacheDebug.clearAll(), __cacheDebug.clearAniml(), __cacheDebug.showCacheKeys()');
}
