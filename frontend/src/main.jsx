// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import i18n from '@/i18n'; // Initialize i18n
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter for routing
import { Toaster } from '@/components/ui/toaster'; // Import Toaster component
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider
import { I18nextProvider } from 'react-i18next';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider> 
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <App />
          <Toaster />
        </I18nextProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);