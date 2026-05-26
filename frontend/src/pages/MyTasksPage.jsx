import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authstore';
import { getMyTasks, updateCard } from '../api/card.api';
import TaskQueueFilters from '../components/Tasks/TaskQueueFilters';
import FocusTaskPanel from '../components/Tasks/FocusTaskPanel';
import CardDetail from '../components/Card/CardDetail';
import toast from 'react-hot-toast';

const MyTasksPage = () => {
    const user = useAuthStore(s => s.user);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState(null);
    const [focusMode, setFocusMode] = useState(false);
    
    const [filters, setFilters] = useState({
        priority: null,
        blocked: false,
        overdue: false,
        dueSoon: false,
        reviewRequested: false
    });

    const fetchTasks = () => {
        setLoading(true);
        const params = {};
        if (filters.priority) params.priority = filters.priority;
        if (filters.blocked) params.blocked = true;
        if (filters.overdue) params.overdue = true;
        if (filters.dueSoon) params.dueSoon = true;
        if (filters.reviewRequested) params.reviewRequested = true;

        getMyTasks(params)
            .then(res => setCards(res.data?.cards || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!user) return;
        fetchTasks();
    }, [user, filters]);

    // Quick inline toggles
    const handleToggleBlocked = async (cardObj) => {
        const isCurrentlyBlocked = !!cardObj.blocked;
        let reason = '';
        if (!isCurrentlyBlocked) {
            reason = prompt('Enter reason for blockage:') || 'No reason specified';
        }
        try {
            await updateCard(cardObj._id, {
                blocked: !isCurrentlyBlocked,
                blockedReason: !isCurrentlyBlocked ? reason : '',
                assignees: cardObj.assignees?.map(a => a._id || a) || [],
                version: cardObj.version
            });
            toast.success('Task block status updated');
            fetchTasks();
        } catch (err) {
            toast.error('Failed to update block status');
        }
    };

    const handleToggleReview = async (cardObj) => {
        try {
            await updateCard(cardObj._id, {
                reviewRequested: !cardObj.reviewRequested,
                assignees: cardObj.assignees?.map(a => a._id || a) || [],
                version: cardObj.version
            });
            toast.success('Task review status updated');
            fetchTasks();
        } catch (err) {
            toast.error('Failed to update review status');
        }
    };

    // Partition tasks
    const getBlockedTasks = () => cards.filter(c => c.blocked);
    
    const getOverdueTasks = () => cards.filter(c => {
        if (c.blocked) return false;
        if (!c.dueDate) return false;
        const d = new Date(c.dueDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return d <= today;
    });

    const getHighPriorityTasks = () => cards.filter(c => {
        if (c.blocked) return false;
        // Check if overdue
        const d = c.dueDate ? new Date(c.dueDate) : null;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const isOverdue = d && d <= today;
        if (isOverdue) return false;

        return c.priority === 'high' || c.priority === 'urgent';
    });

    const getWaitingReviewTasks = () => cards.filter(c => {
        if (c.blocked) return false;
        // Check if overdue
        const d = c.dueDate ? new Date(c.dueDate) : null;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const isOverdue = d && d <= today;
        if (isOverdue) return false;

        if (c.priority === 'high' || c.priority === 'urgent') return false;

        return c.reviewRequested;
    });

    const getUpcomingTasks = () => cards.filter(c => {
        if (c.blocked) return false;
        // Check if overdue
        const d = c.dueDate ? new Date(c.dueDate) : null;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const isOverdue = d && d <= today;
        if (isOverdue) return false;

        if (c.priority === 'high' || c.priority === 'urgent') return false;
        if (c.reviewRequested) return false;

        return true;
    });

    const renderPriorityBadge = (prio) => {
        switch (prio) {
            case 'urgent':
                return <span className="bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-400 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Urgent</span>;
            case 'high':
                return <span className="bg-amber-50 border border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">High</span>;
            case 'medium':
                return <span className="bg-yellow-50 border border-yellow-100 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900/60 dark:text-yellow-400 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Medium</span>;
            default:
                return <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Low</span>;
        }
    };

    const renderCardRow = (card) => {
        const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
        return (
            <div
                key={card._id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-200"
            >
                <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Pipeline Info */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span>{card.board?.name || 'Board'}</span>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-indigo-650 dark:text-indigo-400">{card.column?.name || 'Column'}</span>
                    </div>

                    {/* Title */}
                    <button
                        onClick={() => setSelectedCard(card)}
                        className="text-left text-sm font-extrabold text-slate-850 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight block w-full truncate cursor-pointer"
                    >
                        {card.title}
                    </button>

                    {/* Metadata strip */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                        {renderPriorityBadge(card.priority)}

                        {card.dueDate && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isOverdue
                                    ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/60'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                            }`}>
                                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}

                        {card.estimatedHours > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-550 dark:text-slate-400">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {card.estimatedHours}h estimated
                            </span>
                        )}
                        
                        {card.checklist && card.checklist.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-550 dark:text-slate-450">
                                <span className="material-symbols-outlined text-[12px]">playlist_add_check</span>
                                {card.checklist.filter(i => i.done).length}/{card.checklist.length}
                            </span>
                        )}
                    </div>

                    {/* Blocked Reason details */}
                    {card.blocked && card.blockedReason && (
                        <div className="mt-2 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-700 dark:text-rose-400">
                            <strong className="font-bold">Reason:</strong> {card.blockedReason}
                        </div>
                    )}
                </div>

                {/* Inline Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                        onClick={() => handleToggleBlocked(card)}
                        className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            card.blocked
                                ? 'bg-rose-600 border-rose-600 text-white hover:bg-rose-750'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-750'
                        }`}
                        title={card.blocked ? 'Unblock task' : 'Block task'}
                    >
                        <span className="material-symbols-outlined text-sm">block</span>
                        {card.blocked ? 'Blocked' : 'Block'}
                    </button>

                    <button
                        onClick={() => handleToggleReview(card)}
                        className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            card.reviewRequested
                                ? 'bg-indigo-650 border-indigo-650 text-white hover:bg-indigo-750'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-750'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">rate_review</span>
                        {card.reviewRequested ? 'Under Review' : 'Request Review'}
                    </button>

                    <button
                        onClick={() => setSelectedCard(card)}
                        className="flex items-center justify-center p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl dark:border-slate-700 dark:hover:bg-slate-750 cursor-pointer"
                        title="View Full Details"
                    >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 text-slate-605 dark:text-slate-300 antialiased font-sans transition-colors duration-200">
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700/50 sticky top-0 z-40 flex items-center justify-between px-6 sm:px-8 shadow-sm transition-all duration-200">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard"
                        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-semibold transition-all group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-sm">
                        <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 5l-7 7 7 7"/>
                        </svg>
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <span className="text-slate-300 dark:text-slate-600 text-lg font-light">/</span>
                    <h1 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Work Queue</h1>
                </div>
                
                {cards.length > 0 && !loading && (
                    <button
                        onClick={() => setFocusMode(true)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-sm font-bold">bolt</span>
                        Start Focus Mode
                    </button>
                )}
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                
                {/* Search / Filters */}
                <TaskQueueFilters filters={filters} onChange={setFilters} />

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin" />
                    </div>
                ) : cards.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-slate-800 dark:text-white font-bold text-lg mb-1">No tasks in queue</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm">Modify filters or wait for cards to be assigned.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        
                        {/* 1. Blocked Queue */}
                        {getBlockedTasks().length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-rose-500 font-bold text-lg">block</span>
                                    <h3 className="font-extrabold text-sm uppercase text-slate-800 dark:text-white tracking-wider">Blocked / Waiting ({getBlockedTasks().length})</h3>
                                </div>
                                <div className="space-y-3">
                                    {getBlockedTasks().map(renderCardRow)}
                                </div>
                            </div>
                        )}

                        {/* 2. Overdue / Due Today Queue */}
                        {getOverdueTasks().length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-amber-500 font-bold text-lg">alarm_on</span>
                                    <h3 className="font-extrabold text-sm uppercase text-slate-800 dark:text-white tracking-wider">Due Today / Overdue ({getOverdueTasks().length})</h3>
                                </div>
                                <div className="space-y-3">
                                    {getOverdueTasks().map(renderCardRow)}
                                </div>
                            </div>
                        )}

                        {/* 3. High & Urgent Priority Queue */}
                        {getHighPriorityTasks().length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-red-500 font-bold text-lg">priority_high</span>
                                    <h3 className="font-extrabold text-sm uppercase text-slate-800 dark:text-white tracking-wider">High & Urgent Priority ({getHighPriorityTasks().length})</h3>
                                </div>
                                <div className="space-y-3">
                                    {getHighPriorityTasks().map(renderCardRow)}
                                </div>
                            </div>
                        )}

                        {/* 4. Waiting Review Queue */}
                        {getWaitingReviewTasks().length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-blue-500 font-bold text-lg">rate_review</span>
                                    <h3 className="font-extrabold text-sm uppercase text-slate-800 dark:text-white tracking-wider">Waiting Review ({getWaitingReviewTasks().length})</h3>
                                </div>
                                <div className="space-y-3">
                                    {getWaitingReviewTasks().map(renderCardRow)}
                                </div>
                            </div>
                        )}

                        {/* 5. Upcoming & Other Queue */}
                        {getUpcomingTasks().length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-indigo-500 font-bold text-lg">schedule</span>
                                    <h3 className="font-extrabold text-sm uppercase text-slate-800 dark:text-white tracking-wider">Upcoming & Other Tasks ({getUpcomingTasks().length})</h3>
                                </div>
                                <div className="space-y-3">
                                    {getUpcomingTasks().map(renderCardRow)}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </main>

            {/* Standard Modal Detail */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                        <CardDetail
                            card={selectedCard}
                            onClose={() => {
                                setSelectedCard(null);
                                fetchTasks();
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Focus Mode Panel */}
            {focusMode && cards.length > 0 && (
                <FocusTaskPanel
                    cards={cards}
                    initialIndex={0}
                    onClose={() => {
                        setFocusMode(false);
                        fetchTasks();
                    }}
                    onCardUpdated={fetchTasks}
                />
            )}
        </div>
    );
};

export default MyTasksPage;
