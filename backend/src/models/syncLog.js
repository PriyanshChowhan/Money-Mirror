import mongoose from 'mongoose';

const syncLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fetchedAt: {
        type: Date,
        default: Date.now
    },
    messageCount: Number,
    notes: String, 
},
    { timestamps: true }
);

export default mongoose.model('SyncLog', syncLogSchema);
