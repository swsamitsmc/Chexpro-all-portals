// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();
import { validateEnvironment } from './utils/envValidator.js';

// Validate environment variables
validateEnvironment();
import winston from 'winston';
import morgan from 'morgan';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import hpp from 'hpp';
import crypto from 'crypto';
import { generateHelmetCsp, securityHeaders } from './utils/cspConfig.js';
import mfaRoutes from './routes/mfa.js';
import formRoutes from './routes/forms.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import { initializeDatabase } from './config/db.js';
import { initializeSchema } from './utils/dbInit.js';
import { cleanupExpiredTokens } from './utils/userManager.js';
import { sanitizeInput } from './middleware/security.js';
import { generateApiDocs } from './utils/apiDocs.js';
import { performanceMiddleware, getMetrics } from './utils/performance.js';
import { trackError, getErrorStats } from './utils/errorTracking.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// Gzip compression for faster responses
app.use(compression());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Security headers with CSP
// NOTE: CSP is configured in utils/cspConfig.js - using the centralized configuration
app.use(helmet({
  contentSecurityPolicy: false, // Disabled - use cspConfig.js for CSP headers
  crossOriginEmbedderPolicy: false,
}));

// Add additional security headers
Object.entries(securityHeaders).forEach(([header, value]) => {
  if (value !== undefined) {
    app.use((req, res, next) => {
      res.setHeader(header, value);
      next();
    });
  }
});

// Enable CORS for specific origins only - Consolidated configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Use consolidated ALLOWED_ORIGINS for all environments
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : process.env.NODE_ENV !== 'production'
        ? ['http://localhost:5173', 'http://localhost:3000']
        : [];

    // Allow requests with no origin (like mobile apps or curl requests)
    // but only in development or for health checks
    if (!origin) {
      // In production, require origin for security
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS: Origin header required'));
      }
      return callback(null, true);
    }

    // Use exact matching to prevent bypass attacks
    // (e.g., http://localhost:5173.evil.com would bypass startsWith check)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS denied for origin: ${encodeURIComponent(origin)}`);
    return callback(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};
app.use(cors(corsOptions));

// Parse incoming JSON requests.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
// Parse cookies for CSRF/session helpers
app.use(cookieParser());

// Input sanitization
app.use(sanitizeInput);

// HTTP request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Performance monitoring
app.use(performanceMiddleware);

// Global rate limiting to prevent abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(globalLimiter);

// --- API Routes ---

// All form-related routes will be prefixed with /api/form
app.use('/api/form', formRoutes);
// Auth-related routes for cookie demo
app.use('/api/auth', authRoutes);
// Dashboard routes for client portal
app.use('/api/dashboard', dashboardRoutes);
// MFA routes for two-factor authentication
app.use('/api/mfa', mfaRoutes);

// Health check endpoint to verify the server is running
app.get('/health', (req, res) => {
    // Require authorization for health endpoint
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.HEALTH_CHECK_TOKEN;
    
    if (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    // Require authorization for API documentation
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.HEALTH_CHECK_TOKEN;
    
    if (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const docs = generateApiDocs();
    res.json(docs);
});

// Performance metrics endpoint
app.get('/api/metrics', (req, res) => {
    // Require authorization for metrics endpoint
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.METRICS_TOKEN;
    
    if (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const metrics = getMetrics();
    const errorStats = getErrorStats();
    res.json({ ...metrics, errors: errorStats });
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  // CORS denials
  if (err && typeof err.message === 'string' && err.message.startsWith('CORS:')) {
    logger.warn('CORS error', {
      origin: encodeURIComponent(req.headers.origin || ''),
      referer: encodeURIComponent(req.headers.referer || ''),
      url: encodeURIComponent(req.url || ''),
      nodeEnv: process.env.NODE_ENV,
      devFrontendUrls: process.env.DEV_FRONTEND_URLS,
      frontendUrl: process.env.FRONTEND_URL
    });
    return res.status(403).json({ 
      error: 'CORS not allowed for this origin',
      details: process.env.NODE_ENV === 'development' ? `Origin: ${req.headers.origin}` : undefined
    });
  }
  // Track error
  trackError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Log error with Winston (sanitized)
  logger.error('Server error', {
    error: encodeURIComponent(err.message || 'Unknown error'),
    stack: process.env.NODE_ENV !== 'production' ? encodeURIComponent(err.stack || '') : undefined,
    url: encodeURIComponent(req.url || ''),
    method: encodeURIComponent(req.method || ''),
    ip: encodeURIComponent(req.ip || '')
  });
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  } else {
    // In development, provide error message but not full stack trace
    // Stack traces can expose internal implementation details
    res.status(500).json({ 
      error: err.message || 'An unexpected error occurred',
      // Only include stack trace if explicitly enabled via DEBUG_MODE
      ...(process.env.DEBUG_MODE === 'true' && { stack: err.stack })
    });
  }
});

// --- Start Server ---
app.listen(PORT, async () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    
    // Development-only: Auto-generate tokens if missing
    // WARNING: This is a convenience for development only and should never run in production
    // Missing tokens in production will cause authentication failures
    if (process.env.NODE_ENV !== 'production') {
      const missingTokens = [];
      
      if (!process.env.HEALTH_CHECK_TOKEN) {
        process.env.HEALTH_CHECK_TOKEN = crypto.randomBytes(32).toString('hex');
        missingTokens.push('HEALTH_CHECK_TOKEN');
      }
      if (!process.env.METRICS_TOKEN) {
        process.env.METRICS_TOKEN = crypto.randomBytes(32).toString('hex');
        missingTokens.push('METRICS_TOKEN');
      }
      
      if (missingTokens.length > 0) {
        logger.warn(`[DEV MODE] Auto-generated tokens for: ${missingTokens.join(', ')}. Set these in your .env file for consistent access.`);
      }
    } else {
      // In production, validate that required tokens exist
      if (!process.env.HEALTH_CHECK_TOKEN || !process.env.METRICS_TOKEN) {
        logger.error('[PRODUCTION] Missing required tokens: HEALTH_CHECK_TOKEN and/or METRICS_TOKEN. Some endpoints will fail.');
      }
    }
    
    await initializeDatabase();
    await initializeSchema();
    
    // Cleanup expired tokens every hour
    setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
});
