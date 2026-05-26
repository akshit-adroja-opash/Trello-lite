import Board from '../models/Board.js';
import Workspace from '../models/Workspace.js';
import Column from '../models/Column.js';
import { generateIndexBetween } from '../utils/fractionalIndex.js';
import { ApiError } from '../utils/apiError.js';

export const createBoard = async (req, res, next) => {
    try {
        const { name, workspaceId, background } = req.body;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        const isMember = workspace.members.some(m => m.user?.toString() === req.user._id.toString());
        if (!isMember) return next(new ApiError(403, 'Not a workspace member'));

        const board = await Board.create({
            name, workspace: workspaceId, Admin: req.user._id, background,
            members: [{ user: req.user._id, role: 'Admin' }]
        });

        // Automatically populate new board with default columns
        const defaultLists = ['Backlog', 'In Progress', 'Code Review', 'Done'];
        let lastOrder = null;
        for (const listName of defaultLists) {
            lastOrder = generateIndexBetween(lastOrder, null);
            await Column.create({
                name: listName,
                board: board._id,
                order: lastOrder
            });
        }

        res.status(201).json({ status: 'success', data: { board } });
    } catch (error) { next(error); }
};

export const getBoards = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const boards = await Board.find({ workspace: workspaceId });
        res.status(200).json({ status: 'success', data: { boards } });
    } catch (error) { next(error); }
};

export const getSingleBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId)
            .populate('workspace', 'name')
            .populate('Admin', 'username email avatar')
            .populate('members.user', 'username email avatar');
        if (!board) return next(new ApiError(404, 'Board not found'));

        const AdminId = board.Admin?._id || board.Admin;
        const isAdmin = AdminId?.toString() === req.user._id.toString();

        let isMember = isAdmin || board.members.some(m => {
            const memberUserId = m.user?._id || m.user;
            return memberUserId && memberUserId.toString() === req.user._id.toString();
        });

        if (!isMember) {
            const workspaceId = board.workspace?._id || board.workspace;
            if (workspaceId) {
                const workspace = await Workspace.findById(workspaceId);
                if (workspace) {
                    isMember = workspace.members.some(m => {
                        const wsUserId = m.user?._id || m.user;
                        return wsUserId && wsUserId.toString() === req.user._id.toString();
                    });
                }
            }
        }

        if (!isMember) {
            return next(new ApiError(403, 'Access denied'));
        }

        res.status(200).json({ status: 'success', data: { board } });
    } catch (error) { next(error); }
};

export const updateBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { name, background } = req.body;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));
        if (board.Admin?.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'project_manager')
            return next(new ApiError(403, 'Only the Admin or System Admin can update this board'));
        if (name) board.name = name;
        if (background) board.background = background;
        await board.save();
        res.status(200).json({ status: 'success', data: { board } });
    } catch (error) { next(error); }
};

export const deleteBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));
        if (board.Admin?.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'project_manager')
            return next(new ApiError(403, 'Only the Admin or System Admin can delete this board'));
        await board.deleteOne();
        res.status(200).json({ status: 'success', message: 'Board deleted' });
    } catch (error) { next(error); }
};

export const getBoardMembers = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId).populate('members.user', 'username email avatar');
        if (!board) return next(new ApiError(404, 'Board not found'));
        res.status(200).json({ status: 'success', data: { members: board.members } });
    } catch (error) { next(error); }
};

export const addBoardMember = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { email, role = 'Editor' } = req.body;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

        const isSystemAdmin = req.user.role === 'admin';
        const workspace = await Workspace.findById(board.workspace);
        const wsMember = workspace?.members.find(m => m.user?.toString() === req.user._id.toString());
        const isWorkspaceAdmin = wsMember?.role === 'admin';

        if (!isSystemAdmin && !isWorkspaceAdmin) {
            return next(new ApiError(403, 'Only Workspace Admins or System Admins can add members'));
        }

        const { default: User } = await import('../models/User.js');
        const invitee = await User.findOne({ email });
        if (!invitee) return next(new ApiError(404, 'User not found'));

        const already = board.members.some(m => m.user?.toString() === invitee._id.toString());
        if (already) return next(new ApiError(400, 'Already a member'));

        board.members.push({ user: invitee._id, role });
        await board.save();
        res.status(200).json({ status: 'success', data: { board } });
    } catch (error) { next(error); }
};

export const updateBoardMemberRole = async (req, res, next) => {
    try {
        const { boardId, memberId } = req.params;
        const { role } = req.body;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

        const isSystemAdmin = req.user.role === 'admin';
        const workspace = await Workspace.findById(board.workspace);
        const wsMember = workspace?.members.find(m => m.user?.toString() === req.user._id.toString());
        const isWorkspaceAdmin = wsMember?.role === 'admin';

        if (!isSystemAdmin && !isWorkspaceAdmin) {
            return next(new ApiError(403, 'Only Workspace Admins or System Admins can change roles'));
        }
        const member = board.members.find(m => m.user?.toString() === memberId);
        if (!member) return next(new ApiError(404, 'Member not found'));
        member.role = role;
        await board.save();
        res.status(200).json({ status: 'success', data: { member } });
    } catch (error) { next(error); }
};

export const removeBoardMember = async (req, res, next) => {
    try {
        const { boardId, memberId } = req.params;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

        const isSystemAdmin = req.user.role === 'admin';
        const workspace = await Workspace.findById(board.workspace);
        const wsMember = workspace?.members.find(m => m.user?.toString() === req.user._id.toString());
        const isWorkspaceAdmin = wsMember?.role === 'admin';

        if (!isSystemAdmin && !isWorkspaceAdmin) {
            return next(new ApiError(403, 'Only Workspace Admins or System Admins can remove members'));
        }

        board.members = board.members.filter(m => m.user?.toString() !== memberId);
        await board.save();
        res.status(200).json({ status: 'success', data: { board } });
    } catch (error) { next(error); }
};

export const toggleStarBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));
        board.isStarred = !board.isStarred;
        await board.save();
        res.status(200).json({ status: 'success', data: { board } });
    } catch (error) { next(error); }
};
