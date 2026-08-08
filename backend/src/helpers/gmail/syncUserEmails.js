import { fetchEmails } from './fetchEmail.js';
import { parseEmailBatch } from './parseEmail.js';
import Transaction from '../../models/transaction.js';
import SyncLog from '../../models/syncLog.js';


export const syncUserEmails = async (authClient, user, limit = 100) => {
  await authClient.getAccessToken();

  const emails = await fetchEmails(authClient, user._id, limit);
  console.log(`Emails fetched: ${emails.length}`);

  const withText = emails.filter(e => e?.rawText);
  if (withText.length < emails.length) {
    console.warn(`Skipped ${emails.length - withText.length} emails with no rawText`);
  }

  // Safety-net dedupe (fetchEmails already skips known gmailMessageIds, this
  // guards against a race with a concurrent sync for the same user).
  const ids = withText.map(e => e.gmailMessageId);
  const existing = ids.length
    ? await Transaction.find({ gmailMessageId: { $in: ids } }).select('gmailMessageId')
    : [];
  const existingIds = new Set(existing.map(t => t.gmailMessageId));
  const newEmails = withText.filter(e => !existingIds.has(e.gmailMessageId));

  if (newEmails.length < withText.length) {
    console.log(`Skipped ${withText.length - newEmails.length} duplicate emails`);
  }

  // ONE (or a few, chunked) Gemini call(s) for ALL new emails in this sync,
  // instead of a sequential per-email call. This is the dominant latency win.
  const parsedByGmailId = await parseEmailBatch(newEmails);

  const toInsert = [];
  for (const email of newEmails) {
    const parsed = parsedByGmailId.get(email.gmailMessageId);

    if (!parsed) {
      console.log("No transaction found in email:", email.gmailMessageId);
      continue;
    }

    if (!parsed.amount) {
      console.warn("Parsed transaction missing amount:", email.gmailMessageId);
      continue;
    }

    toInsert.push({
      ...parsed,
      user: user._id,
      gmailMessageId: email.gmailMessageId,
      date: parsed.date || new Date(email.internalDate),
      source: 'email',
    });
  }

  // Bulk insert instead of one Transaction.create() per email.
  let savedTransactions = [];
  if (toInsert.length) {
    try {
      savedTransactions = await Transaction.insertMany(toInsert, { ordered: false });
    } catch (err) {
      // With ordered:false, valid docs still get inserted even if some hit the
      // unique gmailMessageId index (e.g. a race with a concurrent sync).
      if (err.insertedDocs) {
        savedTransactions = err.insertedDocs;
        console.warn(
          `Bulk insert: ${savedTransactions.length} succeeded, ${err.writeErrors?.length || 0} skipped (likely duplicates)`
        );
      } else {
        console.error('Bulk insert failed:', err.message);
        throw err;
      }
    }
  }

  console.log(`Saved ${savedTransactions.length} transactions for ${user.email}`);

  // Always create a sync log to track when we last checked
  // This prevents re-querying the same emails repeatedly
  await SyncLog.create({
    user: user._id,
    fetchedAt: new Date(),
    messageCount: savedTransactions.length,
    notes: savedTransactions.length > 0
      ? `Synced ${savedTransactions.length} new transactions.`
      : 'Sync completed, no new transactions found.',
  });

  return savedTransactions;
};
