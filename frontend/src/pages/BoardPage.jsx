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
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-800">
            {/* ── Board Header ── */}
            <header className="shrink-0 h-14 flex items-center justify-between px-4 gap-3 bg-slate-900/80 backdrop-blur-sm border-b border-white/10">
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                    <Link to="/dashboard"
                        className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 5l-7 7 7 7"/>
                        </svg>
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <span className="text-white/30 hidden sm:inline">|</span>
                    <h1 className="font-semibold text-white truncate">{board?.name}</h1>
                    {!connected && (
                        <span className="shrink-0 text-xs bg-warning/20 text-warning border border-warning/30 px-2 py-0.5 rounded-full">
                            Reconnecting…
                        </span>
                    )}
                </div>

                {/* Center — search + filter */}
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search… (/)"
                            className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:bg-white/20 focus:border-white/40 transition" />
                    </div>
                    {allLabels.length > 0 && (
                        <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)}
                            className="h-8 px-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:bg-white/20 transition">
                            <option value="">All labels</option>
                            {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    )}
                </div>

                {/* Right — presence + shortcuts */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-1.5">
                        {presence.map(u => <Avatar key={u.userId} name={u.username} avatar={u.avatar} size={28} />)}
                    </div>
                    <button onClick={() => setShowShortcuts(true)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white text-xs font-bold transition"
                        title="Keyboard shortcuts (?)">?</button>
                </div>
            </header>

            {/* ── Board Canvas ── */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                <DndContext sensors={sensors} collisionDetection={closestCorners}
                    onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <ColumnList
                        columns={columns} cards={cards}
                        searchQuery={searchQuery} filterLabel={filterLabel}
                        onAddCard={handleAddCard} onAddColumn={handleAddColumn}
                        boardId={boardId} socket={socket}
                    />
                    <DragOverlay>
                        {activeCard && <CardItem card={activeCard} isDragging />}
                    </DragOverlay>
                </DndContext>
            </div>

            {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
        </div>
    );
};

export default BoardPage;
