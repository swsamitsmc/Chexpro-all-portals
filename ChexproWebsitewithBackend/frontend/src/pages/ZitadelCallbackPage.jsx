/**
 * Zitadel Callback Page
 * 
 * This page handles the OAuth callback from Zitadel after login.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZitadelAuth } from '../hooks/useZitadelAuth';

/**
 * Callback page component
 * @returns {React.ReactNode}
 */
export function ZitadelCallbackPage() {
  const navigate = useNavigate();
  const { handleCallback, isAuthenticated, configured } = useZitadelAuth();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      if (!configured) {
        setError('Zitadel is not configured');
        setProcessing(false);
        return;
      }

      if (isAuthenticated) {
        // Already authenticated, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      try {
        const user = await handleCallback();
        if (user) {
          // Check for return URL
          const returnTo = sessionStorage.getItem('zitadel_return_to');
          sessionStorage.removeItem('zitadel_return_to');

          if (returnTo) {
            window.location.href = returnTo;
          } else {
            navigate('/dashboard');
          }
        } else {
          // No user returned, might need to check error
          const params = new URLSearchParams(window.location.search);
          const errorParam = params.get('error');
          const errorDescription = params.get('error_description');

          if (errorParam) {
            setError(errorDescription || errorParam);
          } else {
            setError('Authentication failed');
          }
        }
      } catch (err) {
        setError(err.message || 'Authentication failed');
      } finally {
        setProcessing(false);
      }
    };

    processCallback();
  }, [handleCallback, navigate, isAuthenticated, configured]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default ZitadelCallbackPage;
