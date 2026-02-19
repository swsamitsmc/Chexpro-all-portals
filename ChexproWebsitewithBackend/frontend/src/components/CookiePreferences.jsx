import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export function CookiePreferencesModal({
  open = false,
  onClose,
  onSave,
  prefs = { analytics: false, marketing: false, persistentLogin: false },
  setPrefs = () => {}
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (typeof onSave === 'function') {
      onSave();
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const updatePrefs = (key, value) => {
    if (typeof setPrefs === 'function') {
      setPrefs({ ...prefs, [key]: value });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white p-6 rounded shadow-lg max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-title"
      >
        <h2 id="cookie-prefs-title" className="text-lg font-bold mb-4">{t('cookies.preferences')}</h2>
        <form onSubmit={handleSave}>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={Boolean(prefs.analytics)}
              onChange={e => updatePrefs('analytics', e.target.checked)}
            />
            <span className="ml-2">{t('cookies.analytics')}</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={Boolean(prefs.marketing)}
              onChange={e => updatePrefs('marketing', e.target.checked)}
            />
            <span className="ml-2">{t('cookies.marketing')}</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={Boolean(prefs.persistentLogin)}
              onChange={e => updatePrefs('persistentLogin', e.target.checked)}
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

CookiePreferencesModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  prefs: PropTypes.shape({
    analytics: PropTypes.bool,
    marketing: PropTypes.bool,
    persistentLogin: PropTypes.bool,
  }),
  setPrefs: PropTypes.func,
};
