import mongoose from 'mongoose';

// Stores the inputs a user gives the Budget Optimizer so they don't have
// to re-enter income/household details every time they open Insights.
const budgetPreferenceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    monthlyIncome: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    adults: {
        type: Number,
        default: 2,
        min: 1
    },
    children: {
        type: Number,
        default: 0,
        min: 0
    },
    city: {
        // used to pick a cost-of-living tier: metro / tier2 / tier3
        type: String
    },
    cityTier: {
        type: String,
        enum: ['metro', 'tier2', 'tier3'],
        default: 'metro'
    },
    // Optional per-category overrides, e.g. { groceries: 25 } meaning 25% of income
    // If not provided, the optimizer falls back to built-in benchmark percentages
    customAllocations: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
},
    { timestamps: true }
);

export default mongoose.model('BudgetPreference', budgetPreferenceSchema);