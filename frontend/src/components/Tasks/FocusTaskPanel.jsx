import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { getSingleBoard } from '../../api/board.api';
import { updateCard, moveCard, addComment } from '../../api/card.api';
import Avatar from '../../UI/Avatar';

const FocusTaskPanel = ({ cards, initialIndex, onClose, onCardUpdated }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [card, setCard] = useState(cards[initialIndex]);

    // Local input states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [blocked, setBlocked] = useState(false);
    const [blockedReason, setBlockedReason] = useState('');
    const [estimatedHours, setEstimatedHours] = useState(0);
    const [reviewRequested, setReviewRequested] = useState(false);
    const [checklist, setChecklist] = useState([]);
    const [newCheckItem, setNewCheckItem] = useState('');
    const [commentText, setCommentText] = useState('');
    
    const [columns, setColumns] = useState([]);
    const [saving, setSaving] = useState(false);
    const [moving, setMoving] = useState(false);

    // Sync input states when the current card changes
    useEffect(() => {
        const activeCard = cards[currentIndex];
        if (!activeCard) return;

        setCard(activeCard);
        setTitle(activeCard.title || '');
        setDescription(activeCard.description || '');
        setDueDate(activeCard.dueDate ? activeCard.dueDate.slice(0, 10) : '');
        setPriority(activeCard.priority || 'medium');
        setBlocked(!!activeCard.blocked);
        setBlockedReason(activeCard.blockedReason || '');
        setEstimatedHours(activeCard.estimatedHours || 0);
        setReviewRequested(!!activeCard.reviewRequested);
        setChecklist(activeCard.checklist || []);
        setNewCheckItem('');
        setCommentText('');
        setColumns([]);
    }, [currentIndex, cards]);

    // Fetch board columns to allow column/status transition
    useEffect(() => {
        if (!card.board?._id) return;
        getSingleBoard(card.board._id)
            .then(res => {
                const cols = res.data?.board?.columns || res.board?.columns || [];
                setColumns(cols);
            })
            .catch(err => console.error("Error fetching board columns:", err));
    }, [card.board?._id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updateCard(card._id, {
                title,
                description,
                dueDate: dueDate || null,
                priority,
                blocked,
                blockedReason: blocked ? blockedReason : '',
                estimatedHours,
                reviewRequested,
                checklist,
                assignees: card.assignees?.map(a => a._id || a) || [],
                version: card.version
            });
            const updated = res.data?.card;
            setCard(updated);
            onCardUpdated(updated);
            toast.success('Task details saved');
        } catch (err) {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleColumnChange = async (e) => {
        const newColId = e.target.value;
        if (!newColId || newColId === card.column?._id) return;
        setMoving(true);
        try {
            const res = await moveCard(card._id, {
                columnId: newColId,
                order: "1" // Default order at top of the column
            });
            const updated = res.data?.card;
            setCard(updated);
            onCardUpdated(updated);
            toast.success('Task status updated');
        } catch (err) {
            toast.error('Failed to move task status');
        } finally {
            setMoving(false);
        }
    };

    const handleToggleCheck = async (idx) => {
        const updatedChecklist = checklist.map((item, index) =>
            index === idx ? { ...item, done: !item.done } : item
        );
        setChecklist(updatedChecklist);
        
        try {
            const res = await updateCard(card._id, {
                checklist: updatedChecklist,
                assignees: card.assignees?.map(a => a._id || a) || [],
                version: card.version
            });
            const updated = res.data?.card;
            setCard(updated);
            onCardUpdated(updated);
        } catch (err) {
            toast.error('Failed to update checklist item');
            // Revert state
            setChecklist(checklist);
        }
    };

    const handleAddCheckItem = async (e) => {
        e.preventDefault();
        if (!newCheckItem.trim()) return;

        const updatedChecklist = [...checklist, { text: newCheckItem.trim(), done: false }];
        setChecklist(updatedChecklist);
        setNewCheckItem('');

        try {
            const res = await updateCard(card._id, {
                checklist: updatedChecklist,
                assignees: card.assignees?.map(a => a._id || a) || [],
                version: card.version
            });
            const updated = res.data?.card;
            setCard(updated);
            onCardUpdated(updated);
            toast.success('Added checklist item');
        } catch (err) {
            toast.error('Failed to add checklist item');
            setChecklist(checklist);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const res = await addComment(card._id, { text: commentText.trim() });
            const newComment = res.data?.comment;
            if (newComment) {
                const updatedCardObj = {
                    ...card,
                    comments: [...(card.comments || []), newComment]
                };
                setCard(updatedCardObj);
                onCardUpdated(updatedCardObj);
                setCommentText('');
                toast.success('Comment posted');
            }
        } catch (err) {
            toast.error('Failed to post comment');
        }
    };

    const checklistProgress = checklist.length > 0
        ? Math.round((checklist.filter(i => i.done).length / checklist.length) * 100)
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">
            {/* Header: Focus Mode Controls */}
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700/60"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Exit Focus
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-650 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ⚡ Focus Mode
                    </span>
                </div>

                {/* Carousel Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <span className="text-xs font-bold text-slate-500">
                        Task {currentIndex + 1} of {cards.length}
                    </span>
                    <button
                        onClick={() => setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1))}
                        disabled={currentIndex === cards.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </header>

            {/* Task Container */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Column 1 & 2: Primary Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title and Pipeline path */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                <span>{card.board?.name || 'Board'}</span>
                                <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                                <span className="text-indigo-600 dark:text-indigo-400">{card.column?.name || 'Column'}</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                {card.title}
                            </h2>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">notes</span>
                                Description
                            </h3>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Add a description..."
                                rows="5"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 outline-none resize-none"
                            />
                        </div>

                        {/* Checklist */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">check_box</span>
                                    Checklist
                                </h3>
                                {checklist.length > 0 && (
                                    <span className="text-xs bg-indigo-55 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 font-bold px-2 py-0.5 rounded-full">
                                        {checklistProgress}% Completed
                                    </span>
                                )}
                            </div>

                            {checklist.length > 0 && (
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                                        style={{ width: `${checklistProgress}%` }}
                                    />
                                </div>
                            )}

                            {/* Checklist Items */}
                            <div className="space-y-2">
                                {checklist.map((item, idx) => (
                                    <label key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800/80 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={item.done}
                                            onChange={() => handleToggleCheck(idx)}
                                            className="w-4.5 h-4.5 rounded accent-indigo-600"
                                        />
                                        <span className={`text-sm ${item.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {item.text}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Add checklist item */}
                            <form onSubmit={handleAddCheckItem} className="flex gap-2">
                                <input
                                    value={newCheckItem}
                                    onChange={e => setNewCheckItem(e.target.value)}
                                    placeholder="Add checklist item..."
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs outline-none"
                                />
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                                >
                                    Add
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Column 3: Sidebar Controls */}
                    <div className="space-y-6">
                        {/* Task Settings / Save */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                                <span className="material-symbols-outlined text-sm">settings</span>
                                Task Settings
                            </h3>

                            {/* Column Status selector */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Column (Status)</label>
                                <select
                                    value={card.column?._id || ''}
                                    onChange={handleColumnChange}
                                    disabled={moving || columns.length === 0}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer disabled:opacity-50"
                                >
                                    {columns.map(col => (
                                        <option key={col._id} value={col._id}>
                                            📋 {col.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority Select */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Priority</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
                                >
                                    <option value="low">🟢 Low</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="high">🟠 High</option>
                                    <option value="urgent">🔴 Urgent</option>
                                </select>
                            </div>

                            {/* Estimated Hours */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Estimated Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={estimatedHours}
                                    onChange={e => setEstimatedHours(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none"
                                />
                            </div>

                            {/* Due date */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
                                />
                            </div>

                            {/* Checkboxes: Blocked & Review Requested */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="focus-blocked"
                                        checked={blocked}
                                        onChange={e => {
                                            setBlocked(e.target.checked);
                                            if (!e.target.checked) setBlockedReason('');
                                        }}
                                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                    />
                                    <label htmlFor="focus-blocked" className="text-[11px] font-bold text-slate-550 dark:text-slate-450 uppercase cursor-pointer select-none">
                                        Blocked / Waiting
                                    </label>
                                </div>

                                {blocked && (
                                    <textarea
                                        value={blockedReason}
                                        onChange={e => setBlockedReason(e.target.value)}
                                        placeholder="Explain what is blocking this task..."
                                        rows="2"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white outline-none resize-none"
                                    />
                                )}

                                <div className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="focus-review-requested"
                                        checked={reviewRequested}
                                        onChange={e => setReviewRequested(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <label htmlFor="focus-review-requested" className="text-[11px] font-bold text-slate-550 dark:text-slate-450 uppercase cursor-pointer select-none">
                                        Review Requested
                                    </label>
                                </div>
                            </div>

                            {/* Save Task Details */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                            >
                                {saving ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">save</span>
                                        Save changes
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Comments & Discussions */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                                <span className="material-symbols-outlined text-sm">forum</span>
                                Comments
                            </h3>

                            {/* Comments scroll area */}
                            <div className="max-h-48 overflow-y-auto space-y-3.5 pr-1">
                                {card.comments && card.comments.length > 0 ? (
                                    card.comments.map((c, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <div className="shrink-0 mt-0.5">
                                                <Avatar name={c.user?.username || '?'} avatar={c.user?.avatar} size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] leading-relaxed">
                                                <div className="flex items-center justify-between gap-1.5 mb-1 font-bold text-[10px] text-slate-550 dark:text-slate-400">
                                                    <span className="truncate">{c.user?.username || 'User'}</span>
                                                    <span className="font-medium text-slate-400">
                                                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="break-words">
                                                    <ReactMarkdown>{c.text || ''}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No comments posted yet.</p>
                                )}
                            </div>

                            {/* Post comments form */}
                            <form onSubmit={handleAddComment} className="space-y-2">
                                <textarea
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows="2"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!commentText.trim()}
                                    className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all disabled:opacity-40"
                                >
                                    Post Comment
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default FocusTaskPanel;
