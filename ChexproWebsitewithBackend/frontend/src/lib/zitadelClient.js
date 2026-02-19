/**
 * Zitadel Client Configuration
 * 
 * This file configures the Zitadel OIDC client for frontend authentication.
 * Uses @zitadel/react which wraps oidc-client-ts for OIDC authentication.
 */

import { createZitadelAuth } from '@zitadel/react';

const ZITADEL_ISSUER = import.meta.env.VITE_ZITADEL_ISSUER || 'http://localhost:8080';
const ZITADEL_CLIENT_ID = import.meta.env.VITE_ZITADEL_CLIENT_ID;
const ZITADEL_REDIRECT_URI = import.meta.env.VITE_ZITADEL_REDIRECT_URI || 'http://localhost:5173/callback';
const ZITADEL_LOGOUT_URI = import.meta.env.VITE_ZITADEL_LOGOUT_URI || 'http://localhost:5173/logout';

/**
 * Create Zitadel OIDC client instance
 * Wraps @zitadel/react's createZitadelAuth to provide a compatible interface
 * @returns {Object|null} Zitadel client wrapper or null if not configured
 */
let zitadelAuthInstance = null;

export const createZitadelClient = () => {
  if (!ZITADEL_CLIENT_ID) {
    console.warn('[Zitadel] Client ID not configured. Set VITE_ZITADEL_CLIENT_ID in .env');
    return null;
  }

  if (!zitadelAuthInstance) {
    const auth = createZitadelAuth({
      issuer: ZITADEL_ISSUER,
      clientId: ZITADEL_CLIENT_ID,
      redirectUri: ZITADEL_REDIRECT_URI,
      postLogoutRedirectUri: ZITADEL_LOGOUT_URI,
      scopes: [
        'openid',
        'profile',
        'email',
        'roles',
      ],
    });

    // Wrap the auth instance to provide a compatible interface
    // The context expects: signInWithRedirect, tokenRequest, getUserInfo, signOut
    // @zitadel/react provides: authorize, signout, userManager
    zitadelAuthInstance = {
      // Original methods
      authorize: auth.authorize.bind(auth),
      signout: auth.signout.bind(auth),
      userManager: auth.userManager,
      
      // Compatible wrapper methods for ZitadelAuthContext
      signInWithRedirect: async (scopes, prompt) => {
        await auth.authorize();
        // Return a URL-like object for compatibility
        return { url: ZITADEL_REDIRECT_URI };
      },
      
      tokenRequest: async (code) => {
        // Use oidc-client-ts's userManager to exchange code for tokens
        const user = await auth.userManager.signinRedirectCallback();
        return {
          access_token: user.access_token,
          id_token: user.id_token,
          refresh_token: user.refresh_token,
          token_type: user.token_type,
          expires_at: user.expires_at,
        };
      },
      
      getUserInfo: async (accessToken) => {
        // Use oidc-client-ts's userManager to get user info
        const user = await auth.userManager.getUser();
        if (!user) {
          throw new Error('No user found');
        }
        return {
          sub: user.profile.sub,
          email: user.profile.email,
          email_verified: user.profile.email_verified,
          name: user.profile.name,
          given_name: user.profile.given_name,
          family_name: user.profile.family_name,
          picture: user.profile.picture,
          roles: user.profile.roles || [],
        };
      },
      
      signOut: async (accessToken) => {
        await auth.signout();
        return { url: ZITADEL_LOGOUT_URI };
      },
    };
  }

  return zitadelAuthInstance;
};

/**
 * Check if Zitadel is configured
 * @returns {boolean}
 */
export const isZitadelConfigured = () => {
  return !!ZITADEL_CLIENT_ID;
};

/**
 * Get Zitadel configuration for external use
 * @returns {Object}
 */
export const getZitadelConfig = () => {
  return {
    issuer: ZITADEL_ISSUER,
    clientId: ZITADEL_CLIENT_ID,
    redirectUri: ZITADEL_REDIRECT_URI,
    logoutUri: ZITADEL_LOGOUT_URI,
    configured: isZitadelConfigured(),
  };
};

// Export for use in components
export const zitadelConfig = {
  issuer: ZITADEL_ISSUER,
  clientId: ZITADEL_CLIENT_ID,
  redirectUri: ZITADEL_REDIRECT_URI,
  logoutUri: ZITADEL_LOGOUT_URI,
  configured: isZitadelConfigured(),
};
