/**
 * Zitadel Login Button Component
 * 
 * A button that triggers Zitadel authentication flow.
 */

import { useState } from 'react';
import { useZitadelAuth } from '../../hooks/useZitadelAuth';
import { Button } from '../ui/button';

/**
 * Login button component
 * @param {Object} props
 * @param {string} props.variant - Button variant (default, outline, etc.)
 * @param {string} props.size - Button size
 * @param {string} props.returnTo - URL to redirect to after login
 * @param {React.ReactNode} props.children - Custom button text
 * @returns {React.ReactNode}
 */
export function ZitadelLoginButton({
  variant = 'default',
  size = 'default',
  returnTo = null,
  children = null,
  className = '',
  ...props
}) {
  const { login, isLoading, isAuthenticated, configured } = useZitadelAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleClick = async () => {
    if (isLoading || isLoggingIn || isAuthenticated) return;

    setIsLoggingIn(true);
    try {
      await login({ returnTo });
    } catch (err) {
      console.error('[Zitadel] Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!configured) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
        {...props}
      >
        {children || 'Login (Not Configured)'}
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
        {...props}
      >
        {children || 'Already Logged In'}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || isLoggingIn}
      className={className}
      {...props}
    >
      {isLoggingIn ? 'Redirecting...' : (children || 'Sign In')}
    </Button>
  );
}

/**
 * Logout button component
 * @param {Object} props
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 * @param {React.ReactNode} props.children - Custom button text
 * @returns {React.ReactNode}
 */
export function ZitadelLogoutButton({
  variant = 'outline',
  size = 'default',
  children = null,
  className = '',
  ...props
}) {
  const { logout, isLoading, isAuthenticated, configured } = useZitadelAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleClick = async () => {
    if (isLoading || isLoggingOut || !isAuthenticated) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('[Zitadel] Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!configured || !isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || isLoggingOut}
      className={className}
      {...props}
    >
      {isLoggingOut ? 'Signing out...' : (children || 'Sign Out')}
    </Button>
  );
}

/**
 * Combined login/logout button
 * @param {Object} props
 * @returns {React.ReactNode}
 */
export function ZitadelAuthButton({ className = '', ...props }) {
  const { isAuthenticated } = useZitadelAuth();

  if (isAuthenticated) {
    return <ZitadelLogoutButton className={className} {...props} />;
  }

  return <ZitadelLoginButton className={className} {...props} />;
}

export default ZitadelLoginButton;
