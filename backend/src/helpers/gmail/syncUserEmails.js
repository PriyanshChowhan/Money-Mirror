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

  const ids = withText.map(e => e.gmailMessageId);
  const existing = ids.length
    ? await Transaction.find({ gmailMessageId: { $in: ids } }).select('gmailMessageId')
    : [];
  const existingIds = new Set(existing.map(t => t.gmailMessageId));
  const newEmails = withText.filter(e => !existingIds.has(e.gmailMessageId));

  if (newEmails.length < withText.length) {
    console.log(`Skipped ${withText.length - newEmails.length} duplicate emails`);
  }

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

  let savedTransactions = [];
  if (toInsert.length) {
    try {
      savedTransactions = await Transaction.insertMany(toInsert, { ordered: false });
    } catch (err) {
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
