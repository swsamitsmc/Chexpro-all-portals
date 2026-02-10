
import { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ClientLayout from '@/components/layout/ClientLayout';
import { AnimatePresence } from 'framer-motion';
import PageLoader from '@/components/ui/PageLoader';
import PageTransition from '@/components/ui/PageTransition';
import RouteChangeTracker from './RouteChangeTracker';
import { useCookiePreferences } from '@/hooks/useCookiePreferences';
import { useCookieManager } from '@/hooks/useCookieManager';
import { loadGoogleAnalytics } from '@/lib/googleAnalytics';
import useGAPageTracking from '@/hooks/useGAPageTracking';
import { ENV_CONFIG } from '@/config/envConfig';
import lazyWithPreload from '@/lib/lazyWithPreload';
import ErrorBoundary from '@/components/ErrorBoundary';

const HomePage = lazyWithPreload(() => import('@/pages/HomePage'));
const AboutUsPage = lazyWithPreload(() => import('@/pages/AboutUsPage'));
const ServicesPage = lazyWithPreload(() => import('@/pages/ServicesPage'));
const CompliancePage = lazyWithPreload(() => import('@/pages/CompliancePage'));
const ResourcesPage = lazyWithPreload(() => import('@/pages/ResourcesPage'));
const ResourcePostPage = lazyWithPreload(() => import('@/pages/ResourcePostPage'));
const ContactUsPage = lazyWithPreload(() => import('@/pages/ContactUsPage'));
const ClientLoginPage = lazyWithPreload(() => import('@/pages/ClientLoginPage'));
const RequestDemoPage = lazyWithPreload(() => import('@/pages/RequestDemoPage'));

const PrivacyPolicyPage = lazyWithPreload(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazyWithPreload(() => import('@/pages/TermsOfServicePage'));
const FCRACompliancePage = lazyWithPreload(() => import('@/pages/FCRACompliancePage'));
const DataSecurityPage = lazyWithPreload(() => import('@/pages/DataSecurityPage'));
const NotFoundPage = lazyWithPreload(() => import('@/pages/NotFoundPage'));

// Dashboard pages
const Dashboard = lazyWithPreload(() => import('@/pages/Dashboard'));

const publicPages = {
  '/': HomePage,
  '/about': AboutUsPage,
  '/services': ServicesPage,
  '/compliance': CompliancePage,
  '/resources': ResourcesPage,
  '/resources/:slug': ResourcePostPage,
  '/contact': ContactUsPage,
  '/login': ClientLoginPage,
  '/request-demo': RequestDemoPage,
  '/privacy-policy': PrivacyPolicyPage,
  '/terms-of-service': TermsOfServicePage,
  '/fcra-compliance': FCRACompliancePage,
  '/data-security': DataSecurityPage,
  '*': NotFoundPage,
};



function App() {
  const location = useLocation();
  const [prefs] = useCookiePreferences();
  
  // Use custom cookie manager
  useCookieManager(prefs);

  // Load GA only if analytics cookies allowed
  useEffect(() => {
    if (prefs.analytics && ENV_CONFIG.GA_MEASUREMENT_ID && ENV_CONFIG.ENABLE_ANALYTICS) {
      loadGoogleAnalytics(ENV_CONFIG.GA_MEASUREMENT_ID);
    }
  }, [prefs.analytics]);

  // Track page views only if analytics cookies allowed
  useGAPageTracking(prefs.analytics && ENV_CONFIG.GA_MEASUREMENT_ID && ENV_CONFIG.ENABLE_ANALYTICS);

  // Preload pages on hover - Enhanced for parameterized routes
  const handleLinkHover = (path) => {
    // Handle exact path matches first
    if (publicPages[path] && publicPages[path].preload) {
      publicPages[path].preload();
      return;
    }

    // Handle parameterized routes by checking patterns
    if (path.startsWith('/resources/')) {
      if (publicPages['/resources/:slug'] && publicPages['/resources/:slug'].preload) {
        publicPages['/resources/:slug'].preload();
      }
    }
  };

  return (
    <Routes location={location} key={location.pathname}>
      {/* Public routes with AppLayout */}
      <Route element={
        <AppLayout onLinkHover={handleLinkHover}>
          <RouteChangeTracker />
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </AnimatePresence>
          </ErrorBoundary>
        </AppLayout>
      }>
        {Object.entries(publicPages).map(([path, Component]) => (
          <Route
            key={path}
            path={path}
            element={
              <PageTransition>
                <Component />
              </PageTransition>
            }
          />
        ))}
      </Route>

      {/* Dashboard routes with ClientLayout */}
      <Route path="/dashboard" element={
        <ClientLayout>
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </AnimatePresence>
          </ErrorBoundary>
        </ClientLayout>
      } />
    </Routes>
  );
}

export default App;
