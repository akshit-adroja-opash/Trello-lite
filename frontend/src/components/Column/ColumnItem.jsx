import { useState, useMemo } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import CardItem from '../Card/CardItem';
import { deleteColumn, updateColumn } from '../../api/column.api';
import useBoardStore from '../../store/boardStore';

const CARD_HEIGHT = 80;
const VIRTUALIZE_THRESHOLD = 100;

const ColumnItem = ({ column, cards, searchQuery, filterLabel, onAddCard, boardId, socket }) => {
    const [addingCard, setAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [editingName, setEditingName] = useState(false);
    const [colName, setColName] = useState(column.name);

    const { removeColumn, updateColumn: storeUpdateColumn } = useBoardStore();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: column._id,
        data: { type: 'column', column },
    });

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

    const filteredCards = useMemo(() => cards.filter(card => {
        if (searchQuery && !card.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterLabel && !card.labels?.some(l => l.name === filterLabel)) return false;
        return true;
    }), [cards, searchQuery, filterLabel]);

    const handleAddCard = async () => {
        if (!newCardTitle.trim()) return;
        await onAddCard(column._id, newCardTitle.trim());
        setNewCardTitle('');
        setAddingCard(false);
    };

    const handleRenameColumn = async () => {
        if (!colName.trim() || colName === column.name) { setEditingName(false); return; }
        try {
            const res = await updateColumn(column._id, { name: colName });
            const updated = res.data?.column;
            storeUpdateColumn(updated);
            socket?.emit('column:update', { boardId, column: updated });
        } catch { toast.error('Failed to rename column'); }
        setEditingName(false);
    };

    const handleDeleteColumn = async () => {
        if (!confirm(`Delete column "${column.name}"?`)) return;
        try {
            await deleteColumn(column._id);
            removeColumn(column._id);
            socket?.emit('column:delete', { boardId, columnId: column._id });
        } catch { toast.error('Failed to delete column'); }
    };

    const useVirtualize = filteredCards.length > VIRTUALIZE_THRESHOLD;

    return (
        <div ref={setNodeRef} style={style}
            className="shrink-0 w-64 flex flex-col bg-slate-100 rounded-2xl shadow max-h-[calc(100vh-7rem)]">

            {/* Column header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2 cursor-grab active:cursor-grabbing"
                {...attributes} {...listeners}>
                {editingName ? (
                    <input autoFocus value={colName}
                        onChange={e => setColName(e.target.value)}
                        onBlur={handleRenameColumn}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameColumn(); if (e.key === 'Escape') setEditingName(false); }}
                        className="flex-1 h-7 px-2 rounded-lg border border-primary bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onClick={e => e.stopPropagation()} />
                ) : (
                    <h3 className="font-semibold text-sm text-on-surface flex-1 truncate select-none"
                        onDoubleClick={() => setEditingName(true)}>
                        {column.name}
                        <span className="ml-1.5 text-on-surface-variant font-normal text-xs">{filteredCards.length}</span>
                    </h3>
                )}
                <button onClick={e => { e.stopPropagation(); handleDeleteColumn(); }}
                    className="ml-1 w-6 h-6 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container text-xs transition"
                    title="Delete column">✕</button>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-2 min-h-[40px]">
                {useVirtualize ? (
                    <SortableContext items={filteredCards.map(c => c._id)} strategy={verticalListSortingStrategy}>
                        <div style={{ height: Math.min(filteredCards.length * CARD_HEIGHT, 480), overflowY: 'auto' }}>
                            {filteredCards.map(card => (
                                <div key={card._id} style={{ height: CARD_HEIGHT }}>
                                    <CardItem card={card} columnId={column._id} />
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                ) : (
                    <SortableContext items={filteredCards.map(c => c._id)} strategy={verticalListSortingStrategy}>
                        {filteredCards.length === 0 && (
                            <div className="text-center text-on-surface-variant text-xs py-5 border-2 border-dashed border-outline-variant rounded-xl my-1">
                                Drop cards here
                            </div>
                        )}
                        {filteredCards.map(card => (
                            <CardItem key={card._id} card={card} columnId={column._id} />
                        ))}
                    </SortableContext>
                )}
            </div>

            {/* Add card */}
            <div className="px-2 pb-2 pt-1">
                {addingCard ? (
                    <div>
                        <textarea autoFocus rows={2} value={newCardTitle}
                            onChange={e => setNewCardTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); } if (e.key === 'Escape') setAddingCard(false); }}
                            placeholder="Card title…"
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none mb-1.5" />
                        <div className="flex gap-2">
                            <button onClick={handleAddCard}
                                className="bg-primary hover:bg-primary-dark text-on-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                                Add card
                            </button>
                            <button onClick={() => setAddingCard(false)}
                                className="text-on-surface-variant text-xs px-3 py-1.5 rounded-lg hover:bg-surface-overlay transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setAddingCard(true)}
                        className="w-full text-left text-on-surface-variant hover:text-primary hover:bg-primary-bg text-xs font-medium px-2 py-2 rounded-xl transition flex items-center gap-1.5">
                        <span className="text-base leading-none">+</span> Add a card
                    </button>
                )}
            </div>
        </div>
    );
};

export default ColumnItem;
