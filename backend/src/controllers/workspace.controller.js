import Card from '../models/Card.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { ApiError } from '../utils/apiError.js';
import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';
import { sendNotificationToUser } from '../sockets/user.socket.js';

export const createWorkspace = async (req, res, next) => {
    try {
        // Only Admin and Project Manager can create workspaces
        if (req.user.role === 'developer') {
            return next(new ApiError(403, 'Developers cannot create workspaces'));
        }
        const { name, description } = req.body;
        const workspace = await Workspace.create({
            name, description,
            Admin: req.user._id,
            members: [{ user: req.user._id, role: req.user.role }]
        });
        const populated = await Workspace.findById(workspace._id).populate('members.user', 'username email avatar role');
        res.status(201).json({ status: 'success', data: { workspace: populated } });
    } catch (error) { next(error); }
};

export const getWorkspaces = async (req, res, next) => {
    try {
        const workspaces = await Workspace.find({ 'members.user': req.user._id })
            .populate('members.user', 'username email avatar role');
        res.status(200).json({ status: 'success', data: { workspaces } });
    } catch (error) { next(error); }
};

export const inviteMember = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const { email, role = 'client' } = req.body;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        if (workspace.Admin?.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'project_manager')
            return next(new ApiError(403, 'Only the Admin or System Admin can invite members'));

        const invitee = await User.findOne({ email });
        if (!invitee) return next(new ApiError(404, 'User with that email not found'));

        const alreadyMember = workspace.members.some(m => m.user?.toString() === invitee._id.toString());
        if (alreadyMember) return next(new ApiError(400, 'User is already a member'));

        workspace.members.push({ user: invitee._id, role });
        await workspace.save();

        // Create and send notification to invitee
        try {
            const notif = await Notification.create({
                recipient: invitee._id,
                sender: req.user._id,
                type: 'WORKSPACE_INVITE',
                message: `You have been invited to workspace "${workspace.name}" by ${req.user.username || 'Admin'}`,
                relatedEntity: workspace._id,
                entityModel: 'Workspace'
            });

            const io = getIO();
            sendNotificationToUser(io, invitee._id, notif);
        } catch (err) {
            console.error('Failed to create/send invite notification:', err.message);
        }

        const populated = await Workspace.findById(workspace._id).populate('members.user', 'username email avatar role');
        res.status(200).json({ status: 'success', data: { workspace: populated } });
    } catch (error) { next(error); }
};

export const getMembers = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId).populate('members.user', 'username email avatar role');
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        if (!workspace.members.some(m => m.user?._id?.toString() === req.user._id.toString()))
            return next(new ApiError(403, 'Not a member of this workspace'));
        res.status(200).json({ status: 'success', data: { members: workspace.members } });
    } catch (error) { next(error); }
};

export const updateMemberRole = async (req, res, next) => {
    try {
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));

        const userMember = workspace.members.find(m => m.user?.toString() === req.user._id.toString());
        const isWorkspaceOwner = workspace.Admin?.toString() === req.user._id.toString();
        const isWorkspaceAdmin = (userMember && userMember.role === 'admin') || isWorkspaceOwner;
        const isSystemAdmin = req.user.role === 'admin';
        const isPM = req.user.role === 'project_manager' || (userMember && userMember.role === 'project_manager') || isWorkspaceOwner;

        if (!isWorkspaceAdmin && !isSystemAdmin && !isPM) {
            return next(new ApiError(403, 'Unauthorized to update member roles'));
        }

        const member = workspace.members.id(memberId);
        if (!member) return next(new ApiError(404, 'Member not found'));

        // PM restriction: cannot assign admin role, and cannot modify existing admin members
        if (!isWorkspaceAdmin && !isSystemAdmin && isPM) {
            if (role === 'admin') {
                return next(new ApiError(403, 'Project Managers cannot assign Admin privileges'));
            }
            if (member.role === 'admin') {
                return next(new ApiError(403, 'Project Managers cannot modify Admin member roles'));
            }
        }

        member.role = role;
        await workspace.save();
        res.status(200).json({ status: 'success', data: { member } });
    } catch (error) { next(error); }
};

export const removeMember = async (req, res, next) => {
    try {
        const { workspaceId, memberId } = req.params;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        
        const userMember = workspace.members.find(m => m.user?.toString() === req.user._id.toString());
        const isWorkspaceOwner = workspace.Admin?.toString() === req.user._id.toString();
        const isWorkspaceAdmin = (userMember && userMember.role === 'admin') || isWorkspaceOwner;
        const isSystemAdmin = req.user.role === 'admin';

        if (!isWorkspaceAdmin && !isSystemAdmin) {
            return next(new ApiError(403, 'Only Workspace Admins or System Admins can remove members'));
        }
        
        // Find the user ID of the member being removed before pulling from array
        const memberSub = workspace.members.id(memberId);
        if (!memberSub) return next(new ApiError(404, 'Member not found'));
        const removedUserId = memberSub.user;

        workspace.members.pull({ _id: memberId });
        await workspace.save();

        // Create and send notification to removed member
        try {
            const notif = await Notification.create({
                recipient: removedUserId,
                sender: req.user._id,
                type: 'WORKSPACE_REMOVE',
                message: `You have been removed from workspace "${workspace.name}" by ${req.user.username || 'Admin'}`,
                relatedEntity: workspace._id,
                entityModel: 'Workspace'
            });

            const io = getIO();
            sendNotificationToUser(io, removedUserId, notif);
        } catch (err) {
            console.error('Failed to create/send remove notification:', err.message);
        }

        res.status(200).json({ status: 'success', message: 'Member removed' });
    } catch (error) { next(error); }
};

export const updateWorkspace = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const { name, description } = req.body;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        
        const userMember = workspace.members.find(m => m.user?.toString() === req.user._id.toString());
        const isWorkspaceOwner = workspace.Admin?.toString() === req.user._id.toString();
        const isWorkspaceAdmin = (userMember && userMember.role === 'admin') || isWorkspaceOwner;
        const isSystemAdmin = req.user.role === 'admin';

        if (!isWorkspaceAdmin && !isSystemAdmin) {
            return next(new ApiError(403, 'Only Workspace Admins or System Admins can update this workspace'));
        }

        if (name) workspace.name = name;
        if (description !== undefined) workspace.description = description;
        await workspace.save();
        const populated = await Workspace.findById(workspace._id).populate('members.user', 'username email avatar role');
        res.status(200).json({ status: 'success', data: { workspace: populated } });
    } catch (error) { next(error); }
};

export const getOverdueCount = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        const isMember = workspace.members.some(m => m.user?.toString() === req.user._id.toString());
        if (!isMember) return next(new ApiError(403, 'Access denied'));

        // Find boards in workspace
        const Board = (await import('../models/Board.js')).default;
        const boards = await Board.find({ workspace: workspaceId }).select('_id');
        const boardIds = boards.map(b => b._id);
        // Count overdue cards
        const now = new Date();
        const count = await Card.countDocuments({ board: { $in: boardIds }, dueDate: { $lt: now } });
        res.status(200).json({ status: 'success', data: { overdueCount: count } });
    } catch (err) {
        next(err);
    }
};

export const deleteWorkspace = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        
        const userMember = workspace.members.find(m => m.user?.toString() === req.user._id.toString());
        const isWorkspaceOwner = workspace.Admin?.toString() === req.user._id.toString();
        const isWorkspaceAdmin = (userMember && userMember.role === 'admin') || isWorkspaceOwner;
        const isSystemAdmin = req.user.role === 'admin';

        if (!isWorkspaceAdmin && !isSystemAdmin) {
            return next(new ApiError(403, 'Only Workspace Admins or System Admins can delete this workspace'));
        }

        await workspace.deleteOne();
        res.status(200).json({ status: 'success', message: 'Workspace deleted' });
    } catch (error) {
        next(error);
    }
};
