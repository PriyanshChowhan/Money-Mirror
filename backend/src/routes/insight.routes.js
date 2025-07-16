import express from 'express';
import TransactionModel from '../models/transaction.js'; 
import { protect } from '../middlewares/authjwt.js';
import { aiInsights, rawInsights } from '../controllers/insights.controller.js';
const router = express.Router();
router.use((req, res, next) => {
    req.app.set('Transaction', TransactionModel);
    next();
});

/**
 * @route   GET /api/insights
 * @desc    Generate AI-based financial insights
 * @access  Private
 */
router.get('/ai', protect, aiInsights);

/**
 * @route   GET /api/insights/raw
 * @desc    Get raw aggregated insight data for charts/dashboards
 * @access  Private
 */
router.get('/raw', protect, rawInsights);
export default router;
