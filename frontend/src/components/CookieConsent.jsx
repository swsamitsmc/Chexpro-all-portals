import { useState } from 'react';
import { getCookie } from '@/lib/cookieUtils';
import { useCookiePreferences } from '@/hooks/useCookiePreferences';

export function CookieBanner({ onPreferencesClick }) {
  const [prefs, setPrefs] = useCookiePreferences();
  const [consentGiven, setConsentGiven] = useState(() => {
    if (typeof window === 'undefined') return true;
    // Consent is given if the cookie_preferences cookie exists
    return getCookie('cookie_preferences') !== null;
  });

  const handleEssentialOnly = () => {
    setPrefs({ analytics: true, marketing: false, persistentLogin: false });
    setConsentGiven(true);
  };

  const handleAcceptAll = () => {
    setPrefs({ analytics: true, marketing: true, persistentLogin: true });
    setConsentGiven(true);
  };

  // Only show banner if consent not given
  if (!consentGiven) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 flex flex-col md:flex-row items-center justify-between shadow-lg">
        <span>
          We use essential cookies for analytics. You can also allow marketing and persistent login cookies. See our Privacy Policy for details.
        </span>
        <div className="flex gap-2 mt-2 md:mt-0 md:ml-4">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            onClick={handleEssentialOnly}
          >
            Essential Cookies Only
          </button>
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
            onClick={handleAcceptAll}
          >
            Accept All Cookies
          </button>
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded"
            onClick={onPreferencesClick}
          >
            Preferences
          </button>
        </div>
      </div>
    );
  }
  // Do not show any button after consent
  return null;
}