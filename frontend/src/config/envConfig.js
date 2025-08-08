// Centralized environment variable access
export const ENV_CONFIG = {
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Feature flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  ENABLE_MARKETING: import.meta.env.VITE_ENABLE_MARKETING !== 'false',
  
  // Debug flags
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
};