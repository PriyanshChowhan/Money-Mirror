import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getMonthlySpendingSummary = async (Transaction, userId, months = 12) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate },
                amount: { $gt: 0 }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" }
                },
                totalSpent: { $sum: "$amount" },
                transactionCount: { $sum: 1 },
                avgTransaction: { $avg: "$amount" },
                maxTransaction: { $max: "$amount" },
                categories: { $addToSet: "$category" }
            }
        },
        {
            $sort: { "_id.year": 1, "_id.month": 1 }
        },
        {
            $project: {
                _id: 0,
                month: "$_id.month",
                year: "$_id.year",
                totalSpent: { $round: ["$totalSpent", 2] },
                transactionCount: 1,
                avgTransaction: { $round: ["$avgTransaction", 2] },
                maxTransaction: { $round: ["$maxTransaction", 2] },
                uniqueCategories: { $size: "$categories" }
            }
        }
    ]);
};

// Category-wise spending analysis with savings opportunities
const getCategoryAnalysis = async (Transaction, userId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('🔍 Category Analysis Debug:', {
        userId,
        startDate,
        days
    });

    const allTransactions = await Transaction.find({ user: userId }).lean();
    console.log('📊 Total user transactions:', allTransactions.length);
    console.log('📊 Sample transaction:', allTransactions[0]);

    const result = await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate },
                amount: { $gt: 0 },
                category: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: "$category",
                totalSpent: { $sum: "$amount" },
                transactionCount: { $sum: 1 },
                avgAmount: { $avg: "$amount" },
                merchants: { $addToSet: "$merchant" },
                dates: { $push: "$date" }
            }
        },
        {
            $addFields: {
                merchantCount: { $size: "$merchants" },
                firstTransaction: { $min: "$dates" },
                lastTransaction: { $max: "$dates" },
                dailyAverage: { $divide: ["$totalSpent", days] }
            }
        },
        {
            $project: {
                _id: 0,
                category: "$_id",
                totalSpent: { $round: ["$totalSpent", 2] },
                transactionCount: 1,
                avgAmount: { $round: ["$avgAmount", 2] },
                merchantCount: 1,
                dailyAverage: { $round: ["$dailyAverage", 2] },
                firstTransaction: 1,
                lastTransaction: 1
            }
        },
        {
            $sort: { totalSpent: -1 }
        }
    ]);

    console.log('Category analysis result count:', result.length);
    
    return result;
};

// Enhanced merchant analysis for subscription and habit tracking
const getMerchantAnalysis = async (Transaction, userId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('🔍 Merchant Analysis Debug:', {
        userId,
        startDate,
        days
    });

    const result = await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate },
                amount: { $gt: 0 },
                merchant: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: "$merchant",
                totalSpent: { $sum: "$amount" },
                transactionCount: { $sum: 1 },
                avgAmount: { $avg: "$amount" },
                amounts: { $push: "$amount" },
                dates: { $push: "$date" },
                categories: { $addToSet: "$category" }
            }
        },
        {
            $addFields: {
                isRecurring: {
                    $cond: {
                        if: { $gte: ["$transactionCount", 3] },
                        then: true,
                        else: false
                    }
                },
                isSubscription: {
                    $cond: {
                        if: { 
                            $and: [
                                { $gte: ["$transactionCount", 2] },
                                { $lte: [{ $stdDevPop: "$amounts" }, 10] }
                            ]
                        },
                        then: true,
                        else: false
                    }
                },
                daysBetweenTransactions: {
                    $map: {
                        input: { $range: [1, { $size: "$dates" }] },
                        as: "idx",
                        in: {
                            $divide: [
                                {
                                    $subtract: [
                                        { $arrayElemAt: ["$dates", "$$idx"] },
                                        { $arrayElemAt: ["$dates", { $subtract: ["$$idx", 1] }] }
                                    ]
                                },
                                1000 * 60 * 60 * 24
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                merchant: "$_id",
                totalSpent: { $round: ["$totalSpent", 2] },
                transactionCount: 1,
                avgAmount: { $round: ["$avgAmount", 2] },
                isRecurring: 1,
                isSubscription: 1,
                avgDaysBetween: { $round: [{ $avg: "$daysBetweenTransactions" }, 1] },
                categories: 1,
                lastTransaction: { $max: "$dates" },
                consistencyScore: {
                    $cond: {
                        if: { $gt: ["$transactionCount", 1] },
                        then: { $round: [{ $divide: [1, { $add: [{ $stdDevPop: "$amounts" }, 1] }] }, 2] },
                        else: 0
                    }
                }
            }
        },
        {
            $sort: { totalSpent: -1 }
        }
    ]);

    console.log('📊 Merchant analysis result count:', result.length);
    
    return result;
};

// ================================
// 1b. RECURRING SUBSCRIPTION DETECTION (deterministic, no AI)
// ================================
//
// Goal: if a merchant charges the same (or near-same) amount on a
// recognizable cadence - e.g. "₹500 to Netflix roughly every 30 days" -
// flag it as a subscription automatically, without the user ever typing
// it into a form. This runs on raw transaction history and produces a
// confidence score per merchant.
const detectRecurringSubscriptions = async (Transaction, userId, days = 365) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const grouped = await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate },
                amount: { $gt: 0 },
                merchant: { $exists: true, $ne: null, $ne: '' }
            }
        },
        {
            $group: {
                _id: "$merchant",
                amounts: { $push: "$amount" },
                dates: { $push: "$date" },
                ids: { $push: "$_id" },
                categories: { $addToSet: "$category" }
            }
        },
        // need at least 2 charges from the same merchant to even consider it
        { $match: { "amounts.1": { $exists: true } } }
    ]);

    const candidates = [];

    for (const group of grouped) {
        const merchant = group._id;
        const paired = group.dates
            .map((d, i) => ({ date: new Date(d), amount: group.amounts[i], id: group.ids[i] }))
            .sort((a, b) => a.date - b.date);

        const amounts = paired.map(p => p.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const amountVariance = avgAmount > 0
            ? (Math.max(...amounts) - Math.min(...amounts)) / avgAmount
            : 1;

        // Gap in days between each consecutive charge from this merchant
        const intervals = [];
        for (let i = 1; i < paired.length; i++) {
            intervals.push((paired[i].date - paired[i - 1].date) / (1000 * 60 * 60 * 24));
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const intervalSpread = intervals.length ? Math.max(...intervals) - Math.min(...intervals) : 999;

        // Classify the cadence - if it doesn't fit a recognizable pattern
        // (weekly / monthly / yearly) it's probably not a subscription
        let billingCycle = 'unknown';
        if (avgInterval >= 25 && avgInterval <= 35) billingCycle = 'monthly';
        else if (avgInterval >= 5 && avgInterval <= 9) billingCycle = 'weekly';
        else if (avgInterval >= 350 && avgInterval <= 380) billingCycle = 'yearly';
        if (billingCycle === 'unknown') continue;

        // "Same fixed date every month" check
        const daysOfMonth = paired.map(p => p.date.getDate());
        const avgDayOfMonth = daysOfMonth.reduce((a, b) => a + b, 0) / daysOfMonth.length;
        const dayOfMonthSpread = Math.max(...daysOfMonth) - Math.min(...daysOfMonth);

        // Confidence blends: how much history we have, how consistent the
        // amount is, how consistent the interval is, and (for monthly
        // cadences) how consistent the billing day is.
        let confidence = 0;
        confidence += Math.min(paired.length / 4, 1) * 0.35;
        confidence += amountVariance <= 0.02 ? 0.30 : amountVariance <= 0.08 ? 0.15 : 0;
        confidence += intervalSpread <= 3 ? 0.20 : intervalSpread <= 7 ? 0.10 : 0;
        confidence += (billingCycle !== 'monthly' || dayOfMonthSpread <= 3)
            ? 0.15
            : dayOfMonthSpread <= 6 ? 0.07 : 0;
        confidence = Math.round(Math.min(confidence, 1) * 100) / 100;

        if (confidence < 0.4) continue; // too weak a signal yet - wait for more data

        const lastCharge = paired[paired.length - 1];
        const predictedNextBillingDate = new Date(lastCharge.date);
        predictedNextBillingDate.setDate(predictedNextBillingDate.getDate() + Math.round(avgInterval));

        candidates.push({
            merchant,
            avgAmount: Math.round(avgAmount * 100) / 100,
            amountVariance: Math.round(amountVariance * 1000) / 1000,
            occurrenceCount: paired.length,
            avgDaysBetween: Math.round(avgInterval * 10) / 10,
            billingCycle,
            dayOfMonth: billingCycle === 'monthly' ? Math.round(avgDayOfMonth) : null,
            lastPaymentDate: lastCharge.date,
            predictedNextBillingDate,
            confidence,
            category: group.categories.find(Boolean) || null,
            linkedTransactionIds: paired.map(p => p.id)
        });
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);
};

// Upserts detected recurring charges into the Subscription collection so
// they appear automatically - no manual entry required. Manually-created
// subscriptions and anything the user dismissed are left untouched.
const syncDetectedSubscriptions = async (Transaction, Subscription, userId) => {
    const candidates = await detectRecurringSubscriptions(Transaction, userId);
    const result = { created: 0, updated: 0, skipped: 0, candidatesFound: candidates.length };

    for (const c of candidates) {
        const existing = await Subscription.findOne({ user: userId, merchant: c.merchant });

        if (existing && existing.userDismissed) {
            result.skipped += 1;
            continue;
        }

        if (existing && existing.source === 'manual') {
            existing.lastPaymentDate = c.lastPaymentDate;
            existing.nextBillingDate = c.predictedNextBillingDate;
            await existing.save();
            result.updated += 1;
            continue;
        }

        const payload = {
            user: userId,
            service: c.merchant,
            merchant: c.merchant,
            amount: c.avgAmount,
            billingCycle: c.billingCycle,
            nextBillingDate: c.predictedNextBillingDate,
            lastPaymentDate: c.lastPaymentDate,
            category: c.category,
            source: 'detected',
            status: 'active',
            confidence: c.confidence,
            occurrenceCount: c.occurrenceCount,
            avgDaysBetween: c.avgDaysBetween,
            dayOfMonth: c.dayOfMonth,
            amountVariance: c.amountVariance,
            linkedTransactionIds: c.linkedTransactionIds
        };

        if (existing) {
            Object.assign(existing, payload);
            await existing.save();
            result.updated += 1;
        } else {
            await Subscription.create(payload);
            result.created += 1;
        }
    }

    return result;
};

// Raw (non-AI) subscription insight for the /raw/subscriptions endpoint:
// runs detection, syncs it into the DB, then returns a dashboard-ready
// payload - active subscriptions, upcoming renewals, newly detected items
// still awaiting user confirmation, and a monthly/yearly cost rollup.
const getSubscriptionRawInsights = async (Transaction, Subscription, userId) => {
    await syncDetectedSubscriptions(Transaction, Subscription, userId);

    const subscriptions = await Subscription.find({
        user: userId,
        status: { $ne: 'cancelled' },
        userDismissed: { $ne: true }
    }).sort({ nextBillingDate: 1 }).lean();

    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    const upcomingRenewals = subscriptions.filter(s =>
        s.nextBillingDate && new Date(s.nextBillingDate) >= now && new Date(s.nextBillingDate) <= in7Days
    );

    const awaitingConfirmation = subscriptions.filter(s => s.source === 'detected' && !s.userConfirmed);

    const monthlyEquivalent = (s) => {
        if (!s.amount) return 0;
        if (s.billingCycle === 'weekly') return s.amount * 4.33;
        if (s.billingCycle === 'yearly') return s.amount / 12;
        return s.amount;
    };

    const totalMonthlySpend = Math.round(
        subscriptions.reduce((sum, s) => sum + monthlyEquivalent(s), 0) * 100
    ) / 100;

    return {
        subscriptions,
        upcomingRenewals,
        awaitingConfirmation,
        summary: {
            activeCount: subscriptions.length,
            totalMonthlySpend,
            totalYearlySpend: Math.round(totalMonthlySpend * 12 * 100) / 100,
            currency: 'INR'
        }
    };
};

// Lets the user confirm a detected subscription ("yes, this is really a
// subscription") or dismiss it ("no, stop flagging this merchant").
const confirmSubscription = async (Subscription, userId, subscriptionId) => {
    return Subscription.findOneAndUpdate(
        { _id: subscriptionId, user: userId },
        { userConfirmed: true },
        { new: true }
    );
};

const dismissSubscription = async (Subscription, userId, subscriptionId) => {
    return Subscription.findOneAndUpdate(
        { _id: subscriptionId, user: userId },
        { userDismissed: true, status: 'cancelled' },
        { new: true }
    );
};

// Enhanced spending patterns with lifestyle insights
const getSpendingPatterns = async (Transaction, userId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('🔍 Spending Patterns Debug:', {
        userId,
        startDate,
        days
    });

    const result = await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate },
                amount: { $gt: 0 }
            }
        },
        {
            $group: {
                _id: {
                    dayOfWeek: { $dayOfWeek: "$date" },
                    hour: { $hour: "$date" }
                },
                totalSpent: { $sum: "$amount" },
                transactionCount: { $sum: 1 },
                avgAmount: { $avg: "$amount" },
                categories: { $addToSet: "$category" }
            }
        },
        {
            $group: {
                _id: "$_id.dayOfWeek",
                dailyTotal: { $sum: "$totalSpent" },
                dailyCount: { $sum: "$transactionCount" },
                avgDailyAmount: { $avg: "$avgAmount" },
                hourlyBreakdown: {
                    $push: {
                        hour: "$_id.hour",
                        amount: { $round: ["$totalSpent", 2] },
                        count: "$transactionCount",
                        categories: "$categories"
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                dayOfWeek: "$_id",
                dayName: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                            { case: { $eq: ["$_id", 2] }, then: "Monday" },
                            { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                            { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                            { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                            { case: { $eq: ["$_id", 6] }, then: "Friday" },
                            { case: { $eq: ["$_id", 7] }, then: "Saturday" }
                        ],
                        default: "Unknown"
                    }
                },
                totalSpent: { $round: ["$dailyTotal", 2] },
                transactionCount: "$dailyCount",
                avgTransactionAmount: { $round: ["$avgDailyAmount", 2] },
                peakHour: {
                    $arrayElemAt: [
                        "$hourlyBreakdown.hour",
                        {
                            $indexOfArray: [
                                "$hourlyBreakdown.amount",
                                { $max: "$hourlyBreakdown.amount" }
                            ]
                        }
                    ]
                },
                peakHourSpending: { $max: "$hourlyBreakdown.amount" }
            }
        },
        {
            $sort: { dayOfWeek: 1 }
        }
    ]);

    console.log('📊 Spending patterns result count:', result.length);
    
    return result;
};

// Budget performance analysis
const getBudgetPerformance = async (Transaction, userId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const categorySpending = await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate },
                amount: { $gt: 0 }
            }
        },
        {
            $group: {
                _id: "$category",
                totalSpent: { $sum: "$amount" },
                transactionCount: { $sum: 1 },
                avgDailySpending: { $avg: { $divide: ["$amount", days] } }
            }
        },
        {
            $project: {
                _id: 0,
                category: "$_id",
                totalSpent: { $round: ["$totalSpent", 2] },
                transactionCount: 1,
                projectedMonthlySpending: { $round: [{ $multiply: ["$avgDailySpending", 30] }, 2] }
            }
        },
        {
            $sort: { totalSpent: -1 }
        }
    ]);

    return categorySpending;
};

// Enhanced insights data generation
const generateInsightData = async (Transaction, userId) => {
    console.log('🔍 Generating insight data for user:', userId);
    
    const [
        monthlyData,
        categoryData,
        merchantData,
        patternsData,
        budgetData
    ] = await Promise.all([
        getMonthlySpendingSummary(Transaction, userId, 12),
        getCategoryAnalysis(Transaction, userId, 365),
        getMerchantAnalysis(Transaction, userId, 365),
        getSpendingPatterns(Transaction, userId, 365),
        getBudgetPerformance(Transaction, userId, 365)
    ]);

    console.log('📊 Insight Data Summary:', {
        monthlyDataCount: monthlyData.length,
        categoryDataCount: categoryData.length,
        merchantDataCount: merchantData.length,
        patternsDataCount: patternsData.length,
        budgetDataCount: budgetData.length
    });

    return {
        monthlyData,
        categoryData,
        merchantData,
        patternsData,
        budgetData,
        currency: 'INR'
    };
};

// ================================
// 1c. BUDGET OPTIMIZER (deterministic, no AI)
// ================================
//
// Answers: "for my income and household size, how much SHOULD I be
// spending per category, and how does that compare to what I actually
// spend?" Groceries scale with headcount (a family of 4 needs more food
// than a single person on the same income); everything else scales with
// income as a %. All benchmarks are overridable per-user via
// BudgetPreference.customAllocations.
const BUDGET_BENCHMARKS = {
    metro: { groceryPerAdult: 6000, groceryPerChild: 3500, rentPct: 30 },
    tier2: { groceryPerAdult: 4500, groceryPerChild: 2800, rentPct: 25 },
    tier3: { groceryPerAdult: 3500, groceryPerChild: 2200, rentPct: 20 }
};

// % of monthly income for categories that scale with earnings rather than
// household size
const INCOME_PCT_BENCHMARKS = {
    utilities: 5,
    transportation: 8,
    healthcare: 5,
    education: 8, // only applied when the household has children
    entertainment: 5,
    subscriptions: 3,
    savings: 20
};

// Free-text keywords used to match a user's real transaction categories to
// our benchmark buckets, so "actual" spend can be compared to "recommended"
const CATEGORY_KEYWORD_MAP = {
    groceries: ['grocery', 'groceries', 'supermarket'],
    rent: ['rent', 'housing', 'mortgage'],
    utilities: ['utility', 'utilities', 'electricity', 'water bill', 'gas bill', 'broadband', 'internet'],
    transportation: ['transport', 'fuel', 'petrol', 'diesel', 'cab', 'uber', 'ola', 'metro', 'commute'],
    healthcare: ['health', 'medical', 'pharmacy', 'doctor', 'hospital'],
    education: ['education', 'school', 'tuition', 'childcare', 'daycare'],
    entertainment: ['entertainment', 'dining', 'restaurant', 'movies', 'ott', 'leisure'],
    subscriptions: ['subscription', 'subscriptions'],
    savings: ['savings', 'investment', 'sip', 'mutual fund']
};

const matchActualSpend = (categoryData, keywords) => {
    if (!keywords || !keywords.length) return 0;
    return categoryData
        .filter(c => keywords.some(k => (c.category || '').toLowerCase().includes(k)))
        .reduce((sum, c) => sum + (c.totalSpent || 0), 0);
};

// Core optimizer: given income + household composition (+ optional real
// category spend), produce a recommended monthly budget per category and
// flag whether the user is over/under/on-track against it.
const getBudgetOptimizerRecommendation = ({
    monthlyIncome,
    adults = 2,
    children = 0,
    cityTier = 'metro',
    customAllocations = {},
    categoryData = []
}) => {
    if (!monthlyIncome || monthlyIncome <= 0) {
        throw new Error('monthlyIncome must be a positive number');
    }

    const benchmark = BUDGET_BENCHMARKS[cityTier] || BUDGET_BENCHMARKS.metro;

    // Groceries scale with headcount, capped at 30% of income so it stays
    // sane for lower incomes with larger families
    const groceryRaw = adults * benchmark.groceryPerAdult + children * benchmark.groceryPerChild;
    const groceryRecommended = Math.min(groceryRaw, monthlyIncome * 0.30);

    const pctAmount = (key, fallbackPct) => {
        const p = customAllocations[key] !== undefined ? customAllocations[key] : fallbackPct;
        return Math.round(monthlyIncome * (p / 100) * 100) / 100;
    };
    const pctLabel = (key, fallbackPct) => customAllocations[key] !== undefined ? customAllocations[key] : fallbackPct;

    const recommendations = {
        groceries: {
            recommended: Math.round(groceryRecommended),
            basis: `₹${benchmark.groceryPerAdult}/adult + ₹${benchmark.groceryPerChild}/child (${cityTier} benchmark)`,
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.groceries)
        },
        rent: {
            recommended: pctAmount('rent', benchmark.rentPct),
            basis: `${pctLabel('rent', benchmark.rentPct)}% of income`,
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.rent)
        },
        utilities: {
            recommended: pctAmount('utilities', INCOME_PCT_BENCHMARKS.utilities),
            basis: `${pctLabel('utilities', INCOME_PCT_BENCHMARKS.utilities)}% of income`,
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.utilities)
        },
        transportation: {
            recommended: pctAmount('transportation', INCOME_PCT_BENCHMARKS.transportation),
            basis: `${pctLabel('transportation', INCOME_PCT_BENCHMARKS.transportation)}% of income`,
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.transportation)
        },
        healthcare: {
            recommended: pctAmount('healthcare', INCOME_PCT_BENCHMARKS.healthcare),
            basis: `${pctLabel('healthcare', INCOME_PCT_BENCHMARKS.healthcare)}% of income`,
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.healthcare)
        },
        education: {
            recommended: children > 0 ? pctAmount('education', INCOME_PCT_BENCHMARKS.education) : 0,
            basis: children > 0 ? `${pctLabel('education', INCOME_PCT_BENCHMARKS.education)}% of income` : 'no children in household',
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.education)
        },
        entertainment: {
            recommended: pctAmount('entertainment', INCOME_PCT_BENCHMARKS.entertainment),
            basis: `${pctLabel('entertainment', INCOME_PCT_BENCHMARKS.entertainment)}% of income`,
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.entertainment)
        },
        subscriptions: {
            recommended: pctAmount('subscriptions', INCOME_PCT_BENCHMARKS.subscriptions),
            basis: `${pctLabel('subscriptions', INCOME_PCT_BENCHMARKS.subscriptions)}% of income`,
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.subscriptions)
        },
        savings: {
            recommended: pctAmount('savings', INCOME_PCT_BENCHMARKS.savings),
            basis: `${pctLabel('savings', INCOME_PCT_BENCHMARKS.savings)}% of income`,
            actual: matchActualSpend(categoryData, CATEGORY_KEYWORD_MAP.savings)
        }
    };

    for (const val of Object.values(recommendations)) {
        if (!val.recommended) { val.status = 'n/a'; continue; }
        const diffPct = ((val.actual - val.recommended) / val.recommended) * 100;
        val.diffPct = Math.round(diffPct);
        if (diffPct > 15) {
            val.status = 'over_budget';
            val.message = `Spending ₹${Math.round(val.actual - val.recommended).toLocaleString('en-IN')} more than the benchmark`;
        } else if (diffPct < -15) {
            val.status = 'under_budget';
            val.message = `₹${Math.round(val.recommended - val.actual).toLocaleString('en-IN')} of headroom left in this category`;
        } else {
            val.status = 'on_track';
            val.message = `Within a healthy range of the ₹${Math.round(val.recommended).toLocaleString('en-IN')} benchmark`;
        }
    }

    const totalRecommended = Object.values(recommendations).reduce((s, v) => s + v.recommended, 0);
    const totalActual = Object.values(recommendations).reduce((s, v) => s + v.actual, 0);

    return {
        inputs: { monthlyIncome, adults, children, cityTier },
        recommendations,
        summary: {
            totalRecommended: Math.round(totalRecommended),
            totalActual: Math.round(totalActual),
            unallocated: Math.round(monthlyIncome - totalRecommended),
            currency: 'INR'
        }
    };
};

// Convenience wrapper: pulls real category spend for the user, merges it
// with saved (or ad-hoc) BudgetPreference inputs, and returns the full
// optimizer result - this is what the /budget-optimizer route calls.
const getBudgetOptimizerForUser = async (Transaction, userId, { monthlyIncome, adults, children, cityTier, customAllocations }) => {
    const categoryData = await getCategoryAnalysis(Transaction, userId, 30);
    return getBudgetOptimizerRecommendation({
        monthlyIncome,
        adults,
        children,
        cityTier,
        customAllocations,
        categoryData
    });
};

// ================================
// 2. ENHANCED LLM INSIGHT GENERATOR
// ================================

// Initialize Gemini AI model
const initializeGeminiModel = (geminiApiKey) => {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

// Enhanced insight parser with action items
const parseInsightResponse = (responseText) => {
    try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return [{
            type: "general",
            title: "Financial Insight",
            message: responseText.trim(),
            severity: "low",
            actionItems: [],
            category: "general"
        }];
    } catch (error) {
        console.error('Error parsing insight response:', error);
        return [{
            type: "error",
            title: "Analysis Unavailable",
            message: "We're working on analyzing your spending patterns. Please check back soon!",
            severity: "low",
            actionItems: [],
            category: "system"
        }];
    }
};

// Generate actionable spending insights
const generateActionableSpendingInsights = async (model, data) => {
    const currentMonth = data.monthlyData[data.monthlyData.length - 1];
    const previousMonth = data.monthlyData[data.monthlyData.length - 2];
    
    const prompt = `
You are a supportive financial advisor for PayWatch users. Generate 3-4 positive, actionable insights about spending patterns.

Current Month: ${JSON.stringify(currentMonth)}
Previous Month: ${JSON.stringify(previousMonth)}
Monthly Trend: ${JSON.stringify(data.monthlyData.slice(-3))}
Currency: ${data.currency}

IMPORTANT: Always frame insights positively and focus on empowering users to make better financial decisions.

For each insight, provide:
1. A positive observation or trend
2. 2-3 specific actionable recommendations
3. Encouragement and support

Focus areas:
- Spending growth opportunities and smart habits
- Transaction pattern optimizations
- Budget allocation improvements
- Financial goal achievement strategies

Format as JSON array with this structure:
[
  {
    "type": "spending_trend",
    "title": "Your Spending Momentum",
    "message": "Positive message about their spending pattern",
    "severity": "low|medium|high",
    "actionItems": [
      "Specific actionable step 1",
      "Specific actionable step 2",
      "Specific actionable step 3"
    ],
    "category": "budgeting",
    "impact": "high|medium|low",
    "timeframe": "immediate|short_term|long_term"
  }
]

Keep tone encouraging, specific, and actionable. Focus on growth and optimization rather than restrictions.
`;

    const result = await model.generateContent(prompt);
    return parseInsightResponse(result.response.text());
};

// Generate smart category optimization insights
const generateCategoryOptimizationInsights = async (model, data) => {
    const prompt = `
You are a financial optimization specialist for PayWatch. Generate 3-4 smart category insights that help users optimize their spending.

Category Analysis: ${JSON.stringify(data.categoryData)}
Budget Performance: ${JSON.stringify(data.budgetData)}
Currency: ${data.currency}

FOCUS ON: Helping users make smarter spending decisions in each category.

For each category insight:
1. Highlight smart spending patterns they're already doing
2. Suggest optimization opportunities
3. Provide specific tactics to maximize value

Categories to analyze:
- Food & Dining: meal planning, bulk buying, restaurant choices
- Entertainment: value subscriptions, experiences vs things
- Shopping: timing purchases, finding deals, quality investments
- Transportation: cost-effective options, planning routes
- Bills & Utilities: optimization opportunities, switching providers

Format as JSON array:
[
  {
    "type": "category_optimization",
    "title": "Smart Category Spending",
    "message": "Positive insight about their category spending",
    "severity": "low|medium|high",
    "actionItems": [
      "Specific optimization tactic 1",
      "Specific optimization tactic 2",
      "Specific optimization tactic 3"
    ],
    "category": "category_name",
    "impact": "high|medium|low",
    "timeframe": "immediate|short_term|long_term",
    "potentialSavings": "estimated monthly savings amount"
  }
]

Emphasize smart optimization over restriction. Focus on value and quality of life.
`;

    const result = await model.generateContent(prompt);
    return parseInsightResponse(result.response.text());
};

// Generate subscription and recurring payment insights
const generateSubscriptionInsights = async (model, data) => {
    const subscriptions = data.merchantData.filter(m => m.isSubscription || m.isRecurring);
    
    const prompt = `
You are a subscription optimization expert for PayWatch. Generate 2-3 insights about subscription management and recurring payments.

Subscription Data: ${JSON.stringify(subscriptions)}
All Merchants: ${JSON.stringify(data.merchantData.slice(0, 10))}
Currency: ${data.currency}

FOCUS ON: Helping users maximize value from their subscriptions and recurring payments.

For each insight:
1. Celebrate smart subscription choices they're making
2. Identify optimization opportunities
3. Suggest subscription management strategies

Areas to cover:
- Subscription portfolio optimization
- Seasonal subscription management
- Family/group subscription opportunities
- Usage-based subscription evaluation
- Bundling vs individual service decisions

Format as JSON array:
[
  {
    "type": "subscription_optimization",
    "title": "Subscription Strategy",
    "message": "Positive insight about their subscription management",
    "severity": "low|medium|high",
    "actionItems": [
      "Specific subscription action 1",
      "Specific subscription action 2",
      "Specific subscription action 3"
    ],
    "category": "subscriptions",
    "impact": "high|medium|low",
    "timeframe": "immediate|short_term|long_term",
    "potentialSavings": "estimated monthly savings amount"
  }
]

Focus on value optimization and smart subscription strategies, not just cancellation.
`;

    const result = await model.generateContent(prompt);
    return parseInsightResponse(result.response.text());
};

// Generate lifestyle and habit insights
const generateLifestyleInsights = async (model, data) => {
    const prompt = `
You are a lifestyle financial coach for PayWatch. Generate 2-3 insights about spending habits and lifestyle patterns.

Spending Patterns: ${JSON.stringify(data.patternsData)}
Category Data: ${JSON.stringify(data.categoryData.slice(0, 5))}
Currency: ${data.currency}

FOCUS ON: Helping users align their spending with their lifestyle goals and values.

For each insight:
1. Recognize positive spending habits they've developed
2. Identify lifestyle-aligned opportunities
3. Suggest habit improvements that enhance life quality

Areas to explore:
- Time-based spending optimization (weekend vs weekday)
- Seasonal spending adjustments
- Work-life balance through spending
- Health and wellness investment opportunities
- Social spending optimization
- Productivity and efficiency spending

Format as JSON array:
[
  {
    "type": "lifestyle_optimization",
    "title": "Lifestyle Alignment",
    "message": "Positive insight about their lifestyle spending",
    "severity": "low|medium|high",
    "actionItems": [
      "Specific lifestyle improvement 1",
      "Specific lifestyle improvement 2",
      "Specific lifestyle improvement 3"
    ],
    "category": "lifestyle",
    "impact": "high|medium|low",
    "timeframe": "immediate|short_term|long_term",
    "lifeQualityImpact": "high|medium|low"
  }
]

Focus on enhancing life quality through smart spending, not just saving money.
`;

    const result = await model.generateContent(prompt);
    return parseInsightResponse(result.response.text());
};

// Generate comprehensive actionable insights
const generateComprehensiveInsights = async (Transaction, userId, geminiApiKey) => {
    try {
        const model = initializeGeminiModel(geminiApiKey);
        const data = await generateInsightData(Transaction, userId);

        const [
            spendingInsights,
            categoryInsights,
            subscriptionInsights,
            lifestyleInsights
        ] = await Promise.all([
            generateActionableSpendingInsights(model, data),
            generateCategoryOptimizationInsights(model, data),
            generateSubscriptionInsights(model, data),
            generateLifestyleInsights(model, data)
        ]);

        // Combine all insights and add priority scoring
        const allInsights = [
            ...spendingInsights,
            ...categoryInsights,
            ...subscriptionInsights,
            ...lifestyleInsights
        ].map(insight => ({
            ...insight,
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            priority: calculateInsightPriority(insight),
            isNew: true,
            createdAt: new Date().toISOString()
        }));

        return {
            success: true,
            insights: {
                featured: allInsights.filter(i => i.priority === 'high').slice(0, 3),
                spending: spendingInsights,
                categories: categoryInsights,
                subscriptions: subscriptionInsights,
                lifestyle: lifestyleInsights,
                all: allInsights.sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                userId: userId,
                dataRange: '30-60 days',
                totalInsights: allInsights.length,
                actionableItems: allInsights.reduce((sum, insight) => sum + (insight.actionItems?.length || 0), 0)
            },
            rawData: data
        };
    } catch (error) {
        console.error('Error generating comprehensive insights:', error);
        return {
            success: false,
            error: error.message,
            insights: null
        };
    }
};

// Calculate insight priority based on impact and urgency
const calculateInsightPriority = (insight) => {
    const impactScore = insight.impact === 'high' ? 3 : insight.impact === 'medium' ? 2 : 1;
    const urgencyScore = insight.timeframe === 'immediate' ? 3 : insight.timeframe === 'short_term' ? 2 : 1;
    const severityScore = insight.severity === 'high' ? 3 : insight.severity === 'medium' ? 2 : 1;
    
    const totalScore = impactScore + urgencyScore + severityScore;
    
    if (totalScore >= 8) return 'high';
    if (totalScore >= 6) return 'medium';
    return 'low';
};

// ================================
// 3. ENHANCED SERVICE FUNCTIONS
// ================================

// Main function to generate comprehensive user insights
const generateUserInsights = async (Transaction, userId, geminiApiKey) => {
    return await generateComprehensiveInsights(Transaction, userId, geminiApiKey);
};

// Get enhanced aggregated data for dashboard
const getUserAggregatedData = async (Transaction, userId) => {
    return await generateInsightData(Transaction, userId);
};

// Generate quick daily insights
const generateDailyInsights = async (Transaction, userId, geminiApiKey) => {
    try {
        const model = initializeGeminiModel(geminiApiKey);
        const data = await generateInsightData(Transaction, userId);
        
        const prompt = `
Generate 1-2 quick daily financial insights for a PayWatch user.

Recent Data: ${JSON.stringify(data.categoryData.slice(0, 3))}
Today's Focus: Smart spending decisions and daily optimization

Keep insights short, actionable, and encouraging. Focus on today's opportunities.

Format as JSON array with title, message, and 1-2 actionItems.
`;

        const result = await model.generateContent(prompt);
        const insights = parseInsightResponse(result.response.text());
        
        return {
            success: true,
            insights: insights.map(insight => ({
                ...insight,
                type: 'daily_insight',
                priority: 'medium',
                isDaily: true
            }))
        };
    } catch (error) {
        console.error('Error generating daily insights:', error);
        return {
            success: false,
            error: error.message,
            insights: []
        };
    }
};

// ================================
// 4. ENHANCED ROUTE HANDLER
// ================================

const handleGenerateInsights = async (req, res) => {
    try {
        const { userId } = req.user;
        const { type = 'comprehensive' } = req.query;
        const Transaction = req.app.get('Transaction');
        const geminiApiKey = process.env.GEMINI_API_KEY;

        let insights;
        
        switch (type) {
            case 'daily':
                insights = await generateDailyInsights(Transaction, userId, geminiApiKey);
                break;
            case 'comprehensive':
            default:
                insights = await generateUserInsights(Transaction, userId, geminiApiKey);
                break;
        }

        if (insights.success) {
            res.json({
                success: true,
                data: insights,
                message: 'Insights generated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: insights.error,
                message: 'Failed to generate insights'
            });
        }
    } catch (error) {
        console.error('Insight generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to generate insights'
        });
    }
};

// ================================
// 5. EXPORTS
// ================================

export {
    // Enhanced aggregation functions
    getMonthlySpendingSummary,
    getCategoryAnalysis,
    getMerchantAnalysis,
    getSpendingPatterns,
    getBudgetPerformance,
    generateInsightData,

    // Recurring subscription detection (deterministic, no AI)
    detectRecurringSubscriptions,
    syncDetectedSubscriptions,
    getSubscriptionRawInsights,
    confirmSubscription,
    dismissSubscription,

    // Budget optimizer (deterministic, no AI)
    getBudgetOptimizerRecommendation,
    getBudgetOptimizerForUser,

    // Enhanced LLM functions
    initializeGeminiModel,
    parseInsightResponse,
    generateActionableSpendingInsights,
    generateCategoryOptimizationInsights,
    generateSubscriptionInsights,
    generateLifestyleInsights,
    generateComprehensiveInsights,
    calculateInsightPriority,

    // Enhanced service functions
    generateUserInsights,
    getUserAggregatedData,
    generateDailyInsights,

    // Enhanced route handler
    handleGenerateInsights
};

export default handleGenerateInsights;