import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    Admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    background: { type: String, default: '#0079bf' },
    isStarred: { type: Boolean, default: false },
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // admin = Admin, project_manager = Project Manager, developer = Developer, client = Client
        role: { type: String, enum: ['admin', 'project_manager', 'developer', 'client'], default: 'developer' }
    }]
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);
export default Board;
