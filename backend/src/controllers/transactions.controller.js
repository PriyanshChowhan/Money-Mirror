import transaction from '../models/transaction.js';
import dayjs from 'dayjs';

export const getAllTransactions = async (req, res) => {
  const transactions = await transaction.find({ user: req.user._id }).sort({ date: -1 });
  res.status(200).json(transactions);
};

export const getAllTransactionsByRange = async (req, res) => {
  try {
    const { range, start, end } = req.query;
    const userId = req.user._id;

    let startDate, endDate = new Date();

    // Handle predefined ranges
    if (range === 'this-month') {
      startDate = dayjs().startOf('month').toDate();
      endDate = dayjs().endOf('month').toDate();
    } else if (range === 'last-month') {
      startDate = dayjs().subtract(1, 'month').startOf('month').toDate();
      endDate = dayjs().subtract(1, 'month').endOf('month').toDate();
    } else if (range === 'last-12-months') {
      startDate = dayjs().subtract(12, 'month').startOf('month').toDate();
    }

    // Override with custom start/end dates (if provided)
    if (start) startDate = new Date(start);
    if (end) endDate = new Date(end);

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;

    // Build final MongoDB query
    const filter = {
      user: userId,
      ...(Object.keys(dateFilter).length && { date: dateFilter })
    };

    const transactions = await transaction.find(filter).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching transactions by range:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
