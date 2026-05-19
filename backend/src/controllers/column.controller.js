import Column from '../models/Column.js';
import { ApiError } from '../utils/apiError.js';
import { generateIndexBetween } from '../utils/fractionalIndex.js';

export const createColumn = async (req, res, next) => {
    try {
        const { name, boardId } = req.body;
        if (!name || !boardId) return next(new ApiError(400, 'name and boardId are required'));
        // Find the last column by ascending order, take the last one
        const columns = await Column.find({ board: boardId }).sort('order');
        const last = columns[columns.length - 1];
        const order = generateIndexBetween(last?.order ?? null, null);
        if (!order) return next(new ApiError(500, 'Failed to generate order'));
        const column = await Column.create({ name, board: boardId, order });
        res.status(201).json({ status: 'success', data: { column } });
    } catch (error) { next(error); }
};

export const getColumns = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const columns = await Column.find({ board: boardId }).sort('order');
        res.status(200).json({ status: 'success', data: { columns } });
    } catch (error) { next(error); }
};

export const updateColumn = async (req, res, next) => {
    try {
        const { columnId } = req.params;
        const { name, order } = req.body;
        const column = await Column.findById(columnId);
        if (!column) return next(new ApiError(404, 'Column not found'));
        if (name) column.name = name;
        if (order !== undefined) column.order = order;
        await column.save();
        res.status(200).json({ status: 'success', data: { column } });
    } catch (error) { next(error); }
};

export const deleteColumn = async (req, res, next) => {
    try {
        const { columnId } = req.params;
        const column = await Column.findByIdAndDelete(columnId);
        if (!column) return next(new ApiError(404, 'Column not found'));
        res.status(200).json({ status: 'success', message: 'Column deleted' });
    } catch (error) { next(error); }
};

export const reorderColumn = async (req, res, next) => {
    try {
        const { columnId, prevOrder, nextOrder } = req.body;
        const newOrder = generateIndexBetween(prevOrder || null, nextOrder || null);
        const column = await Column.findByIdAndUpdate(columnId, { order: newOrder }, { new: true });
        if (!column) return next(new ApiError(404, 'Column not found'));
        res.status(200).json({ status: 'success', data: { column } });
    } catch (error) { next(error); }
};
