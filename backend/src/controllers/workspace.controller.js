import Card from '../models/Card.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { ApiError } from '../utils/apiError.js';

export const createWorkspace = async (req, res, next) => {
    try {
        // Only Admin and Project Manager can create workspaces
        if (req.user.role === 'developer') {
            return next(new ApiError(403, 'Developers cannot create workspaces'));
        }
        const { name, description } = req.body;
        const workspace = await Workspace.create({
            name, description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'admin' }]
        });
        res.status(201).json({ status: 'success', data: { workspace } });
    } catch (error) { next(error); }
};

export const getWorkspaces = async (req, res, next) => {
    try {
        const workspaces = await Workspace.find({ 'members.user': req.user._id })
            .populate('members.user', 'username email avatar');
        res.status(200).json({ status: 'success', data: { workspaces } });
    } catch (error) { next(error); }
};

export const inviteMember = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const { email, role = 'viewer' } = req.body;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        if (workspace.owner.toString() !== req.user._id.toString())
            return next(new ApiError(403, 'Only the owner can invite members'));

        const invitee = await User.findOne({ email });
        if (!invitee) return next(new ApiError(404, 'User with that email not found'));

        const alreadyMember = workspace.members.some(m => m.user.toString() === invitee._id.toString());
        if (alreadyMember) return next(new ApiError(400, 'User is already a member'));

        workspace.members.push({ user: invitee._id, role });
        await workspace.save();

        res.status(200).json({ status: 'success', data: { workspace } });
    } catch (error) { next(error); }
};

export const getMembers = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId).populate('members.user', 'username email avatar');
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        if (!workspace.members.some(m => m.user._id.toString() === req.user._id.toString()))
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
        if (workspace.owner.toString() !== req.user._id.toString())
            return next(new ApiError(403, 'Only the owner can change roles'));
        const member = workspace.members.id(memberId);
        if (!member) return next(new ApiError(404, 'Member not found'));
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
        if (workspace.owner.toString() !== req.user._id.toString())
            return next(new ApiError(403, 'Only the owner can remove members'));
        workspace.members.pull({ _id: memberId });
        await workspace.save();
        res.status(200).json({ status: 'success', message: 'Member removed' });
    } catch (error) { next(error); }
};

export const updateWorkspace = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const { name, description } = req.body;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        if (workspace.owner.toString() !== req.user._id.toString())
            return next(new ApiError(403, 'Only the owner can update this workspace'));
        if (name) workspace.name = name;
        if (description !== undefined) workspace.description = description;
        await workspace.save();
        res.status(200).json({ status: 'success', data: { workspace } });
    } catch (error) { next(error); }
};

export const getOverdueCount = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return next(new ApiError(404, 'Workspace not found'));
    const isMember = workspace.members.some(m => m.user.toString() === req.user._id.toString());
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
    if (workspace.owner.toString() !== req.user._id.toString())
      return next(new ApiError(403, 'Only the owner can delete this workspace'));
    await workspace.deleteOne();
    res.status(200).json({ status: 'success', message: 'Workspace deleted' });
  } catch (error) {
    next(error);
  }
};
