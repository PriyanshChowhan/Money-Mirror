import { getAuthenticatedClient } from '../helpers/gmail/auth.js';
import { syncUserEmails } from '../helpers/gmail/syncUserEmails.js';

export const syncEmailsForUser = async (user) => {
  if (!user?.accessToken || !user?.refreshToken) {
    throw new Error('No valid Gmail tokens available');
  }

  try {
    const authClient = getAuthenticatedClient({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    // Set up token refresh handler BEFORE making any API calls
    let tokenUpdatePromise = null;
    authClient.on('tokens', (tokens) => {
      console.log(`Token refresh triggered for ${user.email}`);
      tokenUpdatePromise = (async () => {
        try {
          let updated = false;
          if (tokens.access_token) {
            user.accessToken = tokens.access_token;
            updated = true;
          }
          if (tokens.refresh_token) {
            user.refreshToken = tokens.refresh_token;
            updated = true;
          }
          if (updated) {
            await user.save();
            console.log(`Tokens updated and saved for ${user.email}`);
          }
        } catch (saveErr) {
          console.error(`Failed to save refreshed tokens for ${user.email}:`, saveErr.message);
        }
      })();
    });

    // Force token refresh before syncing to ensure fresh tokens
    try {
      await authClient.getAccessToken();
      // Wait for any token updates to complete
      if (tokenUpdatePromise) {
        await tokenUpdatePromise;
      }
    } catch (tokenErr) {
      console.error(`Token refresh failed for ${user.email}:`, tokenErr.message);
      throw tokenErr;
    }

    const savedTransactions = await syncUserEmails(authClient, user);
    console.log(`Synced ${savedTransactions.length} transactions for ${user.email}`);
    
    // Ensure final token updates are saved
    if (tokenUpdatePromise) {
      await tokenUpdatePromise;
    }
    
    return savedTransactions;

  } catch (err) {
    console.error(`❌ Error syncing emails for ${user.email}:`, err.message);

    if (err.message.includes('invalid_grant') || err.code === 401) {
      user.refreshToken = null;
      user.accessToken = null;
      await user.save();
      console.log(`Tokens invalid for ${user.email} — user must re-login`);
    }
    throw err;
  }
};
