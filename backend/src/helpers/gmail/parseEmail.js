import { parseEmailsWithLLM } from "../../langchain/llmParser.js";

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
 * Parses an email and returns the extracted transaction object.
 * @param {string} rawEmailText - Raw email content
 * @param {string} userId - MongoDB ObjectId for the user
 * @param {string} [gmailMessageId] - Optional Gmail message ID
 * @returns {Promise<object|null>} - Parsed transaction data or null
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
      console.warn("❗ LLM returned empty or invalid array.");
      return null;
    }

    const tx = parsed[0]; // Assume 1 email → 1 transaction

    const transactionData = {
      amount: tx.amount,
      currency: tx.currency || "INR",
      date: new Date(tx.date),
      category: tx.category,
      merchant: tx.merchant,
      rawText: rawEmailText,
      confidence: 1.0,
    };

    return transactionData;
  } catch (err) {
    console.error("❌ Error parsing transaction:", err.message);
    return null;
  }
}
