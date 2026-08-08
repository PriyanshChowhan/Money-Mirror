import express from 'express';
import TransactionModel from '../models/transaction.js';
import SubscriptionModel from '../models/subscription.js';
import BudgetPreferenceModel from '../models/budgetPreference.js';
import { protect } from '../middlewares/authjwt.js';
import {
    aiInsights,
    rawInsights,
    subscriptionInsights,
    confirmSubscriptionHandler,
    dismissSubscriptionHandler,
    getBudgetPreference,
    runBudgetOptimizer
} from '../controllers/insights.controller.js';

const router = express.Router();

router.use((req, res, next) => {
    req.app.set('Transaction', TransactionModel);
    req.app.set('Subscription', SubscriptionModel);
    req.app.set('BudgetPreference', BudgetPreferenceModel);
    next();
});

router.get('/ai', protect, aiInsights);

router.get('/raw', protect, rawInsights);

router.get('/raw/subscriptions', protect, subscriptionInsights);
router.post('/subscriptions/:id/confirm', protect, confirmSubscriptionHandler);
router.post('/subscriptions/:id/dismiss', protect, dismissSubscriptionHandler);

router.get('/budget-optimizer', protect, getBudgetPreference);
router.post('/budget-optimizer', protect, runBudgetOptimizer);

export default router;