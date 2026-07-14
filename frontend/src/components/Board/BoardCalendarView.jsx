import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { updateCard } from '../../api/card.api';
import useBoardStore from '../../store/boardStore';
import useSocketStore from '../../store/socketStore';
import Avatar from '../../UI/Avatar';
import CardDetail from '../Card/CardDetail';

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

const BoardCalendarView = ({ boardId, filteredCards }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCard, setSelectedCard] = useState(null);

    const { updateCard: storeUpdateCard, boardRole } = useBoardStore();
    const socket = useSocketStore(s => s.socket);
    const canEdit = ['admin', 'project_manager', 'developer'].includes(boardRole);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate 42 calendar grid days (prev month filler, current month, next month filler)
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayIndex = getFirstDayOfMonth(year, month);
        const days = [];

        // Previous month padding
        const prevYear = month === 0 ? year - 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
        const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

        for (let i = firstDayIndex - 1; i >= 0; i--) {
            days.push({
                date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month padding to fill out a 6-week grid
        const totalGridSlots = 42;
        const nextMonthPadding = totalGridSlots - days.length;
        const nextYear = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 0 : month + 1;

        for (let i = 1; i <= nextMonthPadding; i++) {
            days.push({
                date: new Date(nextYear, nextMonth, i),
                isCurrentMonth: false
            });
        }

        return days;
    }, [year, month]);

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

    // Month Navigation Controls
    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Drag-and-Drop Event Handlers
    const handleDragStart = (e, card) => {
        if (!canEdit) return;
        e.dataTransfer.setData('text/plain', card._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDropOnDay = async (e, targetDate) => {
        e.preventDefault();
        if (!canEdit) return;
        const cardId = e.dataTransfer.getData('text/plain');
        if (!cardId) return;

        const card = allFilteredCards.find(c => c._id === cardId);
        if (!card) return;

        // Set target date, preserve existing timezone boundaries by setting local time mapping
        const nextDate = new Date(targetDate);
        nextDate.setHours(12, 0, 0, 0); // standard mid-day time

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
            {/* Left: Calendar Workspace */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 flex flex-col h-full shadow-sm overflow-hidden">

                {/* Calendar Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">calendar_month</span>
                        {monthNames[month]} {year}
                    </h2>
                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1.5 text-slate-600 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center"
                            title="Previous Month"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button
                            onClick={handleToday}
                            className="px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 rounded-lg hover:text-blue-700 dark:hover:text-blue-300 shadow-sm border border-slate-200/20 transition-all active:scale-[0.98]"
                        >
                            Today
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-1.5 text-slate-600 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center"
                            title="Next Month"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 mb-1 shrink-0 text-center">
                    {dayNames.map(day => (
                        <div key={day} className="text-xs font-extrabold capitalize tracking-wider text-slate-400 dark:text-slate-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Month Grid */}
                <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1 overflow-y-auto min-h-0 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/40 dark:border-slate-850">
                    {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                        const dayCards = scheduledCards.filter(c => isSameDay(c.dueDate, date));
                        const isToday = isSameDay(new Date(), date);
                        return (
                            <div
                                key={idx}
                                onDragOver={e => canEdit && e.preventDefault()}
                                onDrop={e => handleDropOnDay(e, date)}
                                className={`flex flex-col bg-white dark:bg-slate-800/80 p-2 border border-slate-100/60 dark:border-slate-800/20 min-h-[64px] max-h-[120px] overflow-y-auto hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors duration-100 group relative rounded-xl ${!isCurrentMonth ? 'opacity-40 bg-slate-50/30 dark:bg-slate-800/30' : ''
                                    } ${isToday ? 'ring-2 ring-blue-500/80 dark:ring-blue-400' : ''}`}
                            >
                                <span className={`text-xs font-bold self-end rounded-full w-5 h-5 flex items-center justify-center mb-1 select-none ${isToday
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-650 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                                    }`}>
                                    {date.getDate()}
                                </span>

                                <div className="flex-1 flex flex-col gap-1.5 overflow-x-hidden min-h-0">
                                    {dayCards.map(card => (
                                        <div
                                            key={card._id}
                                            draggable={canEdit}
                                            onDragStart={e => handleDragStart(e, card)}
                                            onClick={() => setSelectedCard(card)}
                                            className="px-2 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 cursor-grab active:cursor-grabbing hover:shadow-sm truncate select-none transition-all flex flex-col gap-1 shrink-0"
                                            style={{
                                                borderLeft: card.labels?.[0]?.color
                                                    ? `3px solid ${card.labels[0].color}`
                                                    : '3px solid transparent'
                                            }}
                                            title={card.title}
                                        >
                                            <span className="truncate">{card.title}</span>
                                            {card.assignees?.length > 0 && (
                                                <div className="flex -space-x-1 shrink-0 mt-0.5 justify-end">
                                                    {card.assignees.slice(0, 2).map((a, i) => (
                                                        <div key={a._id || i} className="ring-1 ring-white dark:ring-slate-900 rounded-full overflow-hidden">
                                                            <Avatar name={a.username} avatar={a.avatar} size={13} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Unscheduled Drawer / Sidebar */}
            <div
                onDragOver={e => canEdit && e.preventDefault()}
                onDrop={handleDropOnUnscheduled}
                className="bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-slate-200 dark:border-slate-750/80 p-5 flex flex-col h-full overflow-hidden shadow-inner"
            >
                <div className="shrink-0 mb-4">
                    <h3 className="text-sm font-extrabold capitalize tracking-wider text-slate-455 dark:text-slate-400 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">assignment_late</span>
                        Unscheduled Tasks
                    </h3>
                    <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
                        Drag cards from this bin onto the calendar to assign due dates, or drag them back here to clear dates.
                    </p>
                </div>

                {/* Unscheduled List container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {unscheduledCards.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-3xl mb-2">check_circle</span>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">All tasks scheduled</p>
                        </div>
                    ) : (
                        unscheduledCards.map(card => (
                            <div
                                key={card._id}
                                draggable={canEdit}
                                onDragStart={e => handleDragStart(e, card)}
                                onClick={() => setSelectedCard(card)}
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 hover:shadow-md hover:border-slate-350 dark:hover:border-slate-600 transition cursor-grab active:cursor-grabbing select-none flex flex-col gap-2 relative overflow-hidden"
                                style={{
                                    borderTop: card.labels?.[0]?.color
                                        ? `3px solid ${card.labels[0].color}`
                                        : undefined
                                }}
                            >
                                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                                    {card.title}
                                </h4>

                                <div className="flex items-center justify-between gap-2 mt-1">
                                    {card.labels?.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {card.labels.slice(0, 2).map((l, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border"
                                                    style={{ color: l.color, borderColor: `${l.color}25`, backgroundColor: `${l.color}12` }}
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
                        ))
                    )}
                </div>
            </div>

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

export default BoardCalendarView;
