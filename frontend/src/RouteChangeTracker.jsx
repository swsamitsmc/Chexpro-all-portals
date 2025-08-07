import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const RouteChangeTracker = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to the top of the page on route change
        if (GA_MEASUREMENT_ID) {
            // Send a pageview event to Google Analytics
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [location]); // This effect runs every time the location changes

    return null; // This component does not render anything
};

export default RouteChangeTracker;