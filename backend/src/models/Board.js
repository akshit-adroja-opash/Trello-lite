import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    background: {
        type: String, // Color or URL
        default: '#0079bf'
    },
    isStarred: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);
export default Board;
