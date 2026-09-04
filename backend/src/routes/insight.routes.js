import express from 'express';
import TransactionModel from '../models/transaction.js';
import SubscriptionModel from '../models/subscription.js';
import { protect } from '../middlewares/authjwt.js';
import {
    aiInsights,
    rawInsights,
    subscriptionInsights,
    confirmSubscriptionHandler,
    dismissSubscriptionHandler
} from '../controllers/insights.controller.js';

const router = express.Router();

router.use((req, res, next) => {
    req.app.set('Transaction', TransactionModel);
    req.app.set('Subscription', SubscriptionModel);
    next();
});

router.get('/ai', protect, aiInsights);

router.get('/raw', protect, rawInsights);

router.get('/raw/subscriptions', protect, subscriptionInsights);
router.post('/subscriptions/:id/confirm', protect, confirmSubscriptionHandler);
router.post('/subscriptions/:id/dismiss', protect, dismissSubscriptionHandler);

export default router;
