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
        <div className="flex gap-3 h-full items-start pb-4">
            <SortableContext items={columns.map(c => c._id)} strategy={horizontalListSortingStrategy}>
                {columns.map(col => (
                    <ColumnItem key={col._id} column={col} cards={cards[col._id] || []}
                        searchQuery={searchQuery} filterLabel={filterLabel}
                        onAddCard={onAddCard} boardId={boardId} socket={socket} />
                ))}
            </SortableContext>

            {/* Add column */}
            <div className="shrink-0 w-64">
                {adding ? (
                    <div className="bg-surface rounded-2xl p-3 shadow border border-outline-variant">
                        <input autoFocus value={newColName}
                            onChange={e => setNewColName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                            placeholder="Column name"
                            className="w-full h-9 px-3 rounded-xl border border-outline-variant bg-surface-raised text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 mb-2" />
                        <div className="flex gap-2">
                            <button onClick={handleAdd}
                                className="bg-primary hover:bg-primary-dark text-on-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                                Add column
                            </button>
                            <button onClick={() => setAdding(false)}
                                className="text-on-surface-variant text-xs px-3 py-1.5 rounded-lg hover:bg-surface-raised transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setAdding(true)}
                        className="w-full bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-medium px-4 py-3 rounded-2xl transition flex items-center gap-2">
                        <span className="text-lg leading-none">+</span> Add column
                    </button>
                )}
            </div>
        </div>
    );
};

export default ColumnList;
