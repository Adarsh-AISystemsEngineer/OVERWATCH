import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Middleware for caching API responses
 * Reduces database load and improves response times
 *
 * @param durationSeconds - Cache duration in seconds
 */
export function cacheMiddleware(durationSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.baseUrl}${req.url}`;
    const cached = cache.get(key);

    // Return cached response if valid
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    // Remove expired cache
    if (cached && cached.expiresAt <= Date.now()) {
      cache.delete(key);
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);

    res.json = function (data: unknown) {
      cache.set(key, {
        data,
        expiresAt: Date.now() + durationSeconds * 1000,
      });

      return originalJson(data);
    };

    next();
  };
}

/**
 * Clear all cached data (useful for scraper updates)
 */
export function clearCache() {
  cache.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string) {
  cache.delete(key);
}
