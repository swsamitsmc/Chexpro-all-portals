import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ENV_CONFIG } from '@/config/envConfig';
import { trackPageView } from '@/lib/googleAnalytics';

const RouteChangeTracker = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to the top of the page on route change
    if (ENV_CONFIG.GA_MEASUREMENT_ID && ENV_CONFIG.ENABLE_ANALYTICS) {
      trackPageView(location.pathname + location.search);
    }
    }, [location]); // This effect runs every time the location changes

    return null; // This component does not render anything
};

export default RouteChangeTracker;