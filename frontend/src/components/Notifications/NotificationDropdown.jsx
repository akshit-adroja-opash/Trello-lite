import React from 'react';
import useNotificationStore from '../../store/notificationStore';

/**
 * Dropdown that lists notifications with read/unread styling.
 */
const NotificationDropdown = ({ onClose }) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotificationStore();

  const handleItemClick = (notif) => {
    // Example navigation: you can replace with actual routing logic
    console.log('Navigate to', notif.entityModel, notif.relatedEntity);
    if (!notif.isRead) markAsRead(notif._id);
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 z-50">
      <div className="flex items-center justify-between p-3 border-b border-white/15">
        <h4 className="text-sm font-medium text-white">Notifications</h4>
        <button
          className="text-xs text-white/70 hover:text-white"
          onClick={markAllAsRead}
        >
          Mark all as read
        </button>
        <button className="ml-2" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-white/70 hover:text-white">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {loading ? (
        <p className="p-4 text-center text-white/70">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="p-4 text-center text-white/70">No notifications</p>
      ) : (
        notifications.map((n) => (
          <button
            key={n._id}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${n.isRead ? 'text-white/70 hover:bg-white/10' : 'bg-white/10 text-white hover:bg-white/15'}`}
            onClick={() => handleItemClick(n)}
          >
            {n.message}
          </button>
        ))
      )}
    </div>
  );
};

export default NotificationDropdown;
