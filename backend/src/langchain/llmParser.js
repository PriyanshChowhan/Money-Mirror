import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Calls Gemini to parse financial transaction details from emails.
 * @param {{ rawEmails: string[], geminiConfig: { geminiApi: string } }} param0 
 * @returns {Promise<string>} Raw Gemini output (may include markdown)
 */
export async function parseEmailsWithLLM({ rawEmails, geminiConfig }) {
  const genAI = new GoogleGenerativeAI(geminiConfig.geminiApi);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const compiledText = rawEmails.join("\n\n");

  const prompt = `You are a strict financial transaction parser. You ONLY extract payments, expenses, subscriptions, income, refunds, or charges from emails.

From the following email content, extract ONLY legitimate financial transactions. Reject any email that is NOT about actual money movements.

Rules:
- Extract transactions ONLY if the email clearly mentions a monetary amount with a price/cost/payment
- Reject promotional emails, newsletters, ads, or non-payment emails
- Reject emails that don't have clear transaction details
- Return a JSON array with transactions found. Each should have:
  * "amount": number (the transaction value)
  * "currency": string (e.g., INR, USD, EUR)
  * "date": string in ISO format (YYYY-MM-DD)
  * "merchant": string (who received or sent the payment)
  * "category": string (food, rent, shopping, travel, subscription, salary, etc.)
  * "isPayment": boolean (true only if genuine payment/charge)

Strict requirements:
- Return ONLY valid JSON array
- Do NOT wrap in code blocks or explanations
- If email is NOT about payments, return empty array: []
- Verify merchant is legitimate (not spam/phishing)

Email content:
${compiledText}

Return ONLY the JSON array. NO markdown, NO explanations.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Batched version: parses MANY emails in a single Gemini call instead of one call per email.
 * Each email is wrapped with an explicit index marker so the model can tell us which
 * transaction (if any) belongs to which email, and we can map results back reliably —
 * including emails that produce NO transaction, which we need to know about too.
 *
 * @param {{ emails: { gmailMessageId: string, rawText: string }[], geminiConfig: { geminiApi: string } }} param0
 * @returns {Promise<string>} Raw Gemini output (may include markdown), expected to be a JSON array
 *   of { index: number, isPayment: boolean, amount, currency, date, merchant, category, confidence }
 */
export async function parseEmailBatchWithLLM({ emails, geminiConfig }) {
  const genAI = new GoogleGenerativeAI(geminiConfig.geminiApi);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const compiledText = emails
    .map((e, i) => `--- EMAIL_START index=${i} ---\n${e.rawText}\n--- EMAIL_END index=${i} ---`)
    .join("\n\n");

  const prompt = `You are a strict financial transaction parser. You ONLY extract payments, expenses, subscriptions, income, refunds, or charges from emails.

You will be given MULTIPLE emails, each wrapped between "--- EMAIL_START index=N ---" and "--- EMAIL_END index=N ---" markers. Process EACH email independently.

Rules per email:
- Extract a transaction ONLY if the email clearly mentions a monetary amount with a price/cost/payment
- Reject promotional emails, newsletters, ads, or non-payment emails (still return an entry for it, with isPayment=false)
- Verify merchant is legitimate (not spam/phishing)

Return a single JSON array with EXACTLY ONE object per input email (same count as emails given, in any order), each with:
  * "index": number (the index marker from that email, REQUIRED, used to map back)
  * "isPayment": boolean (true only if genuine payment/charge was found)
  * "amount": number or null
  * "currency": string or null (e.g., INR, USD, EUR)
  * "date": string in ISO format (YYYY-MM-DD) or null
  * "merchant": string or null
  * "category": string or null (food, rent, shopping, travel, subscription, salary, etc.)
  * "confidence": number between 0 and 1

Strict requirements:
- Return ONLY a valid JSON array, one entry per email, matched by "index"
- Do NOT wrap in code blocks or explanations
- Do NOT skip any index, even for non-payment emails (return isPayment=false for those)

Emails:
${compiledText}

Return ONLY the JSON array. NO markdown, NO explanations.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
