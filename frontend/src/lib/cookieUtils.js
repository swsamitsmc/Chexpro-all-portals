import Cookies from 'js-cookie';

const setCookie = (name, value, options = {}) => {
  const { days, ...rest } = options;
  let expires = days ? days : undefined;
  Cookies.set(name, value, { expires, ...rest });
};

const getCookie = (name) => {
  return Cookies.get(name);
};

const eraseCookie = (name) => {
  Cookies.remove(name);
};

export { setCookie, getCookie, eraseCookie };