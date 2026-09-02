import { google } from 'googleapis';
import pLimit from 'p-limit';
import { convert } from 'html-to-text';
import Transaction from '../../models/transaction.js';
import SyncLog from '../../models/syncLog.js';

const GMAIL_FETCH_CONCURRENCY = 5;

function decodeBody(data) {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function htmlToReadableText(html) {
  if (!html) return '';

  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'script', format: 'skip' },
      { selector: 'style', format: 'skip' },
    ],
  }).trim();
}

function collectMimeBodies(part, bodies) {
  if (!part) return;

  if (part.mimeType === 'text/plain' && part.body?.data) {
    bodies.plain.push(decodeBody(part.body.data));
  }

  if (part.mimeType === 'text/html' && part.body?.data) {
    bodies.html.push(decodeBody(part.body.data));
  }

  for (const child of part.parts || []) {
    collectMimeBodies(child, bodies);
  }
}

function extractEmailText(payload, snippet = '') {
  const bodies = { plain: [], html: [] };
  collectMimeBodies(payload, bodies);

  const plainText = bodies.plain.map(x => x.trim()).filter(Boolean).join('\n\n');
  const htmlText = bodies.html.map(htmlToReadableText).filter(Boolean).join('\n\n');

  if (htmlText) return htmlText;
  if (plainText) return plainText;

  if (payload?.body?.data) {
    const decoded = decodeBody(payload.body.data);
    return payload.mimeType === 'text/html'
      ? htmlToReadableText(decoded)
      : decoded.trim();
  }

  return snippet?.trim() || '';
}

export const fetchEmails = async (auth, userId, maxResults = 100) => {
  const gmail = google.gmail({ version: 'v1', auth });

  const lastLog = await SyncLog.findOne({ user: userId }).sort({ fetchedAt: -1 });
  const afterDate = lastLog ? new Date(lastLog.fetchedAt) : null;

  let gmailQuery = `
    subject:(payment OR transaction OR receipt OR invoice OR order OR subscription OR refund OR charged OR purchase OR spent OR credited OR debited OR billing OR bank OR transfer OR salary OR income OR paid OR debit OR credit)
  `.trim();

  if (afterDate) {
    const year = afterDate.getFullYear();
    const month = String(afterDate.getMonth() + 1).padStart(2, '0');
    const day = String(afterDate.getDate()).padStart(2, '0');
    const dateStr = `${year}/${month}/${day}`;

    gmailQuery += ` after:${dateStr}`;
    console.log(`Fetching emails after: ${dateStr} (${afterDate.toISOString()})`);
  } else {
    console.log('No last sync log found - fetching recent emails');
  }

  console.log('Gmail query:', gmailQuery);

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: gmailQuery,
    maxResults,
    includeSpamTrash: false,
  });

  const messages = res.data.messages || [];
  console.log(`Found ${messages.length} messages from Gmail API`);

  if (!messages.length) {
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

  const results = await Promise.all(
    toFetch.map(msg =>
      limit(async () => {
        try {
          const fullMsg = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full',
          });

          const payload = fullMsg.data.payload;

          if (!payload) {
            console.warn(`No payload for message ${msg.id}`);
            return null;
          }

          const rawText = extractEmailText(payload, fullMsg.data.snippet);

          if (!rawText) {
            console.warn(`No usable body found for message ${msg.id}`);
            return null;
          }

          console.log(
            `[email] ${msg.id} | mime=${payload.mimeType} | extracted=${rawText.length} chars`
          );

          return {
            gmailMessageId: msg.id,
            rawText,
            internalDate: new Date(parseInt(fullMsg.data.internalDate, 10)),
            snippet: fullMsg.data.snippet,
          };
        } catch (err) {
          console.warn(`Failed to fetch message ${msg.id}:`, err.message);
          return null;
        }
      })
    )
  );

  const newEmails = results.filter(Boolean);

  console.log(`Returning ${newEmails.length} new emails for processing`);
  return newEmails;
};