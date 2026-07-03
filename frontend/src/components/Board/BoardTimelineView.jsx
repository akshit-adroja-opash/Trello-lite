import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { updateCard } from '../../api/card.api';
import useBoardStore from '../../store/boardStore';
import useSocketStore from '../../store/socketStore';
import Avatar from '../../UI/Avatar';
import CardDetail from '../Card/CardDetail';

const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

const BoardTimelineView = ({ boardId, filteredCards, columns = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCard, setSelectedCard] = useState(null);
    const [groupBy, setGroupBy] = useState('column'); // 'column' | 'assignee'
    const [viewDaysCount, setViewDaysCount] = useState(14); // 14 days (2 weeks) or 28 days (4 weeks)
    const [showUnscheduled, setShowUnscheduled] = useState(true);

    const { updateCard: storeUpdateCard, boardRole } = useBoardStore();
    const socket = useSocketStore(s => s.socket);
    const canEdit = ['admin', 'project_manager', 'developer'].includes(boardRole);

    // Flatten all pre-filtered/sorted board cards
    const allFilteredCards = useMemo(() => {
        return Object.values(filteredCards).flat();
    }, [filteredCards]);

    // Split filtered cards into scheduled and unscheduled
    const { scheduledCards, unscheduledCards } = useMemo(() => {
        const scheduled = [];
        const unscheduled = [];
        allFilteredCards.forEach(c => {
            if (c.dueDate) {
                scheduled.push(c);
            } else {
                unscheduled.push(c);
            }
        });
        return { scheduledCards: scheduled, unscheduledCards: unscheduled };
    }, [allFilteredCards]);

    // Generate date columns for timeline
    const timelineDates = useMemo(() => {
        const dates = [];
        const start = new Date(currentDate);
        // Start 3 days before currentDate for better visual context
        start.setDate(start.getDate() - 3);
        start.setHours(0, 0, 0, 0);

        for (let i = 0; i < viewDaysCount; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [currentDate, viewDaysCount]);

    const timelineStart = timelineDates[0];
    const timelineEnd = new Date(timelineDates[timelineDates.length - 1]);
    timelineEnd.setHours(23, 59, 59, 999);

    // Grouping logic for rows
    const groupedRows = useMemo(() => {
        if (groupBy === 'column') {
            return columns.map(col => ({
                id: col._id,
                name: col.name,
                type: 'column',
                cards: scheduledCards.filter(c => c.column === col._id || c.column?._id === col._id)
            }));
        } else {
            // Group by assignee
            const assigneesMap = new Map();
            const unassigned = [];

            scheduledCards.forEach(c => {
                if (!c.assignees || c.assignees.length === 0) {
                    unassigned.push(c);
                } else {
                    c.assignees.forEach(a => {
                        const id = a._id || a;
                        if (!assigneesMap.has(id)) {
                            assigneesMap.set(id, {
                                id,
                                name: a.username || 'Assignee',
                                avatar: a.avatar,
                                type: 'assignee',
                                cards: []
                            });
                        }
                        assigneesMap.get(id).cards.push(c);
                    });
                }
            });

            const result = Array.from(assigneesMap.values());
            if (unassigned.length > 0 || result.length === 0) {
                result.push({
                    id: 'unassigned',
                    name: 'Unassigned',
                    type: 'assignee',
                    cards: unassigned
                });
            }
            return result;
        }
    }, [groupBy, columns, scheduledCards]);

    // Timeline Navigation
    const handlePrev = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() - Math.floor(viewDaysCount / 2));
        setCurrentDate(next);
    };

    const handleNext = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + Math.floor(viewDaysCount / 2));
        setCurrentDate(next);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Calculate bar position and width percentage relative to timeline dates
    const getBarGeometry = (card) => {
        if (!card.dueDate) return null;
        const due = new Date(card.dueDate);
        
        // Default start date: createdAt or 3 days before due date
        let start = card.createdAt ? new Date(card.createdAt) : new Date(due);
        if (!card.createdAt || isSameDay(start, due)) {
            start = new Date(due);
            const durationDays = card.estimatedHours ? Math.max(1, Math.ceil(card.estimatedHours / 8)) : 3;
            start.setDate(start.getDate() - durationDays);
        }

        // If bar is completely out of view window, hide or clip
        if (due < timelineStart || start > timelineEnd) {
            return null;
        }

        const effectiveStart = start < timelineStart ? timelineStart : start;
        const effectiveEnd = due > timelineEnd ? timelineEnd : due;

        const totalMs = timelineEnd.getTime() - timelineStart.getTime();
        const startOffsetMs = effectiveStart.getTime() - timelineStart.getTime();
        const durationMs = Math.max(86400000, effectiveEnd.getTime() - effectiveStart.getTime() + 86400000); // at least 1 day

        const leftPercent = Math.max(0, Math.min(99, (startOffsetMs / totalMs) * 100));
        const widthPercent = Math.max(1.5, Math.min(100 - leftPercent, (durationMs / totalMs) * 100));

        return {
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            isClippedLeft: start < timelineStart,
            isClippedRight: due > timelineEnd
        };
    };

    // Drag and Drop to Unscheduled
    const handleDragStart = (e, card) => {
        if (!canEdit) return;
        e.dataTransfer.setData('text/plain', card._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDropOnDate = async (e, targetDate) => {
        e.preventDefault();
        if (!canEdit) return;
        const cardId = e.dataTransfer.getData('text/plain');
        if (!cardId) return;

        const card = allFilteredCards.find(c => c._id === cardId);
        if (!card) return;

        const nextDate = new Date(targetDate);
        nextDate.setHours(17, 0, 0, 0); // end of standard workday

        try {
            const res = await updateCard(card._id, {
                ...card,
                dueDate: nextDate.toISOString(),
                version: card.version
            });
            const updatedCard = res.data?.card;
            if (updatedCard) {
                storeUpdateCard(updatedCard);
                socket?.emit('card:update', { boardId, card: updatedCard });
                toast.success(`Rescheduled "${card.title}" to ${targetDate.toLocaleDateString()}`);
            }
        } catch (err) {
            if (err.response?.status === 409) {
                toast.error('Conflict: card was modified by someone else');
            } else {
                toast.error('Failed to reschedule card');
            }
        }
    };

    const handleDropOnUnscheduled = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        const cardId = e.dataTransfer.getData('text/plain');
        if (!cardId) return;

        const card = allFilteredCards.find(c => c._id === cardId);
        if (!card || !card.dueDate) return;

        try {
            const res = await updateCard(card._id, {
                ...card,
                dueDate: null,
                version: card.version
            });
            const updatedCard = res.data?.card;
            if (updatedCard) {
                storeUpdateCard(updatedCard);
                socket?.emit('card:update', { boardId, card: updatedCard });
                toast.success(`Cleared due date from "${card.title}"`);
            }
        } catch {
            toast.error('Failed to unschedule card');
        }
    };

    const getPriorityGradient = (priority, labelColor) => {
        if (labelColor) return { backgroundColor: labelColor, borderColor: labelColor };
        switch (priority) {
            case 'urgent':
                return { background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', borderColor: '#B91C1C' };
            case 'high':
                return { background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', borderColor: '#C2410C' };
            case 'medium':
                return { background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', borderColor: '#CA8A04', color: '#1E293B' };
            default:
                return { background: '#0058be', borderColor: '#004395' }; // matching target HTML primary blue
        }
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-11rem)] min-h-[520px]">
            {/* Gantt Main Container */}
            <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col min-w-0">
                {/* Gantt Header Controls */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 flex-wrap gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">analytics</span>
                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Gantt Schedule</h2>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
                            <span className="text-xs px-2 py-0.5 text-slate-500 font-medium">Group:</span>
                            <button
                                onClick={() => setGroupBy('column')}
                                className={`px-3 py-1 text-xs rounded transition-all ${groupBy === 'column'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold border border-slate-200/60 dark:border-slate-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                Status
                            </button>
                            <button
                                onClick={() => setGroupBy('assignee')}
                                className={`px-3 py-1 text-xs rounded transition-all ${groupBy === 'assignee'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold border border-slate-200/60 dark:border-slate-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                Assignee
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-900/80 rounded-lg p-1 border border-slate-200/60 dark:border-slate-800">
                            <button
                                onClick={() => setViewDaysCount(14)}
                                className={`px-3 py-1 text-xs rounded transition-all ${viewDaysCount === 14
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold border border-slate-200/60 dark:border-slate-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                2 Weeks
                            </button>
                            <button
                                onClick={() => setViewDaysCount(28)}
                                className={`px-3 py-1 text-xs rounded transition-all ${viewDaysCount === 28
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold border border-slate-200/60 dark:border-slate-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                4 Weeks
                            </button>
                        </div>

                        <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                            <button
                                onClick={handlePrev}
                                className="px-2 py-1 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center"
                                title="Previous period"
                            >
                                <span className="material-symbols-outlined text-md">chevron_left</span>
                            </button>
                            <button
                                onClick={handleToday}
                                className="px-3 py-1 text-xs font-bold bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Today
                            </button>
                            <button
                                onClick={handleNext}
                                className="px-2 py-1 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center"
                                title="Next period"
                            >
                                <span className="material-symbols-outlined text-md">chevron_right</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowUnscheduled(!showUnscheduled)}
                            className={`p-1.5 rounded-lg border transition-all text-xs font-semibold flex items-center space-x-1 px-3 py-1.5 ${showUnscheduled
                                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-400'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
                            }`}
                            title="Toggle Unscheduled Tasks Sidebar"
                        >
                            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                            <span className="hidden md:inline">{unscheduledCards.length} Unscheduled</span>
                        </button>
                    </div>
                </div>

                {/* Timeline View Canvas */}
                <div className="flex flex-1 overflow-auto">
                    {/* Row Labels (Left Column) */}
                    <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 sticky left-0 z-20 shrink-0">
                        <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100/80 dark:bg-slate-900/80 font-bold select-none">
                            {groupBy === 'column' ? 'Board Columns / Status' : 'Team Members / Assignees'}
                        </div>

                        {/* Status / Assignee Sections */}
                        <div className="divide-y divide-slate-200/40 dark:divide-slate-800/60">
                            {groupedRows.map(group => (
                                <div key={group.id} className="py-2">
                                    {/* Section Header */}
                                    <div className="px-4 flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {group.type === 'assignee' && group.avatar !== undefined ? (
                                                <Avatar name={group.name} avatar={group.avatar} size={20} className="w-5 h-5 rounded-full shrink-0" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></div>
                                            )}
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{group.name}</span>
                                            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                                                {group.cards.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Section Cards or Empty state */}
                                    {group.cards.length === 0 ? (
                                        <div className="px-4 pl-8 py-3 italic text-slate-400 dark:text-slate-500 text-xs">
                                            No scheduled cards
                                        </div>
                                    ) : (
                                        group.cards.map(card => (
                                            <div
                                                key={card._id}
                                                onClick={() => setSelectedCard(card)}
                                                className="px-4 pl-8 min-h-[48px] py-1.5 flex flex-col justify-center cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors rounded-r-lg group/card"
                                            >
                                                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400">
                                                    {card.title}
                                                </div>
                                                <div className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                                                    <span>Due: {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    {card.checklist?.length > 0 && (
                                                        <span className="text-blue-500 ml-1">
                                                            ☑ {Math.round((card.checklist.filter(i => i.done).length / card.checklist.length) * 100)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Grid (Right Column) */}
                    <div className="flex-1 min-w-[800px] relative">
                        {/* Date Header */}
                        <div className="h-14 border-b border-slate-200 dark:border-slate-700 flex bg-white dark:bg-slate-800 sticky top-0 z-10 select-none">
                            {timelineDates.map((date, idx) => {
                                const isToday = isSameDay(new Date(), date);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                return (
                                    <div
                                        key={idx}
                                        onDragOver={e => canEdit && e.preventDefault()}
                                        onDrop={e => handleDropOnDate(e, date)}
                                        className={`flex-1 flex flex-col items-center justify-center border-r border-slate-200/60 dark:border-slate-700/60 min-w-[64px] transition-colors ${
                                            isToday ? 'bg-blue-500/10 dark:bg-blue-500/20' : isWeekend ? 'bg-slate-50/60 dark:bg-slate-900/40 opacity-80' : ''
                                        }`}
                                    >
                                        <span className={`text-[10px] uppercase font-mono tracking-wider ${
                                            isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                                        }`}>
                                            {date.toLocaleDateString(undefined, { weekday: 'short' })}
                                        </span>
                                        {isToday ? (
                                            <div className="w-6 h-6 mt-0.5 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-bold shadow-sm">
                                                {date.getDate()}
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold mt-0.5 text-slate-700 dark:text-slate-300">
                                                {date.getDate()}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid Rows & Task Bars Container */}
                        <div className="divide-y divide-slate-200/40 dark:divide-slate-800/60 relative">
                            {/* Background Grid Vertical Lines */}
                            <div className="absolute inset-0 grid grid-flow-col auto-cols-fr pointer-events-none z-0">
                                {timelineDates.map((date, idx) => {
                                    const isToday = isSameDay(new Date(), date);
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    return (
                                        <div
                                            key={idx}
                                            className={`border-r border-slate-200/40 dark:border-slate-800/40 h-full ${
                                                isToday ? 'bg-blue-500/[0.03] dark:bg-blue-400/[0.05]' : isWeekend ? 'bg-slate-100/30 dark:bg-slate-900/30' : ''
                                            }`}
                                        />
                                    );
                                })}
                            </div>

                            {/* Section Rows matching Left Column height */}
                            {groupedRows.map(group => (
                                <div key={group.id} className="py-2 relative z-1">
                                    {/* Spacer matching Section Header height */}
                                    <div className="h-[28px] mb-2"></div>

                                    {/* Card row slots */}
                                    {group.cards.length === 0 ? (
                                        <div className="min-h-[40px] py-3"></div>
                                    ) : (
                                        group.cards.map(card => {
                                            const geom = getBarGeometry(card);
                                            const gradientStyle = getPriorityGradient(card.priority, card.labels?.[0]?.color);

                                            return (
                                                <div key={card._id} className="min-h-[48px] py-1.5 relative flex items-center">
                                                    {geom && (
                                                        <div
                                                            draggable={canEdit}
                                                            onDragStart={e => handleDragStart(e, card)}
                                                            onClick={() => setSelectedCard(card)}
                                                            className={`absolute h-6 sm:h-7 rounded-full shadow-sm cursor-pointer flex items-center px-3 gap-2 text-white text-xs font-bold transition-all hover:scale-[1.01] hover:shadow-md select-none group/bar ${
                                                                geom.isClippedLeft ? 'rounded-l-none border-l-2 border-dashed border-white/80' : ''
                                                            } ${
                                                                geom.isClippedRight ? 'rounded-r-none border-r-2 border-dashed border-white/80' : ''
                                                            }`}
                                                            style={{
                                                                left: geom.left,
                                                                width: geom.width,
                                                                ...gradientStyle,
                                                                color: gradientStyle.color || '#FFFFFF'
                                                            }}
                                                            title={`${card.title} (Due: ${new Date(card.dueDate).toLocaleDateString()})`}
                                                        >
                                                            <span className="truncate flex-1 drop-shadow-sm">{card.title}</span>
                                                            
                                                            {card.assignees?.length > 0 ? (
                                                                <div className="ml-auto flex -space-x-1.5 shrink-0">
                                                                    {card.assignees.slice(0, 2).map((a, i) => (
                                                                        <div key={a._id || i} className="ring-1 ring-white/60 rounded-full overflow-hidden shrink-0">
                                                                            <Avatar name={a.username} avatar={a.avatar} size={18} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="ml-auto w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                                    {card.title.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Unscheduled Tasks */}
            {showUnscheduled && (
                <aside className="w-full lg:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col shrink-0 overflow-hidden">
                    <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">inventory_2</span>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-200">
                                Unscheduled ({unscheduledCards.length})
                            </h3>
                        </div>
                        <button
                            onClick={() => setShowUnscheduled(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden p-1"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                        {unscheduledCards.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center p-6 text-center h-full min-h-[240px]">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-slate-400 text-3xl">task_alt</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">All tasks scheduled</p>
                                <p className="text-xs text-slate-400 px-2 leading-relaxed">Drag tasks from here onto a timeline date column to schedule them.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {unscheduledCards.map(card => (
                                    <div
                                        key={card._id}
                                        draggable={canEdit}
                                        onDragStart={e => handleDragStart(e, card)}
                                        onClick={() => setSelectedCard(card)}
                                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition cursor-grab active:cursor-grabbing select-none flex flex-col gap-2 relative overflow-hidden"
                                        style={{
                                            borderTop: card.labels?.[0]?.color ? `3px solid ${card.labels[0].color}` : undefined
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                card.priority === 'urgent' ? 'bg-red-500' :
                                                card.priority === 'high' ? 'bg-orange-500' :
                                                card.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-600'
                                            }`} />
                                            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 flex-1">
                                                {card.title}
                                            </h4>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            {card.labels?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {card.labels.slice(0, 2).map((l, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border"
                                                            style={{ color: l.color, borderColor: `${l.color}30`, backgroundColor: `${l.color}15` }}
                                                        >
                                                            {l.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div />
                                            )}

                                            {card.assignees?.length > 0 && (
                                                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                                    {card.assignees.slice(0, 3).map((a, idx) => (
                                                        <div key={a._id || idx} className="ring-1.5 ring-white dark:ring-slate-800 rounded-full overflow-hidden shrink-0">
                                                            <Avatar name={a.username} avatar={a.avatar} size={18} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            )}

            {/* Modal for viewing card details */}
            {selectedCard && (
                <CardDetail
                    card={selectedCard}
                    columnId={selectedCard.column}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
};

export default BoardTimelineView;
