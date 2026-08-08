import { google } from 'googleapis';
import User from '../models/user.js';
import SyncLog from '../models/syncLog.js';
import { getAuthURL, getTokensFromCode, getAuthenticatedClient } from '../helpers/gmail/auth.js';
import { generateToken } from '../utils/generateTokens.js';
import { enqueueSync } from '../queues/syncQueue.js';

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
      
      // Create initial sync log dated 7 days ago
      // This allows fetching recent emails but avoids years of history
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      await SyncLog.create({
        user: user._id,
        fetchedAt: weekAgo,
        messageCount: 0,
        notes: 'Initial sync log set to 7 days ago. Will fetch recent emails but not full history.',
      });
      console.log(`New user created: ${user.email}, initial sync log set to 7 days ago`);
    } else {
      if (tokens.access_token) user.accessToken = tokens.access_token;
      if (tokens.refresh_token) user.refreshToken = tokens.refresh_token || user.refreshToken;
      await user.save();
    }

    // Step 2.4: Generate JWT and send the user to the dashboard IMMEDIATELY.
    // Sync no longer blocks login — it's queued as a background job below,
    // after the response is already on its way to the browser.
    const token = generateToken(user._id, user.name);

    const isProduction = process.env.NODE_ENV === 'production';
    const frontendRedirectBase = process.env.FRONTEND_URL || (isProduction ? 'https://money-mirror.xyz' : 'http://localhost:5173');

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(`${frontendRedirectBase}/dashboard`);

    // Step 2.5: Queue the Gmail sync AFTER the response is sent. The
    // frontend shows existing/cached data immediately and can poll
    // GET /api/gmail/sync/status to know when fresh data has landed.
    // enqueueSync uses a deterministic jobId, so this is a no-op if a sync
    // for this user is already queued/running (handles double-callback, etc).
    try {
      const job = await enqueueSync(user._id.toString());
      console.log(job
        ? `Queued sync job ${job.id} for ${user.email}`
        : `Sync already queued/running for ${user.email}, skipped duplicate enqueue`);
    } catch (queueErr) {
      // Never let a queueing failure affect the login itself — the response
      // has already been sent at this point anyway.
      console.error(`Failed to queue sync for ${user.email}:`, queueErr.message);
    }

  } catch (error) {
    console.error('Google Auth Error:', error);
    // Guard against "Cannot set headers after they are sent" — res.redirect()
    // above may have already completed the response by the time an error
    // surfaces from the (non-blocking) enqueueSync step.
    if (!res.headersSent) {
      res.status(500).json({ message: 'Google login failed' });
    }
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
