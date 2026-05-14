import Board from '../models/Board.js';


export const createBoard = async (req, res, next) => {
    try {
        const { name, workspaceId, background } = req.body;

        const board = await Board.create({
            name,
            workspace: workspaceId,
            owner: req.user._id,
            background
        });

        res.status(201).json({
            status: 'success',
            data: { board }
        });
    } catch (error) {
        next(error);
    }
};


export const getBoards = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;

        const boards = await Board.find({
            workspace: workspaceId
        });

        res.status(200).json({
            status: 'success',
            data: { boards }
        });
    } catch (error) {
        next(error);
    }
};


export const getSingleBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;

        const board = await Board.findById(boardId)
            .populate('workspace')
            .populate('owner', 'name email');

        if (!board) {
            return res.status(404).json({
                status: 'fail',
                message: 'Board not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { board }
        });
    } catch (error) {
        next(error);
    }
};

export const updateBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { name, background } = req.body;

        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({
                status: 'fail',
                message: 'Board not found'
            });
        }

        if (name) board.name = name;
        if (background) board.background = background;

        await board.save();

        res.status(200).json({
            status: 'success',
            data: { board }
        });
    } catch (error) {
        next(error);
    }
};


export const deleteBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;

        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({
                status: 'fail',
                message: 'Board not found'
            });
        }

        await board.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Board deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};


export const getBoardMembers = async (req, res, next) => {
    try {
        const { boardId } = req.params;

        const board = await Board.findById(boardId)
            .populate('members.user', 'name email');

        if (!board) {
            return res.status(404).json({
                status: 'fail',
                message: 'Board not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                members: board.members
            }
        });
    } catch (error) {
        next(error);
    }
};


export const updateBoardMemberRole = async (req, res, next) => {
    try {
        const { boardId, memberId } = req.params;
        const { role } = req.body;

        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({
                status: 'fail',
                message: 'Board not found'
            });
        }

        const member = board.members.find(
            (m) => m.user.toString() === memberId
        );

        if (!member) {
            return res.status(404).json({
                status: 'fail',
                message: 'Member not found'
            });
        }

        member.role = role;

        await board.save();

        res.status(200).json({
            status: 'success',
            message: 'Member role updated successfully',
            data: {
                member
            }
        });
    } catch (error) {
        next(error);
    }
};