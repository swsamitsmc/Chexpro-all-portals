/**
 * Content Security Policy (CSP) Configuration
 * Enhanced security headers for production deployment
 * 
 * NOTE: The 'unsafe-inline' and 'unsafe-eval' directives are temporarily included
 * to support React/Vite development features. For production, consider:
 * 1. Using nonces for inline scripts: scriptSrc: ["'self'", "'nonce-#{nonce}'"]
 * 2. Using Content-Security-Policy-Report-Only for gradual CSP adoption
 * 3. Refactoring inline scripts to external files
 */

export const cspConfig = {
  // Directives
  directives: {
    // Default source - only allow from same origin
    defaultSrc: ["'self'"],
    
    // Script sources - only self and trusted sources
    // WARNING: 'unsafe-inline' and 'unsafe-eval' weaken XSS protection
    scriptSrc: [
      "'self'",
    ],
    
    // Style sources
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and many UI libraries
      "https://fonts.googleapis.com",
    ],
    
    // Font sources
    fontSrc: [
      "'self'",
      "data:",
      "https://fonts.gstatic.com",
    ],
    
    // Image sources
    imgSrc: [
      "'self'",
      "data:",
      "https:",
    ],
    
    // Connect sources (API calls)
    connectSrc: [
      "'self'",
    ],
    
    // Frame sources - prevent clickjacking
    frameSrc: ["'none'"],
    
    // Form action
    formAction: ["'self'"],
    
    // Base URI
    baseUri: ["'self'"],
    
    // Disallow plugin content
    objectSrc: ["'none'"],
    
    // Require signed responses for workers
    workerSrc: ["'self'"],
    
    // Manifest sources
    manifestSrc: ["'self'"],
    
    // Media sources
    mediaSrc: ["'self'"],
    
    // Frame ancestors - prevent clickjacking
    frameAncestors: ["'self'"],
    
    // Require transaction of Content-Security-Policy
    upgradeInsecureRequests: [],
  },
  
  // Report-Only mode for testing CSP before enforcement
  reportOnly: process.env.NODE_ENV !== 'production',
};

/**
 * Additional security headers
 */
export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Control browser features
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
  ].join(', '),
  
  // Strict Transport Security (HSTS)
  // Enable in production with proper SSL certificate
  'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
    ? 'max-age=31536000; includeSubDomains; preload' 
    : undefined,
  
  // Cache control for sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  
  // Pragma for backward compatibility
  'Pragma': 'no-cache',
};

/**
 * Generate Helmet-compatible CSP configuration
 */
export const generateHelmetCsp = () => {
  return {
    contentSecurityPolicy: {
      directives: {
        ...cspConfig.directives,
        // Remove report-uri as we're using reportOnly
        reportUri: undefined,
      },
    },
    // Report only in development
    reportOnly: cspConfig.reportOnly,
  };
};
