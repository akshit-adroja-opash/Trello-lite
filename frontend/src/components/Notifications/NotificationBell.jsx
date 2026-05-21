import { useState, useEffect } from 'react';
import useNotificationStore from '../../store/notificationStore';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
    const unreadCount = useNotificationStore(s => s.unreadCount);
    const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
    const initSocketListeners = useNotificationStore(s => s.initSocketListeners);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();
        initSocketListeners();
    }, [fetchNotifications, initSocketListeners]);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="relative w-10 h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all shadow-sm hover:shadow"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {open && <NotificationDropdown onClose={() => setOpen(false)} />}
        </div>
    );
};

export default NotificationBell;
