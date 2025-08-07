import React from 'react';
import { useTranslation } from 'react-i18next';

export function CookiePreferencesModal({ open, onClose, onSave, prefs, setPrefs }) {
  const { t } = useTranslation();
  if (!open) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">{t('cookies.preferences')}</h2>
        <form onSubmit={handleSave}>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={e => setPrefs({ ...prefs, analytics: e.target.checked })}
            />
            <span className="ml-2">{t('cookies.analytics')}</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={e => setPrefs({ ...prefs, marketing: e.target.checked })}
            />
            <span className="ml-2">{t('cookies.marketing')}</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={prefs.persistentLogin}
              onChange={e => setPrefs({ ...prefs, persistentLogin: e.target.checked })}
            />
            <span className="ml-2">{t('cookies.persistent')}</span>
          </label>
          <div className="flex justify-end mt-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{t('cookies.savePreferences')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
