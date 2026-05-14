import Column from '../models/Column.js';

export const createColumn = async (req, res, next) => {
    try {
        const { name, boardId, order } = req.body;
        const column = await Column.create({
            name,
            board: boardId,
            order
        });
        res.status(201).json({ status: 'success', data: { column } });
    } catch (error) {
        next(error);
    }
};

export const getColumns = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const columns = await Column.find({ board: boardId }).sort('order');
        res.status(200).json({ status: 'success', data: { columns } });
    } catch (error) {
        next(error);
    }
};

export const updateColumn = async (req, res, next) => {
    try {
        const { columnId } = req.params;
        const { name, order } = req.body;

        const column = await Column.findById(columnId);
        if (!column) {
            return res.status(404).json({ status: 'fail', message: 'Column not found' });
        }

        column.name = name || column.name;
        column.order = order !== undefined ? order : column.order;

        await column.save();

        res.status(200).json({ status: 'success', data: { column } });
    } catch (error) {
        next(error);
    }
};

export const deleteColumn = async (req, res, next) => {
    try {
        const { columnId } = req.params;

        const column = await Column.findById(columnId);
        if (!column) {
            return res.status(404).json({ status: 'fail', message: 'Column not found' });
        }

        await column.remove();

        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};

export const reorderColumns = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { columnOrder } = req.body; // Array of column IDs in new order

        const columns = await Column.find({ board: boardId });
        const columnIds = columns.map(c => c._id.toString());
        if (!columnOrder.every(id => columnIds.includes(id))) {
            return res.status(400).json({ status: 'fail', message: 'Invalid column IDs' });
        }

        for (let i = 0; i < columnOrder.length; i++) {
            await Column.findByIdAndUpdate(columnOrder[i], { order: i });
        }

        res.status(200).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};              