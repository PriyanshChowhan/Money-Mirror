import express from 'express';
import { protect } from '../middlewares/authjwt.js';
import { getAllTransactions, getAllTransactionsByRange } from "../controllers/transactions.controller.js";

const router = express.Router()
router.get('/getTransactions', protect, getAllTransactions);
router.get('/getTransactionsByRange', protect, getAllTransactionsByRange);

export default router
