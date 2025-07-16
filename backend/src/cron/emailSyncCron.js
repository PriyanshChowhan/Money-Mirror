import cron from 'node-cron';
import { getAuthenticatedClient } from '../helpers/gmail/auth.js';
import User from '../models/user.js';
import { syncUserEmails } from '../helpers/gmail/syncUserEmails.js';

const runEmailSyncJob = async () => {
  console.log('Running email sync cron job...');

  const user = await User.findOne({
    accessToken: { $exists: true },
    refreshToken: { $exists: true },
  });

  if (!user) {
    console.log('No user found with valid tokens.');
    return;
  }

  try {
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

    const savedTransactions = await syncUserEmails(authClient, user);
    console.log(`Synced ${savedTransactions.length} transactions for ${user.email}`);
  } catch (err) {
    if (err.message === 'invalid_grant') {
      user.refreshToken = undefined;
      user.accessToken = undefined;
      await user.save();
    }

    console.error('❌ Error syncing emails:', err.message);
  }

  console.log('Email sync cron job complete');
};

export const scheduleEmailSync = () => {
  cron.schedule('* * * * *', runEmailSyncJob);
};
