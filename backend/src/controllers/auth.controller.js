import { google } from 'googleapis';
import User from '../models/user.js';
import { getAuthURL, getTokensFromCode, getAuthenticatedClient } from '../helpers/gmail/auth.js';
import { generateToken } from '../utils/generateTokens.js';
import { syncEmailsForUser } from '../cron/emailSyncCron.js';

import jwt from 'jsonwebtoken';

/**
 * Step 1: Redirect to Google OAuth Consent Screen
 */
export const redirectToGoogle = (req, res) => {
  const url = getAuthURL();
  res.redirect(url);
};

/**
 * Step 2: Handle Google OAuth Callback
 */
export const handleGoogleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ message: 'Authorization code not found' });

    // Step 2.1: Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Step 2.2: Get Google user info
    const authClient = getAuthenticatedClient(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: authClient });

    // Using the authenticated user token, ask Google: Who is this user?
    const { data: userInfo } = await oauth2.userinfo.get(); // Creating a Google API service object.
    const { id: googleId, email, name } = userInfo;

    // Step 2.3: Create or find user in DB
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
    } else {
      if (tokens.access_token) user.accessToken = tokens.access_token;
      if (tokens.refresh_token) user.refreshToken = tokens.refresh_token || user.refreshToken;
      await user.save();
    }

    // Step 2.4: Sync emails on login
    console.log(`Starting email sync for user: ${user.email}`);

    try {
      console.log(`Attempting to fetch and sync emails on login...`);
      const syncedTransactions = await syncEmailsForUser(user);
      console.log(`Fresh emails synced on login: ${syncedTransactions.length} transactions`);
    } catch (syncErr) {
      console.warn(`Email sync failed on login (non-blocking):`, syncErr.message);
    }
    console.log(`Login process completed for ${user.email}`);

    // Step 2.5: Generate JWT (your own app token)
    const token = generateToken(user._id, user.name);

    const isProduction = process.env.NODE_ENV === 'production';
    const frontendRedirectBase = process.env.FRONTEND_URL || (isProduction ? 'https://money-mirror.xyz' : 'http://localhost:5173');

    // Step 2.6: Send JWT as cookie 
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(`${frontendRedirectBase}/dashboard`);


  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google login failed' });
  }
};

export const logout = async (req, res) => {
  console.log(`Logging out user: ${req.user?.email || 'Unknown'}`);
  res.clearCookie('jwt')
  return res.status(200).json({ message: 'Logged out successfully' });
}

export const getUserProfile = async (req, res) => {
  try {
    // Extract user ID from the verified JWT
    const userId = req.user._id;

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
