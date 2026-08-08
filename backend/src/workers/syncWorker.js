// Standalone worker process — run with `node src/workers/syncWorker.js`.
// Deliberately NOT imported by app.js / index.js: this must run as its own
// process (and its own Docker Compose service) so that slow Gmail/Gemini
// I/O never shares an event loop or blocks the API server.

import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development'
});

import { Worker } from 'bullmq';
import connectDB from '../db/connectDB.js';
import User from '../models/user.js';
import { syncEmailsForUser } from '../cron/emailSyncCron.js';
import { redisConnection, SYNC_QUEUE_NAME } from '../queues/syncQueue.js';

// Caps how many sync jobs run at once across ALL users on this worker
// process. This is your real lever for respecting Gmail's per-project quota
// — raise it if you run multiple worker replicas and want to split load,
// lower it if you start seeing Gmail 429s.
const CONCURRENCY = Number(process.env.SYNC_WORKER_CONCURRENCY) || 5;

async function start() {
  await connectDB();

  const worker = new Worker(
    SYNC_QUEUE_NAME,
    async (job) => {
      const { userId } = job.data;
      const user = await User.findById(userId);

      if (!user) {
        console.warn(`[sync-worker] User ${userId} not found, skipping job ${job.id}`);
        return { skipped: true };
      }

      if (!user.accessToken || !user.refreshToken) {
        console.warn(`[sync-worker] User ${user.email} has no Gmail tokens, skipping`);
        return { skipped: true };
      }

      console.log(`[sync-worker] Starting sync for ${user.email} (job ${job.id})`);
      const saved = await syncEmailsForUser(user);
      console.log(`[sync-worker] Synced ${saved.length} transactions for ${user.email}`);

      return { transactionCount: saved.length };
    },
    {
      connection: redisConnection,
      concurrency: CONCURRENCY,
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`[sync-worker] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`[sync-worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
  });

  console.log(`[sync-worker] Listening on queue "${SYNC_QUEUE_NAME}" with concurrency ${CONCURRENCY}`);
}

start().catch((err) => {
  console.error('[sync-worker] Failed to start:', err);
  process.exit(1);
});
