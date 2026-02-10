import Redis from 'ioredis';

/**
 * Redis Cache Manager
 * Provides caching capabilities for API responses and session storage
 */

// Redis client instance
let redisClient = null;

/**
 * Initialize Redis connection
 */
export const initRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  };

  redisClient = new Redis(redisConfig);

  redisClient.on('connect', () => {
    console.log('Redis connected');
  });

  redisClient.on('error', (err) => {
    console.warn('Redis connection error (caching disabled):', err.message);
  });

  redisClient.on('close', () => {
    console.log('Redis connection closed');
  });

  return redisClient;
};

/**
 * Get Redis client (initializes if not exists)
 */
export const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

/**
 * Cache wrapper function - tries Redis, falls back to memory cache on error
 */
const memoryCache = new Map();

const getFromMemoryCache = (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.value;
};

const setInMemoryCache = (key, value, ttlSeconds = 300) => {
  memoryCache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000),
  });
  
  // Cleanup old entries periodically
  if (memoryCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of memoryCache.entries()) {
      if (now > v.expiry) {
        memoryCache.delete(k);
      }
    }
  }
};

/**
 * Get value from cache
 */
export const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    
    if (value) {
      return JSON.parse(value);
    }
  } catch (error) {
    console.warn('Redis cache get failed, using memory cache:', error.message);
  }
  
  // Fallback to memory cache
  return getFromMemoryCache(key);
};

/**
 * Set value in cache with TTL
 */
export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.warn('Redis cache set failed, using memory cache:', error.message);
    
    // Fallback to memory cache
    setInMemoryCache(key, value, ttlSeconds);
  }
};

/**
 * Delete value from cache
 */
export const cacheDel = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.warn('Redis cache delete failed:', error.message);
  }
  
  // Also delete from memory cache
  memoryCache.delete(key);
};

/**
 * Clear all cache entries matching a pattern
 */
export const cacheClearPattern = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.warn('Redis cache clear pattern failed:', error.message);
  }
  
  // Clear matching memory cache entries
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
    }
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  const stats = {
    memoryCacheSize: memoryCache.size,
    redis: false,
  };
  
  try {
    const client = getRedisClient();
    stats.redis = true;
    stats.redisInfo = await client.info('memory');
  } catch (error) {
    stats.redisError = error.message;
  }
  
  return stats;
};

/**
 * Middleware for caching API responses
 */
export const cacheMiddleware = (ttlSeconds = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `cache:${req.method}:${req.originalUrl}`;
    
    // Try to get from cache
    const cachedResponse = await cacheGet(cacheKey);
    
    if (cachedResponse) {
      // Set cache headers
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', `public, max-age=${ttlSeconds}`);
      
      return res.json(cachedResponse);
    }
    
    // Store original json function
    const originalJson = res.json.bind(res);
    
    // Override json to cache response
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(cacheKey, body, ttlSeconds);
      }
      return originalJson(body);
    };
    
    next();
  };
};

/**
 * Invalidate cache for a specific route
 */
export const invalidateCache = async (routePattern) => {
  await cacheClearPattern(`*${routePattern}*`);
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default {
  initRedis,
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheClearPattern,
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  closeRedis,
};
