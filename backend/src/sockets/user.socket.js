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
 * Emits a notification to a specific user if they are currently connected.
 * @param {import('socket.io').Server} io - The socket.io server instance
 * @param {String} userId - The ID of the recipient user
 * @param {Object} notification - The notification payload
 */
export const sendNotificationToUser = (io, userId, notification) => {
    const socketId = userSockets.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit('new_notification', notification);
    }
};
