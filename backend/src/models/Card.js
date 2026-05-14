import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    column: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Column',
        required: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    order: {
        type: String, // Fractional index
        required: true
    },
    assignees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    labels: [{
        name: String,
        color: String
    }],
    dueDate: {
        type: Date
    },
    attachments: [{
        name: String,
        url: String,
        fileType: String
    }]
}, { timestamps: true });

const Card = mongoose.model('Card', cardSchema);
export default Card;
