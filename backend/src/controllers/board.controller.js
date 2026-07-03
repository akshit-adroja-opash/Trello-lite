import Board from '../models/Board.js';
import Workspace from '../models/Workspace.js';
import Column from '../models/Column.js';
import { generateIndexBetween } from '../utils/fractionalIndex.js';
import { ApiError } from '../utils/apiError.js';

const formatBoard = (board, userId) => {
    if (!board) return null;
    const boardObj = board.toObject ? board.toObject() : board;
    const starredBy = boardObj.starredBy || [];
    boardObj.isStarred = starredBy.some(id => id?.toString() === userId?.toString());
    return boardObj;
};

const formatBoards = (boards, userId) => {
    if (!boards) return [];
    return boards.map(b => formatBoard(b, userId));
};

export const createBoard = async (req, res, next) => {
    try {
        const { name, workspaceId, background } = req.body;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));
        const isMember = workspace.members.some(m => m.user?.toString() === req.user._id.toString());
        if (!isMember) return next(new ApiError(403, 'Not a workspace member'));

        // Include all admins and project_managers from the workspace as default board members
        const defaultBoardMembers = workspace.members
            .filter(m => m.role === 'admin' || m.role === 'project_manager')
            .map(m => ({ user: m.user, role: m.role }));

        if (!defaultBoardMembers.some(m => m.user?.toString() === req.user._id.toString())) {
            defaultBoardMembers.push({ user: req.user._id, role: req.user.role });
        }

        const board = await Board.create({
            name, workspace: workspaceId, Admin: req.user._id, background,
            members: defaultBoardMembers
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

        await board.populate([
            { path: 'Admin', select: 'username email avatar role' },
            { path: 'members.user', select: 'username email avatar role' }
        ]);
        res.status(201).json({ status: 'success', data: { board: formatBoard(board, req.user._id) } });
    } catch (error) { next(error); }
};

export const getBoards = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const boards = await Board.find({ workspace: workspaceId })
            .populate('Admin', 'username email avatar role')
            .populate('members.user', 'username email avatar role');
        res.status(200).json({ status: 'success', data: { boards: formatBoards(boards, req.user._id) } });
    } catch (error) { next(error); }
};

export const getSingleBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId)
            .populate('workspace', 'name')
            .populate('Admin', 'username email avatar role')
            .populate('members.user', 'username email avatar role');
        if (!board) return next(new ApiError(404, 'Board not found'));

        res.status(200).json({ status: 'success', data: { board: formatBoard(board, req.user._id) } });
    } catch (error) { next(error); }
};

export const updateBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { name, background } = req.body;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));
        if (name) board.name = name;
        if (background) board.background = background;
        await board.save();
        res.status(200).json({ status: 'success', data: { board: formatBoard(board, req.user._id) } });
    } catch (error) { next(error); }
};

export const deleteBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

        // Cascade delete columns and cards inside this board
        const { default: Column } = await import('../models/Column.js');
        const { default: Card } = await import('../models/Card.js');
        await Card.deleteMany({ board: boardId });
        await Column.deleteMany({ board: boardId });

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
        const { email, role = 'developer' } = req.body;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

        const { default: User } = await import('../models/User.js');
        const invitee = await User.findOne({ email });
        if (!invitee) return next(new ApiError(404, 'User not found'));

        const already = board.members.some(m => m.user?.toString() === invitee._id.toString());
        if (already) return next(new ApiError(400, 'Already a member'));

        board.members.push({ user: invitee._id, role });
        await board.save();
        const populated = await Board.findById(board._id).populate([
            { path: 'Admin', select: 'username email avatar role' },
            { path: 'members.user', select: 'username email avatar role' }
        ]);
        res.status(200).json({ status: 'success', data: { board: formatBoard(populated, req.user._id) } });
    } catch (error) { next(error); }
};

export const updateBoardMemberRole = async (req, res, next) => {
    try {
        const { boardId, memberId } = req.params;
        const { role } = req.body;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

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

        board.members = board.members.filter(m => m.user?.toString() !== memberId);
        await board.save();
        const populated = await Board.findById(board._id).populate([
            { path: 'Admin', select: 'username email avatar role' },
            { path: 'members.user', select: 'username email avatar role' }
        ]);
        res.status(200).json({ status: 'success', data: { board: formatBoard(populated, req.user._id) } });
    } catch (error) { next(error); }
};

export const toggleStarBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

        if (!board.starredBy) {
            board.starredBy = [];
        }

        const userIdStr = req.user._id.toString();
        const index = board.starredBy.findIndex(id => id?.toString() === userIdStr);
        if (index > -1) {
            board.starredBy.splice(index, 1);
        } else {
            board.starredBy.push(req.user._id);
        }
        await board.save();
        res.status(200).json({ status: 'success', data: { board: formatBoard(board, req.user._id) } });
    } catch (error) { next(error); }
};
