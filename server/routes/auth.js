import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
const router = express.Router();
import { setSessionCookie, setCSRFCookie, setPersistentLoginCookie } from './cookieHelpers.js';

// Mock user database (replace with a real database in production)
const mockUsers = {
  'demo': {
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxy.abcdefghijklmnopqrstuvwxy.abcdefghijkl', // Hashed 'password123'
    // In a real application, you would store the actual hashed password here
    // For demonstration, this is a placeholder.
    // To generate a hash: bcrypt.hash('password123', 10).then(hash => console.log(hash));
  },
  'admin': {
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxy.abcdefghijklmnopqrstuvwxy.abcdefghijkl', // Hashed 'admin123'
  },
};

// Rate limiting to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Example login route - demo purposes only, intentionally simplified
// In production, implement proper authentication and CSRF protection
router.post('/login', loginLimiter, async (req, res) => {
  // CSRF protection
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionCsrf = req.cookies['csrf-token'];
  
  if (!csrfToken || csrfToken !== sessionCsrf) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // Basic validation
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  // Authenticate user
  const user = mockUsers[req.body.username];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Compare provided password with hashed password
  const passwordMatch = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const sessionId = crypto.randomBytes(32).toString('hex');
  setSessionCookie(res, sessionId);

  const newCsrfToken = crypto.randomBytes(32).toString('hex');
  setCSRFCookie(res, newCsrfToken); // Use newCsrfToken here

  if (req.body.rememberMe) {
    const persistentToken = crypto.randomBytes(32).toString('hex');
    setPersistentLoginCookie(res, persistentToken);
    // Store persistentToken in DB for user
  }

  res.json({ status: 'Logged in', sessionId });
});

export default router;
