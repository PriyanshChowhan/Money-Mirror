import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gmailMessageId: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    source: {
        type: String,
        enum: ['email', 'manual'],
        default: 'email'
    },
    amount: {
        type: Number,
        required: false
    },
    currency: {
        type: String,
        default: 'INR'
    },
    date: {
        type: Date,
        required: true
    },
    category: {
        type: String
    },  
    merchant: {
        type: String
    },
    rawText: {
        type: String
    },
    tags: {
        type: [String]
    },
    confidence: {
        type: Number
    } 
},
    { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
