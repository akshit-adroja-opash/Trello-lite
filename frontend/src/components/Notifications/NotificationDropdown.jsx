import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../../store/notificationStore';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, loading, markAsRead, markAllAsRead } = useNotificationStore();
    const navigate = useNavigate();

    const handleItemClick = (notif) => {
        if (!notif.isRead) markAsRead(notif._id);
        if (notif.entityModel === 'Card' && notif.relatedEntity) {
            navigate(`/board/${notif.relatedEntity}`);
        }
        onClose();
    };

    return (
        <>
            {/* backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            <div className="absolute right-0 top-12 z-50 w-80 max-h-[420px] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h4>
                    <div className="flex items-center gap-2">
                        {notifications.some(n => !n.isRead) && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 1l12 12M13 1L1 13" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* body */}
                <div className="overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <span className="w-5 h-5 border-2 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                            <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-xs font-medium">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <button
                                key={n._id}
                                onClick={() => handleItemClick(n)}
                                className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${!n.isRead ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''}`}
                            >
                                <div className="flex items-start gap-2.5">
                                    {!n.isRead && (
                                        <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                    )}
                                    <div className={!n.isRead ? '' : 'pl-4'}>
                                        <p className={`text-xs leading-relaxed ${!n.isRead ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDropdown;
