// Centralized environment variable access
export const ENV_CONFIG = {
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // Sanity CMS Configuration
  SANITY_PROJECT_ID: import.meta.env.VITE_SANITY_PROJECT_ID,
  SANITY_DATASET: import.meta.env.VITE_SANITY_DATASET || 'production',
  SANITY_API_TOKEN: import.meta.env.VITE_SANITY_API_TOKEN,
  
  // Strapi CMS Configuration (deprecated, use Sanity)
  STRAPI_URL: import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337',
  STRAPI_TOKEN: import.meta.env.VITE_STRAPI_TOKEN,
  STRAPI_POST_CT: import.meta.env.VITE_STRAPI_POST_CT || 'posts',
  STRAPI_CATEGORY_CT: import.meta.env.VITE_STRAPI_CATEGORY_CT || 'categories',
  STRAPI_PUBLICATION_STATE: import.meta.env.VITE_STRAPI_PUBLICATION_STATE || 'live',
  
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Feature flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  ENABLE_MARKETING: import.meta.env.VITE_ENABLE_MARKETING !== 'false',
  
  // CMS Selection - set to 'sanity' to use Sanity, 'strapi' for Strapi, 'fallback' for hardcoded data
  USE_CMS: import.meta.env.VITE_USE_CMS || 'fallback',
  
  // Zitadel Authentication Configuration
  ZITADEL_ISSUER: import.meta.env.VITE_ZITADEL_ISSUER || 'http://localhost:8080',
  ZITADEL_CLIENT_ID: import.meta.env.VITE_ZITADEL_CLIENT_ID,
  ZITADEL_REDIRECT_URI: import.meta.env.VITE_ZITADEL_REDIRECT_URI || 'http://localhost:5173/callback',
  ZITADEL_LOGOUT_URI: import.meta.env.VITE_ZITADEL_LOGOUT_URI || 'http://localhost:5173/logout',
  
  // Debug flags
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
};