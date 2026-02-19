/**
 * Zitadel Authentication Context
 * 
 * Provides authentication state and methods for the React frontend.
 * This context manages user authentication state using Zitadel OIDC.
 * 
 * SECURITY NOTE: Tokens are stored in memory only, not in localStorage.
 * This reduces the risk of XSS attacks stealing authentication tokens.
 * For persistence across page reloads, the backend should use httpOnly cookies.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { zitadelConfig, createZitadelClient, isZitadelConfigured } from '../lib/zitadelClient';

/**
 * Create the authentication context
 */
const ZitadelAuthContext = createContext(null);

// Session storage key for user info only (not tokens)
const USER_SESSION_KEY = 'chexpro_user_session';

/**
 * Authentication provider component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function ZitadelAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Store tokens in memory only - NOT in localStorage for security
  const [accessToken, setAccessToken] = useState(null);
  const [idToken, setIdToken] = useState(null);

  /**
   * Check if user is authenticated on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      if (!isZitadelConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        // Check for stored user session (basic info only, no tokens)
        const storedUserSession = sessionStorage.getItem(USER_SESSION_KEY);
        
        if (storedUserSession) {
          const userData = JSON.parse(storedUserSession);
          setUser(userData);
          setIsAuthenticated(true);
          // Note: Tokens are not restored - user must re-authenticate
          // This is intentional for security - tokens should come from httpOnly cookies
        }
      } catch (err) {
        console.error('[Zitadel] Auth check failed:', err);
        setError(err.message);
        // Clear potentially corrupted session data
        sessionStorage.removeItem(USER_SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login with Zitadel - redirects to Zitadel login page
   */
  const login = useCallback(async (options = {}) => {
    if (!isZitadelConfigured()) {
      console.warn('[Zitadel] Not configured, cannot login');
      setError('Zitadel is not configured');
      return;
    }

    try {
      const client = createZitadelClient();
      if (!client) {
        throw new Error('Failed to create Zitadel client');
      }

      const { url } = await client.signInWithRedirect(
        options.scopes || ['openid', 'profile', 'email', 'roles'],
        options.prompt
      );

      // Store the original URL for redirect after login
      if (options.returnTo) {
        sessionStorage.setItem('zitadel_return_to', options.returnTo);
      }

      // Redirect to Zitadel
      window.location.href = url;
    } catch (err) {
      console.error('[Zitadel] Login failed:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Handle the callback from Zitadel after login
   */
  const handleCallback = useCallback(async () => {
    if (!isZitadelConfigured()) {
      return null;
    }

    try {
      const client = createZitadelClient();
      if (!client) {
        throw new Error('Failed to create Zitadel client');
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        throw new Error('No authorization code in callback');
      }

      // Exchange code for tokens
      const response = await client.tokenRequest(code);

      if (response.access_token) {
        const userInfo = await client.getUserInfo(response.access_token);

        const userData = {
          id: userInfo.sub,
          email: userInfo.email,
          emailVerified: userInfo.email_verified,
          name: userInfo.name,
          givenName: userInfo.given_name,
          familyName: userInfo.family_name,
          picture: userInfo.picture,
          roles: userInfo.roles || [],
        };

        // Store only user info in sessionStorage (not tokens)
        // Tokens are kept in memory only for this session
        sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));

        setUser(userData);
        setAccessToken(response.access_token);
        setIdToken(response.id_token);
        setIsAuthenticated(true);
        setError(null);

        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);

        return userData;
      }
    } catch (err) {
      console.error('[Zitadel] Callback failed:', err);
      setError(err.message);
      throw err;
    }

    return null;
  }, []);

  /**
   * Logout from Zitadel
   */
  const logout = useCallback(async () => {
    if (!isZitadelConfigured()) {
      // Clear local state only
      clearSession();
      return;
    }

    try {
      const client = createZitadelClient();
      if (client && accessToken) {
        // Try to logout from Zitadel
        try {
          const { url } = await client.signOut(accessToken);
          clearSession();
          window.location.href = url;
        } catch (signOutErr) {
          console.warn('[Zitadel] Sign out redirect failed:', signOutErr);
          clearSession();
        }
      } else {
        clearSession();
      }
    } catch (err) {
      console.error('[Zitadel] Logout failed:', err);
      clearSession();
    }
  }, [accessToken]);

  /**
   * Clear local session data
   */
  const clearSession = useCallback(() => {
    // Clear sessionStorage (user info only)
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem('zitadel_return_to');

    // Clear in-memory state
    setUser(null);
    setAccessToken(null);
    setIdToken(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  /**
   * Get the access token for API calls
   */
  const getAccessToken = useCallback(() => {
    return accessToken;
  }, [accessToken]);

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  const hasRole = useCallback((role) => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  }, [user]);

  /**
   * Check if user is an employer
   */
  const isEmployer = useCallback(() => {
    return hasRole('employer') || hasRole('admin');
  }, [hasRole]);

  /**
   * Check if user is a candidate
   */
  const isCandidate = useCallback(() => {
    return hasRole('candidate');
  }, [hasRole]);

  /**
   * Check if user is an admin
   */
  const isAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  /**
   * Refresh the access token
   */
  const refreshToken = useCallback(async () => {
    if (!isZitadelConfigured() || !user) {
      return;
    }

    try {
      const client = createZitadelClient();
      if (!client) return;

      // For PKCE, we need to re-authenticate
      await login();
    } catch (err) {
      console.error('[Zitadel] Token refresh failed:', err);
      throw err;
    }
  }, [user, login]);

  // Value to provide to consumers
  const value = useMemo(() => ({
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    idToken,
    configured: isZitadelConfigured(),

    // Methods
    login,
    logout,
    handleCallback,
    getAccessToken,
    refreshToken,
    clearSession,

    // Role helpers
    hasRole,
    isEmployer,
    isCandidate,
    isAdmin,
  }), [
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    idToken,
    login,
    logout,
    handleCallback,
    getAccessToken,
    refreshToken,
    clearSession,
    hasRole,
    isEmployer,
    isCandidate,
    isAdmin,
  ]);

  return (
    <ZitadelAuthContext.Provider value={value}>
      {children}
    </ZitadelAuthContext.Provider>
  );
}

/**
 * Hook to use Zitadel authentication
 * @returns {Object} Authentication context value
 */
export function useZitadelAuth() {
  const context = useContext(ZitadelAuthContext);
  if (!context) {
    throw new Error('useZitadelAuth must be used within a ZitadelAuthProvider');
  }
  return context;
}

/**
 * Higher-order component to wrap components with auth requirement
 * @param {React.ComponentType} Component - Component to wrap
 * @param {Object} options - Options
 * @returns {React.ComponentType}
 */
export function withZitadelAuth(Component, options = {}) {
  return function AuthenticatedComponent(props) {
    const { requiredRoles, requiredAuth } = options;
    const { isAuthenticated, isLoading, hasRole } = useZitadelAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (requiredAuth !== false && !isAuthenticated) {
      return <div>Please log in to access this page.</div>;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRoles = requiredRoles.every(role => hasRole(role));
      if (!hasRequiredRoles) {
        return <div>You do not have permission to access this page.</div>;
      }
    }

    return <Component {...props} />;
  };
}

export default ZitadelAuthContext;
