import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Keycloak configuration
const keycloakConfig = {
  url: process.env.KEYCLOAK_URL || 'http://localhost:8081',
  realm: process.env.KEYCLOAK_REALM || 'chexpro',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'chexpro-backend',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  audience: process.env.KEYCLOAK_AUDIENCE || 'chexpro-backend',
};

// JWKS client for fetching public keys
let jwksClientInstance = null;

/**
 * Initialize JWKS client
 */
const initJwksClient = () => {
  if (!jwksClientInstance) {
    const jwksUri = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`;
    jwksClientInstance = jwksClient({
      jwksUri: jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return jwksClientInstance;
};

/**
 * Get signing key from JWKS
 * @param {object} header - JWT header
 * @returns {Promise<string>} Signing key
 */
const getSigningKey = (header) => {
  return new Promise((resolve, reject) => {
    const client = initJwksClient();
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        reject(err);
      } else {
        resolve(key.getPublicKey());
      }
    });
  });
};

/**
 * Verify Keycloak access token
 * @param {string} token - Access token to verify
 * @returns {Promise<object>} Decoded token payload
 */
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const signingKey = await getSigningKey(decoded.header);

    const payload = jwt.verify(token, signingKey, {
      audience: keycloakConfig.audience,
      issuer: `${keycloakConfig.url}/realms/${keycloakConfig.realm}`,
      algorithms: ['RS256'],
    });

    return payload;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error;
  }
};

/**
 * Extract token from Authorization header
 * @param {object} req - Express request
 * @returns {string|null} Token or null
 */
export const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

/**
 * Keycloak authentication middleware
 * Validates Bearer token in Authorization header
 */
export const keycloakAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No access token provided',
      });
    }

    const payload = await verifyToken(token);

    // Attach user info to request
    req.user = {
      id: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      name: payload.name,
      roles: payload.realm_access?.roles || [],
      clientId: payload.azp,
      tokenPayload: payload,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Required roles (any of these)
 * @returns {function} Express middleware
 */
export const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        requiredRoles: roles,
        userRoles: userRoles,
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if valid token provided, continues otherwise
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = await verifyToken(token);
      req.user = {
        id: payload.sub,
        username: payload.preferred_username,
        email: payload.email,
        name: payload.name,
        roles: payload.realm_access?.roles || [],
        clientId: payload.azp,
        tokenPayload: payload,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Get Keycloak configuration info
 */
export const getKeycloakInfo = () => {
  return {
    url: keycloakConfig.url,
    realm: keycloakConfig.realm,
    audience: keycloakConfig.audience,
    issuer: `${keycloakConfig.url}/realms/${keycloakConfig.realm}`,
  };
};

export default keycloakAuth;
