import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setOpen(false);
  };

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'fr', label: 'FR' },
    { code: 'hi', label: 'हि' }
  ];

  return (
    <div className="relative">
      <button
        className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {languages.find(l => l.code === i18n.language)?.label || 'EN'}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-28 rounded-md border bg-white shadow-md z-50"
        >
          {languages.map(({ code, label }) => (
            <button
              key={code}
              role="menuitem"
              onClick={() => changeLanguage(code)}
              className={`block w-full text-left px-3 py-2 text-sm ${i18n.language === code ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;