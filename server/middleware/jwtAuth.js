import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Validate required secrets at startup
const requiredSecrets = [
  { name: 'JWT_SECRET', envValue: process.env.JWT_SECRET },
  { name: 'JWT_REFRESH_SECRET', envValue: process.env.JWT_REFRESH_SECRET }
];

const missingSecrets = requiredSecrets
  .filter(s => !s.envValue)
  .map(s => s.name);

if (missingSecrets.length > 0) {
  const errorMsg = `Missing required environment variables: ${missingSecrets.join(', ')}. These are required in all environments.`;
  console.error(`[SECURITY] ${errorMsg}`);
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
}

// Use provided secrets or fail in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/**
 * JWT Authentication Middleware
 * Validates JWT tokens from Authorization header or cookies
 */
export const jwtAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'chexpro',
      audience: 'chexpro-users'
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional JWT Auth - doesn't fail if no token, but validates if present
 */
export const optionalJwtAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies?.access_token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'chexpro',
      audience: 'chexpro-users'
    });
    req.user = decoded;
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};

/**
 * Generate JWT tokens
 */
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role || 'user'
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '15m', // Short-lived access token
      issuer: 'chexpro',
      audience: 'chexpro-users'
    }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '7d', // Longer-lived refresh token
      issuer: 'chexpro',
      audience: 'chexpro-users'
    }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify refresh token and generate new access token
 */
export const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: 'chexpro',
      audience: 'chexpro-users'
    });

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '15m',
        issuer: 'chexpro',
        audience: 'chexpro-users'
      }
    );

    return { accessToken: newAccessToken, valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};
