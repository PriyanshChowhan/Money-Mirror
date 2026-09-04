import {
    generateInsightData,
    generateUserInsights,
    getSubscriptionRawInsights,
    confirmSubscription,
    dismissSubscription
} from '../insights/insightService.js';

// GET /api/insights/raw
// Pure aggregation data (monthly trend, categories, merchants, patterns)
// without an AI call.
const rawInsights = async (req, res) => {
    try {
        const userId = req.user._id;
        const Transaction = req.app.get('Transaction');
        const data = await generateInsightData(Transaction, userId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('rawInsights error:', error);
        res.status(500).json({ success: false, error: 'Failed to load raw insights' });
    }
};

// GET /api/insights/ai
// LLM-generated actionable insights (spending, categories, subscriptions,
// lifestyle) via Gemini.
const aiInsights = async (req, res) => {
    try {
        const userId = req.user._id;
        const Transaction = req.app.get('Transaction');
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const result = await generateUserInsights(Transaction, userId, geminiApiKey);

        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        res.json({ success: true, insights: result.insights, metadata: result.metadata });
    } catch (error) {
        console.error('aiInsights error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate AI insights' });
    }
};

// GET /api/insights/raw/subscriptions
// Deterministic subscription detection: runs the recurring-charge detector,
// syncs results into the Subscription collection, returns active
// subscriptions + upcoming renewals + anything new awaiting confirmation.
const subscriptionInsights = async (req, res) => {
    try {
        const userId = req.user._id;
        const Transaction = req.app.get('Transaction');
        const Subscription = req.app.get('Subscription');
        const data = await getSubscriptionRawInsights(Transaction, Subscription, userId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('subscriptionInsights error:', error);
        res.status(500).json({ success: false, error: 'Failed to load subscription insights' });
    }
};

// POST /api/insights/subscriptions/:id/confirm
const confirmSubscriptionHandler = async (req, res) => {
    try {
        const userId = req.user._id;
        const Subscription = req.app.get('Subscription');
        const updated = await confirmSubscription(Subscription, userId, req.params.id);
        if (!updated) return res.status(404).json({ success: false, error: 'Subscription not found' });
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('confirmSubscriptionHandler error:', error);
        res.status(500).json({ success: false, error: 'Failed to confirm subscription' });
    }
};

// POST /api/insights/subscriptions/:id/dismiss
const dismissSubscriptionHandler = async (req, res) => {
    try {
        const userId = req.user._id;
        const Subscription = req.app.get('Subscription');
        const updated = await dismissSubscription(Subscription, userId, req.params.id);
        if (!updated) return res.status(404).json({ success: false, error: 'Subscription not found' });
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('dismissSubscriptionHandler error:', error);
        res.status(500).json({ success: false, error: 'Failed to dismiss subscription' });
    }
};

export {
    rawInsights,
    aiInsights,
    subscriptionInsights,
    confirmSubscriptionHandler,
    dismissSubscriptionHandler
};
