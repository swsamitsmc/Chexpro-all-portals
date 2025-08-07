import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
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
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: true
    }
  });

export default i18n;