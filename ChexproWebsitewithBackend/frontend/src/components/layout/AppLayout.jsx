import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import BackToTopButton from '@/components/BackToTopButton';
import { CookieBanner } from '@/components/CookieConsent';
import { CookiePreferencesModal } from '@/components/CookiePreferences';
import { useCookiePreferences } from '@/hooks/useCookiePreferences';

const AppLayout = ({ children, onLinkHover }) => {
  const [prefs, setPrefs] = useCookiePreferences();
  const [showPrefs, setShowPrefs] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onLinkHover={onLinkHover} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <BackToTopButton />
      <CookieBanner onPreferencesClick={() => setShowPrefs(true)} />
      <CookiePreferencesModal 
        open={showPrefs}
        onClose={() => setShowPrefs(false)}
        onSave={() => setShowPrefs(false)}
        prefs={prefs}
        setPrefs={setPrefs}
      />
    </div>
  );
};

export default AppLayout;