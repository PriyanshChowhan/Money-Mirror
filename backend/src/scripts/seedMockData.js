import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path'
dotenv.config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development'
});

import connect from '../db/connectDB.js';
import Transaction from '../models/transaction.js';
import Subscription from '../models/subscription.js';
import BudgetPreference from '../models/budgetPreference.js';
console.log(process.env.MONGODB_URI)

// NOTE: nothing in this script calls Gemini. It only writes to MongoDB, so
// it's safe to re-run as many times as you want while testing - it won't
// touch your AI insight quota. The `/api/insights/ai` endpoint is the only
// one that spends Gemini calls; the subscription detector and budget
// optimizer added here are pure aggregation/math and are free to hit
// repeatedly.

const userId = new mongoose.Types.ObjectId('6a661517999a5ad3ae2a4ede');

// --- date helpers, all relative to "today" so the recurring-charge detector
// (which looks at the last 365 days) and the budget optimizer (which looks
// at the last 30 days) always have realistic data, no matter when you run
// this script ---
const monthsAgoOnDay = (monthsBack, dayOfMonth, hour = 12) => {
  const d = new Date();
  d.setDate(1); // avoid month-rollover weirdness (e.g. Jan 31 - 1 month)
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(dayOfMonth);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const daysAgo = (n, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// ================================
// 1. RECURRING CHARGES
//    - fixed amount, fixed day-of-month, repeated over several months
//    - this is exactly the pattern detectRecurringSubscriptions() looks for
// ================================
const recurringMonthly = [];

// Netflix: ₹499 on the 11th, for the last 7 months -> should surface as a
// high-confidence monthly subscription
for (let m = 0; m < 7; m++) {
  recurringMonthly.push({
    user: userId, source: 'manual', amount: 499, currency: 'INR',
    date: monthsAgoOnDay(m, 11), category: 'Subscriptions', merchant: 'Netflix',
    rawText: 'Netflix monthly plan', tags: ['subscription'], confidence: 0.95
  });
}

// Spotify: ₹129 on the 5th, for the last 6 months -> same idea, kept
// perfectly consistent (unlike the old seed data, which used to jump
// between 129 and 299 and would have hurt the amount-consistency score)
for (let m = 0; m < 6; m++) {
  recurringMonthly.push({
    user: userId, source: 'manual', amount: 129, currency: 'INR',
    date: monthsAgoOnDay(m, 5), category: 'Subscriptions', merchant: 'Spotify',
    rawText: 'Spotify Premium', tags: ['subscription'], confidence: 0.93
  });
}

// Rent: ₹18,000 on the 1st, for the last 8 months -> a big recurring
// "subscription" that also exercises the rent/housing budget category
for (let m = 0; m < 8; m++) {
  recurringMonthly.push({
    user: userId, source: 'manual', amount: 18000, currency: 'INR',
    date: monthsAgoOnDay(m, 1), category: 'Rent', merchant: 'Landlord - Sharma Apartments',
    rawText: 'Monthly rent payment', tags: ['housing'], confidence: 0.97
  });
}

// Electricity: on the 20th every month, but the amount genuinely fluctuates
// (₹900-1400) like a real bill would - useful to show the detector correctly
// stays cautious about calling a variable-amount bill a "subscription"
const electricityAmounts = [1120, 980, 1340, 1050, 1210, 890];
electricityAmounts.forEach((amt, m) => {
  recurringMonthly.push({
    user: userId, source: 'manual', amount: amt, currency: 'INR',
    date: monthsAgoOnDay(m, 20), category: 'Utilities', merchant: 'Tata Power',
    rawText: 'Electricity bill', tags: ['utilities'], confidence: 0.9
  });
});

// ================================
// 2. WEEKLY RECURRING CHARGE
//    - fixed amount, ~7 day cadence, for the last 10 weeks
// ================================
const recurringWeekly = [];
for (let w = 0; w < 10; w++) {
  recurringWeekly.push({
    user: userId, source: 'manual', amount: 249, currency: 'INR',
    date: daysAgo(w * 7 + 2), category: 'Health', merchant: 'Cult.fit',
    rawText: 'Cult.fit weekly gym pass', tags: ['fitness'], confidence: 0.88
  });
}

// ================================
// 3. YEARLY RECURRING CHARGE
//    - only 2 occurrences ~365 days apart, still enough for the detector
//    (billingCycle classification only needs the interval, not a long history)
// ================================
const recurringYearly = [
  { user: userId, source: 'manual', amount: 1499, currency: 'INR', date: daysAgo(370), category: 'Subscriptions', merchant: 'Amazon Prime', rawText: 'Amazon Prime annual membership', tags: ['subscription'], confidence: 0.9 },
  { user: userId, source: 'manual', amount: 1499, currency: 'INR', date: daysAgo(5), category: 'Subscriptions', merchant: 'Amazon Prime', rawText: 'Amazon Prime annual renewal', tags: ['subscription'], confidence: 0.9 }
];

// ================================
// 4. RECENT, CATEGORY-RICH SPENDING (last ~30 days)
//    - this is what the Budget Optimizer compares your recommended budget
//    against, so every benchmark category needs at least one entry here
// ================================
const recentSpending = [
  // Groceries
  { user: userId, source: 'manual', amount: 2200, currency: 'INR', date: daysAgo(3), category: 'Groceries', merchant: 'BigBasket', rawText: 'Weekly grocery order', tags: ['groceries'], confidence: 0.92 },
  { user: userId, source: 'manual', amount: 1850, currency: 'INR', date: daysAgo(11), category: 'Groceries', merchant: 'JioMart', rawText: 'Grocery restock', tags: ['groceries'], confidence: 0.9 },
  { user: userId, source: 'manual', amount: 1600, currency: 'INR', date: daysAgo(19), category: 'Groceries', merchant: 'More Supermarket', rawText: 'Monthly groceries', tags: ['groceries'], confidence: 0.91 },
  { user: userId, source: 'manual', amount: 2050, currency: 'INR', date: daysAgo(27), category: 'Groceries', merchant: 'BigBasket', rawText: 'Grocery order', tags: ['groceries'], confidence: 0.92 },

  // Transportation
  { user: userId, source: 'manual', amount: 620, currency: 'INR', date: daysAgo(4), category: 'Transportation', merchant: 'Indian Oil', rawText: 'Petrol refill', tags: ['fuel'], confidence: 0.91 },
  { user: userId, source: 'manual', amount: 380, currency: 'INR', date: daysAgo(9), category: 'Transportation', merchant: 'Uber', rawText: 'Cab to office', tags: ['commute'], confidence: 0.88 },
  { user: userId, source: 'manual', amount: 540, currency: 'INR', date: daysAgo(16), category: 'Transportation', merchant: 'Indian Oil', rawText: 'Petrol refill', tags: ['fuel'], confidence: 0.91 },

  // Healthcare
  { user: userId, source: 'manual', amount: 850, currency: 'INR', date: daysAgo(14), category: 'Health', merchant: 'Apollo Pharmacy', rawText: 'Medicines', tags: ['health'], confidence: 0.9 },

  // Entertainment & dining
  { user: userId, source: 'manual', amount: 760, currency: 'INR', date: daysAgo(2), category: 'Food', merchant: 'Swiggy', rawText: 'Dinner order', tags: ['meal'], confidence: 0.92 },
  { user: userId, source: 'manual', amount: 1400, currency: 'INR', date: daysAgo(8), category: 'Entertainment', merchant: 'INOX', rawText: 'Movie night', tags: ['entertainment'], confidence: 0.9 },
  { user: userId, source: 'manual', amount: 680, currency: 'INR', date: daysAgo(17), category: 'Food', merchant: 'Zomato', rawText: 'Weekend order', tags: ['meal'], confidence: 0.91 },

  // One-off shopping (non-recurring - should NOT be flagged as a subscription)
  { user: userId, source: 'manual', amount: 2600, currency: 'INR', date: daysAgo(21), category: 'Shopping', merchant: 'Amazon', rawText: 'Bought headphones', tags: ['electronics'], confidence: 0.93 },
];

// ================================
// 5. OLDER ONE-OFF TRANSACTIONS (spread across the last 12 months)
//    - purely for the monthly spending trend chart; not recurring, so
//    these should never show up in subscription detection
// ================================
const olderOneOffs = [
  { user: userId, source: 'manual', amount: 3200, currency: 'INR', date: daysAgo(45), category: 'Travel', merchant: 'Uber', rawText: 'Outstation cab', tags: ['travel'], confidence: 0.94 },
  { user: userId, source: 'manual', amount: 15400, currency: 'INR', date: daysAgo(80), category: 'Travel', merchant: 'IndiGo', rawText: 'Flight to Goa', tags: ['flight'], confidence: 0.95 },
  { user: userId, source: 'manual', amount: 2500, currency: 'INR', date: daysAgo(130), category: 'Shopping', merchant: 'Flipkart', rawText: 'Bought smartwatch', tags: ['gadget'], confidence: 0.94 },
  { user: userId, source: 'manual', amount: 15000, currency: 'INR', date: daysAgo(190), category: 'Health', merchant: 'Apollo Hospital', rawText: 'Medical tests and consultation', tags: ['health'], confidence: 0.95 },
  { user: userId, source: 'manual', amount: 999, currency: 'INR', date: daysAgo(230), category: 'Shopping', merchant: 'Myntra', rawText: 'T-shirt & jeans', tags: ['clothing'], confidence: 0.91 },
  { user: userId, source: 'manual', amount: 4600, currency: 'INR', date: daysAgo(290), category: 'Travel', merchant: 'Redbus', rawText: 'Bus to Manali', tags: ['travel'], confidence: 0.94 },
  { user: userId, source: 'manual', amount: 11200, currency: 'INR', date: daysAgo(350), category: 'Shopping', merchant: 'Croma', rawText: 'Bought new phone', tags: ['electronics'], confidence: 0.96 },
];

const mockTransactions = [
  ...recurringMonthly,
  ...recurringWeekly,
  ...recurringYearly,
  ...recentSpending,
  ...olderOneOffs,
];

// ================================
// 6. OPTIONAL: a manually-entered subscription + a saved budget preference
//    - lets you verify that syncDetectedSubscriptions() never overwrites a
//    subscription the user entered themselves (source: 'manual'), and that
//    the Budget Optimizer pre-fills from a saved preference on first load
// ================================
const seedManualSubscription = {
  user: userId,
  service: 'Netflix',
  merchant: 'Netflix', // must match the transaction merchant string above
  amount: 499,
  currency: 'INR',
  billingCycle: 'monthly',
  category: 'Subscriptions',
  source: 'manual',
  status: 'active',
  userConfirmed: true
};

const seedBudgetPreference = {
  user: userId,
  monthlyIncome: 85000,
  currency: 'INR',
  adults: 2,
  children: 2,
  cityTier: 'metro'
};

const seedData = async () => {
  try {
    await connect(`${process.env.MONGODB_URI}/moneymirror`);

    await Transaction.deleteMany({ user: userId });
    await Transaction.insertMany(mockTransactions);
    console.log(`Seeded ${mockTransactions.length} mock transactions.`);

    await Subscription.deleteMany({ user: userId });
    await Subscription.create(seedManualSubscription);
    console.log('Seeded 1 manual subscription (Netflix) to test manual-vs-detected merge behavior.');

    await BudgetPreference.deleteMany({ user: userId });
    await BudgetPreference.create(seedBudgetPreference);
    console.log('Seeded a budget preference (₹85,000/mo, 2 adults, 2 children, metro).');

    console.log('Mock data seeded.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();