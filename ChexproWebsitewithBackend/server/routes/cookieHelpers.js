// Middleware to set session, CSRF, and persistent login cookies in a SOC2/FCRA compliant way
//
// Cookie SameSite Policy:
// - Session and CSRF cookies: 'Strict' - Cookie is only sent in a first-party context
//   This provides maximum security for sensitive session tokens
// - Persistent login cookies: 'Lax' - Cookie is sent with top-level navigations and safe HTTP methods
//   This allows users to stay logged in while navigating within the site
//
// The difference is intentional:
// - Strict prevents CSRF attacks on sensitive operations
// - Lax provides better UX for persistent sessions while maintaining reasonable security

import crypto from 'crypto';

// Validate SESSION_SECRET at startup
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  const errorMsg = 'SESSION_SECRET environment variable is not set. This is required in all environments for secure session management.';
  console.error(`[SECURITY] ${errorMsg}`);
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
}

function signSessionId(sessionId) {
  return crypto.createHmac('sha256', SESSION_SECRET)
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
