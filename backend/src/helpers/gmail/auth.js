import { google } from 'googleapis';

export const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.google_client_id,
    process.env.google_client_secret,
    process.env.google_redirect_uris
  );
};

/**
 * Generate the Google OAuth2 consent URL
 */
export const getAuthURL = () => {
  const oauth2Client = createOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
};

/**
 * Exchange OAuth2 code for tokens
 * @param {string} code - Code from Google callback
 */
export const getTokensFromCode = async (code) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Get an authenticated client using saved tokens
 * @param {object} tokens - { access_token, refresh_token }
 * @returns {OAuth2Client} authenticated client
 */
export const getAuthenticatedClient = (tokens) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens); // includes refresh_token
  return oauth2Client;
};
