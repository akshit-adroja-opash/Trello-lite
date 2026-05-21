import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema({
    text: { type: String, required: true },
    done: { type: Boolean, default: false }
}, { _id: true });

const cardSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    column: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    order: { type: String, required: true },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    labels: [{ name: String, color: String }],
    dueDate: { type: Date },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    checklist: [checklistItemSchema],
    version: { type: Number, default: 0 }
}, { timestamps: true });

const Card = mongoose.model('Card', cardSchema);
export default Card;
