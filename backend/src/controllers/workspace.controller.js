import Card from '../models/Card.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { ApiError } from '../utils/apiError.js';
import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';
import { sendNotificationToUser } from '../sockets/user.socket.js';

export const createWorkspace = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        
        // Fetch all users with role 'admin' or 'project_manager' so they are added by default
        const defaultUsers = await User.find({ role: { $in: ['admin', 'project_manager'] } });
        const membersList = defaultUsers.map(u => ({
            user: u._id,
            role: u.role
        }));

        // Ensure the creator is included in case they weren't in that query
        if (!membersList.some(m => m.user.toString() === req.user._id.toString())) {
            membersList.push({ user: req.user._id, role: req.user.role });
        }

        const workspace = await Workspace.create({
            name, description,
            Admin: req.user._id,
            members: membersList
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
        res.status(200).json({ status: 'success', data: { members: workspace.members } });
    } catch (error) { next(error); }
};

export const updateMemberRole = async (req, res, next) => {
    try {
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));

        const isSystemAdmin = req.user.role === 'admin';
        const isWorkspaceAdmin = req.workspaceRole === 'admin';
        const isPM = req.workspaceRole === 'project_manager';

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

        // Cascade delete boards, columns, and cards inside this workspace
        const Board = (await import('../models/Board.js')).default;
        const Column = (await import('../models/Column.js')).default;
        const Card = (await import('../models/Card.js')).default;
        const boards = await Board.find({ workspace: workspaceId }).select('_id');
        const boardIds = boards.map(b => b._id);
        if (boardIds.length > 0) {
            await Card.deleteMany({ board: { $in: boardIds } });
            await Column.deleteMany({ board: { $in: boardIds } });
            await Board.deleteMany({ _id: { $in: boardIds } });
        }

        await workspace.deleteOne();
        res.status(200).json({ status: 'success', message: 'Workspace deleted' });
    } catch (error) {
        next(error);
    }
};
