import {
  handleGenerateInsights,
  generateUserInsights,
  getUserAggregatedData
} from '../insights/insightService.js'

export const rawInsights = async (req, res) => {
  const Transaction = req.app.get('Transaction');
  const userId = req.user._id;
  const data = await getUserAggregatedData(Transaction, userId);
  res.json({ success: true, data });
}

export const aiInsights = async (req, res) => {
  try {
    const Transaction = req.app.get('Transaction');
    const geminiApiKey = process.env.GEMINI_API_KEY;

    const userId = req.user._id;
    const result = await generateUserInsights(Transaction, userId, geminiApiKey);

    res.json(result);
  } catch (err) {
    console.error('Error generating test insights:', err);
    res.status(500).json({ success: false, error: 'Failed to generate test insights' });
  }
}