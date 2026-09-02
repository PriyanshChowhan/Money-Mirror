import { Queue } from 'bullmq';

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

export const SYNC_QUEUE_NAME = 'email-sync';

export const syncQueue = new Queue(SYNC_QUEUE_NAME, {
  connection: redisConnection,
});

export async function enqueueSync(userId) {
  const jobId = `sync-${userId}`;

  const existing = await syncQueue.getJob(jobId);

  if (existing) {
    const state = await existing.getState();

    if (state === 'waiting' || state === 'active' || state === 'delayed') {
      return null;
    }

    await existing.remove();
  }

  return syncQueue.add(
    'sync-user',
    { userId },
    {
      jobId,
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    }
  );
}

export async function getSyncStatus(userId) {
  const job = await syncQueue.getJob(`sync-${userId}`);

  if (!job) {
    return { state: 'idle' };
  }

  const state = await job.getState();

  if (state === 'failed') {
    return {
      state,
      failedReason: job.failedReason,
    };
  }

  return { state };
}