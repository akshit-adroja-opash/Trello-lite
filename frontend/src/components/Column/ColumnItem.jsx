import { useState, useMemo } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import CardItem from '../Card/CardItem';
import { deleteColumn, updateColumn } from '../../api/column.api';
import { createCard as createCardApi, getBoardTemplates } from '../../api/card.api';
import { generateIndexBetween } from '../../utils/fractionalIndex';
import useBoardStore from '../../store/boardStore';
import useAuthStore from '../../store/authstore';
import { canDeleteColumn, canEditColumn, canCreateCard } from '../../utils/rolePermissions'; 

const getColumnColorClasses = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('backlog') || lowerName.includes('todo') || lowerName.includes('to do')) {
        return {
            bg: 'bg-blue-50/60 dark:bg-blue-950/15',
            border: 'border-blue-200/60 dark:border-blue-900/30',
            text: 'text-blue-800 dark:text-blue-300',
            badge: 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
            bar: 'bg-blue-500/85 dark:bg-blue-400/85'
        };
    }
    if (lowerName.includes('progress') || lowerName.includes('active') || lowerName.includes('doing')) {
        return {
            bg: 'bg-amber-50/65 dark:bg-amber-950/15',
            border: 'border-amber-200/60 dark:border-amber-900/30',
            text: 'text-amber-800 dark:text-amber-300',
            badge: 'bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
            bar: 'bg-amber-500/85 dark:bg-amber-400/85'
        };
    }
    if (lowerName.includes('review') || lowerName.includes('testing') || lowerName.includes('qa')) {
        return {
            bg: 'bg-indigo-50/60 dark:bg-indigo-950/15',
            border: 'border-indigo-200/60 dark:border-indigo-900/30',
            text: 'text-indigo-800 dark:text-indigo-300',
            badge: 'bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
            bar: 'bg-indigo-500/85 dark:bg-indigo-400/85'
        };
    }
    if (lowerName.includes('done') || lowerName.includes('complete') || lowerName.includes('finish')) {
        return {
            bg: 'bg-emerald-50/60 dark:bg-emerald-950/15',
            border: 'border-emerald-200/60 dark:border-emerald-900/30',
            text: 'text-emerald-800 dark:text-emerald-300',
            badge: 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
            bar: 'bg-emerald-500/85 dark:bg-emerald-400/85'
        };
    }
    return {
        bg: 'bg-slate-100/80 dark:bg-slate-800/40',
        border: 'border-slate-200/60 dark:border-slate-700/50',
        text: 'text-slate-800 dark:text-white',
        badge: 'bg-slate-200/60 dark:bg-slate-700/50 text-slate-505 dark:text-slate-400',
        bar: 'bg-slate-400/85 dark:bg-slate-500/85'
    };
};

const ColumnItem = ({ column, cards, searchQuery, filterLabel, onAddCard, boardId, socket }) => {
  const role = useBoardStore((s) => s.boardRole);
    const [addingCard, setAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [editingName, setEditingName] = useState(false);
    const [colName, setColName] = useState(column.name);

    const [templates, setTemplates] = useState([]);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);

    const { removeColumn, updateColumn: storeUpdateColumn, addCard } = useBoardStore();

    const handleOpenTemplates = async () => {
        setShowTemplateMenu(!showTemplateMenu);
        if (!showTemplateMenu) {
            try {
                const res = await getBoardTemplates(boardId);
                setTemplates(res.data?.templates || []);
            } catch {
                toast.error("Failed to load card templates");
            }
        }
    };

    const handleAddCardFromTemplate = async (template) => {
        const colCards = cards || [];
        const last = colCards[colCards.length - 1];
        const order = generateIndexBetween(last?.order || null, null);
        try {
            const res = await createCardApi({
                title: template.title,
                description: template.description || '',
                columnId: column._id,
                boardId,
                order,
                labels: template.labels?.map(l => ({ name: l.name, color: l.color })) || [],
                checklist: template.checklist?.map(item => ({ text: item.text, done: false })) || []
            });
            const card = res.data?.card;
            if (card) {
                addCard(card);
                socket?.emit('card:create', { boardId, card });
                toast.success(`Created card from template "${template.title}"`);
                setAddingCard(false);
                setShowTemplateMenu(false);
            }
        } catch (err) {
            toast.error('Failed to create card from template');
        }
    };

    const colors = getColumnColorClasses(column.name);

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
    if (!canEditColumn(role)) return; // prevent rename if not allowed
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
    if (!canDeleteColumn(role)) return; // prevent delete if not allowed
        if (!confirm(`Delete column "${column.name}"?`)) return;
        try {
            await deleteColumn(column._id);
            removeColumn(column._id);
            socket?.emit('column:delete', { boardId, columnId: column._id });
        } catch { toast.error('Failed to delete column'); }
    };


    return (
        <div ref={setNodeRef} style={style}
            className={`shrink-0 w-72 flex flex-col ${colors.bg} border ${colors.border} rounded-2xl max-h-[calc(100vh-6.5rem)] transition-shadow duration-200 ${isDragging ? 'shadow-none' : 'shadow-sm'}`}>

            <div className={`h-1 w-full rounded-t-2xl ${colors.bar}`} />

            <div className="flex items-center justify-between pl-4 pr-2.5 pt-3.5 pb-2.5 cursor-grab active:cursor-grabbing select-none group/header"
                {...attributes} {...listeners}>
                {editingName ? (
                    <input autoFocus value={colName}
                        onChange={e => setColName(e.target.value)}
                        onBlur={handleRenameColumn}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameColumn(); if (e.key === 'Escape') setEditingName(false); }}
                        className="flex-1 h-8 px-2.5 rounded-xl border border-indigo-500 dark:border-indigo-600 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5"
                        onClick={e => e.stopPropagation()} />
                ) : (
                    <h3 className={`font-bold text-sm ${colors.text} flex-1 truncate pr-2 tracking-tight`}
                        onDoubleClick={() => canEditColumn(role) && setEditingName(true)}>
                        {column.name}
                        <span className={`ml-2 ${colors.badge} font-bold text-[11px] px-2 py-0.5 rounded-full`}>
                            {filteredCards.length}
                        </span>
                    </h3>
                )}
                
                <button onClick={e => { e.stopPropagation(); handleDeleteColumn(); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-all opacity-0 group-hover/header:opacity-100 focus:opacity-100"
                    title="Delete column"
                    style={{ display: canDeleteColumn(role) ? undefined : 'none' }}>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 1l12 12M13 1L1 13"/>
                    </svg>
                </button>
            </div>

            <div className="flex-1 px-3 custom-scrollbar min-h-[20px] overflow-y-auto pb-1">
                <SortableContext items={filteredCards.map(c => c._id)} strategy={verticalListSortingStrategy}>
                    {filteredCards.length === 0 && !addingCard && (
                        <div className="text-center text-slate-450 dark:text-slate-500 text-xs font-semibold py-6 border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl my-1 bg-slate-50/40 dark:bg-slate-900/10 select-none">
                            Drop cards here
                        </div>
                    )}
                    {filteredCards.map(card => (
                        <div key={card._id} className="pb-2">
                            <CardItem card={card} columnId={column._id} />
                        </div>
                    ))}
                </SortableContext>
            </div>

            <div className="p-2 pt-1.5 shrink-0 border-t border-slate-200/20 dark:border-slate-700/30">
                {addingCard ? (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in zoom-in-95 duration-150">
                        <textarea autoFocus rows={2} value={newCardTitle}
                            onChange={e => setNewCardTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); } if (e.key === 'Escape') setAddingCard(false); }}
                            placeholder="Type a title for this card..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none mb-2" />
                        <div className="flex gap-1.5 items-center justify-between">
                            <div className="relative">
                                <button onClick={handleOpenTemplates}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-350 text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Create from template"
                                >
                                    <span className="material-symbols-outlined text-[16px]">bookmark</span>
                                    <span>Template</span>
                                </button>
                                
                                {showTemplateMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Select Card Template
                                        </div>
                                        <div className="max-h-40 overflow-y-auto custom-scrollbar mt-1">
                                            {templates.length > 0 ? (
                                                templates.map(temp => (
                                                    <button key={temp._id} onClick={() => handleAddCardFromTemplate(temp)}
                                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                        <span>{temp.title}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-3 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                                    No templates saved yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-1.5">
                                <button onClick={() => { setAddingCard(false); setShowTemplateMenu(false); }}
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button onClick={handleAddCard}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm shadow-indigo-100 dark:shadow-none transition-colors cursor-pointer">
                                    Add card
                                </button>
                            </div>
                        </div>
                    </div>
                ) : canCreateCard(role) ? (
                    <button onClick={() => setAddingCard(true)}
                        className="w-full text-left text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 text-xs font-bold px-2.5 py-2 rounded-xl transition-all flex items-center gap-2 group/addbtn">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" className="text-slate-450 dark:text-slate-400 group-hover/addbtn:text-indigo-600 transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Add a card</span>
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default ColumnItem;