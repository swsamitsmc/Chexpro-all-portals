import { useState, useEffect } from 'react';
import { setCookie, getCookie } from '@/lib/cookieUtils';

const COOKIE_PREF_KEY = 'cookie_preferences';

const defaultPreferences = {
  analytics: false,
  marketing: false,
  persistentLogin: false
};

export function useCookiePreferences() {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === 'undefined') return defaultPreferences;
    
    const savedPrefs = getCookie(COOKIE_PREF_KEY);
    if (savedPrefs) {
      try {
        return JSON.parse(savedPrefs);
      } catch (e) {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    setCookie(COOKIE_PREF_KEY, JSON.stringify(preferences), {
      days: 365,
      path: '/',
      secure: true,
      sameSite: 'Lax'
    });
  }, [preferences]);

  return [preferences, setPreferences];
}
