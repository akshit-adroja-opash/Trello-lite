const userSockets = new Map(); // Map userId -> socketId

export const registerUserHandlers = (io, socket) => {
    // When a user logs in or connects, they emit this event
    socket.on('register_user', (userId) => {
        if (userId) {
            userSockets.set(userId, socket.id);
        }
    });

    socket.on('disconnect', () => {
        // Find and remove the user from the map when they disconnect
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
    });
};

/**
 * Emits a notification to a specific user if they are currently connected
 * and have not muted the notification type or board.
 * @param {import('socket.io').Server} io - The socket.io server instance
 * @param {String} userId - The ID of the recipient user
 * @param {Object} notification - The notification payload (must include `type`, optionally `boardId`)
 */
export const sendNotificationToUser = async (io, userId, notification) => {
    try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId).select('preferences.notifications').lean();
        if (user?.preferences?.notifications) {
            const prefs = user.preferences.notifications;
            // Skip if user has muted this notification type
            if (prefs.mutedTypes?.length > 0 && prefs.mutedTypes.includes(notification.type)) {
                return;
            }
            // Skip if user has muted the board this notification is about
            if (notification.boardId && prefs.mutedBoards?.length > 0) {
                const boardIdStr = notification.boardId.toString();
                if (prefs.mutedBoards.some(id => id.toString() === boardIdStr)) {
                    return;
                }
            }
        }
    } catch (err) {
        console.error('Failed to check notification preferences:', err.message);
        // Continue sending on error — don't block notifications due to preference check failure
    }

    const socketId = userSockets.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit('new_notification', notification);
    }
};
