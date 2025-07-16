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
    amount: {
        type: Number
    },
    currency: {
        type: String,
        default: 'INR'
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly', 'weekly']
    },
    nextBillingDate: Date,
    lastPaymentDate: Date,
    category: String,
    rawText: String,
},
    { timestamps: true }
);

export default mongoose.model('Subscription', subscriptionSchema);
