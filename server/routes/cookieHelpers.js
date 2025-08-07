// Middleware to set session, CSRF, and persistent login cookies in a SOC2/FCRA compliant way
import crypto from 'crypto';

export function setSessionCookie(res, sessionId) {
  res.cookie('session_id', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
}

export function setCSRFCookie(res, csrfToken) {
  res.cookie('csrf_token', csrfToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
}

export function setPersistentLoginCookie(res, token) {
  res.cookie('persistent_login', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}
