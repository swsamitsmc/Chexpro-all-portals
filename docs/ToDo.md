# ToDo List for ChexPro Website with Backend

This document outlines identified issues and potential improvements, categorized by severity.

## Critical Issues

*   **Backend: `server/routes/auth.js` - Mock User Database (CWE-798 - Hard-coded Credentials):** The `mockUsers` object with placeholder hashed passwords is a critical security vulnerability. This must be replaced with a proper user authentication system integrated with a real database.
    *   **Severity:** Critical
    *   **Description:** Hardcoded, placeholder hashed passwords are used for authentication. This is not a real authentication system and is highly insecure.
    *   **Impact**: Complete authentication bypass, unauthorized access
    **Action:** Implement a secure user management system with a proper database for user credentials.

## High Issues

*   **Backend: `server/routes/auth.js` - No Actual User Database Integration:** The `mockUsers` object needs to be replaced with a proper database lookup for user authentication.
    *   **Severity:** High
    *   **Description:** User authentication relies on a mock in-memory object instead of a persistent database.
    **Action:** Integrate with a database to store and retrieve user credentials securely.
*   **Backend: `server/routes/auth.js` - Basic Session Management (CWE-384 - Session Fixation):** Session management is basic, lacking comprehensive session validation, expiration handling, and secure storage mechanisms beyond the cookie itself.
    *   **Severity:** High
    *   **Description:** Session IDs are generated and set as cookies, but there's no server-side validation or management of these sessions (e.g., invalidation on logout, periodic re-validation).
    *   **Impact**: Session hijacking, unauthorized access
    **Action:** Implement a robust session management system (e.g., using a session store like Redis or a database) with proper expiration, invalidation, and re-validation logic.


## Moderate Issues

*   **Backend: `server/index.js` - Missing Comprehensive Security Headers:** The application lacks comprehensive security headers (e.g., Content Security Policy, X-XSS-Protection, X-Frame-Options, Strict-Transport-Security).
    *   **Severity:** Moderate
    *   **Description:** Basic security headers are missing, which can expose the application to various web vulnerabilities.
    **Action:** Implement a middleware like `helmet` to set appropriate security headers.
*   **Backend: `server/routes/auth.js` - Basic CSRF Token Handling:** CSRF token handling could be more robust (e.g., using a dedicated CSRF middleware like `csurf` with proper token rotation and validation).
    *   **Severity:** Moderate
    *   **Description:** The current CSRF protection is manually implemented and might not cover all edge cases or best practices.
    **Action:** Consider using a well-maintained CSRF protection library or enhance the current implementation to include token rotation and more rigorous validation.
*   **Backend: `server/routes/forms.js` - CSRF Secret Generation (CWE-352 - Cross-Site Request Forgery):** The CSRF secret generation falls back to `tokens.secretSync()` if `process.env.CSRF_SECRET` is not set. In production, `tokens.secretSync()` should not be used as it generates a new secret on each server restart, invalidating existing CSRF tokens.
    *   **Severity:** Moderate
    *   **Description:** The CSRF secret is not persistently configured, leading to token invalidation on server restarts.
    *   **Impact**: CSRF protection bypass after server restart
    **Action:** Ensure `process.env.CSRF_SECRET` is always set in production environments with a securely generated, persistent secret.
*   **Backend: `server/routes/forms.js` - Email Sending Error Handling:** Email sending error handling is basic. It logs critical errors but lacks retry mechanisms or integration with error tracking services.
    *   **Severity:** Moderate
    *   **Description:** If email sending fails, the error is logged, but no retry mechanism or external notification is in place.
    **Action:** Implement retry logic for email sending and integrate with an error tracking service (e.g., Sentry, LogRocket) for critical failures.
*   **Backend: `server/config/db.js` - Basic Database Connection Error Handling:** Error handling for database connection failure is basic. It logs a fatal error but doesn't gracefully shut down the application or provide a more robust retry mechanism.
    *   **Severity:** Moderate
    *   **Description:** The application logs a fatal error on database connection failure but doesn't have a graceful shutdown or retry strategy.
    **Action:** Implement a more robust error handling strategy for database connection failures, including graceful shutdown and/or a retry mechanism with backoff.
*   **Backend: `server/routes/forms.js` - Information Exposure Through Error Messages (CWE-209):** Database error messages exposed in email content.
    *   **Severity:** Moderate
    *   **Description:** Database error messages exposed in email content.
    *   **Impact**: Information disclosure about system internals
    **Action:** Sanitize error messages before including in emails.
*   **Backend: `server/index.js` - Uncontrolled Resource Consumption (CWE-400):** No global rate limiting implemented.
    *   **Severity:** Moderate
    *   **Description:** No global rate limiting implemented.
    *   **Impact**: DoS attacks through resource exhaustion
    **Action:** Implement global rate limiting middleware.
*   **Backend: `server/routes/cookieHelpers.js` - Missing Encryption of Sensitive Data (CWE-311):** Session cookies lack encryption, only rely on httpOnly flag.
    *   **Severity:** Moderate
    *   **Description:** Session cookies lack encryption, only rely on httpOnly flag.
    *   **Impact**: Session data exposure if cookies are compromised
    **Action:** Implement cookie encryption/signing.

## Low Issues

*   **Backend: `server/index.js` - Hardcoded Development CORS Origins:** The development CORS origins (`http://localhost:5173`, `http://localhost:3000`) are hardcoded.
    *   **Severity:** Low
    *   **Description:** Development origins are hardcoded, which can be inflexible.
    **Action:** Consider making development origins configurable via environment variables or a dedicated development configuration file.
*   **Backend: `server/index.js` - Basic Error Logging and Generic Response:** Error logging is basic (`console.error`) and the error response is generic (`Something broke!`).
    *   **Severity:** Low
    *   **Description:** Error handling provides minimal detail to the client and relies solely on console logging for debugging.
    **Action:** Implement a more sophisticated logging solution (e.g., Winston, Morgan) and provide more informative (but not overly detailed) error responses in development, while keeping them generic in production.
*   **Backend: `server/routes/auth.js` - Incomplete `rememberMe` Functionality:** The `rememberMe` functionality is not fully implemented (the persistent token is not stored in the database).
    *   **Severity:** Low
    *   **Description:** The `rememberMe` feature generates a token but doesn't persist it, making it non-functional across sessions.
    **Action:** Store the persistent token securely in the database and implement logic to validate it on subsequent visits.
*   **Backend: `server/routes/forms.js` - Custom `escapeHTML` Function:** A custom `escapeHTML` function is used. While functional, using a well-established library for HTML escaping is generally more secure and robust.
    *   **Severity:** Low
    *   **Description:** A custom HTML escaping function is used, which might not cover all edge cases or be as robust as a well-tested library.
    **Action:** Consider replacing the custom `escapeHTML` function with a battle-tested library for HTML escaping.
*   **Backend: `server/routes/forms.js` - Global Rate Limiting for Forms:** Rate limiting is applied globally to all routes in the file. While acceptable, more granular control might be needed for specific endpoints.
    *   **Severity:** Low
    *   **Description:** Rate limiting is applied broadly to all form routes, which might be too restrictive or not granular enough for future needs.
    **Action:** Evaluate if more granular rate limiting is required for specific form endpoints.
*   **Backend: `server/routes/forms.js` - Hardcoded Email Recipient Addresses:** Email recipient addresses are sourced from environment variables. This is good, but for dynamic configurations, a database or admin panel might be more suitable.
    *   **Severity:** Low
    *   **Description:** Email recipient addresses are hardcoded in environment variables, which can be inflexible for dynamic changes.
    **Action:** For dynamic recipient management, consider storing email recipient addresses in a database or providing an admin interface to configure them.
*   **Backend: `server/config/db.js` - Hardcoded `connectionLimit`:** The `connectionLimit` of 10 is hardcoded. This might not be optimal for all production environments and should ideally be configurable via environment variables.
    *   **Severity:** Low
    *   **Description:** The database connection pool limit is hardcoded, limiting scalability and flexibility.
    **Action:** Make the `connectionLimit` configurable via environment variables.
*   **Backend: `server/routes/cookieHelpers.js` - Hardcoded `maxAge` for Cookies:** Hardcoded `maxAge` values for cookies. These should ideally be configurable via environment variables.
    *   **Severity:** Low
    *   **Description:** Cookie expiration times are hardcoded, reducing flexibility.
    **Action:** Make cookie `maxAge` values configurable via environment variables.
*   **Backend: `server/routes/cookieHelpers.js` - `sameSite: 'Lax'` for Persistent Login Cookie:** `sameSite: 'Lax'` for `persistent_login` cookie. While generally secure, depending on the application's specific needs, `Strict` might be preferred if cross-site requests are not expected for persistent logins.
    *   **Severity:** Low
    *   **Description:** The `sameSite` attribute for the persistent login cookie is set to `Lax`, which might not be the most secure option depending on the application's cross-site interaction requirements.
    **Action:** Re-evaluate the `sameSite` attribute for the persistent login cookie based on specific security and functionality requirements.
*   **Backend: `server/routes/cookieHelpers.js` - No Explicit Domain for Cookies:** No explicit domain set for cookies. This might be fine for single-domain applications but could be an issue in multi-subdomain setups.
    *   **Severity:** Low
    *   **Description:** Cookies do not have an explicitly set domain, which can cause issues in multi-subdomain environments.
    **Action:** Consider explicitly setting the `domain` attribute for cookies if the application operates across multiple subdomains.
*   **Backend: `server/package.json` - Recent `eslint` Version:** `eslint` version `^9.32.0` is very recent. While generally good, it might introduce breaking changes or require updated configurations in the future.
    *   **Severity:** Low
    *   **Description:** Using a very recent major version of `eslint` might lead to unexpected breaking changes or require frequent configuration updates.
    **Action:** Monitor `eslint` releases for breaking changes and update configurations as needed.
*   **Backend: `server/package.json` - No `test` Script:** No `test` script is defined, which is a best practice for maintainable code.
    *   **Severity:** Low
    *   **Description:** The `package.json` lacks a defined `test` script, hindering automated testing.
    **Action:** Add a `test` script to `package.json` and implement unit/integration tests for the backend.
*   **Backend: `server/package.json` - No Pre-commit Hooks:** No `pre-commit` hooks or similar to enforce linting before commits.
    *   **Severity:** Low
    *   **Description:** No automated checks are performed before commits, potentially allowing unlinted code into the repository.
    **Action:** Implement pre-commit hooks (e.g., using `husky` and `lint-staged`) to enforce linting and other code quality checks.
*   **Frontend: `frontend/package.json` - Outdated `vite` Version:** `vite` version `^7.0.6` is very old. The latest version is `5.x.x`.
    *   **Severity:** Low
    *   **Description:** The `vite` build tool is significantly outdated, potentially leading to compatibility issues, performance bottlenecks, and missing new features.
    **Action:** Upgrade `vite` to the latest stable version.
*   **Frontend: `frontend/package.json` - Outdated `eslint` Version:** `eslint` version `^8.57.1` is old. The latest version is `9.x.x`.
    *   **Severity:** Low
    *   **Description:** The `eslint` version is outdated, missing out on new linting rules and performance improvements.
    **Action:** Upgrade `eslint` to the latest stable version.
*   **Frontend: `frontend/package.json` - Unnecessary Direct `esbuild` and `terser` Dependencies:** `esbuild` and `terser` are listed as direct dependencies, but they are typically build tools managed by Vite.
    *   **Severity:** Low
    *   **Description:** `esbuild` and `terser` are listed as direct dependencies, which are usually handled by Vite.
    **Action:** Review if `esbuild` and `terser` are truly needed as direct dependencies or if they can be removed.
*   **Frontend: `frontend/package.json` - No `test` Script:** No `test` script is defined, which is a best practice for frontend projects.
    *   **Severity:** Low
    *   **Description:** The `package.json` lacks a defined `test` script, hindering automated testing.
    **Action:** Add a `test` script to `package.json` and implement unit/integration tests for the frontend.
*   **Frontend: `frontend/package.json` - No Pre-commit Hooks:** No `pre-commit` hooks or similar to enforce linting before commits.
    *   **Severity:** Low
    *   **Description:** No automated checks are performed before commits, potentially allowing unlinted code into the repository.
    **Action:** Implement pre-commit hooks (e.g., using `husky` and `lint-staged`) to enforce linting and other code quality checks.
*   **Frontend: `frontend/src/App.jsx` - Hardcoded `GA_MEASUREMENT_ID` Access:** `GA_MEASUREMENT_ID` is directly accessed from `import.meta.env`.
    *   **Severity:** Low
    *   **Description:** Google Analytics measurement ID is accessed directly from `import.meta.env`, which can be less maintainable for multiple environment variables.
    **Action:** Centralize environment variable access in a dedicated configuration file or utility.
*   **Frontend: `frontend/src/App.jsx` - Direct Cookie Manipulation:** Direct cookie manipulation in `useEffect`.
    *   **Severity:** Low
    *   **Description:** Cookies are directly manipulated within a `useEffect` hook, which can become cumbersome for complex cookie logic.
    **Action:** Encapsulate cookie manipulation within a dedicated utility or custom hook for better organization and reusability.
*   **Frontend: `frontend/src/App.jsx` - Direct Rendering of `BackToTopButton` and `CookieBanner`:** `BackToTopButton` and `CookieBanner` are directly rendered.
    *   **Severity:** Low
    *   **Description:** `BackToTopButton` and `CookieBanner` are rendered directly in `App.jsx`, which might not be optimal for layout or context management.
    **Action:** Consider placing these components within a dedicated layout component or context provider for better structural organization.
*   **Frontend: `frontend/src/App.jsx` - `AnimatePresence` without Explicit Animations:** `AnimatePresence` is used without explicit route transition animations.
    *   **Severity:** Low
    *   **Description:** `AnimatePresence` is present but no explicit route transition animations are defined, potentially leading to a less smooth user experience.
    **Action:** Implement explicit route transition animations using `framer-motion` with `AnimatePresence`.
*   **Frontend: `frontend/src/index.css` - Hardcoded Color Values:** Hardcoded color values in HSL format.
    *   **Severity:** Low
    *   **Description:** Color values are hardcoded in HSL format, which can be less flexible for theme changes.
    **Action:** Ensure consistent use of CSS variables for colors and consider a more dynamic theming solution if needed.
*   **Frontend: `frontend/src/index.css` - `animated-item` Class:** The `animated-item` class is defined but its animation properties are not present in this file.
    *   **Severity:** Low
    *   **Description:** The `animated-item` class is defined without corresponding animation properties in the CSS file, indicating that animation logic is handled elsewhere.
    **Action:** Document where the animation properties for `animated-item` are defined for clarity.
*   **Frontend: `frontend/src/index.css` - Long `font-family` Stack:** The `font-family` stack is quite long.
    *   **Severity:** Low
    *   **Description:** The `font-family` stack is extensive, which might be overly verbose for a specific font strategy.
    **Action:** Simplify the `font-family` stack if a specific font strategy is in place.
*   **Frontend: `frontend/src/main.jsx` - `React.StrictMode` Double Rendering:** `React.StrictMode` is good for development but can sometimes cause double-rendering issues with certain libraries or custom hooks.
    *   **Severity:** Low
    *   **Description:** `React.StrictMode` can cause components to render twice in development, which might expose subtle bugs but can also be confusing.
    **Action:** Be aware of potential double-rendering issues in development due to `React.StrictMode`.
*   **Frontend: `frontend/src/main.jsx` - Global `Toaster` Rendering:** The `Toaster` component is rendered globally.
    *   **Severity:** Low
    *   **Description:** The `Toaster` component is rendered globally, which is a common pattern but requires careful styling and accessibility considerations.
    **Action:** Ensure the `Toaster` component is correctly styled and accessible.
*   **Frontend: `frontend/src/RouteChangeTracker.jsx` - `GA_MEASUREMENT_ID` Direct Access:** `GA_MEASUREMENT_ID` is directly accessed from `import.meta.env` again.
    *   **Severity:** Low
    *   **Description:** Google Analytics measurement ID is accessed directly from `import.meta.env` in `RouteChangeTracker.jsx`, reinforcing the need for centralized configuration.
    **Action:** Centralize environment variable access in a dedicated configuration file or utility.
*   **Frontend: `frontend/src/RouteChangeTracker.jsx` - `location` Dependency in `useEffect`:** The `useEffect` hook has `location` as a dependency.
    *   **Severity:** Low
    *   **Description:** The `useEffect` hook in `RouteChangeTracker` has `location` as a dependency, which is correct for tracking route changes but might trigger unnecessary re-renders if `location` object identity changes frequently.
    **Action:** Monitor for any performance issues related to `location` as a dependency in `useEffect`.
*   **Frontend: `frontend/src/components/CookieConsent.jsx` - `consentGiven` State Initialization:** The `consentGiven` state initialization checks `typeof window === 'undefined'`.
    *   **Severity:** Low
    *   **Description:** The `consentGiven` state initialization handles server-side rendering but the `getCookie` function might not be designed for SSR.
    **Action:** Ensure `getCookie` is robust for both client-side and server-side rendering, or adjust the initialization logic.
*   **Frontend: `frontend/src/components/CookieConsent.jsx` - Conditional `CookiePreferencesModal` Rendering:** The `CookiePreferencesModal` is rendered conditionally based on `showPrefs`.
    *   **Severity:** Low
    *   **Description:** The `CookiePreferencesModal` is conditionally rendered, which is fine, but if the modal is complex, lazy loading could improve initial page load performance.
    **Action:** Consider lazy loading the `CookiePreferencesModal` if its complexity impacts initial page load.
*   **Frontend: `frontend/src/components/CookiePreferences.jsx` - Basic Modal Implementation (CWE-1021 - Improper Restriction of Rendered UI Layers):** The modal is implemented with basic CSS for positioning.
    *   **Severity:** Low
    *   **Description:** The modal uses basic CSS for positioning, lacking advanced accessibility features and consistent styling with a UI library.
    *   **Impact**: Accessibility issues, potential UI confusion
    **Action:** Use a dedicated modal component from a UI library (e.g., Radix UI) for better accessibility, focus management, and styling consistency.
*   **Frontend: `frontend/src/components/CookiePreferences.jsx` - `onSave` Prop Usage:** The `onSave` prop is called without passing the updated `prefs` object.
    *   **Severity:** Low
    *   **Description:** The `onSave` prop is called without passing the updated `prefs` object, which might limit its reusability for external handling.
    **Action:** Pass the updated `prefs` object to the `onSave` callback for better data flow.
*   **Frontend: `frontend/src/components/layout/Footer.jsx` - Hardcoded Social Media Links:** Hardcoded social media links.
    *   **Severity:** Low
    *   **Description:** Social media links are hardcoded in the footer, making updates cumbersome.
    **Action:** Centralize social media links in a configuration file or environment variables.
*   **Frontend: `frontend/src/components/layout/Footer.jsx` - Direct Image Imports:** Direct image imports for logos.
    *   **Severity:** Low
    *   **Description:** Image imports are direct, which is fine for small projects but can become less manageable for larger asset libraries.
    **Action:** Consider a centralized asset management strategy for images in larger applications.
*   **Frontend: `frontend/src/components/layout/Header.jsx` - Hardcoded Navigation Links:** Hardcoded navigation links (`navLinks`).
    *   **Severity:** Low
    *   **Description:** Navigation links are hardcoded, limiting flexibility for dynamic menus.
    **Action:** Manage navigation links from a centralized configuration, CMS, or API for greater flexibility.
*   **Frontend: `frontend/src/components/layout/Header.jsx` - Direct Image Import for Logo:** Direct image import for `chexProLogo`.
    *   **Severity:** Low
    *   **Description:** The logo image is directly imported, which is fine, but a centralized asset management strategy might be considered for larger applications.
    **Action:** Consider a centralized asset management strategy for images in larger applications.
*   **Frontend: `frontend/src/components/ui/use-toast.js` - Global Mutable `toastStore`:** The `toastStore` is a global mutable object.
    *   **Severity:** Low
    *   **Description:** The `toastStore` uses a global mutable object for state management, which can lead to unexpected side effects and testing difficulties.
    **Action:** Consider refactoring to use React Context or a dedicated state management library for global toast state.
*   **Frontend: `frontend/src/components/ui/use-toast.js` - Hardcoded `TOAST_LIMIT`:** `TOAST_LIMIT` is hardcoded to 1.
    *   **Severity:** Low
    *   **Description:** The toast display limit is hardcoded, restricting the number of simultaneous toasts.
    **Action:** Make `TOAST_LIMIT` configurable to allow for more flexible toast display.
*   **Frontend: `frontend/src/components/ui/use-toast.js` - Simple `generateId` Function:** The `generateId` function uses a simple counter.
    *   **Severity:** Low
    *   **Description:** The ID generation for toasts uses a simple counter, which could theoretically lead to collisions in highly concurrent environments.
    **Action:** Consider a more robust ID generation method (e.g., UUID) for larger applications.
*   **Frontend: `frontend/src/components/ui/use-toast.js` - Manual Timeout Management (Performance Issues - Memory Leaks):** The `useEffect` for auto-dismissing toasts uses `setTimeout`.
    *   **Severity:** Low
    *   **Description:** Manual timeout management for toast dismissal can be error-prone and lead to memory leaks if not handled carefully.
    *   **Impact**: Memory leaks in long-running sessions
    **Action:** Explore alternative patterns for managing toast timeouts, potentially leveraging a library or more robust state management.
*   **Frontend: `frontend/src/hooks/useCookieConsent.js` - Return Type of Hook:** The hook returns an array `[prefs.analytics || prefs.marketing]`.
    *   **Severity:** Low
    *   **Description:** The `useCookieConsent` hook returns a single boolean value within an array, which is less idiomatic than returning a direct boolean or an object.
    **Action:** Consider returning a direct boolean value or an object for better clarity and consistency with React hook conventions.
*   **Frontend: `frontend/src/hooks/useCookiePreferences.js` - Frequent Cookie Writes:** The `useEffect` hook writes the cookie on every `prefs` change.
    *   **Severity:** Low
    *   **Description:** The cookie preferences are written to the cookie on every state change, which might be slightly inefficient for very frequent updates.
    **Action:** Consider debouncing or throttling cookie writes if performance becomes an issue in scenarios with very frequent preference changes.
*   **Frontend: `frontend/src/hooks/useCookiePreferences.js` - Hardcoded Cookie Expiration:** Hardcoded cookie expiration (`days: 365`).
    *   **Severity:** Low
    *   **Description:** The cookie expiration for preferences is hardcoded, limiting flexibility.
    **Action:** Make cookie expiration configurable via environment variables or a global constant.
*   **Frontend: `frontend/src/hooks/useCookiePreferences.js` - `sameSite: 'Lax'` for Preferences Cookie:** `sameSite: 'Lax'` for the preferences cookie.
    *   **Severity:** Low
    *   **Description:** The `sameSite` attribute for the cookie preferences is set to `Lax`, which is generally good but might need re-evaluation based on specific cross-site interaction requirements.
    **Action:** Re-evaluate the `sameSite` attribute for the cookie preferences based on specific security and functionality requirements.
*   **Frontend: `frontend/src/hooks/useGAPageTracking.jsx` - `trackPageView` Call Frequency:** The `trackPageView` function is called on every `location` change if `enabled` is true.
    *   **Severity:** Low
    *   **Description:** `trackPageView` is called on every location change, which is intended but relies on the `trackPageView` function to handle potential duplicate calls or rate limiting.
    **Action:** Ensure `trackPageView` handles potential duplicate calls or implement rate limiting if necessary.
*   **Frontend: `frontend/src/i18n/index.js` - Hardcoded English Translations:** Hardcoded English translations.
    *   **Severity:** Low
    *   **Description:** Translations are hardcoded directly in the `index.js` file, making internationalization management difficult.
    **Action:** Externalize translations into separate JSON files (e.g., `en.json`, `fr.json`) and dynamically load them.
*   **Frontend: `frontend/src/i18n/index.js` - Only English Supported:** Only English (`en`) is supported.
    *   **Severity:** Low
    *   **Description:** The application only supports English, limiting its global reach.
    **Action:** Add support for multiple languages to enable internationalization.
*   **Frontend: `frontend/src/i18n/index.js` - `interpolation.escapeValue` Set to `false`:** The `interpolation.escapeValue` is set to `false`.
    *   **Severity:** Low
    *   **Description:** `interpolation.escapeValue` is set to `false`, which can introduce XSS vulnerabilities if translation strings contain unescaped HTML or user-generated content.
    **Action:** Set `interpolation.escapeValue` to `true` and explicitly escape values where needed, or use a library that handles this securely.
*   **Frontend: `frontend/src/lib/cookieUtils.js` - Manual Cookie String Construction:** The `setCookie` function manually constructs the cookie string.
    *   **Severity:** Low
    *   **Description:** The `setCookie` function manually constructs the cookie string, which can be error-prone and less robust than using a dedicated library.
    **Action:** Consider using a dedicated cookie library for more robust cookie handling.
*   **Frontend: `frontend/src/lib/cookieUtils.js` - Hardcoded `path=/` in `eraseCookie`:** The `eraseCookie` function hardcodes `path=/`.
    *   **Severity:** Low
    *   **Description:** The `eraseCookie` function hardcodes `path=/`, which might not always match the cookie's actual path, potentially failing to delete it.
    **Action:** Ensure `eraseCookie` correctly targets the cookie's path, or use a library that handles this automatically.
*   **Frontend: `frontend/src/lib/googleAnalytics.js` - Global `gtag` Definition:** The `gtag` function is defined globally (`window.gtag`).
    *   **Severity:** Low
    *   **Description:** The `gtag` function is defined globally, which can lead to global namespace pollution.
    **Action:** Encapsulate global `gtag` access within a more robust module pattern to avoid global namespace pollution.
*   **Frontend: `frontend/src/lib/googleAnalytics.js` - Global `window.GA_INITIALIZED` Flag:** The `loadGoogleAnalytics` function uses a global flag `window.GA_INITIALIZED`.
    *   **Severity:** Low
    *   **Description:** The `window.GA_INITIALIZED` flag is used for initialization control, which is a common pattern but could be encapsulated within a more robust module pattern.
    **Action:** Encapsulate the `GA_INITIALIZED` flag within a more robust module pattern.
*   **Frontend: `frontend/src/lib/googleAnalytics.js` - Direct `window.gtag` Check:** The `trackPageView` function directly checks for `window.gtag`.
    *   **Severity:** Low
    *   **Description:** `trackPageView` directly checks for `window.gtag`, which is fine but could be abstracted for better maintainability.
    **Action:** Abstract the `window.gtag` check within a more centralized GA management utility.
*   **Backend: `server/routes/cookieHelpers.js` - Sensitive Cookie in HTTPS Session Without 'Secure' Attribute (CWE-614):** Cookies hardcoded as secure=true, may fail in development.
    *   **Severity:** Low
    *   **Description:** Cookies hardcoded as secure=true, may fail in development.
    *   **Impact**: Development environment issues
    **Action**: Make secure flag environment-dependent.

## Fixed Issues

### Critical Severity - Fixed
- **Frontend: `frontend/src/lib/cookieUtils.js` - Insufficient Cookie Validation (CWE-693 - Protection Mechanism Failure)**: Replaced custom cookie handling with `js-cookie` library for robust validation and security.
- **Backend: `server/config/db.js` - SQL Injection Potential (CWE-89)**: Implemented application-level input length validation for all user-supplied data in forms.

### High Severity - Fixed
- **CookieConsent.jsx - Missing setPrefs destructuring**: Fixed missing `setPrefs` destructuring from `useCookiePreferences` hook that was causing runtime errors.
- **i18n/index.js - XSS vulnerability**: Fixed `interpolation.escapeValue: false` which could lead to XSS attacks. Changed to `true` for security.
- **server/index.js - Missing security headers**: Added helmet middleware with CSP and other security headers.
- **server/config/db.js - Redundant connection test**: Moved database connection test to initialization function to prevent redundant executions.
- **Frontend: `frontend/src/RouteChangeTracker.jsx` - Unconditional GA Initialization**: Initialized Google Analytics only once in `App.jsx`.
- **Backend: `server/config/db.js` - Allocation of Resources Without Limits (CWE-770)**: Made `queueLimit` configurable via `process.env.DB_QUEUE_LIMIT`.
- **Backend: `server/routes/auth.js` - No Rate Limiting on Login Attempts (CWE-307)**: Implemented rate limiting for login attempts.

### Medium Severity - Fixed  
- **CWE-862 - Missing Authorization in forms.js**: Added origin validation middleware to prevent unauthorized form submissions.
- **CWE-79/80 - Cross-site scripting in forms.js**: Fixed XSS vulnerability by properly escaping environment variables in email templates.
- **Lazy module loading in tailwind.config.js**: Fixed improper module loading by moving require statement inline.

### Low Severity - Fixed
- **Backend: `server/routes/forms.js` - Unused `validateSession` Middleware**: Removed the unused `validateSession` middleware.
- **Frontend: `frontend/src/components/layout/Header.jsx` - Redundant `cn` Utility Function**: Removed the redundant local `cn` utility function.