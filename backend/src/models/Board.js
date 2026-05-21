import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    background: { type: String, default: '#0079bf' },
    isStarred: { type: Boolean, default: false },
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // Owner = Admin, Admin = Project Manager, Editor = Developer, Viewer = Client
        role: { type: String, enum: ['Owner', 'Admin', 'Editor', 'Viewer'], default: 'Editor' }
    }]
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);
export default Board;
