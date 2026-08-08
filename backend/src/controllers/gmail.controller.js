import { enqueueSync, getSyncStatus } from '../queues/syncQueue.js';

export const syncAndStoreEmails = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.accessToken || !user?.refreshToken) {
      return res.status(400).json({ error: 'Missing tokens or user. Please re-login with Google.' });
    }

    console.log(`Manual sync requested by ${user.email}`);

    const job = await enqueueSync(user._id.toString());

    if (!job) {
      // enqueueSync returns null when a sync for this user is already
      // waiting/active — tell the client so it can just keep polling status
      // instead of thinking the request failed.
      return res.status(202).json({
        success: true,
        status: 'already_syncing',
        message: 'A sync is already in progress for your account.',
      });
    }

    // 202 Accepted: the work is queued, not done. The old version of this
    // endpoint returned 200 with the saved transactions because it awaited
    // the sync inline — clients polling /api/gmail/sync/status now get that
    // result instead.
    res.status(202).json({
      success: true,
      status: 'queued',
      jobId: job.id,
      message: 'Sync queued. Poll GET /api/gmail/sync/status for progress.',
    });

  } catch (err) {
    console.error('Failed to queue sync:', err?.message || err);
    res.status(500).json({ error: 'Failed to queue email sync' });
  }
};

export const getSyncStatusForUser = async (req, res) => {
  try {
    const status = await getSyncStatus(req.user._id.toString());
    res.status(200).json(status);
  } catch (err) {
    console.error('Failed to get sync status:', err?.message || err);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
};
