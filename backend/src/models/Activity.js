import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    card: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
    },
    action: {
        type: String, // e.g., 'created', 'moved', 'commented', 'archived'
        required: true
    },
    details: {
        type: String
    }
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
