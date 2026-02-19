// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import i18n from '@/i18n/index.js'; // Initialize i18n using folder initializer
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter for routing
import { Toaster } from '@/components/ui/toaster'; // Import Toaster component
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider
import { I18nextProvider } from 'react-i18next';
import { ZitadelAuthProvider } from './context/ZitadelAuthContext'; // Import Zitadel Auth Provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider> 
      <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
        <I18nextProvider i18n={i18n}>
          <ZitadelAuthProvider>
            <App />
            <Toaster />
          </ZitadelAuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);