import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'chexpro',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'chexpro-frontend',
};

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

/**
 * Initialize Keycloak and authenticate if necessary
 * @param {boolean} checkLoginIframe - Whether to check for existing session
 * @returns {Promise<object>} Keycloak authentication status
 */
export const initKeycloak = async (checkLoginIframe = true) => {
  try {
    const authenticated = await keycloak.init({
      onLoad: checkLoginIframe ? 'check-sso' : 'login-required',
      checkLoginIframe: checkLoginIframe,
      checkLoginIframeInterval: 60,
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      enableLogging: import.meta.env.DEV,
    });

    console.log('Keycloak initialized:', authenticated ? 'authenticated' : 'not authenticated');
    return { authenticated, keycloak };
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    throw error;
  }
};

/**
 * Perform login
 * @param {string} redirectUri - URL to redirect after login
 */
export const login = (redirectUri = window.location.origin) => {
  keycloak.login({
    redirectUri: redirectUri,
  });
};

/**
 * Perform logout
 * @param {string} redirectUri - URL to redirect after logout
 */
export const logout = (redirectUri = window.location.origin) => {
  keycloak.logout({
    redirectUri: redirectUri,
    postLogoutRedirectUri: redirectUri,
  });
};

/**
 * Register new user
 * @param {string} redirectUri - URL to redirect after registration
 */
export const register = (redirectUri = window.location.origin) => {
  keycloak.register({
    redirectUri: redirectUri,
  });
};

/**
 * Get access token
 * @returns {Promise<string>} Access token
 */
export const getToken = async () => {
  if (!keycloak.authenticated) {
    throw new Error('User not authenticated');
  }

  try {
    const refreshed = await keycloak.updateToken(30);
    if (refreshed) {
      console.log('Token refreshed');
    }
    return keycloak.token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Token expired, need to re-authenticate
    login();
    throw error;
  }
};

/**
 * Get user profile
 * @returns {object} User profile from Keycloak
 */
export const getUserProfile = () => {
  if (!keycloak.authenticated) {
    return null;
  }

  return {
    id: keycloak.subject,
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    name: keycloak.tokenParsed?.name,
    firstName: keycloak.tokenParsed?.given_name,
    lastName: keycloak.tokenParsed?.family_name,
    roles: keycloak.tokenParsed?.realm_access?.roles || [],
    authenticated: keycloak.authenticated,
  };
};

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean} Whether user has the role
 */
export const hasRole = (role) => {
  const profile = getUserProfile();
  return profile?.roles?.includes(role) || false;
};

/**
 * Check if user is authenticated
 * @returns {boolean} Whether user is authenticated
 */
export const isAuthenticated = () => {
  return keycloak.authenticated;
};

/**
 * Get Keycloak instance for advanced usage
 * @returns {object} Keycloak instance
 */
export const getKeycloak = () => {
  return keycloak;
};

/**
 * Refresh token manually
 * @returns {Promise<boolean>} Whether refresh was successful
 */
export const refreshToken = async () => {
  try {
    const refreshed = await keycloak.updateToken(30);
    return refreshed;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

export default keycloak;
