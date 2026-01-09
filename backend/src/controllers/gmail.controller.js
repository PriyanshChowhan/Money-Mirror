import { getAuthenticatedClient } from '../helpers/gmail/auth.js';
import { syncUserEmails } from '../helpers/gmail/syncUserEmails.js';

export const syncAndStoreEmails = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.accessToken || !user?.refreshToken) {
      return res.status(400).json({ error: 'Missing tokens or user' });
    }

    const authClient = getAuthenticatedClient({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    authClient.on('tokens', async (tokens) => {
      let updated = false;
      if (tokens.access_token) {
        user.accessToken = tokens.access_token;
        updated = true;
      }
      if (tokens.refresh_token) {
        user.refreshToken = tokens.refresh_token;
        updated = true;
      }
      if (updated) await user.save();
    });

    const saved = await syncUserEmails(authClient, user);

    res.status(200).json({
      success: true,
      message: `${saved.length} transactions saved`,
      data: saved,
    });

  } catch (err) {
    console.error('Email parse/store error:', err?.message || err);
    res.status(500).json({ error: 'Failed to parse and store transactions' });
  }
};