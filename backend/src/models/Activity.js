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
        type: String,
        required: true
    },
    details: {
        type: String
    },
    target: {
        type: String,
        required: true ,
    }
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
