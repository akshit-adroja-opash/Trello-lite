import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import debounce from 'lodash/debounce';
import BoardMembersModal from '../components/Board/BoardMembersModal';
import BoardSettingsModal from '../components/Board/BoardSettingsModal';

import useBoardStore from '../store/boardStore';
import useSocketStore from '../store/socketStore';
import useAuthStore from '../store/authstore';

import { getSingleBoard } from '../api/board.api';
import { getColumnsByBoard, createColumn, reorderColumn } from '../api/column.api';
import { getCardsByColumn, moveCard, createCard } from '../api/card.api';
import { generateIndexBetween } from '../utils/fractionalIndex';

import ColumnList from '../components/Column/ColumnList';
import CardItem from '../components/Card/CardItem';
import ActivitySidebar from '../components/Board/ActivitySidebar';
import KeyboardShortcutsModal from '../components/Board/KeyboardShortcutsModal';
import NotificationBell from '../components/Notifications/NotificationBell';
import BoardCalendarView from '../components/Board/BoardCalendarView';
import BoardTimelineView from '../components/Board/BoardTimelineView';
import { toggleStarBoard } from '../api/board.api';


const BoardPage = () => {
    const { id: boardId } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const socket = useSocketStore(s => s.socket);
    const connected = useSocketStore(s => s.connected);


    const { board, columns, cards, setBoard, setBoardRole, setColumns, setCardsForColumn,
        addColumn, updateColumn, removeColumn, addCard, updateCard: storeUpdateCard,
        moveCardOptimistic, removeCard, setPresence, undo, redo, boardRole } = useBoardStore();

    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [cursors, setCursors] = useState([]);
    const searchRef = useRef(null);
    const emitCursorRef = useRef(null);
    const [membersModalOpen, setMembersModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('kanban');
    const [showFilters, setShowFilters] = useState(false);
    const [showActivity, setShowActivity] = useState(false);
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [dueDateFilter, setDueDateFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');


    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {

        const load = async () => {

            setLoading(true);

            try {

                const boardRes =
                    await getSingleBoard(boardId);

                const boardData = boardRes.data?.board || boardRes.board;
                setBoard(boardData);


                const colRes =
                    await getColumnsByBoard(boardId);

                const cols =
                    colRes.data?.columns || [];

                setColumns(cols);

                await Promise.all(
                    cols.map(async (col) => {

                        const cardRes =
                            await getCardsByColumn(
                                col._id
                            );

                        setCardsForColumn(
                            col._id,
                            cardRes.data?.cards || []
                        );
                    })
                );

            } catch (err) {

                toast.error(err.response?.data?.message || err.message || "Failed to load board");
                navigate('/dashboard');

            } finally {

                setLoading(false);
            }
        };

        load();

    }, [boardId]);

    useEffect(() => {
        if (board && user) {
            const AdminId = board.Admin?._id || board.Admin;
            if (AdminId === user._id || user.role === 'admin' || user.role === 'project_manager') {
                setBoardRole('admin');
            } else {
                const member = board.members?.find(m =>
                    (m.user?._id || m.user) === user._id
                );
                setBoardRole(member?.role || user.role || 'client');
            }
        } else {
            setBoardRole('client');
        }
    }, [board, user, setBoardRole]);

    useEffect(() => {

        const handleKeyDown = (e) => {

            /*
              =========================
              UNDO
              CTRL + Z
              =========================
            */

            if (
                (e.ctrlKey || e.metaKey) &&
                !e.shiftKey &&
                e.key.toLowerCase() === "z"
            ) {

                e.preventDefault();

                undo();

                toast.success("Undo successful");
            }

            /*
              =========================
              REDO
              CTRL + SHIFT + Z
              =========================
            */

            if (
                (e.ctrlKey || e.metaKey) &&
                e.shiftKey &&
                e.key.toLowerCase() === "z"
            ) {

                e.preventDefault();

                redo();

                toast.success("Redo successful");
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };

    }, [undo, redo]);



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
        socket.on('cursor:update', (data) => {
            setCursors(prev => {
                const filtered = prev.filter(cursor => cursor.userId !== data.userId);
                return [...filtered, data];
            });
        });

        return () => {
            socket.emit('board:leave', { boardId });
            ['board:presence', 'card:moved', 'card:created', 'card:updated', 'card:deleted', 'column:created', 'column:updated', 'column:deleted', 'cursor:update']
                .forEach(e => socket.off(e));
            setCursors([]);
        };
    }, [socket, user, boardId]);

    useEffect(() => {
        if (!socket || !user) {
            emitCursorRef.current?.cancel?.();
            emitCursorRef.current = null;
            return;
        }

        emitCursorRef.current?.cancel?.();
        emitCursorRef.current = debounce((x, y) => {
            socket.emit('cursor:move', {
                boardId,
                userId: user._id,
                user: user.username,
                x,
                y,
            });
        }, 40);

        return () => {
            emitCursorRef.current?.cancel?.();
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
    };

    const handleToggleStar = async () => {
        try {
            const res = await toggleStarBoard(boardId);
            if (res.status === 'success' || res.success) {
                setBoard({ ...board, isStarred: res.data.board.isStarred });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to star board");
        }
    };

    const handleDragEnd = useCallback(async ({ active, over }) => {
        setActiveCard(null); 
        if (!over || active.id === over.id) return;
        if (boardRole === 'client') return;
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
    }, [cards, columns, boardId, socket, boardRole, user]);

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

    const handleMouseMove = useCallback((e) => {
        emitCursorRef.current?.(e.clientX, e.clientY);
    }, []);

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    };

    const uniqueLabels = useMemo(() => {
        const map = new Map();
        Object.values(cards).flat().flatMap(c => c.labels || []).forEach(l => {
            if (l && l.name) {
                map.set(l.name, l);
            }
        });
        return Array.from(map.values());
    }, [cards]);

    const uniqueAssignees = useMemo(() => {
        const list = [];
        if (board?.Admin) {
            list.push(board.Admin);
        }
        if (board?.members) {
            board.members.forEach(m => {
                if (m.user && !list.some(u => u._id === m.user._id)) {
                    list.push(m.user);
                }
            });
        }
        Object.values(cards).flat().flatMap(c => c.assignees || []).forEach(a => {
            if (a && a._id && !list.some(u => u._id === a._id)) {
                list.push(a);
            }
        });
        return list;
    }, [board, cards]);

    const handleClearAllFilters = () => {
        setSelectedLabels([]);
        setSelectedAssignees([]);
        setDueDateFilter('all');
        setSortBy('default');
    };

    const filteredCards = useMemo(() => {
        const result = {};
        const now = new Date();

        Object.entries(cards).forEach(([colId, colCards]) => {
            let list = [...colCards];

            if (searchQuery) {
                const query = searchQuery.toLowerCase();

                list = list.filter(c =>
                    c.title?.toLowerCase().includes(query) ||
                    c.description?.toLowerCase().includes(query) ||
                    c.labels?.some(l => l.name?.toLowerCase().includes(query)) ||
                    c.assignees?.some(a =>
                        a.username?.toLowerCase().includes(query)
                    )
                );
            }

            if (selectedLabels.length > 0) {
                list = list.filter(c => c.labels?.some(l => selectedLabels.includes(l.name)));
            }

            if (selectedAssignees.length > 0) {
                list = list.filter(c => c.assignees?.some(a => selectedAssignees.includes(a._id)));
            }

            if (dueDateFilter !== 'all') {
                list = list.filter(c => {
                    if (!c.dueDate) return dueDateFilter === 'noDate';
                    if (dueDateFilter === 'noDate') return false;

                    const d = new Date(c.dueDate);
                    if (dueDateFilter === 'overdue') {
                        return d < now;
                    }
                    if (dueDateFilter === 'today') {
                        return isSameDay(d, now);
                    }
                    if (dueDateFilter === 'week') {
                        const endOfWeek = new Date();
                        endOfWeek.setDate(now.getDate() + 7);
                        return d >= now && d <= endOfWeek;
                    }
                    return true;
                });
            }

            if (sortBy !== 'default') {
                list.sort((a, b) => {
                    if (sortBy === 'dueDate') {
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    }
                    if (sortBy === 'titleAsc') {
                        return a.title.localeCompare(b.title);
                    }
                    if (sortBy === 'titleDesc') {
                        return b.title.localeCompare(a.title);
                    }
                    if (sortBy === 'newest') {
                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    }
                    return 0;
                });
            }

            result[colId] = list;
        });

        return result;
    }, [cards, searchQuery, selectedLabels, selectedAssignees, dueDateFilter, sortBy]);

    if (loading) return (
        <div className="flex flex-col gap-4 items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-950 animate-pulse" />
                <div className="absolute w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide animate-pulse">Assembling board space...</p>
        </div>
    );

    return (
        <div
            className="flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 antialiased font-sans selection:bg-indigo-500/10 transition-colors duration-200"
            onMouseMove={handleMouseMove}
        >
            {cursors.map(cursor => (
                <div
                    key={cursor.userId}
                    className="fixed z-50 pointer-events-none"
                    style={{ left: cursor.x, top: cursor.y }}
                >
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-sm">
                        {cursor.user}
                    </div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
                </div>
            ))}

            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between sticky top-0 z-50 shrink-0 gap-3 md:gap-4">
                {/* Left Section */}
                <div className="flex items-center gap-4 md:gap-6 justify-start min-w-0 shrink-0">
                    <div className="flex items-center space-x-2 shrink-0">
                        <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span className="text-sm font-semibold hidden sm:inline">Dashboard</span>
                        </Link>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <div className="flex items-center gap-2 md:gap-3">
                            <h1 className="text-slate-900 dark:text-white font-bold text-base md:text-lg truncate max-w-[120px] sm:max-w-none">
                                {board?.name}
                            </h1>

                            <button
                                onClick={handleToggleStar}
                                className={`transition-all shrink-0 ${board?.isStarred
                                    ? 'text-yellow-400'
                                    : 'text-slate-400 hover:text-yellow-400'
                                    }`}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill={board?.isStarred ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.036 6.26a1 1 0 00.95.69h6.58c.969 0 1.371 1.24.588 1.81l-5.325 3.87a1 1 0 00-.364 1.118l2.036 6.26c.3.922-.755 1.688-1.54 1.118l-5.325-3.87a1 1 0 00-1.176 0l-5.325 3.87c-.784.57-1.838-.196-1.539-1.118l2.036-6.26a1 1 0 00-.364-1.118l-5.325-3.87c-.783-.57-.38-1.81.588-1.81h6.58a1 1 0 00.95-.69l2.036-6.26z"
                                    />
                                </svg>
                            </button>
                        </div>
                        {!connected && (
                            <span className="shrink-0 flex items-center gap-1 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-250 dark:border-amber-900/50 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse ml-2">
                                Syncing...
                            </span>
                        )}
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg shrink-0" data-purpose="view-toggles">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-all ${viewMode === 'kanban'
                                ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium'
                                }`}
                        >
                            Board
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-all ${viewMode === 'calendar'
                                ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium'
                                }`}
                        >
                            Calendar
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-all ${viewMode === 'timeline'
                                ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium'
                                }`}
                        >
                            Timeline
                        </button>
                    </div>
                </div>

                {/* Center Section (Search Bar & Filters) */}
                <div className="order-3 lg:order-none w-full lg:w-auto lg:flex-1 lg:max-w-md xl:max-w-lg flex items-center gap-3">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                        </span>
                        <input
                            ref={searchRef}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-9 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white outline-none transition-all"
                            placeholder="Filter board cards..."
                            type="text"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350 transition-all flex items-center justify-center"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 border rounded-lg text-sm font-medium transition-all shrink-0 ${showFilters
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350'
                            }`}
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                            />
                        </svg>

                        <span>Filters</span>

                        {/* Active Filter Count */}
                        {(selectedLabels.length > 0 ||
                            selectedAssignees.length > 0 ||
                            dueDateFilter !== 'all' ||
                            sortBy !== 'default') && (
                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                                    {
                                        (selectedLabels.length > 0 ? 1 : 0) +
                                        (selectedAssignees.length > 0 ? 1 : 0) +
                                        (dueDateFilter !== 'all' ? 1 : 0) +
                                        (sortBy !== 'default' ? 1 : 0)
                                    }
                                </span>
                            )}
                    </button>
                </div>

                {/* Right Section */}
                <div className="flex items-center justify-end space-x-2 md:space-x-4 shrink-0">

                    {/* Tools and Action buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                        <NotificationBell />



                        <button
                            onClick={() => setShowActivity(!showActivity)}
                            className={`p-1.5 rounded-lg border transition-all ${showActivity
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-105 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400'
                                }`}
                            title="Activity Feed"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>

                        <button
                            onClick={() => setShowShortcuts(true)}
                            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-semibold flex items-center justify-center shadow-sm"
                            title="Keyboard shortcuts (?)"
                        >
                            ?
                        </button>
                    </div>
                </div>
            </header>

            {showFilters && (
                <div className="bg-white dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-6 items-start shrink-0">
                    <div data-purpose="filter-labels">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Labels</span>
                        {uniqueLabels.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">No labels on this board</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {uniqueLabels.map(label => (
                                    <label key={label.name} className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedLabels.includes(label.name)}
                                            onChange={() => {
                                                setSelectedLabels(prev => prev.includes(label.name) ? prev.filter(name => name !== label.name) : [...prev, label.name])
                                            }}
                                            className="rounded text-primary focus:ring-primary h-4 w-4"
                                        />
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{label.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <div data-purpose="filter-assignees">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Assignees</span>
                        {uniqueAssignees.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">No assignees on this board</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {uniqueAssignees.map(u => (
                                    <label key={u._id} className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedAssignees.includes(u._id)}
                                            onChange={() => {
                                                setSelectedAssignees(prev => prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id])
                                            }}
                                            className="rounded text-primary focus:ring-primary h-4 w-4"
                                        />
                                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                                            {u.username?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <span className="text-xs text-slate-750 dark:text-slate-350">{u.username}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <div data-purpose="filter-due-date">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Due Date</span>
                        <div className="space-y-1.5">
                            <label className="flex items-center text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                                <input
                                    type="radio"
                                    name="due"
                                    checked={dueDateFilter === 'all'}
                                    onChange={() => setDueDateFilter('all')}
                                    className="mr-2 text-primary focus:ring-primary h-4 w-4"
                                />
                                All Dates
                            </label>
                            <label className="flex items-center text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                                <input
                                    type="radio"
                                    name="due"
                                    checked={dueDateFilter === 'overdue'}
                                    onChange={() => setDueDateFilter('overdue')}
                                    className="mr-2 text-primary focus:ring-primary h-4 w-4"
                                />
                                Overdue
                            </label>
                            <label className="flex items-center text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                                <input
                                    type="radio"
                                    name="due"
                                    checked={dueDateFilter === 'today'}
                                    onChange={() => setDueDateFilter('today')}
                                    className="mr-2 text-primary focus:ring-primary h-4 w-4"
                                />
                                Due Today
                            </label>
                        </div>
                    </div>
                    <div data-purpose="filter-sorting">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sort Cards By</span>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="w-full text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-lg focus:ring-primary focus:border-primary py-2 px-3 outline-none"
                        >
                            <option value="default">Default (Column Order)</option>
                            <option value="dueDate">Due Date</option>
                            <option value="titleAsc">Title: A-Z</option>
                            <option value="titleDesc">Title: Z-A</option>
                            <option value="newest">Newest Created</option>
                        </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={handleClearAllFilters}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="px-6 py-2 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Showing{" "}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                        {Object.values(filteredCards).flat().length}
                    </span>{" "}
                    cards
                </div>

                {(searchQuery ||
                    selectedLabels.length > 0 ||
                    selectedAssignees.length > 0 ||
                    dueDateFilter !== 'all') && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Filters active
                        </div>
                    )}
            </div>

            <main className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <div className={`h-full px-8 py-6 ${viewMode === 'kanban' ? 'min-w-max' : 'w-full'}`}>
                        {viewMode === 'kanban' ? (
                            <DndContext sensors={sensors} collisionDetection={closestCorners}
                                onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

                                {Object.values(filteredCards).flat().length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                            <svg
                                                className="w-8 h-8 text-slate-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9.172 9.172a4 4 0 015.656 5.656M15 15l6 6"
                                                />
                                            </svg>
                                        </div>

                                        <h3 className="text-lg font-semibold text-slate-700 dark:text-white">
                                            No matching cards found
                                        </h3>

                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            Try adjusting your filters or search query
                                        </p>
                                    </div>
                                )}

                                <ColumnList
                                    columns={columns} cards={filteredCards}
                                    searchQuery={searchQuery} filterLabel=""
                                    onAddCard={handleAddCard} onAddColumn={handleAddColumn}
                                    boardId={boardId} socket={socket}
                                />

                                <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>
                                    {activeCard && (
                                        <div className="transform rotate-[2.5deg] scale-[1.03] shadow-2xl shadow-slate-900/15 opacity-95 pointer-events-none rounded-xl border border-slate-200/60 bg-white">
                                            <CardItem card={activeCard} isDragging />
                                        </div>
                                    )}
                                </DragOverlay>
                            </DndContext>
                        ) : viewMode === 'calendar' ? (
                            <BoardCalendarView
                                boardId={boardId}
                                filteredCards={filteredCards}
                            />
                        ) : (
                            <BoardTimelineView
                                boardId={boardId}
                                filteredCards={filteredCards}
                                columns={columns}
                            />
                        )}
                    </div>
                </div>

                <ActivitySidebar boardId={boardId} isOpen={showActivity} onClose={() => setShowActivity(false)} />
            </main>

            {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
            <BoardMembersModal
                board={board}
                isOpen={membersModalOpen}
                onClose={() =>
                    setMembersModalOpen(false)
                }
            />
            <BoardSettingsModal
                board={board}
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                onBoardUpdated={(updatedBoard) => setBoard(updatedBoard)}
            />
        </div>
    );
};

export default BoardPage;
