import Card from '../models/Card.js';
import Activity from '../models/Activity.js';
import { ApiError } from '../utils/apiError.js';
import fs from 'fs';
import path from 'path';
import Board from '../models/Board.js';
import Workspace from '../models/Workspace.js';
import { getBoardIdsForUser } from './dashboard.controller.js';

const logActivity = (userId, boardId, cardId, action, details) =>
    Activity.create({ user: userId, board: boardId, card: cardId, action, details }).catch(() => { });

const getPopulatedCard = async (cardId) => {
    return Card.findById(cardId)
        .populate('assignees', 'username email avatar')
        .populate('comments.user', 'username email avatar')
        .populate('comments.reactions.users', 'username');
};

export const createCard = async (req, res, next) => {
    try {
        const { title, columnId, boardId, order, assignees, labels, dueDate } = req.body;
        const card = await Card.create({ title, column: columnId, board: boardId, order, assignees, labels, dueDate });
        
        // Notify assignees about the new task assignment
        if (assignees && assignees.length > 0) {
            try {
                const { getIO } = await import('../config/socket.js');
                const { sendNotificationToUser } = await import('../sockets/user.socket.js');
                const Notification = (await import('../models/Notification.js')).default;
                
                const io = getIO();
                for (const assigneeId of assignees) {
                    if (assigneeId === req.user._id.toString()) continue;

                    const notif = await Notification.create({
                        recipient: assigneeId,
                        sender: req.user._id,
                        type: 'TASK_ASSIGN',
                        message: `You have been assigned to task "${title}" by ${req.user.username || 'Admin'}`,
                        relatedEntity: card._id,
                        entityModel: 'Card'
                    });

                    sendNotificationToUser(io, assigneeId, notif);
                }
            } catch (err) {
                console.error('Failed to send task assignment notifications:', err.message);
            }
        }

        logActivity(req.user._id, boardId, card._id, 'created', `Created card "${title}"`);
        const populatedCard = await getPopulatedCard(card._id);
        res.status(201).json({ status: 'success', data: { card: populatedCard } });
    } catch (error) { next(error); }
};

export const getCards = async (req, res, next) => {
    try {
        const { columnId } = req.params;
        const cards = await Card.find({ column: columnId, isTemplate: { $ne: true } }).sort('order')
            .populate('assignees', 'username email avatar')
            .populate('comments.user', 'username email avatar')
            .populate('comments.reactions.users', 'username');
        res.status(200).json({ status: 'success', data: { cards } });
    } catch (error) { next(error); }
};

export const getSingleCard = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const card = await Card.findById(cardId)
            .populate('assignees', 'username email avatar')
            .populate('comments.user', 'username email avatar')
            .populate('comments.reactions.users', 'username');
        if (!card) return next(new ApiError(404, 'Card not found'));
        res.status(200).json({ status: 'success', data: { card } });
    } catch (error) { next(error); }
};

export const updateCard = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const { version, ...updates } = req.body;

        const card = await Card.findById(cardId);
        if (!card) return next(new ApiError(404, 'Card not found'));

        if (version !== undefined && card.version !== version) {
            return next(new ApiError(409, 'Conflict: card was modified by another user'));
        }

        // Compare assignees to detect new assignments
        let newlyAssigned = [];
        if (updates.assignees) {
            const existingAssignees = (card.assignees || []).map(id => id.toString());
            const newAssignees = updates.assignees.map(id => id.toString());
            const isDifferent = existingAssignees.length !== newAssignees.length || existingAssignees.some(id => !newAssignees.includes(id));

            if (isDifferent) {
                const board = await Board.findById(card.board);
                if (!board) return next(new ApiError(404, 'Board not found'));

                const isSystemAdmin = req.user.role === 'admin';
                const workspace = await Workspace.findById(board.workspace);
                const wsMember = workspace?.members.find(m => m.user?.toString() === req.user._id.toString());
                const isWorkspaceOwner = workspace?.Admin?.toString() === req.user._id.toString();
                const isWorkspaceAdmin = wsMember?.role === 'admin' || isWorkspaceOwner || req.user.role === 'project_manager';

                if (!isSystemAdmin && !isWorkspaceAdmin) {
                    return next(new ApiError(403, 'Task assignment is an Admin-only privilege'));
                }
            }

            newlyAssigned = newAssignees.filter(id => !existingAssignees.includes(id));
        }

        Object.assign(card, updates);
        card.version = (card.version || 0) + 1;
        await card.save();

        // Send task assignment notifications
        if (newlyAssigned.length > 0) {
            try {
                const { getIO } = await import('../config/socket.js');
                const { sendNotificationToUser } = await import('../sockets/user.socket.js');
                const Notification = (await import('../models/Notification.js')).default;
                
                const io = getIO();
                for (const assigneeId of newlyAssigned) {
                    if (assigneeId === req.user._id.toString()) continue;

                    const notif = await Notification.create({
                        recipient: assigneeId,
                        sender: req.user._id,
                        type: 'TASK_ASSIGN',
                        message: `You have been assigned to task "${card.title}" by ${req.user.username || 'Admin'}`,
                        relatedEntity: card._id,
                        entityModel: 'Card'
                    });

                    sendNotificationToUser(io, assigneeId, notif);
                }
            } catch (err) {
                console.error('Failed to send task assignment notifications:', err.message);
            }
        }

        logActivity(req.user._id, card.board, card._id, 'updated', `Updated card "${card.title}"`);
        const populatedCard = await getPopulatedCard(card._id);
        res.status(200).json({ status: 'success', data: { card: populatedCard } });
    } catch (error) { next(error); }
};

export const deleteCard = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const card = await Card.findByIdAndDelete(cardId);
        if (!card) return next(new ApiError(404, 'Card not found'));
        logActivity(req.user._id, card.board, card._id, 'deleted', `Deleted card "${card.title}"`);
        res.status(204).send();
    } catch (error) { next(error); }
};

export const moveCard = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const { targetColumnId, targetOrder, version } = req.body;

        const card = await Card.findById(cardId);
        if (!card) return next(new ApiError(404, 'Card not found'));

        if (version !== undefined && card.version !== version) {
            return next(new ApiError(409, 'Conflict: card was modified by another user'));
        }

        const fromColumn = card.column?.toString();
        card.column = targetColumnId;
        card.order = targetOrder;
        card.version = (card.version || 0) + 1;
        await card.save();

        logActivity(req.user._id, card.board, card._id, 'moved',
            `Moved card "${card.title}" from column ${fromColumn} to ${targetColumnId}`);

        const populatedCard = await getPopulatedCard(card._id);
        res.status(200).json({ status: 'success', data: { card: populatedCard } });
    } catch (error) { next(error); }
};

export const getCardActivities = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const activities = await Activity.find({ card: cardId })
            .populate('user', 'username avatar')
            .sort('-createdAt')
            .limit(50);
        res.status(200).json({ status: 'success', data: { activities } });
    } catch (error) { next(error); }
};

export const getMyTasks = async (req, res, next) => {
    try {
        const { priority, blocked, overdue, dueSoon, reviewRequested } = req.query;
        const boardIds = await getBoardIdsForUser(req.user._id);
        const query = { assignees: req.user._id, board: { $in: boardIds } };

        if (priority) {
            query.priority = priority;
        }
        if (blocked !== undefined) {
            query.blocked = blocked === 'true';
        }
        if (reviewRequested !== undefined) {
            query.reviewRequested = reviewRequested === 'true';
        }

        const now = new Date();
        if (overdue === 'true') {
            query.dueDate = { $lt: now };
        } else if (dueSoon === 'true') {
            const twoDaysFromNow = new Date(now.getTime() + 86400000 * 2);
            query.dueDate = { $gte: now, $lte: twoDaysFromNow };
        }

        const cards = await Card.find(query)
            .populate('board', 'name')
            .populate('column', 'name')
            .populate('assignees', 'username email avatar')
            .populate('comments.user', 'username email avatar')
            .sort({ dueDate: 1 });
        res.status(200).json({ status: 'success', data: { cards } });
    } catch (error) { next(error); }
};

export const addComment = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const { text } = req.body;

        if (!text) return next(new ApiError(400, 'Comment text is required'));

        const card = await Card.findById(cardId);
        if (!card) return next(new ApiError(404, 'Card not found'));

        const comment = { user: req.user._id, text };
        card.comments.push(comment);
        await card.save();

        const populatedCard = await getPopulatedCard(card._id);
        const newComment = populatedCard.comments[populatedCard.comments.length - 1];

        const Activity = (await import('../models/Activity.js')).default;
        await Activity.create({
            board: card.board,
            user: req.user._id,
            action: 'commented',
            target: card._id,
            details: `Commented on card "${card.title}"`
        });

        try {
            const { getIO } = await import('../config/socket.js');
            const { sendNotificationToUser } = await import('../sockets/user.socket.js');
            const Board = (await import('../models/Board.js')).default;
            const Notification = (await import('../models/Notification.js')).default;

            const boardObj = await Board.findById(card.board);
            if (boardObj) {
                const io = getIO();
                const recipients = new Set();

                if (boardObj.Admin?.toString() !== req.user._id.toString()) {
                    recipients.add(boardObj.Admin?.toString());
                }
                for (const m of boardObj.members || []) {
                    if (m.user && m.user.toString() !== req.user._id.toString()) {
                        recipients.add(m.user.toString());
                    }
                }

                // Include workspace members who also have access to the board
                try {
                    const Workspace = (await import('../models/Workspace.js')).default;
                    const workspaceObj = await Workspace.findById(boardObj.workspace);
                    if (workspaceObj) {
                        for (const m of workspaceObj.members || []) {
                            if (m.user && m.user.toString() !== req.user._id.toString()) {
                                recipients.add(m.user.toString());
                            }
                        }
                    }
                } catch (wsErr) {
                    console.error('Failed to include workspace members in notification:', wsErr.message);
                }

                for (const recipientId of recipients) {
                    const notif = await Notification.create({
                        recipient: recipientId,
                        sender: req.user._id,
                        type: 'BOARD_COMMENT',
                        message: `${req.user.username || 'User'} commented on card "${card.title}"`,
                        relatedEntity: card._id,
                        entityModel: 'Card'
                    });

                    sendNotificationToUser(io, recipientId, notif);
                }
            }
        } catch (socketErr) {
            console.error('Socket notification error (comment):', socketErr.message);
        }

        res.status(201).json({ status: 'success', data: { comment: newComment } });
    } catch (err) {
        next(err);
    }
};

export const saveCardAsTemplate = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const originalCard = await Card.findById(cardId);
        if (!originalCard) return next(new ApiError(404, 'Card not found'));

        const templateCard = await Card.create({
            title: originalCard.title,
            description: originalCard.description || '',
            column: originalCard.column,
            board: originalCard.board,
            order: '0',
            labels: originalCard.labels.map(l => ({ name: l.name, color: l.color })),
            checklist: originalCard.checklist.map(item => ({ text: item.text, done: false })),
            isTemplate: true
        });

        logActivity(req.user._id, originalCard.board, originalCard._id, 'updated', `Saved card "${originalCard.title}" as a template`);
        res.status(201).json({ status: 'success', data: { template: templateCard } });
    } catch (error) { next(error); }
};

export const getBoardTemplates = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const templates = await Card.find({ board: boardId, isTemplate: true });
        res.status(200).json({ status: 'success', data: { templates } });
    } catch (error) { next(error); }
};

export const toggleCommentReaction = async (req, res, next) => {
    try {
        const { cardId, commentId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        if (!emoji) return next(new ApiError(400, 'Emoji is required'));

        const card = await Card.findById(cardId);
        if (!card) return next(new ApiError(404, 'Card not found'));

        const comment = card.comments.id(commentId);
        if (!comment) return next(new ApiError(404, 'Comment not found'));

        if (!comment.reactions) {
            comment.reactions = [];
        }

        let existingReaction = comment.reactions.find(r => r.emoji === emoji);

        if (existingReaction) {
            const userIndex = existingReaction.users.indexOf(userId);
            if (userIndex > -1) {
                // Remove user
                existingReaction.users.splice(userIndex, 1);
                // If no users left, remove reaction entirely
                if (existingReaction.users.length === 0) {
                    comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
                }
            } else {
                // Add user
                existingReaction.users.push(userId);
            }
        } else {
            // Create new reaction
            comment.reactions.push({
                emoji,
                users: [userId]
            });
        }

        await card.save();

        const populatedCard = await getPopulatedCard(cardId);

        logActivity(req.user._id, card.board, card._id, 'updated', `Reacted ${emoji} to a comment on card "${card.title}"`);

        res.status(200).json({ status: 'success', data: { card: populatedCard } });
    } catch (error) { next(error); }
};

export const addCardAttachment = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        if (!req.file) {
            return next(new ApiError(400, 'No file uploaded'));
        }

        const card = await Card.findById(cardId);
        if (!card) {
            // Cleanup the file if card doesn't exist
            fs.unlink(req.file.path, () => {});
            return next(new ApiError(404, 'Card not found'));
        }

        const attachment = {
            filename: req.file.originalname,
            url: `/uploads/cards/${req.file.filename}`,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
        };

        card.attachments = card.attachments || [];
        card.attachments.push(attachment);
        card.version = (card.version || 0) + 1;
        await card.save();

        const populatedCard = await getPopulatedCard(cardId);

        logActivity(req.user._id, card.board, card._id, 'updated', `Attached file "${req.file.originalname}" to card "${card.title}"`);

        // Send Socket update
        try {
            const { getIO } = await import('../config/socket.js');
            const io = getIO();
            io.to(card.board.toString()).emit('card:update', { boardId: card.board, card: populatedCard });
        } catch (socketErr) {
            console.error('Socket notification error (attachment):', socketErr.message);
        }

        res.status(200).json({ status: 'success', data: { card: populatedCard } });
    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        next(error);
    }
};

export const deleteCardAttachment = async (req, res, next) => {
    try {
        const { cardId, attachmentId } = req.params;

        const card = await Card.findById(cardId);
        if (!card) return next(new ApiError(404, 'Card not found'));

        const attachment = card.attachments.id(attachmentId);
        if (!attachment) return next(new ApiError(404, 'Attachment not found'));

        // Delete file from disk
        const filename = path.basename(attachment.url);
        const filePath = path.join(path.resolve('uploads', 'cards'), filename);
        fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete physical file:', err.message);
        });

        // Remove from DB
        card.attachments.pull(attachmentId);
        card.version = (card.version || 0) + 1;
        await card.save();

        const populatedCard = await getPopulatedCard(cardId);

        logActivity(req.user._id, card.board, card._id, 'updated', `Removed attachment "${attachment.filename}" from card "${card.title}"`);

        // Send Socket update
        try {
            const { getIO } = await import('../config/socket.js');
            const io = getIO();
            io.to(card.board.toString()).emit('card:update', { boardId: card.board, card: populatedCard });
        } catch (socketErr) {
            console.error('Socket notification error (delete attachment):', socketErr.message);
        }

        res.status(200).json({ status: 'success', data: { card: populatedCard } });
    } catch (error) { next(error); }
};


