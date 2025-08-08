import { useEffect } from 'react';
import { setCookie } from '@/lib/cookieUtils';
import { APP_CONFIG } from '@/config/appConfig';

export const useCookieManager = (prefs) => {
  // Handle marketing cookie
  useEffect(() => {
    if (prefs.marketing) {
      setCookie('marketing_cookie', '1', { 
        days: APP_CONFIG.MARKETING_COOKIE_DAYS, 
        path: '/', 
        secure: true, 
        sameSite: 'Lax' 
      });
    } else {
      setCookie('marketing_cookie', '', { days: -1, path: '/' });
    }
  }, [prefs.marketing]);

  return {
    setMarketingCookie: (enabled) => {
      if (enabled) {
        setCookie('marketing_cookie', '1', { 
          days: APP_CONFIG.MARKETING_COOKIE_DAYS, 
          path: '/', 
          secure: true, 
          sameSite: 'Lax' 
        });
      } else {
        setCookie('marketing_cookie', '', { days: -1, path: '/' });
      }
    }
  };
};