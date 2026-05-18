import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import useBoardStore from '../store/boardStore';
import useSocketStore from '../store/socketStore';
import useAuthStore from '../store/authstore';

import { getSingleBoard } from '../api/board.api';
import { getColumnsByBoard, createColumn, reorderColumn } from '../api/column.api';
import { getCardsByColumn, moveCard, createCard } from '../api/card.api';
import { generateIndexBetween } from '../utils/fractionalIndex';

import ColumnList from '../components/Column/ColumnList';
import CardItem from '../components/Card/CardItem';
import Avatar from '../UI/Avatar';
import KeyboardShortcutsModal from '../components/Board/KeyboardShortcutsModal';

const BoardPage = () => {
    const { id: boardId } = useParams();
    const user = useAuthStore(s => s.user);
    const socket = useSocketStore(s => s.socket);
    const connected = useSocketStore(s => s.connected);

    const { board, columns, cards, presence, setBoard, setColumns, setCardsForColumn,
        addColumn, updateColumn, removeColumn, addCard, updateCard: storeUpdateCard,
        moveCardOptimistic, removeCard, setPresence } = useBoardStore();

    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState(null);
    const [activeColumn, setActiveColumn] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLabel, setFilterLabel] = useState('');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const searchRef = useRef(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const boardRes = await getSingleBoard(boardId);
                setBoard(boardRes.data?.board || boardRes.board);
                const colRes = await getColumnsByBoard(boardId);
                const cols = colRes.data?.columns || [];
                setColumns(cols);
                await Promise.all(cols.map(async col => {
                    const cardRes = await getCardsByColumn(col._id);
                    setCardsForColumn(col._id, cardRes.data?.cards || []);
                }));
            } catch { toast.error('Failed to load board'); }
            finally { setLoading(false); }
        };
        load();
    }, [boardId]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.emit('board:join', { boardId, user: { userId: user._id, username: user.username, avatar: user.avatar } });
        socket.on('board:presence', ({ users }) => setPresence(users));
        socket.on('card:moved', ({ cardId, fromColumnId, toColumnId, newOrder }) => moveCardOptimistic(cardId, fromColumnId, toColumnId, newOrder));
        socket.on('card:created', ({ card }) => addCard(card));
        socket.on('card:updated', ({ card }) => storeUpdateCard(card));
        socket.on('card:deleted', ({ cardId, columnId }) => removeCard(cardId, columnId));
        socket.on('column:created', ({ column }) => addColumn(column));
        socket.on('column:updated', ({ column }) => updateColumn(column));
        socket.on('column:deleted', ({ columnId }) => removeColumn(columnId));
        return () => {
            socket.emit('board:leave', { boardId });
            ['board:presence','card:moved','card:created','card:updated','card:deleted','column:created','column:updated','column:deleted']
                .forEach(e => socket.off(e));
        };
    }, [socket, user, boardId]);

    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === '?') setShowShortcuts(v => !v);
            if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
            if (e.key === 'Escape') setShowShortcuts(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleDragStart = ({ active }) => {
        const type = active.data.current?.type;
        if (type === 'card') setActiveCard(active.data.current.card);
        if (type === 'column') setActiveColumn(active.data.current.column);
    };

    const handleDragEnd = useCallback(async ({ active, over }) => {
        setActiveCard(null); setActiveColumn(null);
        if (!over || active.id === over.id) return;
        const activeType = active.data.current?.type;

        if (activeType === 'card') {
            const card = active.data.current.card;
            const toColumnId = over.data.current?.columnId || over.id;
            const fromColumnId = card.column;
            const toCards = (cards[toColumnId] || []).filter(c => c._id !== card._id);
            const overIndex = toCards.findIndex(c => c._id === over.id);
            const prev = overIndex > 0 ? toCards[overIndex - 1]?.order : null;
            const next = overIndex >= 0 ? toCards[overIndex]?.order : null;
            const newOrder = generateIndexBetween(prev, next);
            moveCardOptimistic(card._id, fromColumnId, toColumnId, newOrder);
            try {
                const res = await moveCard(card._id, { targetColumnId: toColumnId, targetOrder: newOrder, version: card.version });
                const updated = res.data?.card;
                if (updated) storeUpdateCard(updated);
                socket?.emit('card:move', { boardId, cardId: card._id, fromColumnId, toColumnId, newOrder, version: updated?.version });
            } catch (err) {
                moveCardOptimistic(card._id, toColumnId, fromColumnId, card.order);
                if (err.response?.status === 409) toast.error('Conflict: card was updated by someone else');
                else toast.error('Failed to move card');
            }
        }

        if (activeType === 'column') {
            const col = active.data.current.column;
            const overCol = over.data.current?.column;
            if (!overCol) return;
            const oldIndex = columns.findIndex(c => c._id === col._id);
            const newIndex = columns.findIndex(c => c._id === overCol._id);
            const reordered = arrayMove(columns, oldIndex, newIndex);
            setColumns(reordered);
            const prev = newIndex > 0 ? reordered[newIndex - 1]?.order : null;
            const next = newIndex < reordered.length - 1 ? reordered[newIndex + 1]?.order : null;
            try {
                const res = await reorderColumn({ columnId: col._id, prevOrder: prev, nextOrder: next });
                const updated = res.data?.column;
                if (updated) updateColumn(updated);
                socket?.emit('column:update', { boardId, column: updated });
            } catch { toast.error('Failed to reorder column'); }
        }
    }, [cards, columns, boardId, socket]);

    const handleAddColumn = async (name) => {
        try {
            const res = await createColumn({ name, boardId });
            const col = res.data?.column;
            addColumn(col);
            setCardsForColumn(col._id, []);
            socket?.emit('column:create', { boardId, column: col });
        } catch { toast.error('Failed to create column'); }
    };

    const handleAddCard = async (columnId, title) => {
        const colCards = cards[columnId] || [];
        const last = colCards[colCards.length - 1];
        const order = generateIndexBetween(last?.order || null, null);
        try {
            const res = await createCard({ title, columnId, boardId, order });
            const card = res.data?.card;
            addCard(card);
            socket?.emit('card:create', { boardId, card });
        } catch { toast.error('Failed to create card'); }
    };

    const allLabels = [...new Set(Object.values(cards).flat().flatMap(c => c.labels?.map(l => l.name) || []))];

    if (loading) return (
        <div className="flex flex-col gap-4 items-center justify-center h-screen bg-slate-950">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-medium text-slate-400 tracking-wide animate-pulse">Loading workspace...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 selection:bg-indigo-500/30">
            {/* ── Top Suite Header ── */}
            <header className="shrink-0 h-16 flex items-center justify-between px-6 gap-4 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/60 z-10">
                
                {/* Left Controls */}
                <div className="flex items-center gap-4 min-w-0">
                    <Link to="/dashboard"
                        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-all group shrink-0 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 5l-7 7 7 7"/>
                        </svg>
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <span className="text-slate-700 hidden sm:inline text-xl font-light">/</span>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <h1 className="font-semibold text-slate-100 text-base md:text-lg tracking-tight truncate">{board?.name}</h1>
                        {!connected && (
                            <span className="shrink-0 flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md font-medium animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Reconnecting
                            </span>
                        )}
                    </div>
                </div>

                {/* Center — Search & Contextual Filtration */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1 group">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Filter cards... (/)"
                            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />
                    </div>
                    {allLabels.length > 0 && (
                        <div className="relative">
                            <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)}
                                className="h-9 px-3 pr-8 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-300 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer">
                                <option value="">All labels</option>
                                {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Right — Telemetry & Active Statuses */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800/60 p-1 rounded-lg">
                        <div className="flex -space-x-1 hover:-space-x-0.5 transition-all px-1">
                            {presence.map(u => (
                                <div key={u.userId} className="ring-2 ring-slate-900 rounded-full transition-transform hover:scale-105 hover:z-20">
                                    <Avatar name={u.username} avatar={u.avatar} size={26} />
                                </div>
                            ))}
                        </div>
                        {presence.length > 0 && (
                            <span className="text-[11px] font-medium text-slate-400 pr-1.5 hidden md:inline">
                                {presence.length} active
                            </span>
                        )}
                    </div>
                    
                    <button onClick={() => setShowShortcuts(true)}
                        className="w-8 h-8 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center shadow-sm"
                        title="Keyboard shortcuts (?)">
                        ?
                    </button>
                </div>
            </header>

            {/* ── Drag & Drop Dynamic Workspace ── */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                <div className="h-full px-6 py-5 min-w-max">
                    <DndContext sensors={sensors} collisionDetection={closestCorners}
                        onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        
                        <ColumnList
                            columns={columns} cards={cards}
                            searchQuery={searchQuery} filterLabel={filterLabel}
                            onAddCard={handleAddCard} onAddColumn={handleAddColumn}
                            boardId={boardId} socket={socket}
                        />

                        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>
                            {activeCard && (
                                <div className="transform rotate-2 scale-[1.02] shadow-2xl shadow-indigo-950/50 opacity-90 backdrop-blur-sm pointer-events-none">
                                    <CardItem card={activeCard} isDragging />
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                </div>
            </main>

            {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
        </div>
    );
};

export default BoardPage;   