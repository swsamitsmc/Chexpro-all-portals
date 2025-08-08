import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import hiTranslations from './locales/hi.json';

const resources = {
  en: {
    translation: {
      ...enTranslations,
      footer: {
        description: "Reliable, accurate, and fast background screening solutions for modern businesses and individuals.",
        quickLinks: "Quick Links",
        aboutUs: "About Us",
        ourServices: "Our Services",
        compliance: "Compliance",
        resources: "Resources",
        contact: "Contact",
        legal: "Legal",
        fcraCompliance: "FCRA Compliance",
        dataSecurity: "Data Security",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service",
        connectWithUs: "Connect With Us",
        copyright: "© {{year}} ChexPro. All rights reserved. chexpro.com",
        disclaimer: "ChexPro is a consumer reporting agency. We strictly adhere to the Fair Credit Reporting Act (FCRA)."
      },
      cookies: {
        ...enTranslations.cookies,
        preferences: "Cookie Preferences",
        analytics: "Analytics Cookies",
        marketing: "Marketing/Advertising Cookies",
        persistent: "Persistent Login Cookie",
        savePreferences: "Save Preferences",
        description: "We use essential cookies for analytics. You can also allow marketing and persistent login cookies. See our Privacy Policy for details.",
        essentialOnly: "Essential Cookies Only",
        acceptAll: "Accept All Cookies",
        preferencesBtn: "Preferences"
      },
      contact: {
        officeHours: "Office Hours",
        findOnMap: "Find Us On Map",
        contactForm: "Contact Form",
        firstName: "First Name",
        companyName: "Company Name",
        emailAddress: "Email Address",
        phoneNumber: "Phone Number",
        servicesInterested: "Service(s) Interested In",
        message: "Message",
        sendMessage: "Send Message",
        privacyNote: "Note: We respect your privacy. Your information will only be used to respond to your inquiry."
      },
      demo: {
        savePreferences: "Save Preferences",
        privacyNote: "Note: We respect your privacy. Your information will only be used to contact you regarding this request."
      }
    }
  },
  es: {
    translation: {
      ...esTranslations,
      footer: {
        description: "Soluciones confiables, precisas y rápidas de verificación de antecedentes para empresas e individuos modernos.",
        quickLinks: "Enlaces Rápidos",
        aboutUs: "Acerca de Nosotros",
        ourServices: "Nuestros Servicios",
        compliance: "Cumplimiento",
        resources: "Recursos",
        contact: "Contacto",
        legal: "Legal",
        fcraCompliance: "Cumplimiento FCRA",
        dataSecurity: "Seguridad de Datos",
        privacyPolicy: "Política de Privacidad",
        termsOfService: "Términos de Servicio",
        connectWithUs: "Conéctate Con Nosotros",
        copyright: "© {{year}} ChexPro. Todos los derechos reservados. chexpro.com",
        disclaimer: "ChexPro es una agencia de informes de consumidores. Cumplimos estrictamente con la Ley de Informes de Crédito Justos (FCRA)."
      }
    }
  },
  fr: {
    translation: {
      ...frTranslations,
      footer: {
        description: "Solutions de vérification d'antécédents fiables, précises et rapides pour les entreprises et particuliers modernes.",
        quickLinks: "Liens Rapides",
        aboutUs: "À Propos",
        ourServices: "Nos Services",
        compliance: "Conformité",
        resources: "Ressources",
        contact: "Contact",
        legal: "Légal",
        fcraCompliance: "Conformité FCRA",
        dataSecurity: "Sécurité des Données",
        privacyPolicy: "Politique de Confidentialité",
        termsOfService: "Conditions de Service",
        connectWithUs: "Connectez-vous avec Nous",
        copyright: "© {{year}} ChexPro. Tous droits réservés. chexpro.com",
        disclaimer: "ChexPro est une agence de rapports de consommateurs. Nous respectons strictement la Fair Credit Reporting Act (FCRA)."
      }
    }
  },
  hi: {
    translation: {
      ...hiTranslations,
      footer: {
        description: "आधुनिक व्यवसायों और व्यक्तियों के लिए विश्वसनीय, सटीक और तेज़ पृष्ठभूमि जांच समाधान।",
        quickLinks: "त्वरित लिंक",
        aboutUs: "हमारे बारे में",
        ourServices: "हमारी सेवाएं",
        compliance: "अनुपालन",
        resources: "संसाधन",
        contact: "संपर्क",
        legal: "कानूनी",
        fcraCompliance: "FCRA अनुपालन",
        dataSecurity: "डेटा सुरक्षा",
        privacyPolicy: "गोपनीयता नीति",
        termsOfService: "सेवा की शर्तें",
        connectWithUs: "हमसे जुड़ें",
        copyright: "© {{year}} ChexPro. सभी अधिकार सुरक्षित। chexpro.com",
        disclaimer: "ChexPro एक उपभोक्ता रिपोर्टिंग एजेंसी है। हम Fair Credit Reporting Act (FCRA) का सख्ती से पालन करते हैं।"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: true
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;