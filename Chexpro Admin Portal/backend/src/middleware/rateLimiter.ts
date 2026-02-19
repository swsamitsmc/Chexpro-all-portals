import rateLimit from 'express-rate-limit';
import config from '../config/env';

/**
 * Rate limiter middleware
 * Limits requests per IP within a time window
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // Default: 15 minutes
  max: config.rateLimitMaxRequests, // Default: 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  },
  // Use IP address as key
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  // Skip rate limiting for health checks
  skip: (req) => {
    return req.path === '/health';
  },
});

/**
 * Stricter rate limiter for authentication routes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  },
});

/**
 * Rate limiter for API endpoints that modify data
 */
export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please slow down',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  },
});

export default rateLimiter;