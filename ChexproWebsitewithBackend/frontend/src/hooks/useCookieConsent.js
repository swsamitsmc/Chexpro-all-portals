import { useCookiePreferences } from './useCookiePreferences';

export function useCookieConsent() {
  // Consent is true if analytics or marketing cookies are allowed
  const [prefs] = useCookiePreferences();
  return [prefs.analytics || prefs.marketing];
}
