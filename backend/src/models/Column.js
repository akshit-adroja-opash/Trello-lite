import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    order: {
        type: String, // Fractional index
        required: true
    }
}, { timestamps: true });

const Column = mongoose.model('Column', columnSchema);
export default Column;
