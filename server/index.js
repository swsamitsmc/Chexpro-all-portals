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
import formRoutes from './routes/forms.js';
import authRoutes from './routes/auth.js';
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

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// Enable CORS for specific origins only
const corsOptions = {
  origin: (origin, callback) => {
    // In development, allow localhost origins
    if (process.env.NODE_ENV !== 'production') {
      const devOrigins = process.env.DEV_FRONTEND_URLS 
        ? process.env.DEV_FRONTEND_URLS.split(',').map(o => o.trim())
        : ['http://localhost:5173', 'http://localhost:3000'];
      
      if (!origin || devOrigins.some(o => origin.startsWith(o))) {
        return callback(null, true);
      }
    }
    
    // In production, only allow the configured frontend URL
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigin = process.env.FRONTEND_URL;
      if (!allowedOrigin) {
        logger.warn('No FRONTEND_URL configured for production');
        return callback(new Error('CORS: Frontend URL not configured'));
      }
      
      if (!origin || origin === allowedOrigin) {
        return callback(null, true);
      }
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
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// --- Start Server ---
app.listen(PORT, async () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    // Dev convenience: autogenerate fallback tokens if missing
    if (process.env.NODE_ENV !== 'production') {
      if (!process.env.HEALTH_CHECK_TOKEN) {
        process.env.HEALTH_CHECK_TOKEN = Math.random().toString(36).slice(2);
        console.log(`Dev HEALTH_CHECK_TOKEN: ${process.env.HEALTH_CHECK_TOKEN}`);
      }
      if (!process.env.METRICS_TOKEN) {
        process.env.METRICS_TOKEN = Math.random().toString(36).slice(2);
        console.log(`Dev METRICS_TOKEN: ${process.env.METRICS_TOKEN}`);
      }
    }
    await initializeDatabase();
    await initializeSchema();
    
    // Cleanup expired tokens every hour
    setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
});