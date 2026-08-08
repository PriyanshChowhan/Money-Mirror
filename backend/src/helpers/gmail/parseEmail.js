import { parseEmailsWithLLM, parseEmailBatchWithLLM } from "../../langchain/llmParser.js";

// How many emails go into a single Gemini call. Keeps prompt size (and the
// chance of a truncated/malformed JSON response) under control while still
// cutting a 30-email sync down to ~3-4 LLM calls instead of 30.
const BATCH_SIZE = 8;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Cleans LLM output by stripping code blocks or extracting valid JSON.
 * @param {string} text
 * @returns {string}
 */
function cleanLLMResponse(text) {
  const codeBlock = text.match(/```(?:json)?([\s\S]*?)```/i);
  if (codeBlock) return codeBlock[1].trim();

  const jsonLike = text.match(/(\[\s*{[\s\S]*?}\s*\])/);
  if (jsonLike) return jsonLike[1].trim();

  return text.trim();
}

/**
 * Parses an email and extracts transaction details ONLY if it's a payment-related email.
 * Does NOT store raw email text for privacy.
 * @param {string} rawEmailText - Raw email content
 * @param {string} userId - MongoDB ObjectId for the user
 * @param {string} [gmailMessageId] - Optional Gmail message ID
 * @returns {Promise<object|null>} - Parsed transaction data or null if not a payment email
 */
export async function parseEmailContent(rawEmailText, userId, gmailMessageId = null) {
  try {
    const rawOutput = await parseEmailsWithLLM({
      rawEmails: [rawEmailText],
      geminiConfig: {
        geminiApi: process.env.GEMINI_API_KEY,
      },
    });

    const cleaned = cleanLLMResponse(rawOutput);
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn("❗ Email does not contain valid payment transactions.");
      return null;
    }

    const tx = parsed[0]; 

    const transactionData = {
      amount: tx.amount,
      currency: tx.currency || "INR",
      date: new Date(tx.date),
      category: tx.category,
      merchant: tx.merchant,
      confidence: tx.confidence || 1.0,
    };

    return transactionData;
  } catch (err) {
    console.error("Error parsing transaction:", err.message);
    return null;
  }
}

/**
 * Batched version of parseEmailContent. Takes many emails, groups them into
 * chunks of BATCH_SIZE, and makes ONE Gemini call per chunk instead of one
 * call per email.
 *
 * @param {{ gmailMessageId: string, rawText: string, internalDate: Date }[]} emails
 * @returns {Promise<Map<string, object|null>>} map of gmailMessageId -> parsed transaction (or null)
 */
export async function parseEmailBatch(emails) {
  const resultsByGmailId = new Map();
  if (!emails.length) return resultsByGmailId;

  const chunks = chunk(emails, BATCH_SIZE);

  for (const emailChunk of chunks) {
    try {
      const rawOutput = await parseEmailBatchWithLLM({
        emails: emailChunk,
        geminiConfig: { geminiApi: process.env.GEMINI_API_KEY },
      });

      const cleaned = cleanLLMResponse(rawOutput);
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        console.warn("❗ Batch parse did not return an array, skipping chunk");
        emailChunk.forEach(e => resultsByGmailId.set(e.gmailMessageId, null));
        continue;
      }

      // Map each result back to its email by index, defensively (LLM output order isn't guaranteed)
      const byIndex = new Map(parsed.map(item => [item.index, item]));

      emailChunk.forEach((email, i) => {
        const tx = byIndex.get(i);

        if (!tx || tx.isPayment === false || !tx.amount) {
          resultsByGmailId.set(email.gmailMessageId, null);
          return;
        }

        resultsByGmailId.set(email.gmailMessageId, {
          amount: tx.amount,
          currency: tx.currency || "INR",
          date: tx.date ? new Date(tx.date) : new Date(email.internalDate),
          category: tx.category,
          merchant: tx.merchant,
          confidence: tx.confidence || 1.0,
        });
      });
    } catch (err) {
      console.error("Error parsing email batch:", err.message);
      // Don't let one bad chunk kill the whole sync — mark this chunk's emails as
      // unparsed so the loop moves on; they'll simply be retried on the next sync
      // since they're only marked "seen" via the SyncLog date cursor, not per-message.
      emailChunk.forEach(e => resultsByGmailId.set(e.gmailMessageId, null));
    }
  }

  return resultsByGmailId;
}
