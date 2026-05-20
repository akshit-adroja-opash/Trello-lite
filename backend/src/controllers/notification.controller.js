import Notification from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';

// GET /api/v1/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .populate('sender', 'username avatar')
      .lean();
    res.status(200).json({ status: 'success', data: { notifications } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return next(new ApiError(404, 'Notification not found'));
    res.status(200).json({ status: 'success', data: { notification: notif } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
