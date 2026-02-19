/**
 * Zitadel Authentication Middleware
 * 
 * This middleware validates JWT tokens issued by Zitadel.
 * It supports both access tokens and ID tokens.
 */

import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { ENV_CONFIG } from '../utils/envConfig.js';

// JWKS client for fetching Zitadel's public keys
let jwksClient = null;

/**
 * Initialize JWKS client
 */
const initJwksClient = () => {
  if (jwksClient) return;

  const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER || 'http://localhost:8080';
  const ZITADEL_JWKS_URI = process.env.ZITADEL_JWKS_URI || `${ZITADEL_ISSUER}/oauth/jwks`;

  jwksClient = jwksRsa({
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    jwksUri: ZITADEL_JWKS_URI,
  });
};

/**
 * Get signing key from JWKS
 * @param {Object} header - JWT header
 * @returns {Promise<string>}
 */
const getSigningKey = (header) => {
  return new Promise((resolve, reject) => {
    initJwksClient();
    
    jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      resolve(signingKey);
    });
  });
};

/**
 * Verify Zitadel JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Decoded token payload
 */
export const verifyZitadelToken = async (token) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Decode header to get kid
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      const signingKey = await getSigningKey(decoded.header);

      jwt.verify(
        token,
        signingKey,
        {
          algorithms: ['RS256'],
          issuer: process.env.ZITADEL_ISSUER || 'http://localhost:8080',
          audience: process.env.ZITADEL_CLIENT_ID,
        },
        (err, payload) => {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Middleware to authenticate Zitadel tokens
 * Validates Authorization: Bearer <token>
 */
export const zitadelAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.slice(7);

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const payload = await verifyZitadelToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles || [],
      tokenPayload: payload,
    };
    next();
  } catch (error) {
    console.error('[Zitadel] Token verification failed:', error.message);
    
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
 * Optional Zitadel auth - doesn't fail if no token
 */
export const optionalZitadelAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  if (!token) {
    return next();
  }

  try {
    const payload = await verifyZitadelToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles || [],
      tokenPayload: payload,
    };
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};

/**
 * Check if user has required role
 * @param {string[]} requiredRoles - Roles required
 * @returns {Function} Express middleware
 */
export const requireZitadelRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles,
        userRoles 
      });
    }

    next();
  };
};

/**
 * Middleware for employer-only routes
 */
export const requireEmployer = requireZitadelRole(['employer', 'admin']);

/**
 * Middleware for candidate-only routes
 */
export const requireCandidate = requireZitadelRole(['candidate']);

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = requireZitadelRole(['admin']);

/**
 * Get Zitadel discovery document
 */
export const getZitadelDiscovery = () => {
  const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER || 'http://localhost:8080';
  
  return {
    issuer: ZITADEL_ISSUER,
    authorization_endpoint: `${ZITADEL_ISSUER}/oauth/authorize`,
    token_endpoint: `${ZITADEL_ISSUER}/oauth/token`,
    userinfo_endpoint: `${ZITADEL_ISSUER}/oidc/userinfo`,
    jwks_uri: `${ZITADEL_ISSUER}/oauth/jwks`,
    scopes_supported: ['openid', 'profile', 'email', 'roles'],
    response_types_supported: ['code', 'token', 'id_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
  };
};

export default {
  zitadelAuth,
  optionalZitadelAuth,
  verifyZitadelToken,
  requireZitadelRole,
  requireEmployer,
  requireCandidate,
  requireAdmin,
  getZitadelDiscovery,
};
