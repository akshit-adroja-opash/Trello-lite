import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        index: true
    },
    userAgent: {
        type: String
    },
    ipAddress: {
        type: String
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
