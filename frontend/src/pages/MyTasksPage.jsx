import { useEffect, useState } from 'react';
import useAuthStore from '../store/authstore';
import { getMyTasks, updateCard } from '../api/card.api';
import FocusTaskPanel from '../components/Tasks/FocusTaskPanel';
import CardDetail from '../components/Card/CardDetail';
import AdminPanelLayout from '../components/Layout/AdminPanelLayout';
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
        } catch {
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
        } catch {
            toast.error('Failed to update review status');
        }
    };

    const toggleFilter = (key) => {
        setFilters(prev => {
            if (key === 'priority') {
                return { ...prev, priority: prev.priority ? null : 'all' }; // Or whatever logic for priority
            }
            return { ...prev, [key]: !prev[key] };
        });
    };

    // Partition tasks
    const highUrgentTasks = cards.filter(c => c.priority === 'high' || c.priority === 'urgent');
    const upcomingTasks = cards.filter(c => c.priority !== 'high' && c.priority !== 'urgent');

    const renderPriorityBadge = (prio) => {
        switch (prio) {
            case 'urgent':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-error-container dark:bg-error-container/20 text-on-error-container dark:text-red-400 uppercase">Urgent</span>;
            case 'high':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 uppercase">High</span>;
            case 'medium':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-secondary-fixed dark:bg-secondary-fixed/20 text-on-secondary-fixed dark:text-blue-400 uppercase">Medium</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-tertiary-fixed dark:bg-tertiary-fixed/20 text-on-tertiary-fixed dark:text-emerald-400 uppercase">Low</span>;
        }
    };

    const renderCardRow = (card) => {
        const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
        
        return (
            <div key={card._id} className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg p-md shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low dark:hover:bg-slate-750 transition-colors duration-200">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-label-caps text-[12px] text-on-surface-variant dark:text-slate-400">
                        <span>{card.board?.name || 'Board'}</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-secondary dark:text-blue-400 font-semibold uppercase">{card.column?.name || 'Column'}</span>
                    </div>
                    <h3 onClick={() => setSelectedCard(card)} className="font-title-md text-[20px] text-primary dark:text-white cursor-pointer hover:text-secondary transition-colors">
                        {card.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {renderPriorityBadge(card.priority)}
                        
                        {card.dueDate && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${isOverdue ? 'bg-error-container dark:bg-error-container/20 text-on-error-container dark:text-red-400' : 'bg-surface-container-high dark:bg-slate-700 text-on-surface dark:text-slate-300'}`}>
                                <span className="material-symbols-outlined text-[12px] mr-1">calendar_today</span>
                                {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                        
                        {card.blocked && card.blockedReason && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-error-container dark:bg-error-container/20 text-on-error-container dark:text-red-400">
                                <span className="material-symbols-outlined text-[12px] mr-1">block</span>
                                Blocked
                            </span>
                        )}
                        
                        {card.reviewRequested && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-secondary-fixed dark:bg-secondary-fixed/20 text-on-secondary-fixed dark:text-blue-400">
                                <span className="material-symbols-outlined text-[12px] mr-1">rate_review</span>
                                In Review
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button 
                        onClick={() => handleToggleBlocked(card)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border ${card.blocked ? 'bg-error text-on-error border-error dark:bg-red-600 dark:text-white dark:border-red-600' : 'bg-transparent border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'} rounded transition-colors font-body-sm text-[14px]`}
                    >
                        <span className="material-symbols-outlined text-[18px]">block</span>
                        {card.blocked ? 'Blocked' : 'Block'}
                    </button>
                    <button 
                        onClick={() => handleToggleReview(card)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border ${card.reviewRequested ? 'bg-secondary text-on-secondary border-secondary dark:bg-blue-600 dark:text-white dark:border-blue-600' : 'bg-transparent border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'} rounded transition-colors font-body-sm text-[14px]`}
                    >
                        <span className="material-symbols-outlined text-[18px]">rate_review</span>
                        {card.reviewRequested ? 'Under Review' : 'Request Review'}
                    </button>
                    <button 
                        onClick={() => setSelectedCard(card)}
                        className="p-1.5 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-container-high hover:text-on-surface dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors flex items-center justify-center bg-transparent" 
                        title="Open Detail"
                    >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AdminPanelLayout mainClassName="max-w-[1400px] w-full h-full min-h-[calc(100vh-120px)] flex flex-col gap-lg">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display-xl text-display-xl text-primary dark:text-white font-bold tracking-tight mb-1">Work Queue</h1>
                    <p className="font-body-md text-[16px] text-on-surface-variant dark:text-slate-400">Track assigned cards, blockers, reviews, and upcoming work.</p>
                </div>
                {cards.length > 0 && !loading && (
                    <button 
                        onClick={() => setFocusMode(true)}
                        className="flex items-center gap-2 bg-secondary-container dark:bg-blue-600 text-on-secondary-container dark:text-white font-body-md text-sm font-semibold px-4 py-2 rounded-lg hover:bg-secondary-container/90 dark:hover:bg-blue-700 transition-colors shadow-sm self-end md:self-auto"
                    >
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        Start Focus Mode
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg p-sm shadow-sm flex flex-wrap items-center gap-sm">
                <span className="font-label-caps text-[12px] font-medium text-on-surface-variant dark:text-slate-400 px-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">filter_list</span>
                    FILTER BY
                </span>
                <div className="w-px h-4 bg-outline-variant dark:bg-slate-700 mx-1 hidden sm:block"></div>
                
                <button 
                    onClick={() => setFilters(prev => ({...prev, priority: prev.priority ? null : 'all'}))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-body-sm text-[14px] rounded-full transition-colors ${filters.priority ? 'bg-secondary-fixed/50 dark:bg-blue-900/40 border border-secondary text-on-secondary-fixed dark:text-blue-400' : 'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    All Priorities
                </button>
                
                <button 
                    onClick={() => toggleFilter('blocked')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-body-sm text-[14px] rounded-full transition-colors ${filters.blocked ? 'bg-error-container dark:bg-red-900/40 border border-error text-on-error-container dark:text-red-400' : 'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    Blocked
                </button>
                
                <button 
                    onClick={() => toggleFilter('overdue')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-body-sm text-[14px] rounded-full transition-colors ${filters.overdue ? 'bg-amber-100 dark:bg-amber-900/40 border border-amber-600 text-amber-800 dark:text-amber-400' : 'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">alarm</span>
                    Overdue
                </button>
                
                <button 
                    onClick={() => toggleFilter('dueSoon')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-body-sm text-[14px] rounded-full transition-colors ${filters.dueSoon ? 'bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-600 text-emerald-800 dark:text-emerald-400' : 'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    Due Soon
                </button>
                
                <button 
                    onClick={() => toggleFilter('reviewRequested')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-body-sm text-[14px] rounded-full transition-colors ${filters.reviewRequested ? 'bg-secondary-fixed dark:bg-blue-900/40 border border-secondary text-on-secondary-fixed dark:text-blue-400' : 'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">rate_review</span>
                    Review Requested
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin" />
                </div>
            ) : cards.length === 0 ? (
                <div className="text-center py-20 bg-surface-container-lowest dark:bg-slate-800 rounded-lg border border-outline-variant dark:border-slate-700 shadow-sm">
                    <span className="material-symbols-outlined text-on-surface-variant/50 dark:text-slate-600 text-[48px] mb-4">
                        inbox
                    </span>
                    <h3 className="text-lg font-bold text-primary dark:text-white mb-1">No tasks in queue</h3>
                    <p className="text-on-surface-variant dark:text-slate-400 text-sm">Modify filters or wait for cards to be assigned.</p>
                </div>
            ) : (
                <>
                    {/* High & Urgent Priority Section */}
                    {highUrgentTasks.length > 0 && (
                        <section className="flex flex-col gap-md mt-md">
                            <div className="flex items-center gap-2 border-b border-outline-variant dark:border-slate-700 pb-2">
                                <span className="material-symbols-outlined text-error dark:text-red-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                <h2 className="font-label-caps text-[12px] text-primary dark:text-white uppercase tracking-wider font-bold">High & Urgent Priority ({highUrgentTasks.length})</h2>
                            </div>
                            
                            {highUrgentTasks.map(renderCardRow)}
                        </section>
                    )}

                    {/* Upcoming & Other Tasks Section */}
                    {upcomingTasks.length > 0 && (
                        <section className="flex flex-col gap-md mt-lg">
                            <div className="flex items-center gap-2 border-b border-outline-variant dark:border-slate-700 pb-2">
                                <span className="material-symbols-outlined text-secondary dark:text-blue-400 text-[20px]">schedule</span>
                                <h2 className="font-label-caps text-[12px] text-primary dark:text-white uppercase tracking-wider font-bold">Upcoming & Other Tasks ({upcomingTasks.length})</h2>
                            </div>
                            
                            {upcomingTasks.map(renderCardRow)}
                        </section>
                    )}
                </>
            )}

            {/* Standard Modal Detail */}
            {selectedCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl max-h-[90vh] bg-surface-container-lowest dark:bg-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
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
        </AdminPanelLayout>
    );
};

export default MyTasksPage;
