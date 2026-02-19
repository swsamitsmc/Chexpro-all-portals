import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();

  const validateToken = async () => {
    try {
      const response = await authApi.getMe();
      if (response.data.success && response.data.data) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated || !user) {
        const isValid = await validateToken();
        if (!isValid) {
          clearAuth();
          navigate('/login', { state: { from: location.pathname } });
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, user, navigate, location.pathname, clearAuth]);

  return {
    isAuthenticated,
    user,
    setAuth,
    clearAuth,
    validateToken,
  };
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  return isAuthenticated;
}
