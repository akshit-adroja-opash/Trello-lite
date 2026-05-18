import Board from '../models/Board.js';
import Card from '../models/Card.js';
import { ApiError } from '../utils/apiError.js';

export const requireBoardRole = (...allowedRoles) => async (req, res, next) => {
    try {
        let boardId = req.params?.boardId || req.body?.boardId;

        if (!boardId && req.params.cardId) {
            const card = await Card.findById(req.params.cardId).select('board');
            boardId = card?.board?.toString();
        }

        if (!boardId) return next(new ApiError(400, 'boardId required'));

        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

        // Owner always has full access
        if (board.owner.toString() === req.user._id.toString()) {
            req.board = board;
            req.boardRole = 'Owner';
            return next();
        }

        const member = board.members.find(m => m.user.toString() === req.user._id.toString());
        if (!member) return next(new ApiError(403, 'Not a board member'));

        if (!allowedRoles.includes(member.role)) {
            return next(new ApiError(403, `Requires role: ${allowedRoles.join(' or ')}`));
        }

        req.board = board;
        req.boardRole = member.role;
        next();
    } catch (err) {
        next(err);
    }
};
