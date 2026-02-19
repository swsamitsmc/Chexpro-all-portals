/**
 * useZitadelAuth Hook
 * 
 * Custom hook for accessing Zitadel authentication state and methods.
 * Provides a simpler API than directly using the context.
 */

import { useContext, useMemo } from 'react';
import ZitadelAuthContext from '../context/ZitadelAuthContext';

/**
 * Custom hook for Zitadel authentication
 * @returns {Object} Authentication state and methods
 */
export function useZitadelAuth() {
  const context = useContext(ZitadelAuthContext);

  if (!context) {
    throw new Error('useZitadelAuth must be used within a ZitadelAuthProvider');
  }

  return context;
}

/**
 * Hook to check if user is authenticated
 * @returns {boolean}
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useZitadelAuth();
  return { isAuthenticated, isLoading };
}

/**
 * Hook to get current user
 * @returns {Object|null}
 */
export function useUser() {
  const { user } = useZitadelAuth();
  return user;
}

/**
 * Hook to check user roles
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean}
 */
export function useHasRole(roles) {
  const { hasRole: checkRole } = useZitadelAuth();

  const rolesArray = Array.isArray(roles) ? roles : [roles];

  return useMemo(() => {
    return rolesArray.every(role => checkRole(role));
  }, [checkRole, rolesArray]);
}

/**
 * Hook for employer-specific functionality
 * @returns {Object}
 */
export function useEmployer() {
  const { isEmployer, hasRole } = useZitadelAuth();
  return {
    isEmployer,
    canAccess: isEmployer,
  };
}

/**
 * Hook for candidate-specific functionality
 * @returns {Object}
 */
export function useCandidate() {
  const { isCandidate, hasRole } = useZitadelAuth();
  return {
    isCandidate,
    canAccess: isCandidate,
  };
}

/**
 * Hook for admin-specific functionality
 * @returns {Object}
 */
export function useAdmin() {
  const { isAdmin, hasRole } = useZitadelAuth();
  return {
    isAdmin,
    canAccess: isAdmin,
  };
}

/**
 * Hook for authentication actions
 * @returns {Object}
 */
export function useAuthActions() {
  const { login, logout, handleCallback, getAccessToken, refreshToken } = useZitadelAuth();
  return {
    login,
    logout,
    handleCallback,
    getAccessToken,
    refreshToken,
  };
}

export default useZitadelAuth;
