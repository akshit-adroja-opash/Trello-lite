import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardDetail from './CardDetail';
import Avatar from '../../UI/Avatar';

const CardItem = ({ card, columnId, isDragging: externalDragging }) => {
    const [open, setOpen] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card._id,
        data: { type: 'card', card, columnId },
    });

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging || externalDragging ? 0.4 : 1 };

    const isOverdue  = card.dueDate && new Date(card.dueDate) < new Date();
    const isDueSoon  = card.dueDate && !isOverdue && (new Date(card.dueDate) - new Date()) < 86400000 * 2;
    const doneItems  = card.checklist?.filter(i => i.done).length || 0;
    const totalItems = card.checklist?.length || 0;

    return (
        <>
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}
                onClick={() => setOpen(true)}
                className="bg-surface rounded-xl shadow-sm border border-outline-variant p-3 mb-1.5 cursor-pointer hover:shadow hover:border-primary/30 hover:-translate-y-0.5 transition-all select-none group">

                {/* Labels */}
                {card.labels?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {card.labels.map((l, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                                style={{ backgroundColor: l.color || '#4F46E5' }}>
                                {l.name}
                            </span>
                        ))}
                    </div>
                )}

                <p className="text-sm font-medium text-on-surface leading-snug">{card.title}</p>

                {/* Meta */}
                <div className="flex items-center justify-between mt-2 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {card.dueDate && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-lg font-medium ${
                                isOverdue  ? 'bg-error text-on-error' :
                                isDueSoon  ? 'bg-warning/20 text-warning' :
                                             'bg-surface-raised text-on-surface-variant'}`}>
                                📅 {new Date(card.dueDate).toLocaleDateString()}
                            </span>
                        )}
                        {totalItems > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-lg font-medium ${
                                doneItems === totalItems ? 'bg-success/15 text-success' : 'bg-surface-raised text-on-surface-variant'}`}>
                                ☑ {doneItems}/{totalItems}
                            </span>
                        )}
                        {card.description && (
                            <span className="text-on-surface-variant text-xs" title="Has description">≡</span>
                        )}
                    </div>
                    {card.assignees?.length > 0 && (
                        <div className="flex -space-x-1.5 shrink-0">
                            {card.assignees.slice(0, 3).map(a => (
                                <Avatar key={a._id || a} name={a.username || '?'} avatar={a.avatar} size={20} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {open && <CardDetail card={card} columnId={columnId} onClose={() => setOpen(false)} />}
        </>
    );
};

export default CardItem;
