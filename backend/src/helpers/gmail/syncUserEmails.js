import { fetchEmails } from './fetchEmail.js';
import { parseEmailContent } from './parseEmail.js';
import Transaction from '../../models/transaction.js';
import SyncLog from '../../models/syncLog.js';


export const syncUserEmails = async (authClient, user, limit = 100) => {
  await authClient.getAccessToken();

  const emails = await fetchEmails(authClient, user._id, limit);
  console.log(`📧 Emails fetched: ${emails.length}`);

  const savedTransactions = [];

  for (const email of emails) {
    console.log("Processing email:", email.gmailMessageId);

    if (!email?.rawText) {
      console.warn("No rawText found");
      continue;
    }

    const exists = await Transaction.findOne({ gmailMessageId: email.gmailMessageId });
    if (exists) {
      console.log("Skipped duplicate:", email.gmailMessageId);
      continue;
    }

    const parsed = await parseEmailContent(email.rawText, user._id, email.gmailMessageId);

    if (!parsed) {
      console.warn("Parsing failed for:", email.gmailMessageId);
      continue;
    }

    if (!parsed.amount) {
      console.warn("Parsed transaction missing amount:", parsed);
      continue;
    }

    const transactionData = {
      ...parsed,
      user: user._id,
      gmailMessageId: email.gmailMessageId,
      date: parsed.date || new Date(email.internalDate),
      source: 'email',
    };

    const saved = await Transaction.create(transactionData);
    savedTransactions.push(saved);
    console.log("Saved transaction:", saved._id);
  }

  // Only log a sync if something was saved
  if (savedTransactions.length > 0) {
    await SyncLog.create({
      user: user._id,
      fetchedAt: new Date(),
      messageCount: savedTransactions.length,
      notes: `Synced ${savedTransactions.length} new transactions.`,
    });
  }

  return savedTransactions;
};
