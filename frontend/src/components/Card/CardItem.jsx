import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardDetail from './CardDetail';

const CardItem = ({ card, columnId, isDragging: externalDragging }) => {
    const [open, setOpen] = useState(false);

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

    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
    const isDueSoon = card.dueDate && !isOverdue && (new Date(card.dueDate) - new Date()) < 86400000 * 2;
    const doneItems  = card.checklist?.filter(i => i.done).length || 0;
    const totalItems = card.checklist?.length || 0;
    const progress   = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    const firstColor = card.labels?.[0]?.color;

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
                    className="w-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-grab active:cursor-grabbing p-3.5 select-none overflow-hidden"
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
                                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border"
                                >
                                    {l.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <h4 className="text-sm font-semibold text-slate-800 leading-snug group-hover/card:text-indigo-600 transition-colors duration-150">
                        {card.title || "Untitled Task"}
                    </h4>

                    {totalItems > 0 && (
                        <div className="mt-3 mb-1">
                            <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                                <span className="text-slate-400 flex items-center gap-1">
                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    {doneItems}/{totalItems} Tasks
                                </span>
                                <span className={progress === 100 ? 'text-emerald-600' : 'text-slate-500'}>
                                    {progress}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-slate-400">
                        <div className="flex items-center gap-2 flex-wrap">
                            
                            {card.dueDate && (
                                <div 
                                    className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                                        isOverdue
                                            ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                                            : isDueSoon
                                            ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                            : 'bg-slate-50 text-slate-500 border-slate-200/80'
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
                                <div className="text-slate-400/80" title="This card has a description.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h12M4 18h8" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {card.assignees?.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                                {card.assignees.slice(0, 3).map((a, idx) => (
                                    <div 
                                        key={a._id || idx}
                                        className="w-5.5 h-5.5 rounded-full ring-2 ring-white bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center overflow-hidden shrink-0"
                                        title={a.username || 'Assignee'}
                                    >
                                        {a.avatar ? (
                                            <img src={a.avatar} alt={a.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{(a.username || '?').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                ))}
                                {card.assignees.length > 3 && (
                                    <div className="w-5.5 h-5.5 rounded-full ring-2 ring-white bg-slate-200 text-[9px] font-bold text-slate-600 flex items-center justify-center shrink-0">
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