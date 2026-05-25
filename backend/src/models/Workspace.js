import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    Admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        // admin = Admin, project_manager = Project Manager, developer = Developer, client = Client
        role: {
            type: String,
            enum: ['admin', 'project_manager', 'developer', 'client'],
            default: 'client'
        }
    }]
}, { timestamps: true });

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
