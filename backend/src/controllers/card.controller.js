import Card from '../models/Card.js';
import Activity from '../models/Activity.js';
import { ApiError } from '../utils/apiError.js';

const logActivity = (userId, boardId, cardId, action, details) =>
    Activity.create({ user: userId, board: boardId, card: cardId, action, details }).catch(() => { });

export const createCard = async (req, res, next) => {
    try {
        const { title, columnId, boardId, order, assignees, labels, dueDate } = req.body;
        const card = await Card.create({ title, column: columnId, board: boardId, order, assignees, labels, dueDate });
        logActivity(req.user._id, boardId, card._id, 'created', `Created card "${title}"`);
        res.status(201).json({ status: 'success', data: { card } });
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

        Object.assign(card, updates);
        card.version = (card.version || 0) + 1;
        await card.save();

        logActivity(req.user._id, card.board, card._id, 'updated', `Updated card "${card.title}"`);
        res.status(200).json({ status: 'success', data: { card } });
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

        const fromColumn = card.column.toString();
        card.column = targetColumnId;
        card.order = targetOrder;
        card.version = (card.version || 0) + 1;
        await card.save();

        logActivity(req.user._id, card.board, card._id, 'moved',
            `Moved card "${card.title}" from column ${fromColumn} to ${targetColumnId}`);

        res.status(200).json({ status: 'success', data: { card } });
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
        const cards = await Card.find({ assignees: req.user._id })
            .populate('board', 'name')
            .populate('column', 'name')
            .populate('assignees', 'username email avatar')
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

        const populatedCard = await Card.findById(card._id)
            .populate('comments.user', 'username avatar')
            .populate('comments.reactions.users', 'username');
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

                if (boardObj.owner.toString() !== req.user._id.toString()) {
                    recipients.add(boardObj.owner.toString());
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

        const populatedCard = await Card.findById(cardId)
            .populate('assignees', 'username email avatar')
            .populate('comments.user', 'username email avatar')
            .populate('comments.reactions.users', 'username');

        logActivity(req.user._id, card.board, card._id, 'updated', `Reacted ${emoji} to a comment on card "${card.title}"`);

        res.status(200).json({ status: 'success', data: { card: populatedCard } });
    } catch (error) { next(error); }
};


