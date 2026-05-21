import Board from '../models/Board.js';
import Card from '../models/Card.js';
import Column from '../models/Column.js';
import Workspace from '../models/Workspace.js';
import { ApiError } from '../utils/apiError.js';

export const requireBoardRole = (...allowedRoles) => async (req, res, next) => {
    try {
        let boardId = req.params?.boardId || req.body?.boardId;

        if (!boardId && req.params.cardId) {
            const card = await Card.findById(req.params.cardId).select('board');
            boardId = card?.board?.toString();
        }

        if (!boardId && req.params.columnId) {
            const column = await Column.findById(req.params.columnId).select('board');
            boardId = column?.board?.toString();
        }

        if (!boardId && req.body?.columnId) {
            const column = await Column.findById(req.body.columnId).select('board');
            boardId = column?.board?.toString();
        }

        if (!boardId) return next(new ApiError(400, 'boardId required'));

        const board = await Board.findById(boardId);
        if (!board) return next(new ApiError(404, 'Board not found'));

        if (board.owner.toString() === req.user._id.toString()) {
            req.board = board;
            req.boardRole = 'Owner';
            return next();
        }

        let member = board.members.find(m => m.user.toString() === req.user._id.toString());

        if (!member) {
            const workspace = await Workspace.findById(board.workspace);
            if (workspace) {
                const wsMember = workspace.members.find(m => m.user.toString() === req.user._id.toString());
                if (wsMember) {
                    // Map workspace role → board role (display names)
                    // admin           → Owner  (Admin)
                    // project_manager → Admin  (Project Manager)
                    // developer       → Editor (Developer)
                    // client          → Viewer (Client)
                    let inheritedRole = 'Viewer';
                    if (wsMember.role === 'admin') inheritedRole = 'Owner';
                    else if (wsMember.role === 'project_manager') inheritedRole = 'Admin';
                    else if (wsMember.role === 'developer') inheritedRole = 'Editor';
                    member = { role: inheritedRole };
                }
            }
        }

        if (!member) return next(new ApiError(403, 'Not a board or workspace member'));

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
