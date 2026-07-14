import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardDetail from './CardDetail';
import { updateCard } from '../../api/card.api';
import useBoardStore from '../../store/boardStore';
import useSocketStore from '../../store/socketStore';
import toast from 'react-hot-toast';
import Avatar from '../../UI/Avatar';

const CardItem = ({ card, columnId, isDragging: externalDragging }) => {
    const [open, setOpen] = useState(false);
    const [showChecklistDropdown, setShowChecklistDropdown] = useState(false);

    const { updateCard: storeUpdateCard, boardRole, board } = useBoardStore();
    const socket = useSocketStore(s => s.socket);
    const boardId = board?._id;
    const canEdit = ['admin', 'project_manager', 'developer'].includes(boardRole);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card._id,
        data: { type: 'card', card, columnId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging || externalDragging ? 0.4 : 1,
        width: '100%',
    };

    const column = board?.columns?.find(c => c._id === columnId);
    const isDoneColumn = column?.name?.toLowerCase() === 'done';

    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && !isDoneColumn;
    const isDueSoon = card.dueDate && !isOverdue && (new Date(card.dueDate) - new Date()) < 86400000 * 2 && !isDoneColumn;
    const doneItems = card.checklist?.filter(i => i.done).length || 0;
    const totalItems = card.checklist?.length || 0;
    const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    const firstColor = card.labels?.[0]?.color;

    const handleChecklistItemToggle = async (e, itemIdOrIdx) => {
        e.stopPropagation();
        if (!canEdit) {
            toast.error("You don't have permission to edit cards");
            return;
        }

        const updatedChecklist = card.checklist.map((item, idx) => {
            const matches = item._id ? item._id === itemIdOrIdx : idx === itemIdOrIdx;
            return matches ? { ...item, done: !item.done } : item;
        });

        try {
            const res = await updateCard(card._id, {
                ...card,
                checklist: updatedChecklist,
                version: card.version
            });
            const updatedCard = res.data?.card;
            if (updatedCard) {
                storeUpdateCard(updatedCard);
                socket?.emit('card:update', { boardId, card: updatedCard });
            }
        } catch (err) {
            if (err.response?.status === 409) {
                toast.error('Conflict: card was modified by someone else');
            } else {
                toast.error('Failed to update checklist item');
            }
        }
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className="group/card relative outline-none"
            >
                <div
                    onClick={() => setOpen(true)}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-grab active:cursor-grabbing p-3.5 select-none overflow-hidden"
                    style={{
                        borderTop: firstColor ? `3.5px solid ${firstColor}` : undefined
                    }}
                >
                    {card.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                            {card.labels.map((l, i) => (
                                <span
                                    key={i}
                                    style={{
                                        backgroundColor: `${l.color}15`,
                                        color: l.color,
                                        borderColor: `${l.color}30`
                                    }}
                                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-md capitalize tracking-wider border"
                                >
                                    {l.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors duration-150">
                        {card.title || "Untitled Task"}
                    </h4>

                    {totalItems > 0 && (
                        <div className="mt-3 mb-1">
                            <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    <span>{doneItems}/{totalItems} Tasks</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowChecklistDropdown(!showChecklistDropdown);
                                        }}
                                        className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition-colors ml-0.5 flex items-center cursor-pointer"
                                        title="Quick view checklist"
                                    >
                                        <span className="material-symbols-outlined text-[16px] leading-none">
                                            {showChecklistDropdown ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                                        </span>
                                    </button>
                                </span>
                                <span className={progress === 100 ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}>
                                    {progress}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {showChecklistDropdown && (
                                <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 max-h-32 overflow-y-auto custom-scrollbar shadow-inner">
                                    {card.checklist.map((item, idx) => (
                                        <label
                                            key={item._id || idx}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-start gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 select-none transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={item.done}
                                                onChange={(e) => handleChecklistItemToggle(e, item._id || idx)}
                                                className="w-3.5 h-3.5 rounded mt-0.5 text-blue-650 border-slate-300 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-750 cursor-pointer"
                                            />
                                            <span className={`text-[11px] leading-tight font-medium ${item.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                                {item.text}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2 text-slate-400">
                        <div className="flex items-center gap-2 flex-wrap">

                            {card.dueDate && (
                                <div
                                    className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors ${isOverdue
                                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40'
                                        : isDueSoon
                                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40'
                                            : 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-800'
                                        }`}
                                    title={isOverdue ? 'Overdue' : isDueSoon ? 'Due soon' : 'Due date'}
                                >
                                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>
                                        {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            )}

                            {card.description && (
                                <div className="text-slate-400/80 dark:text-slate-500" title="This card has a description.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h12M4 18h8" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {card.assignees?.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                                {card.assignees.slice(0, 3).map((a, idx) => (
                                    <Avatar
                                        key={a._id || idx}
                                        name={a.username}
                                        avatar={a.avatar}
                                        size={22}
                                    />
                                ))}
                                {card.assignees.length > 3 && (
                                    <div className="w-5.5 h-5.5 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                                        +{card.assignees.length - 3}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {open && <CardDetail card={card} columnId={columnId} onClose={() => setOpen(false)} />}
        </>
    );
};

export default CardItem;
