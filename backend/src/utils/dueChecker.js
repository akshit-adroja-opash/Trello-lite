import Card from '../models/Card.js';
import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';
import { sendNotificationToUser } from '../sockets/user.socket.js';

export const checkUpcomingDueDates = async () => {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find cards due within the next 24 hours
        const cards = await Card.find({
            dueDate: { $gte: now, $lte: tomorrow },
            assignees: { $exists: true, $not: { $size: 0 } }
        });

        for (const card of cards) {
            for (const assigneeId of card.assignees) {
                // Check if already notified
                const alreadyNotified = await Notification.findOne({
                    recipient: assigneeId,
                    type: 'CARD_UPDATE',
                    relatedEntity: card._id,
                    message: `Card "${card.title}" is due tomorrow`
                });

                if (!alreadyNotified) {
                    const notif = await Notification.create({
                        recipient: assigneeId,
                        type: 'CARD_UPDATE',
                        message: `Card "${card.title}" is due tomorrow`,
                        relatedEntity: card._id,
                        entityModel: 'Card'
                    });

                    // Emit via socket if online
                    try {
                        const io = getIO();
                        sendNotificationToUser(io, assigneeId, notif);
                    } catch (socketErr) {
                        // socket.io might not be initialized or active
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error checking due dates:', err);
    }
};

export const startDueChecker = () => {
    // Run immediately on start
    checkUpcomingDueDates();
    // Run every 10 minutes (600,000 ms)
    setInterval(checkUpcomingDueDates, 10 * 60 * 1000);
};
