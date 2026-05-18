import { useState } from 'react';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import ColumnItem from './ColumnItem';

const ColumnList = ({ columns, cards, searchQuery, filterLabel, onAddCard, onAddColumn, boardId, socket }) => {
    const [newColName, setNewColName] = useState('');
    const [adding, setAdding] = useState(false);

    const handleAdd = async () => {
        if (!newColName.trim()) return;
        await onAddColumn(newColName.trim());
        setNewColName('');
        setAdding(false);
    };

    return (
        <div className="flex gap-4 h-full items-start pb-4 select-none">
            {/* Draggable Sorting Context List */}
            <SortableContext items={columns.map(c => c._id)} strategy={horizontalListSortingStrategy}>
                {columns.map(col => (
                    <ColumnItem 
                        key={col._id} 
                        column={col} 
                        cards={cards[col._id] || []}
                        searchQuery={searchQuery} 
                        filterLabel={filterLabel}
                        onAddCard={onAddCard} 
                        boardId={boardId} 
                        socket={socket} 
                    />
                ))}
            </SortableContext>

            {/* Dynamic Column Addition Interactive Box */}
            <div className="shrink-0 w-72 group/btn">
                {adding ? (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
                        <input 
                            autoFocus 
                            value={newColName}
                            onChange={e => setNewColName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                            placeholder="Name your column..."
                            className="w-full h-9 px-3 mb-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                        />
                        <div className="flex gap-1.5 justify-end">
                            <button 
                                onClick={() => setAdding(false)}
                                className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAdd}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm shadow-indigo-100 transition-colors"
                            >
                                Add column
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setAdding(true)}
                        className="w-full bg-slate-200/50 hover:bg-slate-200/80 border border-slate-300/40 text-slate-600 hover:text-slate-800 text-sm font-bold px-4 py-3 rounded-2xl transition-all flex items-center justify-between group-hover/btn:shadow-sm"
                    >
                        <span className="flex items-center gap-2">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" className="text-slate-500 transition-transform group-hover/btn:rotate-90">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Add list</span>
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ColumnList;