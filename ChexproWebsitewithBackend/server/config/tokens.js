/**
 * Token Configuration Constants
 * Centralized configuration for JWT and session token lifetimes
 */

// JWT Token Configuration
export const JWT_CONFIG = {
  // Access token lifetime (short-lived for security)
  ACCESS_TOKEN_EXPIRY: '15m',
  
  // Refresh token lifetime (longer-lived for convenience)
  REFRESH_TOKEN_EXPIRY: '7d',
  
  // Token algorithms
  ALGORITHM: 'HS256',
  
  // Token issuer
  ISSUER: 'chexpro',
  
  // Token audience
  AUDIENCE: 'chexpro-users',
};

// Session Configuration
export const SESSION_CONFIG = {
  // Session cookie lifetime (1 hour in milliseconds)
  COOKIE_MAX_AGE: 60 * 60 * 1000,
  
  // CSRF token lifetime (1 hour in milliseconds)
  CSRF_COOKIE_MAX_AGE: 60 * 60 * 1000,
  
  // Persistent login cookie lifetime (30 days in milliseconds)
  PERSISTENT_COOKIE_MAX_AGE: 30 * 24 * 60 * 60 * 1000,
};

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  // General rate limit window (15 minutes)
  GENERAL_WINDOW_MS: 15 * 60 * 1000,
  
  // General rate limit max requests
  GENERAL_MAX_REQUESTS: 10,
  
  // Contact form rate limit window (5 minutes)
  CONTACT_WINDOW_MS: 5 * 60 * 1000,
  
  // Contact form rate limit max requests
  CONTACT_MAX_REQUESTS: 3,
  
  // Demo request rate limit window (10 minutes)
  DEMO_WINDOW_MS: 10 * 60 * 1000,
  
  // Demo request rate limit max requests
  DEMO_MAX_REQUESTS: 2,
  
  // Login rate limit window (5 minutes)
  LOGIN_WINDOW_MS: 5 * 60 * 1000,
  
  // Login rate limit max requests
  LOGIN_MAX_REQUESTS: 5,
};

// Export all configurations as a single object for convenience
export const TOKEN_CONSTANTS = {
  ...JWT_CONFIG,
  ...SESSION_CONFIG,
  ...RATE_LIMIT_CONFIG,
};
