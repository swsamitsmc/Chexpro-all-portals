import { useEffect } from 'react';
import { trackPageView } from '@/lib/googleAnalytics';
import { useLocation } from 'react-router-dom';

export default function useGAPageTracking(enabled) {
  const location = useLocation();

  useEffect(() => {
    if (enabled) {
      trackPageView(location.pathname + location.search);
    }
  }, [enabled, location]);
}
