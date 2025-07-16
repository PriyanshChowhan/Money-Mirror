import { google } from 'googleapis';
import Transaction from '../../models/transaction.js';
import SyncLog from '../../models/syncLog.js';

/**
 * Fetch and decode new Gmail messages that look like financial transactions.
 */
export const fetchEmails = async (auth, userId, maxResults = 100) => {
  const gmail = google.gmail({ version: 'v1', auth });

  // Optional SyncLog filter
  const lastLog = await SyncLog.findOne({ user: userId }).sort({ fetchedAt: -1 });
  const afterDate = lastLog ? new Date(lastLog.fetchedAt) : null;

  // Relaxed Gmail query
  let gmailQuery = `
    (subject:(payment OR transaction OR receipt OR invoice OR order OR purchase OR spent OR credited OR debited)) 
    OR 
    (body:(₹ OR INR OR payment OR subscription OR amount))
  `.trim();

  if (afterDate) {
    const afterTimestampSeconds = Math.floor(afterDate.getTime() / 1000);
    gmailQuery += ` after:${afterTimestampSeconds}`;
  }

  console.log("🔍 Gmail query:", gmailQuery);

  // List messages
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: gmailQuery,
    maxResults,
    includeSpamTrash: false,
  });

  const messages = res.data.messages || [];
  if (messages.length === 0) return [];

  // Filter already processed
  const messageIds = messages.map(msg => msg.id);
  const existing = await Transaction.find({
    user: userId,
    gmailMessageId: { $in: messageIds },
  }).select('gmailMessageId');

  const seenIds = new Set(existing.map(t => t.gmailMessageId));
  const newEmails = [];

  // Fetch full content of new messages
  for (const msg of messages) {
    if (seenIds.has(msg.id)) continue;

    const fullMsg = await gmail.users.messages.get({ userId: 'me', id: msg.id });
    const payload = fullMsg.data.payload;
    if (!payload) continue;

    const parts = payload.parts || [];
    const bodyData =
      payload.body?.data ||
      parts.find(p => p.mimeType === 'text/plain')?.body?.data;

    if (!bodyData) continue;

    const decoded = Buffer.from(bodyData, 'base64').toString('utf-8');

    newEmails.push({
      gmailMessageId: msg.id,
      rawText: decoded,
      internalDate: new Date(parseInt(fullMsg.data.internalDate)),
      snippet: fullMsg.data.snippet,
    });
  }

  return newEmails;
};
