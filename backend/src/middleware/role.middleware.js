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

        if (board.Admin?.toString() === req.user?._id?.toString() || req.user?.role === 'admin') {
            req.board = board;
            req.boardRole = 'admin';
            return next();
        }

        let member = board.members.find(m => m.user?.toString() === req.user?._id?.toString());

        if (!member) {
            const workspace = await Workspace.findById(board.workspace);
            if (workspace) {
                const wsMember = workspace.members.find(m => m.user?.toString() === req.user?._id?.toString());
                if (wsMember) {
                    // Workspace role → Board role (same naming, direct mapping)
                    // admin           → admin           (Admin)
                    // project_manager → project_manager (Project Manager)
                    // developer       → developer       (Developer)
                    // client          → client          (Client)
                    member = { role: wsMember.role };
                }
            }
        }

        if (!member) return next(new ApiError(403, 'Not a board or workspace member'));

        if (allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
            return next(new ApiError(403, `Requires role: ${allowedRoles.join(' or ')}`));
        }

        req.board = board;
        req.boardRole = member.role;

        next();
    } catch (err) {
        next(err);
    }
};

export const requireWorkspaceRole = (...allowedRoles) => async (req, res, next) => {
    try {
        const workspaceId = req.params?.workspaceId || req.body?.workspaceId || req.query?.workspaceId;
        if (!workspaceId) return next(new ApiError(400, 'workspaceId required'));

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return next(new ApiError(404, 'Workspace not found'));

        let memberRole;
        if (workspace.Admin?.toString() === req.user?._id?.toString() || req.user?.role === 'admin') {
            memberRole = 'admin';
        } else {
            const member = workspace.members.find(m => m.user?.toString() === req.user?._id?.toString());
            if (!member) return next(new ApiError(403, 'Not a workspace member'));
            memberRole = member.role;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(memberRole)) {
            return next(new ApiError(403, `Requires workspace role: ${allowedRoles.join(' or ')}`));
        }

        req.workspace = workspace;
        req.workspaceRole = memberRole;
        next();
    } catch (err) {
        next(err);
    }
};

export const requireGlobalRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user || !req.user.role) {
        return next(new ApiError(401, 'Unauthorized'));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
        return next(new ApiError(403, `Requires global role: ${allowedRoles.join(' or ')}`));
    }
    
    next();
};
