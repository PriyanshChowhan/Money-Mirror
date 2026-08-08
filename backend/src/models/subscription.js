import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    service: {
        type: String,
        required: true
    },
    merchant: {
        // Raw merchant string from Transaction, used as the dedupe key
        // when auto-syncing detected subscriptions
        type: String,
        index: true
    },
    amount: {
        type: Number
    },
    currency: {
        type: String,
        default: 'INR'
    },
    billingCycle: {
        type: String,
        enum: ['weekly', 'monthly', 'yearly', 'unknown'],
        default: 'unknown'
    },
    nextBillingDate: Date,
    lastPaymentDate: Date,
    category: String,
    rawText: String,

    // --- Auto-detection metadata ---
    source: {
        // 'manual'   -> user added it themselves
        // 'detected' -> created automatically from transaction patterns
        type: String,
        enum: ['manual', 'detected'],
        default: 'manual'
    },
    status: {
        // 'active'   -> still charging on schedule
        // 'lapsed'   -> pattern used to match, hasn't charged recently
        // 'cancelled'-> user marked it cancelled
        type: String,
        enum: ['active', 'lapsed', 'cancelled'],
        default: 'active'
    },
    confidence: {
        // 0-1 score of how sure the detector is this is a real subscription
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    occurrenceCount: {
        // how many matching transactions were used to detect this
        type: Number,
        default: 0
    },
    avgDaysBetween: Number,
    dayOfMonth: Number, // typical billing day, when billingCycle is 'monthly'
    amountVariance: Number, // (max-min)/avg over observed charges
    linkedTransactionIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    userConfirmed: {
        // becomes true once the user has seen + accepted a detected subscription
        type: Boolean,
        default: false
    },
    userDismissed: {
        // user explicitly said "this isn't a subscription" - stop resurfacing it
        type: Boolean,
        default: false
    }
},
    { timestamps: true }
);

// One subscription record per (user, merchant) so re-running detection
// updates the existing doc instead of creating duplicates
subscriptionSchema.index({ user: 1, merchant: 1 }, { unique: true, partialFilterExpression: { merchant: { $type: 'string' } } });

export default mongoose.model('Subscription', subscriptionSchema);