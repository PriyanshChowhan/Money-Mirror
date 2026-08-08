import { google } from 'googleapis';
import pLimit from 'p-limit';
import Transaction from '../../models/transaction.js';
import SyncLog from '../../models/syncLog.js';

// Cap concurrent gmail.users.messages.get calls per sync so a user with 100
// new emails doesn't fire 100 simultaneous requests (this is a per-user
// courtesy limit — Gmail's real quota is enforced server-side by Google).
const GMAIL_FETCH_CONCURRENCY = 5;

/**
 * Fetch and decode new Gmail messages that look like financial transactions.
 */
export const fetchEmails = async (auth, userId, maxResults = 100) => {
  const gmail = google.gmail({ version: 'v1', auth });

  const lastLog = await SyncLog.findOne({ user: userId }).sort({ fetchedAt: -1 });
  const afterDate = lastLog ? new Date(lastLog.fetchedAt) : null;

  // More flexible query - emails with financial keywords in subject OR body
  let gmailQuery = `
    subject:(payment OR transaction OR receipt OR invoice OR order OR subscription OR refund OR charged OR purchase OR spent OR credited OR debited OR billing OR bank OR transfer OR salary OR income OR paid OR debit OR credit)
  `.trim();

  if (afterDate) {
    // Gmail API expects date in YYYY/MM/DD format for after: parameter
    const year = afterDate.getFullYear();
    const month = String(afterDate.getMonth() + 1).padStart(2, '0');
    const day = String(afterDate.getDate()).padStart(2, '0');
    const dateStr = `${year}/${month}/${day}`;
    gmailQuery += ` after:${dateStr}`;
    console.log(`Fetching emails after: ${dateStr} (${afterDate.toISOString()})`);
  } else {
    console.log('No last sync log found - fetching recent emails');
  }

  console.log("Gmail query:", gmailQuery);

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: gmailQuery,
    maxResults,
    includeSpamTrash: false,
  });

  const messages = res.data.messages || [];
  console.log(`Found ${messages.length} messages from Gmail API`);
  
  if (messages.length === 0) {
    console.log('No messages matched the query');
    return [];
  }

  const messageIds = messages.map(msg => msg.id);
  const existing = await Transaction.find({
    user: userId,
    gmailMessageId: { $in: messageIds },
  }).select('gmailMessageId');

  const seenIds = new Set(existing.map(t => t.gmailMessageId));
  console.log(`${existing.length} messages already exist in database`);
  
  const toFetch = messages.filter(msg => !seenIds.has(msg.id));

  const limit = pLimit(GMAIL_FETCH_CONCURRENCY);

  // Concurrency-limited fetch instead of one gmail.users.messages.get() at a
  // time — same total requests, but they run in parallel (capped) rather
  // than sequentially, which is the dominant latency cost for a sync with
  // many new messages.
  const results = await Promise.all(
    toFetch.map(msg => limit(async () => {
      try {
        const fullMsg = await gmail.users.messages.get({ userId: 'me', id: msg.id });
        const payload = fullMsg.data.payload;
        if (!payload) {
          console.warn(`No payload for message ${msg.id}`);
          return null;
        }

        const parts = payload.parts || [];
        const bodyData =
          payload.body?.data ||
          parts.find(p => p.mimeType === 'text/plain')?.body?.data ||
          parts.find(p => p.mimeType === 'text/html')?.body?.data;

        if (!bodyData) {
          console.warn(`No body data found for message ${msg.id}, snippet: ${fullMsg.data.snippet}`);
          return null;
        }

        const decoded = Buffer.from(bodyData, 'base64').toString('utf-8');

        return {
          gmailMessageId: msg.id,
          rawText: decoded,
          internalDate: new Date(parseInt(fullMsg.data.internalDate)),
          snippet: fullMsg.data.snippet,
        };
      } catch (err) {
        console.warn(`Failed to fetch message ${msg.id}:`, err.message);
        return null;
      }
    }))
  );

  const newEmails = results.filter(Boolean);

  console.log(`Returning ${newEmails.length} new emails for processing`);
  return newEmails;
};
