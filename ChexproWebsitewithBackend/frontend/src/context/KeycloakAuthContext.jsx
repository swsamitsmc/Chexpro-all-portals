import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initKeycloak,
  login,
  logout,
  getToken,
  getUserProfile,
  hasRole,
  isAuthenticated,
  refreshToken,
} from '../lib/keycloakClient';

const KeycloakAuthContext = createContext(null);

/**
 * Provider component for Keycloak authentication
 */
export const KeycloakAuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    initialized: false,
    authenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  // Initialize Keycloak on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const { authenticated, keycloak } = await initKeycloak(true);

        if (authenticated) {
          setAuth({
            initialized: true,
            authenticated: true,
            user: getUserProfile(),
            loading: false,
            error: null,
          });
        } else {
          setAuth({
            initialized: true,
            authenticated: false,
            user: null,
            loading: false,
            error: null,
          });
        }

        // Set up token refresh
        const refreshInterval = setInterval(async () => {
          if (isAuthenticated()) {
            const refreshed = await refreshToken();
            if (refreshed) {
              setAuth((prev) => ({
                ...prev,
                user: getUserProfile(),
              }));
            }
          }
        }, 60000); // Refresh every minute

        return () => clearInterval(refreshInterval);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuth({
          initialized: true,
          authenticated: false,
          user: null,
          loading: false,
          error: error.message,
        });
      }
    };

    initialize();
  }, []);

  // Login function
  const handleLogin = useCallback((redirectUri) => {
    login(redirectUri);
  }, []);

  // Logout function
  const handleLogout = useCallback((redirectUri) => {
    logout(redirectUri);
  }, []);

  // Check if user has role
  const checkRole = useCallback((role) => {
    return hasRole(role);
  }, []);

  const value = {
    ...auth,
    login: handleLogin,
    logout: handleLogout,
    checkRole,
    getToken,
    refreshToken: refreshToken,
  };

  return (
    <KeycloakAuthContext.Provider value={value}>
      {children}
    </KeycloakAuthContext.Provider>
  );
};

/**
 * Hook to use Keycloak authentication
 * @returns {object} Authentication context value
 */
export const useKeycloakAuth = () => {
  const context = useContext(KeycloakAuthContext);
  if (!context) {
    throw new Error('useKeycloakAuth must be used within a KeycloakAuthProvider');
  }
  return context;
};

/**
 * HOC to protect component requiring authentication
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Protected component
 */
export const withKeycloakAuth = (Component) => {
  return function WithKeycloakAuthWrapper(props) {
    const { authenticated, loading, login: handleLogin } = useKeycloakAuth();

    if (loading) {
      return null; // Or a loading spinner
    }

    if (!authenticated) {
      handleLogin();
      return null;
    }

    return <Component {...props} />;
  };
};

export default KeycloakAuthContext;
