import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL_MS = 3000;
// Stop polling after this long even if the job is still running, so a stuck
// job doesn't spin the "Syncing…" indicator forever. The job itself keeps
// running server-side either way — this only affects the UI polling loop.
const MAX_POLL_MS = 2 * 60 * 1000;

/**
 * Polls GET /api/gmail/sync/status and exposes the current state, plus a
 * helper to kick off POST /api/gmail/sync and start polling automatically.
 *
 * States mirror the backend: 'idle' | 'waiting' | 'active' | 'completed' | 'failed'
 */
export function useSyncStatus() {
  const [status, setStatus] = useState('idle');
  const [failedReason, setFailedReason] = useState(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/gmail/sync/status', { withCredentials: true });
      setStatus(res.data.state);
      setFailedReason(res.data.failedReason || null);
      return res.data.state;
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
      return null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    startedAtRef.current = Date.now();

    // Check immediately, then on an interval.
    fetchStatus();

    timerRef.current = setInterval(async () => {
      const state = await fetchStatus();
      const elapsed = Date.now() - startedAtRef.current;

      if (state === 'completed' || state === 'failed' || state === 'idle' || elapsed > MAX_POLL_MS) {
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }, [fetchStatus, stopPolling]);

  // Kick off a manual sync (POST /api/gmail/sync), then start polling for
  // its result. Handles the 202 { status: 'queued' | 'already_syncing' }
  // response shape — there is no more inline transaction list to read here.
  const triggerManualSync = useCallback(async () => {
    try {
      const res = await axios.post('/api/gmail/sync', {}, { withCredentials: true });
      setStatus(res.data.status === 'already_syncing' ? 'active' : 'waiting');
      startPolling();
      return res.data;
    } catch (err) {
      console.error('Failed to trigger sync:', err);
      throw err;
    }
  }, [startPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  return {
    status,
    isSyncing: status === 'waiting' || status === 'active',
    failedReason,
    fetchStatus,
    startPolling,
    stopPolling,
    triggerManualSync,
  };
}
