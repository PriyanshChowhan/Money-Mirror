import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    name: String,
    profilePic: String,
    accessToken: String,
    refreshToken: String,
},
    { timestamps: true }
);

export default mongoose.model('User', userSchema);
