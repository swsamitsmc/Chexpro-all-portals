
import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
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

const pages = {
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



  // Preload pages on hover
  const handleLinkHover = (path) => {
    const PageComponent = pages[path];
    if (PageComponent && PageComponent.preload) {
      PageComponent.preload();
    }
  };

  return (
    <AppLayout onLinkHover={handleLinkHover}>
      <RouteChangeTracker />
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes location={location} key={location.pathname}>
              {Object.entries(pages).map(([path, Component]) => (
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
            </Routes>
          </Suspense>
        </AnimatePresence>
      </ErrorBoundary>
    </AppLayout>
  );
}

export default App;
  