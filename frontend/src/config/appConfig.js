export const APP_CONFIG = {
  TOAST_LIMIT: parseInt(import.meta.env.VITE_TOAST_LIMIT || '1', 10),
  TOAST_DURATION: parseInt(import.meta.env.VITE_TOAST_DURATION || '5000', 10),
  MARKETING_COOKIE_DAYS: parseInt(import.meta.env.VITE_MARKETING_COOKIE_DAYS || '365', 10),
};