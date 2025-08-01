// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { HelmetProvider } from 'react-helmet-async'; // <--- NEW: Import HelmetProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider> {/* <--- NEW: Add HelmetProvider here */}
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);