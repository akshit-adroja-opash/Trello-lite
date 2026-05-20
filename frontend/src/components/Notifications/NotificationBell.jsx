import React, { useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import useNotificationStore from '../../store/notificationStore';
import NotificationDropdown from './NotificationDropdown';

/**
 * Renders a bell icon with unread count badge.
 * On mount it fetches notifications and registers socket listeners via the store.
 */
const NotificationBell = () => {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetch = useNotificationStore((s) => s.fetchNotifications);
  const initSocket = useNotificationStore((s) => s.initSocketListeners);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    fetch();
    initSocket();
  }, [fetch, initSocket]);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5 text-[#e0e0e0]" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
            title={`${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationDropdown onClose={() => setOpen(false)} />}
    </div>
  );
};

export default NotificationBell;
