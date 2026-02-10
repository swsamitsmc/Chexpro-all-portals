import { cacheGet, cacheSet, cacheDel } from './cache.js';

/**
 * Database Query Caching Utilities
 * Caches frequent database queries to reduce load and improve response times
 */

/**
 * Cache a database query result
 */
export const cacheQuery = async (key, queryFn, ttlSeconds = 300) => {
  // Try to get from cache first
  const cached = await cacheGet(key);
  if (cached !== null && cached !== undefined) {
    return { data: cached, fromCache: true };
  }
  
  // Execute query
  const data = await queryFn();
  
  // Cache the result
  await cacheSet(key, data, ttlSeconds);
  
  return { data, fromCache: false };
};

/**
 * Invalidate cache for a specific table
 */
export const invalidateTableCache = async (tableName) => {
  await cacheDel(`db:${tableName}:*`);
};

/**
 * Invalidate specific query cache
 */
export const invalidateQueryCache = async (key) => {
  await cacheDel(key);
};

/**
 * Create a cached version of a database model function
 */
export const createCachedModel = (modelFn, ttlSeconds = 300) => {
  const cache = new Map();
  
  return {
    async findById(id) {
      const key = `model:${modelFn.name}:findById:${id}`;
      const cached = await cacheGet(key);
      if (cached) return cached;
      
      const result = await modelFn.findById(id);
      if (result) {
        await cacheSet(key, result, ttlSeconds);
      }
      return result;
    },
    
    async findAll(filter = {}) {
      const key = `model:${modelFn.name}:findAll:${JSON.stringify(filter)}`;
      const cached = await cacheGet(key);
      if (cached) return cached;
      
      const result = await modelFn.findAll(filter);
      await cacheSet(key, result, ttlSeconds);
      return result;
    },
    
    async create(data) {
      const result = await modelFn.create(data);
      await invalidateTableCache(modelFn.tableName || modelFn.name);
      return result;
    },
    
    async update(id, data) {
      const result = await modelFn.update(id, data);
      await cacheDel(`model:${modelFn.name}:findById:${id}`);
      await invalidateTableCache(modelFn.tableName || modelFn.name);
      return result;
    },
    
    async delete(id) {
      const result = await modelFn.delete(id);
      await cacheDel(`model:${modelFn.name}:findById:${id}`);
      await invalidateTableCache(modelFn.tableName || modelFn.name);
      return result;
    },
  };
};

/**
 * Preload frequently accessed data into cache
 */
export const preloadCache = async (queries) => {
  const results = {};
  
  for (const { key, queryFn, ttl = 300 } of queries) {
    try {
      const data = await queryFn();
      await cacheSet(key, data, ttl);
      results[key] = { success: true };
    } catch (error) {
      results[key] = { success: false, error: error.message };
    }
  }
  
  return results;
};

/**
 * Get cache health status
 */
export const getCacheHealth = async () => {
  const stats = await import('./cache.js').then(m => m.getCacheStats());
  return {
    status: stats.redis ? 'healthy' : 'degraded',
    redis: stats.redis ? 'connected' : 'unavailable',
    memoryCacheSize: stats.memoryCacheSize,
  };
};
