import { useState, useMemo } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FixedSizeList as List } from 'react-window';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import CardItem from '../Card/CardItem';
import { deleteColumn, updateColumn } from '../../api/column.api';
import useBoardStore from '../../store/boardStore';

const CARD_HEIGHT = 88; // Adjusted precisely to account for margin/padding of refactored cards
const VIRTUALIZE_THRESHOLD = 8; // Virtualizing at 2 breaks natural layouts; 8+ optimizes heavy boards

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

    const style = { 
        transform: CSS.Transform.toString(transform), 
        transition, 
        opacity: isDragging ? 0.3 : 1 
    };

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
            className={`shrink-0 w-72 flex flex-col bg-slate-100/80 border border-slate-200/60 rounded-2xl max-h-[calc(100vh-6.5rem)] transition-shadow duration-200 ${isDragging ? 'shadow-none' : 'shadow-sm'}`}>

            {/* Column Draggable Header Control Element */}
            <div className="flex items-center justify-between pl-4 pr-2.5 pt-3.5 pb-2.5 cursor-grab active:cursor-grabbing select-none group/header"
                {...attributes} {...listeners}>
                {editingName ? (
                    <input autoFocus value={colName}
                        onChange={e => setColName(e.target.value)}
                        onBlur={handleRenameColumn}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameColumn(); if (e.key === 'Escape') setEditingName(false); }}
                        className="flex-1 h-8 px-2.5 rounded-xl border border-indigo-500 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        onClick={e => e.stopPropagation()} />
                ) : (
                    <h3 className="font-bold text-sm text-slate-800 flex-1 truncate pr-2 tracking-tight"
                        onDoubleClick={() => setEditingName(true)}>
                        {column.name}
                        <span className="ml-2 bg-slate-200/60 text-slate-500 font-bold text-[11px] px-2 py-0.5 rounded-full">
                            {filteredCards.length}
                        </span>
                    </h3>
                )}
                
                <button onClick={e => { e.stopPropagation(); handleDeleteColumn(); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/header:opacity-100 focus:opacity-100"
                    title="Delete column">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 1l12 12M13 1L1 13"/>
                    </svg>
                </button>
            </div>

            {/* Scrollable/Virtual Card Body Canvas */}
            <div className={`flex-1 px-3 custom-scrollbar min-h-[20px] ${useVirtualize ? 'overflow-hidden' : 'overflow-y-auto pb-1'}`}>
                <SortableContext items={filteredCards.map(c => c._id)} strategy={verticalListSortingStrategy}>
                    {useVirtualize ? (
                        <List
                            height={Math.min(filteredCards.length * CARD_HEIGHT, 440)}
                            itemCount={filteredCards.length}
                            itemSize={CARD_HEIGHT}
                            width="100%"
                            className="custom-scrollbar"
                        >
                            {({ index, style }) => (
                                <div style={{ ...style, paddingTop: '2px', paddingBottom: '6px' }}>
                                    <CardItem card={filteredCards[index]} columnId={column._id} />
                                </div>
                            )}
                        </List>
                    ) : (
                        <>
                            {filteredCards.length === 0 && !addingCard && (
                                <div className="text-center text-slate-400 text-xs font-semibold py-6 border-2 border-dashed border-slate-200 rounded-xl my-1 bg-slate-50/40 select-none">
                                    Drop cards here
                                </div>
                            )}
                            {filteredCards.map(card => (
                                <div key={card._id} className="pb-2">
                                    <CardItem card={card} columnId={column._id} />
                                </div>
                            ))}
                        </>
                    )}
                </SortableContext>
            </div>

            {/* Dynamic Card Addition Execution Component */}
            <div className="p-2 pt-1.5 shrink-0 border-t border-slate-200/20">
                {addingCard ? (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-150">
                        <textarea autoFocus rows={2} value={newCardTitle}
                            onChange={e => setNewCardTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); } if (e.key === 'Escape') setAddingCard(false); }}
                            placeholder="Type a title for this card..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none mb-2" />
                        <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setAddingCard(false)}
                                className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleAddCard}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm shadow-indigo-100 transition-colors">
                                Add card
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setAddingCard(true)}
                        className="w-full text-left text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 text-xs font-bold px-2.5 py-2 rounded-xl transition-all flex items-center gap-2 group/addbtn">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" className="text-slate-400 group-hover/addbtn:text-indigo-600 transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Add a card</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ColumnItem;