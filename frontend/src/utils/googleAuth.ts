/**
 * Google OAuth Helper Utilities for CareerFit
 * Manages Google OAuth authorization URL construction, account selection prompt,
 * state validation, and fallback selection handling.
 */

export const getGoogleClientId = (): string => {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
};

export const isGoogleConfigured = (): boolean => {
  const clientId = getGoogleClientId();
  return Boolean(clientId && clientId.length > 5 && !clientId.startsWith('YOUR_'));
};

/**
 * Builds the official Google OAuth 2.0 authorization URL.
 * Includes `prompt=select_account` to ensure the user is always presented
 * with the account selection screen.
 */
export const getGoogleOAuthUrl = (): string => {
  const clientId = getGoogleClientId();
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('google_oauth_state', state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account', // Crucial: Always forces Google Account Selection screen
    access_type: 'offline',
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Initiates the Google sign-in flow.
 * If VITE_GOOGLE_CLIENT_ID is configured, redirects to Google's live OAuth screen.
 * Otherwise, invokes the local interactive Google account selection modal.
 */
export const initiateGoogleAuth = (onOpenModal: () => void): void => {
  if (isGoogleConfigured()) {
    window.location.href = getGoogleOAuthUrl();
  } else {
    onOpenModal();
  }
};
