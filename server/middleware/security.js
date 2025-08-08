// Additional security middleware
import rateLimit from 'express-rate-limit';

// IP whitelist for admin endpoints
const adminWhitelist = (process.env.ADMIN_IP_WHITELIST || '').split(',').filter(ip => ip.trim());

export const adminIPWhitelist = (req, res, next) => {
  if (adminWhitelist.length === 0) {
    return next(); // No whitelist configured
  }
  
  const clientIP = req.ip || req.connection.remoteAddress;
  if (!adminWhitelist.includes(clientIP)) {
    return res.status(403).json({ error: 'Access denied from this IP' });
  }
  
  next();
};

// Strict rate limiting for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many requests from this IP for sensitive endpoint',
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential script tags and suspicious patterns
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};