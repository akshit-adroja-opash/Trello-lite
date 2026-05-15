import Card from '../models/Card.js';
import Activity from '../models/Activity.js';
import { ApiError } from '../utils/apiError.js';

const logActivity = (userId, boardId, cardId, action, details) =>
    Activity.create({ user: userId, board: boardId, card: cardId, action, details }).catch(() => {});

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
        const cards = await Card.find({ column: columnId }).sort('order')
            .populate('assignees', 'username email avatar');
        res.status(200).json({ status: 'success', data: { cards } });
    } catch (error) { next(error); }
};

export const getSingleCard = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const card = await Card.findById(cardId).populate('assignees', 'username email avatar');
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

        // Conflict detection: reject stale edits
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

        const fromColumn = card.column;
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
