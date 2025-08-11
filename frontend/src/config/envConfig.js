// Centralized environment variable access
export const ENV_CONFIG = {
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  STRAPI_URL: import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337',
  STRAPI_TOKEN: import.meta.env.VITE_STRAPI_TOKEN,
  STRAPI_POST_CT: import.meta.env.VITE_STRAPI_POST_CT || 'posts',
  STRAPI_CATEGORY_CT: import.meta.env.VITE_STRAPI_CATEGORY_CT || 'categories',
  STRAPI_PUBLICATION_STATE: import.meta.env.VITE_STRAPI_PUBLICATION_STATE || 'live',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Feature flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  ENABLE_MARKETING: import.meta.env.VITE_ENABLE_MARKETING !== 'false',
  
  // Debug flags
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
};