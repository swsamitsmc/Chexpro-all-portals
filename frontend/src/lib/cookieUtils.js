import Cookies from 'js-cookie';

// Function to escape HTML entities to prevent XSS
const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

const setCookie = (name, value, options = {}) => {
  const { days, ...rest } = options;
  let expires = days ? days : undefined;
  // Sanitize the cookie value before setting it
  const sanitizedValue = escapeHTML(value);
  Cookies.set(name, sanitizedValue, { expires, sameSite: 'lax', ...rest });
};

const getCookie = (name) => {
  return Cookies.get(name);
};

const eraseCookie = (name) => {
  Cookies.remove(name);
};

export { setCookie, getCookie, eraseCookie };