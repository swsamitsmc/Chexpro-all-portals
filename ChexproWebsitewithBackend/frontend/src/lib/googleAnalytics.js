// Loads Google Analytics script after user consent
export function loadGoogleAnalytics(measurementId) {
  if (!measurementId || typeof window === 'undefined') return;
  if (window.GA_INITIALIZED) return;

  // Validate measurement ID format (G-XXXXXXXXXX)
  if (!/^G-[A-Z0-9]{10}$/.test(measurementId)) {
    console.warn('Invalid GA measurement ID format:', measurementId);
    return;
  }

  window.GA_INITIALIZED = true;

  // Inject GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Init gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, { anonymize_ip: true }); // anonymize IP for privacy
}

// Track page views
export function trackPageView(path) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
    });
  }
}
