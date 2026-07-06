import Card from '../models/Card.js';
import Activity from '../models/Activity.js';
import { ApiError } from '../utils/apiError.js';
import path from 'path';
import { uploadBufferToGridFS, deleteFromGridFS } from '../utils/gridfsStorage.js';
import { v4 as uuidv4 } from 'uuid';
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

                    sendNotificationToUser(io, assigneeId, { ...notif.toObject(), boardId: boardId });
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

                    sendNotificationToUser(io, assigneeId, { ...notif.toObject(), boardId: card.board });
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

                    sendNotificationToUser(io, recipientId, { ...notif.toObject(), boardId: card.board });
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
        const { targetAttachmentId } = req.query;
        if (!req.file) {
            return next(new ApiError(400, 'No file uploaded'));
        }

        const card = await Card.findById(cardId);
        if (!card) {
            return next(new ApiError(404, 'Card not found'));
        }

        const ext = path.extname(req.file.originalname || '');
        const filename = `${uuidv4()}${ext}`;
        const fileUrl = await uploadBufferToGridFS(req.file.buffer, filename, req.file.mimetype, 'cards');

        card.attachments = card.attachments || [];

        // Check if updating existing attachment (by targetAttachmentId or matching filename)
        let existingAtt = null;
        if (targetAttachmentId) {
            existingAtt = card.attachments.id(targetAttachmentId);
        }
        if (!existingAtt) {
            existingAtt = card.attachments.find(a => a.filename.toLowerCase() === req.file.originalname.toLowerCase());
        }

        if (existingAtt) {
            // Initialize versions array with existing data if empty
            if (!existingAtt.versions || existingAtt.versions.length === 0) {
                existingAtt.versions = [{
                    version: existingAtt.version || 1,
                    filename: existingAtt.filename,
                    url: existingAtt.url,
                    mimeType: existingAtt.mimeType,
                    size: existingAtt.size,
                    uploadedBy: existingAtt.uploadedBy,
                    uploadedAt: existingAtt.uploadedAt
                }];
            }
            const newVersionNum = (existingAtt.version || existingAtt.versions.length || 1) + 1;
            existingAtt.version = newVersionNum;
            existingAtt.filename = req.file.originalname;
            existingAtt.url = fileUrl;
            existingAtt.mimeType = req.file.mimetype;
            existingAtt.size = req.file.size;
            existingAtt.uploadedBy = req.user._id;
            existingAtt.uploadedAt = new Date();

            existingAtt.versions.push({
                version: newVersionNum,
                filename: req.file.originalname,
                url: fileUrl,
                mimeType: req.file.mimetype,
                size: req.file.size,
                uploadedBy: req.user._id,
                uploadedAt: new Date()
            });

            logActivity(req.user._id, card.board, card._id, 'updated', `Uploaded new version (v${newVersionNum}) for "${req.file.originalname}" on card "${card.title}"`);
        } else {
            const newAtt = {
                filename: req.file.originalname,
                url: fileUrl,
                mimeType: req.file.mimetype,
                size: req.file.size,
                uploadedBy: req.user._id,
                uploadedAt: new Date(),
                version: 1,
                versions: [{
                    version: 1,
                    filename: req.file.originalname,
                    url: fileUrl,
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                    uploadedBy: req.user._id,
                    uploadedAt: new Date()
                }]
            };
            card.attachments.push(newAtt);
            logActivity(req.user._id, card.board, card._id, 'updated', `Attached file "${req.file.originalname}" to card "${card.title}"`);
        }

        card.version = (card.version || 0) + 1;
        await card.save();

        const populatedCard = await getPopulatedCard(cardId);

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
        next(error);
    }
};

export const deleteCardAttachment = async (req, res, next) => {
    try {
        const { cardId, attachmentId } = req.params;
        const { versionNumber } = req.query;

        const card = await Card.findById(cardId);
        if (!card) return next(new ApiError(404, 'Card not found'));

        const attachment = card.attachments.id(attachmentId);
        if (!attachment) return next(new ApiError(404, 'Attachment not found'));

        if (versionNumber) {
            const verNum = parseInt(versionNumber, 10);
            const verIdx = attachment.versions?.findIndex(v => v.version === verNum);
            if (verIdx !== -1 && verIdx !== undefined) {
                const verObj = attachment.versions[verIdx];
                const filename = path.basename(verObj.url);
                try { await deleteFromGridFS(filename); } catch (err) { console.error('GridFS file delete error:', err.message); }
                attachment.versions.splice(verIdx, 1);

                if (attachment.versions.length === 0) {
                    card.attachments.pull(attachmentId);
                    logActivity(req.user._id, card.board, card._id, 'updated', `Removed attachment "${attachment.filename}" from card "${card.title}"`);
                } else if (attachment.version === verNum) {
                    const latest = attachment.versions[attachment.versions.length - 1];
                    attachment.version = latest.version;
                    attachment.filename = latest.filename;
                    attachment.url = latest.url;
                    attachment.mimeType = latest.mimeType;
                    attachment.size = latest.size;
                    attachment.uploadedBy = latest.uploadedBy;
                    attachment.uploadedAt = latest.uploadedAt;
                    logActivity(req.user._id, card.board, card._id, 'updated', `Deleted version v${verNum} of "${attachment.filename}" on card "${card.title}"`);
                } else {
                    logActivity(req.user._id, card.board, card._id, 'updated', `Deleted version v${verNum} of "${attachment.filename}" on card "${card.title}"`);
                }
            }
        } else {
            if (attachment.versions && attachment.versions.length > 0) {
                for (const ver of attachment.versions) {
                    const fname = path.basename(ver.url);
                    try { await deleteFromGridFS(fname); } catch (err) { console.error('GridFS file delete error:', err.message); }
                }
            } else {
                const filename = path.basename(attachment.url);
                try { await deleteFromGridFS(filename); } catch (err) { console.error('GridFS file delete error:', err.message); }
            }
            card.attachments.pull(attachmentId);
            logActivity(req.user._id, card.board, card._id, 'updated', `Removed attachment "${attachment.filename}" from card "${card.title}"`);
        }

        card.version = (card.version || 0) + 1;
        await card.save();

        const populatedCard = await getPopulatedCard(cardId);

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


