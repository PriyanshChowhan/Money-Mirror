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

  const prompt = `You are an intelligent system that reads emails and extracts only financial transactions such as expenses, subscriptions, income, or refunds.

From the following email content, extract and return a JSON array of financial transactions. Each transaction should be an object with these fields:
- "amount": number
- "currency": string
- "date": string in ISO format (YYYY-MM-DD)
- "merchant": string
- "category": string (e.g., food, rent, shopping, travel, etc.)

Strict rules:
- Return ONLY the JSON array
- Do NOT wrap the result in code blocks or explanations
- Do NOT include text outside the JSON
- If no transaction is found, return an empty JSON array: []

Email content:
${compiledText}

Return ONLY the JSON. Do NOT include any explanation, markdown, or formatting like \`\`\`json.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
