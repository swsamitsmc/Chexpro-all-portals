
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AnimatePresence } from 'framer-motion';
import PageLoader from '@/components/ui/PageLoader';
import RouteChangeTracker from './RouteChangeTracker';
import { CookieBanner } from '@/components/CookieConsent';
import { CookiePreferencesModal } from '@/components/CookiePreferences';
import { useCookiePreferences } from '@/hooks/useCookiePreferences';
import { setCookie } from '@/lib/cookieUtils';
import { loadGoogleAnalytics } from '@/lib/googleAnalytics';
import useGAPageTracking from '@/hooks/useGAPageTracking';
import BackToTopButton from '@/components/BackToTopButton';

const HomePage = lazy(() => import('@/pages/HomePage'));
const AboutUsPage = lazy(() => import('@/pages/AboutUsPage'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const CompliancePage = lazy(() => import('@/pages/CompliancePage'));
const ResourcesPage = lazy(() => import('@/pages/ResourcesPage'));
const ContactUsPage = lazy(() => import('@/pages/ContactUsPage'));
const ClientLoginPage = lazy(() => import('@/pages/ClientLoginPage'));
const RequestDemoPage = lazy(() => import('@/pages/RequestDemoPage'));

const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'));
const FCRACompliancePage = lazy(() => import('@/pages/FCRACompliancePage'));
const DataSecurityPage = lazy(() => import('@/pages/DataSecurityPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function App() {
  const location = useLocation();
  const [prefs, setPrefs] = useCookiePreferences();
  const [showPrefs, setShowPrefs] = useState(false);
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

  // Load GA only if analytics cookies allowed
  useEffect(() => {
    if (prefs.analytics && GA_MEASUREMENT_ID) {
      loadGoogleAnalytics(GA_MEASUREMENT_ID);
    }
  }, [prefs.analytics, GA_MEASUREMENT_ID]);

  // Track page views only if analytics cookies allowed
  useGAPageTracking(prefs.analytics && GA_MEASUREMENT_ID);

  // Set marketing cookie stub if allowed
  useEffect(() => {
    if (prefs.marketing) {
      setCookie('marketing_cookie', '1', { days: 365, path: '/', secure: true, sameSite: 'Lax' });
    } else {
      setCookie('marketing_cookie', '', { days: -1, path: '/' });
    }
  }, [prefs.marketing]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <RouteChangeTracker />
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/contact" element={<ContactUsPage />} />
              <Route path="/login" element={<ClientLoginPage />} />
              <Route path="/request-demo" element={<RequestDemoPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/fcra-compliance" element={<FCRACompliancePage />} />
              <Route path="/data-security" element={<DataSecurityPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      <Footer />
      <BackToTopButton />
      <CookieBanner onPreferencesClick={() => setShowPrefs(true)} />
      <CookiePreferencesModal 
        open={showPrefs}
        onClose={() => setShowPrefs(false)}
        prefs={prefs}
        setPrefs={setPrefs}
      />
    </div>
  );
}

export default App;
  