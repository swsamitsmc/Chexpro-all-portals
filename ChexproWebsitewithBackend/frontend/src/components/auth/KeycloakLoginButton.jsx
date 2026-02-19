import React from 'react';
import { useKeycloakAuth } from '../../context/KeycloakAuthContext';

/**
 * Login button component that uses Keycloak authentication
 */
const KeycloakLoginButton = ({
  children,
  redirectUri,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const { login, loading } = useKeycloakAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    login(redirectUri);
  };

  // Variant styles
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const buttonClass = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${className}
  `;

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={loading}
      className={buttonClass}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children || 'Sign In with Keycloak'
      )}
    </button>
  );
};

export default KeycloakLoginButton;
