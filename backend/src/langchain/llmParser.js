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
