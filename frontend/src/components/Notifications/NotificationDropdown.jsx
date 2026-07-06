import { useNavigate, Link } from 'react-router-dom';
import useNotificationStore from '../../store/notificationStore';
import { getSingleCard } from '../../api/card.api';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
    const navigate = useNavigate();

    const handleItemClick = async (notif) => {
        if (!notif.isRead) markAsRead(notif._id);
        if (notif.entityModel === 'Card' && notif.relatedEntity) {
            try {
                const res = await getSingleCard(notif.relatedEntity);
                const card = res.data?.card;
                if (card && card.board) {
                    navigate(`/board/${card.board}`);
                }
            } catch (err) {
                console.error("Failed to find board for card notification", err);
            }
        } else if (notif.entityModel === 'Board' && notif.relatedEntity) {
            navigate(`/board/${notif.relatedEntity}`);
        }
        onClose();
    };

    const getNotificationIcon = (notif) => {
        const msg = (notif.message || '').toLowerCase();
        if (notif.entityModel === 'Card' || msg.includes('task') || msg.includes('assigned') || msg.includes('card')) {
            return { icon: 'assignment', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400' };
        }
        if (notif.entityModel === 'Board' || msg.includes('board')) {
            return { icon: 'view_kanban', color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-400/15 dark:text-purple-400' };
        }
        if (msg.includes('invite') || msg.includes('user') || msg.includes('team')) {
            return { icon: 'group_add', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400' };
        }
        return { icon: 'notifications_active', color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400' };
    };

    const formatRelativeTime = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            <div className="absolute right-0 top-12 z-50 w-[360px] sm:w-[380px] max-h-[480px] flex flex-col bg-surface-container-lowest dark:bg-slate-800 rounded-2xl shadow-elevated border border-outline-variant dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant dark:border-slate-700/80 bg-surface-container-low/40 dark:bg-slate-800/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-primary dark:text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                            notifications
                        </span>
                        <h4 className="font-headline-sm text-base font-bold text-on-surface dark:text-white">
                            Notifications
                        </h4>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-secondary/15 dark:bg-indigo-500/20 text-secondary dark:text-indigo-300 rounded-full text-[11px] font-bold tracking-wide">
                                {unreadCount} new
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                title="Mark all as read"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-secondary dark:text-indigo-300 hover:bg-secondary/10 dark:hover:bg-indigo-500/15 transition-colors duration-150"
                            >
                                <span className="material-symbols-outlined text-[15px]">done_all</span>
                                <span>Mark read</span>
                            </button>
                        )}
                        <Link
                            to="/settings"
                            onClick={onClose}
                            title="Notification settings"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:hover:bg-slate-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[17px]">settings</span>
                        </Link>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:hover:bg-slate-700 transition-colors"
                            aria-label="Close notifications"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Body / List */}
                <div className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-transparent">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-7 h-7 border-2 border-indigo-200 dark:border-indigo-950 border-t-secondary rounded-full animate-spin" />
                            <span className="text-xs font-medium text-on-surface-variant dark:text-slate-400">Loading notifications...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container dark:bg-slate-750 flex items-center justify-center mb-3 shadow-soft text-slate-400 dark:text-slate-500">
                                <span className="material-symbols-outlined text-[32px]">notifications_paused</span>
                            </div>
                            <h5 className="font-headline-sm text-sm font-bold text-on-surface dark:text-white mb-1">
                                All caught up!
                            </h5>
                            <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-[220px] leading-relaxed">
                                You have no notifications right now. Check back later for updates.
                            </p>
                        </div>
                    ) : (
                        notifications.map((n) => {
                            const iconInfo = getNotificationIcon(n);
                            return (
                                <button
                                    key={n._id}
                                    onClick={() => handleItemClick(n)}
                                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 group relative border ${
                                        !n.isRead
                                            ? 'bg-secondary-container/15 dark:bg-indigo-950/30 border-secondary/20 dark:border-indigo-800/40 shadow-sm'
                                            : 'bg-transparent border-transparent hover:bg-surface-container/60 dark:hover:bg-slate-750/60 hover:border-outline-variant/50'
                                    }`}
                                >
                                    {/* Unread Indicator Dot on left */}
                                    {!n.isRead && (
                                        <span className="mt-4 w-2 h-2 rounded-full bg-secondary dark:bg-indigo-400 shrink-0 ring-2 ring-secondary/20 dark:ring-indigo-400/20 animate-pulse" />
                                    )}

                                    {/* Entity Icon Badge */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-medium ${iconInfo.color} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                                        <span className="material-symbols-outlined text-[20px]">
                                            {iconInfo.icon}
                                        </span>
                                    </div>

                                    {/* Content & Timestamp on right */}
                                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2.5">
                                        <p className={`text-xs sm:text-[13px] leading-relaxed break-words flex-1 ${
                                            !n.isRead
                                                ? 'text-on-surface dark:text-white font-bold'
                                                : 'text-on-surface-variant dark:text-slate-300 font-medium'
                                        }`}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center gap-1 shrink-0 text-[11px] text-on-surface-variant/80 dark:text-slate-400 font-normal pt-0.5">
                                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                                            <span>{formatRelativeTime(n.createdAt)}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-outline-variant dark:border-slate-700/80 bg-surface-container-low/30 dark:bg-slate-800/50 flex items-center justify-between text-[11px] text-on-surface-variant dark:text-slate-400">
                        <span>Showing recent notifications</span>
                        <span className="font-semibold">{notifications.length} total</span>
                    </div>
                )}
            </div>
        </>
    );
};

export default NotificationDropdown;
