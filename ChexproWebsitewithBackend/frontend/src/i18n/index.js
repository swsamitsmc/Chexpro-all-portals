import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import hiTranslations from './locales/hi.json';

const resources = {
  en: {
    translation: enTranslations
  },
  es: {
    translation: esTranslations
  },
  fr: {
    translation: frTranslations
  },
  hi: {
    translation: hiTranslations
  }
};

// Security: Validate language against whitelist to prevent XSS injection
const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem('language');
    // Validate against whitelist of supported languages
    const supportedLangs = ['en', 'es', 'fr', 'hi'];
    return stored && supportedLangs.includes(stored) ? stored : 'en';
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
    return 'en';
  }
};



// Translation file integrity validation
const validateTranslationFile = (translations, language) => {
  if (!translations || typeof translations !== 'object') {
    throw new Error(`Invalid translation file for ${language}`);
  }

  // Check for required sections
  const requiredSections = ['common', 'navigation'];
  for (const section of requiredSections) {
    if (!translations[section]) {
      throw new Error(`Missing required section '${section}' in ${language} translations`);
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'hi'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Validate all translation files on initialization
try {
  validateTranslationFile(enTranslations, 'en');
  validateTranslationFile(esTranslations, 'es');
  validateTranslationFile(frTranslations, 'fr');
  validateTranslationFile(hiTranslations, 'hi');
} catch (error) {
  console.error('Translation file validation failed:', error.message || String(error));
}

export default i18n;
