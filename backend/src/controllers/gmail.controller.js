import { syncEmailsForUser } from '../cron/emailSyncCron.js';

export const syncAndStoreEmails = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.accessToken || !user?.refreshToken) {
      return res.status(400).json({ error: 'Missing tokens or user. Please re-login with Google.' });
    }

    console.log(`Manual sync requested by ${user.email}`);
    const saved = await syncEmailsForUser(user);

    res.status(200).json({
      success: true,
      message: `${saved.length} transactions saved`,
      data: saved,
    });

  } catch (err) {
    console.error('Email parse/store error:', err?.message || err);
    
    if (err.message?.includes('invalid_grant') || err.code === 401) {
      return res.status(401).json({ 
        error: 'Gmail authorization expired. Please log out and log in again.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to parse and store transactions' });
  }
};