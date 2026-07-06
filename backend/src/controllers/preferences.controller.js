import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

// GET /api/v1/preferences/notifications
export const getNotificationPreferences = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('preferences.notifications').lean();
        if (!user) return next(new ApiError(404, 'User not found'));

        const prefs = user.preferences?.notifications || {
            mutedTypes: [],
            mutedBoards: [],
            emailEnabled: true
        };

        res.status(200).json({
            status: 'success',
            data: { notifications: prefs }
        });
    } catch (err) {
        next(err);
    }
};

// PUT /api/v1/preferences/notifications
export const updateNotificationPreferences = async (req, res, next) => {
    try {
        const { mutedTypes, mutedBoards, emailEnabled } = req.body;

        const validTypes = ['CARD_UPDATE', 'BOARD_COMMENT', 'TASK_ACTION', 'MENTION', 'WORKSPACE_INVITE', 'WORKSPACE_REMOVE', 'TASK_ASSIGN'];

        // Validate mutedTypes if provided
        if (mutedTypes !== undefined) {
            if (!Array.isArray(mutedTypes)) {
                return next(new ApiError(400, 'mutedTypes must be an array'));
            }
            const invalid = mutedTypes.filter(t => !validTypes.includes(t));
            if (invalid.length > 0) {
                return next(new ApiError(400, `Invalid notification types: ${invalid.join(', ')}`));
            }
        }

        // Validate mutedBoards if provided
        if (mutedBoards !== undefined && !Array.isArray(mutedBoards)) {
            return next(new ApiError(400, 'mutedBoards must be an array'));
        }

        // Build update object — only update fields that were sent
        const update = {};
        if (mutedTypes !== undefined) update['preferences.notifications.mutedTypes'] = mutedTypes;
        if (mutedBoards !== undefined) update['preferences.notifications.mutedBoards'] = mutedBoards;
        if (emailEnabled !== undefined) update['preferences.notifications.emailEnabled'] = !!emailEnabled;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: update },
            { new: true, runValidators: true }
        ).select('preferences.notifications');

        if (!user) return next(new ApiError(404, 'User not found'));

        res.status(200).json({
            status: 'success',
            message: 'Notification preferences updated',
            data: { notifications: user.preferences.notifications }
        });
    } catch (err) {
        next(err);
    }
};
