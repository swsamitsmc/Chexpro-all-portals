import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
const router = express.Router();
import { setSessionCookie, setCSRFCookie, setPersistentLoginCookie } from './cookieHelpers.js';
import { saveSession } from '../sessionStore.js';

// In a real application, you would fetch user data from a database.
// For this demonstration, we are simulating a user lookup.
// CRITICAL: Replace this with actual database integration for user authentication.

// Rate limiting to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Example login route - demo purposes only, intentionally simplified
// In production, implement proper authentication and CSRF protection
router.post('/login', loginLimiter, async (req, res) => {
  // CSRF protection with proper validation
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionCsrf = req.cookies?.csrf_token;
  
  // Sanitize and validate CSRF tokens with constant-time comparison
  if (!csrfToken || !sessionCsrf || 
      typeof csrfToken !== 'string' || typeof sessionCsrf !== 'string' ||
      csrfToken.length > 256 || sessionCsrf.length > 256 ||
      !crypto.timingSafeEqual(Buffer.from(csrfToken), Buffer.from(sessionCsrf))) {
    console.warn('CSRF validation failed on /login', {
      ip: req.ip,
      origin: req.headers.origin,
      referer: req.headers.referer,
    });
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // Basic validation
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  // Authenticate user
  // Database user lookup
  const user = await getUserFromDatabase(req.body.username); 

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Compare provided password with hashed password
  const passwordMatch = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const sessionId = crypto.randomBytes(32).toString('hex');
  const expirationTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  await saveSession(sessionId, user.id, expirationTime);
  setSessionCookie(res, sessionId);

  const newCsrfToken = crypto.randomBytes(32).toString('hex');
  setCSRFCookie(res, newCsrfToken); // Use newCsrfToken here

  if (req.body.rememberMe) {
    const persistentToken = crypto.randomBytes(32).toString('hex');
    setPersistentLoginCookie(res, persistentToken);
    await savePersistentToken(user.id, persistentToken);
  }

  res.json({ status: 'Logged in', sessionId });
});

// Database user lookup - replace with your actual user table
async function getUserFromDatabase(username) {
  try {
    // Import pool here to avoid circular dependency
    const { default: pool } = await import('../config/db.js');
    const [rows] = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = ? AND active = 1 LIMIT 1',
      [username]
    );
    
    if (rows.length > 0) {
      return {
        id: rows[0].id,
        username: rows[0].username,
        passwordHash: rows[0].password_hash
      };
    }
    return null;
  } catch (error) {
    console.error('Database user lookup failed:', error);
    return null;
  }
}

async function savePersistentToken(userId, token) {
  try {
    const { default: pool } = await import('../config/db.js');
    const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Hash the token before storing
    const hashedToken = await bcrypt.hash(token, 10);
    
    await pool.query(
      'INSERT INTO persistent_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash), expires_at = VALUES(expires_at)',
      [userId, hashedToken, expirationDate]
    );
  } catch (error) {
    console.error('Failed to save persistent token:', error);
  }
}

export default router;
