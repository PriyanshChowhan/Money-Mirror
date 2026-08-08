import { Queue } from 'bullmq';

// Shared connection config used by both the Queue (producer, in the API
// process) and the Worker (consumer, in the separate worker process).
export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // BullMQ requires this to be null, not undefined, for blocking commands.
  maxRetriesPerRequest: null,
};

export const SYNC_QUEUE_NAME = 'email-sync';

export const syncQueue = new Queue(SYNC_QUEUE_NAME, {
  connection: redisConnection,
});

/**
 * Enqueue a Gmail sync job for a user. Uses a deterministic jobId
 * (`sync-<userId>`) so BullMQ itself prevents a second sync from being
 * queued while one is already waiting/active for that user — this replaces
 * needing a separate "syncing" lock field on the User model.
 *
 * @param {string} userId
 * @returns {Promise<import('bullmq').Job|null>} the job, or null if a sync
 *   was already queued/running for this user (duplicate jobId rejected)
 */
export async function enqueueSync(userId) {
  const jobId = `sync-${userId}`;

  // If a job with this ID is already active/waiting, BullMQ's add() will
  // just return the existing job rather than erroring — so we explicitly
  // check first to make the "already syncing" case obvious to the caller.
  const existing = await syncQueue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'waiting' || state === 'active' || state === 'delayed') {
      return null;
    }
  }

  return syncQueue.add(
    'sync-user',
    { userId },
    {
      jobId,
      removeOnComplete: { age: 3600 }, // keep completed jobs for 1hr (for status polling), then GC
      removeOnFail: { age: 86400 },    // keep failed jobs for 1 day for debugging
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    }
  );
}

/**
 * Get the current sync status for a user, for the frontend to poll.
 * @param {string} userId
 * @returns {Promise<{ state: 'idle'|'waiting'|'active'|'completed'|'failed', failedReason?: string }>}
 */
export async function getSyncStatus(userId) {
  const job = await syncQueue.getJob(`sync-${userId}`);
  if (!job) return { state: 'idle' };

  const state = await job.getState();
  if (state === 'failed') {
    return { state, failedReason: job.failedReason };
  }
  return { state };
}
