import { useState, useEffect } from 'react';
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
            .catch(() => console.error("Error fetching board columns"));
    }, [card.board?._id]);

    const handleSave = async () => {
        if (blocked && !blockedReason.trim()) {
            toast.error('A reason is required to mark a task as blocked');
            return;
        }
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
        } catch {
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
        } catch {
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
        } catch {
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
        } catch {
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
        } catch {
            toast.error('Failed to post comment');
        }
    };

    const checklistProgress = checklist.length > 0
        ? Math.round((checklist.filter(i => i.done).length / checklist.length) * 100)
        : 0;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col font-sans antialiased bg-slate-900/60 backdrop-blur-sm transition-colors duration-200">
            {/* Top Navigation Bar (Focus Mode) */}
            <header className="sticky top-0 z-40 w-full bg-surface dark:bg-slate-900 border-b border-outline-variant dark:border-slate-800 shadow-sm h-16 flex items-center justify-between px-margin-desktop">
                <div className="flex items-center gap-md">
                    <button onClick={onClose} className="flex items-center gap-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        <span className="font-body-md font-medium">Exit Focus</span>
                    </button>
                    <div className="h-6 w-px bg-outline-variant dark:bg-slate-700 hidden md:block"></div>
                    <div className="hidden md:flex items-center gap-sm px-3 py-1 bg-secondary-fixed/20 dark:bg-blue-900/40 text-secondary dark:text-blue-400 rounded-full border border-secondary-fixed dark:border-blue-800">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        <span className="font-label-caps font-bold tracking-wider">FOCUS MODE</span>
                    </div>
                </div>
                <div className="flex items-center gap-md text-on-surface-variant dark:text-slate-400">
                    <div className="flex items-center gap-sm">
                        <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="p-1 hover:bg-surface-container-low dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                        </button>
                        <span className="font-body-sm font-medium">Task {currentIndex + 1} of {cards.length}</span>
                        <button onClick={() => setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1))} disabled={currentIndex === cards.length - 1} className="p-1 hover:bg-surface-container-low dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Canvas */}
            <main className="flex-1 overflow-y-auto p-margin-desktop bg-background dark:bg-slate-900">
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter">
                    
                    {/* Left Column: Content Area */}
                    <div className="col-span-1 md:col-span-8 flex flex-col gap-lg">
                        {/* Task Header Card */}
                        <div className="bg-surface-container-lowest/95 dark:bg-slate-800/95 backdrop-blur-[8px] border border-outline-variant dark:border-slate-700 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] rounded-xl p-lg flex flex-col gap-md">
                            <div className="flex items-center gap-sm text-on-surface-variant dark:text-slate-400 font-label-caps">
                                <span className="uppercase">{card.board?.name || 'Board'}</span>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                <span className="uppercase text-secondary dark:text-blue-400 font-bold">{card.column?.name || 'Column'}</span>
                            </div>
                            <h1 className="font-headline-lg text-headline-lg text-primary dark:text-white leading-tight">{card.title}</h1>
                        </div>

                        {/* Description Card */}
                        <div className="bg-surface-container-lowest/95 dark:bg-slate-800/95 backdrop-blur-[8px] border border-outline-variant dark:border-slate-700 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] rounded-xl p-lg flex flex-col gap-md">
                            <div className="flex items-center gap-sm text-on-surface-variant dark:text-slate-400 mb-sm">
                                <span className="material-symbols-outlined text-xl">notes</span>
                                <h2 className="font-label-caps">DESCRIPTION</h2>
                            </div>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Add a description..."
                                rows="5"
                                className="w-full bg-surface-container-low dark:bg-slate-900/50 border border-outline-variant dark:border-slate-700 rounded-lg p-md font-body-md text-on-surface dark:text-slate-200 focus:border-secondary dark:focus:border-blue-500 outline-none resize-none"
                            />
                        </div>

                        {/* Checklist Card */}
                        <div className="bg-surface-container-lowest/95 dark:bg-slate-800/95 backdrop-blur-[8px] border border-outline-variant dark:border-slate-700 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] rounded-xl p-lg flex flex-col gap-md">
                            <div className="flex items-center justify-between mb-sm">
                                <div className="flex items-center gap-sm text-on-surface-variant dark:text-slate-400">
                                    <span className="material-symbols-outlined text-xl">checklist</span>
                                    <h2 className="font-label-caps">CHECKLIST</h2>
                                </div>
                                {checklist.length > 0 && (
                                    <span className="font-label-caps text-secondary dark:text-blue-400 font-bold">{checklistProgress}%</span>
                                )}
                            </div>

                            {checklist.length > 0 && (
                                <div className="w-full bg-surface-container-high dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-secondary dark:bg-blue-500 transition-all duration-300"
                                        style={{ width: `${checklistProgress}%` }}
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                {checklist.map((item, idx) => (
                                    <label key={idx} className="flex items-start gap-3 bg-surface-container-low dark:bg-slate-900/30 hover:bg-surface-container-high dark:hover:bg-slate-900/50 p-3 rounded-lg border border-outline-variant dark:border-slate-700 cursor-pointer transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={item.done}
                                            onChange={() => handleToggleCheck(idx)}
                                            className="w-4 h-4 rounded text-secondary dark:text-blue-500 focus:ring-secondary dark:focus:ring-blue-500 mt-0.5"
                                        />
                                        <span className={`font-body-sm leading-tight ${item.done ? 'line-through text-on-surface-variant dark:text-slate-500' : 'text-on-surface dark:text-slate-200'}`}>
                                            {item.text}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <form onSubmit={handleAddCheckItem} className="flex items-center gap-2 mt-2 min-w-0">
                                <input 
                                    value={newCheckItem}
                                    onChange={e => setNewCheckItem(e.target.value)}
                                    className="flex-1 min-w-0 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 font-body-sm text-on-surface dark:text-slate-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none" 
                                    placeholder="Add checklist item..." 
                                    type="text"
                                />
                                <button type="submit" className="shrink-0 bg-secondary dark:bg-blue-600 text-on-secondary dark:text-white font-body-sm font-medium px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-secondary-container hover:text-on-secondary-container dark:hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                                    Add Item
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Settings & Context */}
                    <div className="col-span-1 md:col-span-4 flex flex-col gap-lg">
                        
                        {/* Settings Card */}
                        <div className="bg-surface-container-lowest/95 dark:bg-slate-800/95 backdrop-blur-[8px] border border-outline-variant dark:border-slate-700 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] rounded-xl p-lg flex flex-col gap-md">
                            <div className="flex items-center gap-sm text-on-surface-variant dark:text-slate-400 border-b border-outline-variant dark:border-slate-700 pb-md mb-sm">
                                <span className="material-symbols-outlined text-xl">settings</span>
                                <h2 className="font-label-caps">TASK SETTINGS</h2>
                            </div>

                            <div className="flex flex-col gap-lg">
                                {/* Column */}
                                <div className="flex flex-col gap-xs">
                                    <label className="font-label-caps text-on-surface-variant dark:text-slate-400">COLUMN (STATUS)</label>
                                    <div className="relative">
                                        <select 
                                            value={card.column?._id || ''}
                                            onChange={handleColumnChange}
                                            disabled={moving || columns.length === 0}
                                            className="w-full appearance-none bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm font-body-sm text-on-surface dark:text-slate-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none pr-xl disabled:opacity-50"
                                        >
                                            {columns.map(col => (
                                                <option key={col._id} value={col._id}>
                                                    {col.name}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">expand_more</span>
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="flex flex-col gap-xs">
                                    <label className="font-label-caps text-on-surface-variant dark:text-slate-400">PRIORITY</label>
                                    <div className="relative">
                                        <select 
                                            value={priority}
                                            onChange={e => setPriority(e.target.value)}
                                            className="w-full appearance-none bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg pl-xl pr-xl py-sm font-body-sm text-on-surface dark:text-slate-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                        <div className={`absolute left-md top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${
                                            priority === 'urgent' ? 'bg-red-500' :
                                            priority === 'high' ? 'bg-orange-500' :
                                            priority === 'medium' ? 'bg-yellow-400' : 'bg-emerald-500'
                                        } pointer-events-none`}></div>
                                        <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">expand_more</span>
                                    </div>
                                </div>

                                {/* Estimated Hours */}
                                <div className="flex flex-col gap-xs">
                                    <label className="font-label-caps text-on-surface-variant dark:text-slate-400">ESTIMATED HOURS</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={estimatedHours}
                                        onChange={e => setEstimatedHours(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm font-body-sm text-on-surface dark:text-slate-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none" 
                                    />
                                </div>

                                {/* Due Date */}
                                <div className="flex flex-col gap-xs">
                                    <label className="font-label-caps text-on-surface-variant dark:text-slate-400">DUE DATE</label>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className="w-full bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm font-body-sm text-on-surface dark:text-slate-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none pr-xl" 
                                        />
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="flex flex-col gap-sm pt-sm">
                                    <label className="flex items-center gap-sm cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={blocked}
                                            onChange={e => {
                                                setBlocked(e.target.checked);
                                                if (!e.target.checked) setBlockedReason('');
                                            }}
                                            className="w-4 h-4 rounded border-outline-variant text-error dark:text-red-500 focus:ring-error" 
                                        />
                                        <span className="font-label-caps text-on-surface-variant dark:text-slate-400 group-hover:text-on-surface dark:group-hover:text-white transition-colors">BLOCKED / WAITING</span>
                                    </label>

                                    {blocked && (
                                        <textarea
                                            value={blockedReason}
                                            onChange={e => setBlockedReason(e.target.value)}
                                            placeholder="Explain what is blocking this task..."
                                            rows="2"
                                            className="w-full bg-error-container/20 dark:bg-red-900/20 border border-error dark:border-red-500/50 rounded-lg p-2 font-body-sm text-on-surface dark:text-white outline-none resize-none mt-1"
                                        />
                                    )}

                                    <label className="flex items-center gap-sm cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={reviewRequested}
                                            onChange={e => setReviewRequested(e.target.checked)}
                                            className="w-4 h-4 rounded border-outline-variant text-secondary dark:text-blue-500 focus:ring-secondary" 
                                        />
                                        <span className="font-label-caps text-on-surface-variant dark:text-slate-400 group-hover:text-on-surface dark:group-hover:text-white transition-colors">REVIEW REQUESTED</span>
                                    </label>
                                </div>

                                {/* Save Button */}
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-secondary dark:bg-blue-600 text-on-secondary dark:text-white font-body-md font-semibold px-md py-sm rounded-lg hover:bg-secondary-container hover:text-on-secondary-container dark:hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-sm mt-sm"
                                >
                                    {saving ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">save</span>
                                            Save changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Comments Card */}
                        <div className="bg-surface-container-lowest/95 dark:bg-slate-800/95 backdrop-blur-[8px] border border-outline-variant dark:border-slate-700 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] rounded-xl p-lg flex flex-col gap-md">
                            <div className="flex items-center gap-sm text-on-surface-variant dark:text-slate-400 border-b border-outline-variant dark:border-slate-700 pb-md mb-sm">
                                <span className="material-symbols-outlined text-xl">forum</span>
                                <h2 className="font-label-caps">COMMENTS</h2>
                            </div>

                            <div className="flex flex-col gap-md max-h-64 overflow-y-auto pr-1">
                                {card.comments && card.comments.length > 0 ? (
                                    card.comments.map((c, idx) => (
                                        <div key={idx} className="flex gap-sm">
                                            <div className="mt-0.5 shrink-0">
                                                <Avatar name={c.user?.username || '?'} avatar={c.user?.avatar} size={32} className="w-8 h-8 rounded-full" />
                                            </div>
                                            <div className="bg-surface-container-low dark:bg-slate-900/60 rounded-lg p-sm flex-1 border border-outline-variant dark:border-slate-700/60">
                                                <div className="flex justify-between items-start mb-xs">
                                                    <span className="font-body-sm font-semibold text-on-surface dark:text-white">{c.user?.username || 'User'}</span>
                                                    <span className="font-body-sm text-on-surface-variant dark:text-slate-500 text-[11px]">
                                                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="font-body-sm text-on-surface dark:text-slate-300 break-words text-[13px]">
                                                    <ReactMarkdown>{c.text || ''}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="font-body-sm text-on-surface-variant dark:text-slate-500 italic">No comments posted yet.</p>
                                )}
                            </div>

                            <form onSubmit={handleAddComment} className="flex flex-col gap-sm mt-sm">
                                <textarea 
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    className="w-full bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm font-body-sm text-on-surface dark:text-slate-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none resize-none" 
                                    placeholder="Write a comment..." 
                                    rows="3"
                                />
                                <button 
                                    type="submit"
                                    disabled={!commentText.trim()}
                                    className="self-start bg-surface-container-high dark:bg-slate-700 text-on-surface-variant dark:text-slate-300 font-body-sm font-medium px-md py-sm rounded-lg hover:bg-surface-variant dark:hover:bg-slate-600 hover:text-on-surface dark:hover:text-white transition-colors disabled:opacity-50"
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
