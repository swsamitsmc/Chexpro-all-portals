// Middleware to set session, CSRF, and persistent login cookies in a SOC2/FCRA compliant way
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is not set. This is required in production for secure session management.');
} else if (!SESSION_SECRET) {
  console.warn('SESSION_SECRET environment variable is not set. Using a default secret for development. Set SESSION_SECRET in production for secure session management.');
}

const ACTIVE_SESSION_SECRET = SESSION_SECRET || 'dev-insecure-session-secret';


function signSessionId(sessionId) {
  return crypto.createHmac('sha256', ACTIVE_SESSION_SECRET)
               .update(sessionId)
               .digest('hex');
}

export function setSessionCookie(res, sessionId) {
  const signedSessionId = sessionId + '.' + signSessionId(sessionId);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE) || 60 * 60 * 1000 // 1 hour default
  };
  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.cookie('session_id', signedSessionId, cookieOptions);
}

export function setCSRFCookie(res, csrfToken) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: parseInt(process.env.CSRF_COOKIE_MAX_AGE) || 60 * 60 * 1000 // 1 hour default
  };
  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.cookie('csrf_token', csrfToken, cookieOptions);
}

export function setPersistentLoginCookie(res, token) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.PERSISTENT_COOKIE_SAME_SITE || 'Lax',
    path: '/',
    maxAge: parseInt(process.env.PERSISTENT_COOKIE_MAX_AGE) || 30 * 24 * 60 * 60 * 1000 // 30 days default
  };
  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.cookie('persistent_login', token, cookieOptions);
}
