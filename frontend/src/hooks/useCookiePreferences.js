import { useState } from 'react';
import { setCookie, getCookie } from '@/lib/cookieUtils';

const COOKIE_PREF_KEY = 'cookie_preferences';

const defaultPrefs = {
  analytics: false,
  marketing: false,
  persistentLogin: false,
};

export function useCookiePreferences() {
  const [prefs, setPrefs] = useState(() => {
    const saved = getCookie(COOKIE_PREF_KEY);
    return saved ? JSON.parse(saved) : defaultPrefs;
  });

  const updatePreferences = (newPrefs) => {
    setPrefs(newPrefs);
    setCookie(COOKIE_PREF_KEY, JSON.stringify(newPrefs), {
      days: 365,
      path: '/',
      secure: true,
      sameSite: 'Lax',
    });
  };

  return [prefs, updatePreferences];
}
