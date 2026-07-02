import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { updateCard, deleteCard, addComment, saveCardAsTemplate, toggleCommentReaction, uploadAttachment, deleteAttachment } from '../../api/card.api';
import { SERVER_URL } from '../../api/axios';
import useBoardStore from '../../store/boardStore';
import useSocketStore from '../../store/socketStore';
import useAuthStore from '../../store/authstore';
import Avatar from '../../UI/Avatar';
import { canEditCard, canDeleteCard, canAssignMembers, canComment, canSaveTemplate } from '../../utils/rolePermissions';
import { getMembers } from '../../api/workspace.api';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const LABEL_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const EmojiPickerPopover = ({ onSelect }) => {
    const [open, setOpen] = useState(false);
    const popoverRef = useRef(null);
    const EMOJIS = ['👍', '❤️', '👀', '🔥', '🎉', '🚀', '😄', '👎'];

    useEffect(() => {
        const clickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', clickOutside);
        return () => document.removeEventListener('mousedown', clickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-5 h-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition flex items-center justify-center cursor-pointer text-xs font-bold border border-dashed border-slate-300 dark:border-slate-700 hover:border-solid"
                title="Add reaction"
            >
                ＋
            </button>
            {open && (
                <div className="absolute bottom-full left-0 mb-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 flex gap-1 z-40 animate-in fade-in slide-in-from-bottom-1 duration-100">
                    {EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => {
                                onSelect(emoji);
                                setOpen(false);
                            }}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const SortableChecklistItem = ({ item, index, onToggleCheck, onRemoveCheck, canEdit }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item._id || item.text || index.toString()
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 group bg-slate-50/40 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/50 px-4 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 transition-all"
        >
            {canEdit && (
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850/80 transition-colors shrink-0 flex items-center"
                    title="Drag to reorder"
                >
                    <span className="material-symbols-outlined text-sm select-none">drag_indicator</span>
                </div>
            )}
            <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggleCheck(index)}
                disabled={!canEdit}
                className="w-4.5 h-4.5 accent-indigo-600 bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-700 rounded cursor-pointer shrink-0"
            />
            <span className={`flex-1 text-sm ${item.done ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : 'text-slate-750 dark:text-slate-300'}`}>
                {item.text}
            </span>
            {canEdit && (
                <button
                    onClick={() => onRemoveCheck(index)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-650 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-xs cursor-pointer"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

const CardDetail = ({ card: initialCard, columnId, onClose }) => {
    const [card, setCard] = useState(initialCard);
    const [title, setTitle] = useState(initialCard.title);
    const [description, setDescription] = useState(initialCard.description || '');
    const [previewMd, setPreviewMd] = useState(false);
    const [dueDate, setDueDate] = useState(initialCard.dueDate ? initialCard.dueDate.slice(0, 10) : '');
    const [commentText, setCommentText] = useState('');
    const [labels, setLabels] = useState(initialCard.labels || []);
    const [newLabel, setNewLabel] = useState({ name: '', color: LABEL_COLORS[0] });
    const [checklist, setChecklist] = useState(initialCard.checklist || []);
    const [newCheckItem, setNewCheckItem] = useState('');
    const [assignees, setAssignees] = useState(
        (initialCard.assignees || []).map(a => (typeof a === 'object' ? a._id : a))
    );
    const [priority, setPriority] = useState(initialCard.priority || 'medium');
    const [blocked, setBlocked] = useState(!!initialCard.blocked);
    const [blockedReason, setBlockedReason] = useState(initialCard.blockedReason || '');
    const [estimatedHours, setEstimatedHours] = useState(initialCard.estimatedHours || 0);
    const [reviewRequested, setReviewRequested] = useState(!!initialCard.reviewRequested);
    const [saving, setSaving] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [openHistoryId, setOpenHistoryId] = useState(null);
    const { updateCard: storeUpdate, removeCard, board, boardRole } = useBoardStore();
    const socket = useSocketStore(s => s.socket);
    const boardId = useBoardStore(s => s.board?._id);
    const currentUser = useAuthStore(s => s.user);
    const canEdit = canEditCard(boardRole);
    const canDelete = canDeleteCard(boardRole);

    const boardMembers = board?.members || [];

    const [workspaceMembers, setWorkspaceMembers] = useState([]);
    const typingTimerRef = useRef(null);

    useEffect(() => {
        const workspaceId = board?.workspace?._id || board?.workspace;
        if (!workspaceId) return;

        getMembers(workspaceId)
            .then(res => {
                setWorkspaceMembers(res.data?.members || res.members || []);
            })
            .catch(err => {
                console.error("Failed to fetch workspace members", err);
            });
    }, [board]);
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleUserTyping = ({ cardId, user }) => {
            if (cardId === card._id) setTypingUser(user);
        };
        const handleUserStopTyping = ({ cardId }) => {
            if (cardId === card._id) setTypingUser(null);
        };
        const handleCardUpdate = ({ card: updatedCard }) => {
            if (updatedCard && updatedCard._id === card._id) {
                setCard(updatedCard);
            }
        };

        socket.on('card:user-typing', handleUserTyping);
        socket.on('card:user-stop-typing', handleUserStopTyping);
        socket.on('card:update', handleCardUpdate);

        return () => {
            socket.off('card:user-typing', handleUserTyping);
            socket.off('card:user-stop-typing', handleUserStopTyping);
            socket.off('card:update', handleCardUpdate);
        };
    }, [socket, card._id]);

    const emitStopTyping = useCallback(() => {
        if (!socket || !boardId) return;
        socket.emit('card:stop-typing', {
            boardId,
            cardId: card._id,
        });
    }, [socket, boardId, card._id]);

    const emitTyping = useCallback(() => {
        if (!socket || !boardId || !currentUser) return;

        socket.emit('card:typing', {
            boardId,
            cardId: card._id,
            user: currentUser.username,
        });

        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(emitStopTyping, 1000);
    }, [socket, boardId, card._id, currentUser, emitStopTyping]);

    useEffect(() => () => {
        clearTimeout(typingTimerRef.current);
        emitStopTyping();
    }, [emitStopTyping]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
        emitTyping();
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
        emitTyping();
    };

    const handleSave = async () => {
        if (!canEdit) return;
        setSaving(true);
        try {
            const res = await updateCard(card._id, {
                title, description, dueDate: dueDate || null,
                labels, checklist, assignees, version: card.version,
                priority, blocked, blockedReason, estimatedHours, reviewRequested
            });
            const updated = res.data?.card;
            setCard(updated);
            storeUpdate(updated);
            socket?.emit('card:update', { boardId, card: updated });
            emitStopTyping();
            toast.success('Card details saved');
        } catch (err) {
            if (err.response?.status === 409) toast.error('Conflict: Modified by another user');
            else toast.error('Failed to save changes');
        } finally { setSaving(false); }
    };

    const handleAddComment = async () => {
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
                storeUpdate(updatedCardObj);
                socket?.emit('card:update', { boardId, card: updatedCardObj });
                setCommentText('');
                toast.success('Comment added');
            }
        } catch {
            toast.error('Failed to add comment');
        }
    };

    const handleToggleReaction = async (commentId, emoji) => {
        try {
            const res = await toggleCommentReaction(card._id, commentId, emoji);
            const updatedCard = res.data?.card;
            if (updatedCard) {
                setCard(updatedCard);
                storeUpdate(updatedCard);
                socket?.emit('card:update', { boardId, card: updatedCard });
            }
        } catch {
            toast.error('Failed to update reaction');
        }
    };

    const handleDelete = async () => {
        if (!canDelete) return;
        if (!confirm('Are you sure you want to permanently delete this card?')) return;
        try {
            await deleteCard(card._id);
            removeCard(card._id, columnId);
            socket?.emit('card:delete', { boardId, cardId: card._id, columnId });
            onClose();
        } catch { toast.error('Failed to delete card'); }
    };

    const [savingTemplate, setSavingTemplate] = useState(false);
    const handleSaveTemplate = async () => {
        setSavingTemplate(true);
        try {
            await saveCardAsTemplate(card._id);
            toast.success('Card saved as a reusable template');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save card template');
        } finally {
            setSavingTemplate(false);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleUploadFile = async (e, targetAttachmentId = null) => {
        const file = e.target.files[0];
        if (!file) return;

        // Prevent video upload
        if (file.type.startsWith('video/') || /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(file.name)) {
            toast.error('Video uploads are not allowed!');
            return;
        }

        // Limit size: 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size cannot exceed 10MB');
            return;
        }

        setUploading(true);
        try {
            const res = await uploadAttachment(card._id, file, targetAttachmentId);
            const updated = res.data?.card;
            if (updated) {
                setCard(updated);
                storeUpdate(updated);
                socket?.emit('card:update', { boardId, card: updated });
                toast.success('File uploaded successfully');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to upload attachment';
            toast.error(errorMsg);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDeleteFile = async (attachmentId, versionNumber = null) => {
        const msg = versionNumber
            ? `Are you sure you want to delete version v${versionNumber}?`
            : 'Are you sure you want to delete this attachment and all its versions?';
        if (!confirm(msg)) return;
        try {
            const res = await deleteAttachment(card._id, attachmentId, versionNumber);
            const updated = res.data?.card;
            if (updated) {
                setCard(updated);
                storeUpdate(updated);
                socket?.emit('card:update', { boardId, card: updated });
                toast.success(versionNumber ? `Version v${versionNumber} deleted` : 'Attachment deleted');
            }
        } catch {
            toast.error('Failed to delete attachment');
        }
    };

    const toggleAssignee = (userId) =>
        setAssignees(p => p.includes(userId) ? p.filter(id => id !== userId) : [...p, userId]);

    const toggleCheck = (idx) => setChecklist(p => p.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
    const removeCheck = (idx) => setChecklist(p => p.filter((_, i) => i !== idx));
    const addCheck = () => {
        if (!newCheckItem.trim()) return;
        setChecklist(p => [...p, { _id: 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9), text: newCheckItem.trim(), done: false }]);
        setNewCheckItem('');
    };
    const addLabel = () => { if (!newLabel.name.trim()) return; setLabels(p => [...p, { name: newLabel.name.trim(), color: newLabel.color }]); setNewLabel({ name: '', color: LABEL_COLORS[0] }); };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragEndChecklist = (event) => {
        if (!canEdit) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setChecklist((items) => {
            const oldIndex = items.findIndex((item) => (item._id || item.text) === active.id);
            const newIndex = items.findIndex((item) => (item._id || item.text) === over.id);
            if (oldIndex === -1 || newIndex === -1) return items;
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const doneCount = checklist.filter(i => i.done).length;
    const progressPercent = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

    return (
        <div
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[4px] flex items-center justify-center p-4 transition-all duration-300"
            onClick={onClose}
        >
            {/* Modal Container */}
            <div
                className="bg-white dark:bg-slate-800 w-full max-w-5xl h-fit max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 text-on-surface dark:text-slate-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="material-symbols-outlined text-secondary dark:text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>view_kanban</span>
                        <input
                            ref={titleInputRef}
                            value={title}
                            onChange={handleTitleChange}
                            readOnly={!canEdit}
                            className="text-lg font-bold text-slate-800 dark:text-white bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none transition-all px-1 py-0.5 rounded-sm disabled:cursor-default truncate flex-1"
                            placeholder="Untitled Task"
                        />
                        {typingUser && (
                            <span className="text-xs text-green-500 font-semibold whitespace-nowrap animate-pulse">
                                {typingUser} is typing...
                            </span>
                        )}
                        {canEdit && (
                            <button
                                onClick={() => titleInputRef.current?.focus()}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-500"
                                title="Edit Title"
                            >
                                <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-650 rounded-full transition-colors"
                        title="Close Modal"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex flex-col md:flex-row overflow-y-auto flex-1 max-h-[calc(90vh-4rem)]">

                    {/* Left Column: Primary Content */}
                    <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">

                        {/* Labels Section */}
                        <section className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400">label</span>
                                <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400">LABELS</span>
                            </div>

                            <div className="space-y-4">
                                {canEdit && (
                                    <>
                                        <div className="flex gap-2">
                                            <input
                                                value={newLabel.name}
                                                onChange={e => setNewLabel(p => ({ ...p, name: e.target.value }))}
                                                placeholder="Create custom tag..."
                                                type="text"
                                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all dark:text-white"
                                            />
                                            <button
                                                onClick={addLabel}
                                                className="bg-secondary dark:bg-indigo-600 text-on-secondary px-4 py-1.5 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 items-center justify-start py-1">
                                            {LABEL_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setNewLabel(p => ({ ...p, color: c }))}
                                                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${newLabel.color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {labels.map((l, i) => (
                                        <span
                                            key={i}
                                            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-md text-white font-semibold shadow-sm"
                                            style={{ backgroundColor: l.color }}
                                        >
                                            {l.name}
                                            {canEdit && (
                                                <button
                                                    onClick={() => setLabels(p => p.filter((_, j) => j !== i))}
                                                    className="hover:bg-black/15 rounded-full w-4 h-4 flex items-center justify-center transition-colors text-[9px]"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Description Section */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400">notes</span>
                                    <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400">DESCRIPTION</span>
                                </div>
                                <button
                                    onClick={() => setPreviewMd(!previewMd)}
                                    className="flex items-center gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors text-xs text-on-surface-variant dark:text-slate-300 font-medium cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[15px]">{previewMd ? 'edit' : 'visibility'}</span>
                                    <span>{previewMd ? 'Edit' : 'Preview'}</span>
                                </button>
                            </div>

                            {previewMd ? (
                                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 min-h-[120px] border border-slate-200 dark:border-slate-700 shadow-inner overflow-auto">
                                    <ReactMarkdown>{description || '*No description provided yet.*'}</ReactMarkdown>
                                </div>
                            ) : (
                                <textarea
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    readOnly={!canEdit}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl p-4 text-sm text-on-surface dark:text-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all resize-none"
                                    placeholder="Add a more detailed description..."
                                    rows="5"
                                />
                            )}
                        </section>

                        {/* Checklist Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400">check_box</span>
                                    <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400">CHECKLIST</span>
                                </div>
                                {checklist.length > 0 && (
                                    <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 font-bold px-2.5 py-0.5 rounded-full text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                                        {progressPercent}%
                                    </span>
                                )}
                            </div>

                            {checklist.length > 0 && (
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            )}

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndChecklist}>
                                    <SortableContext items={checklist.map((item, idx) => item._id || item.text || idx.toString())} strategy={verticalListSortingStrategy}>
                                        {checklist.map((item, i) => (
                                            <SortableChecklistItem
                                                key={item._id || item.text || i}
                                                item={item}
                                                index={i}
                                                onToggleCheck={toggleCheck}
                                                onRemoveCheck={removeCheck}
                                                canEdit={canEdit}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                                <input
                                    value={newCheckItem}
                                    onChange={e => setNewCheckItem(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCheck()}
                                    placeholder="Add task checkpoint..."
                                    type="text"
                                    className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all dark:text-white"
                                />
                                <button
                                    onClick={addCheck}
                                    className="shrink-0 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-750 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                                >
                                    Add Item
                                </button>
                            </div>
                        </section>

                        {/* Attachments Section */}
                        <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400">attach_file</span>
                                    <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Attachments</span>
                                </div>
                                {canEdit && (
                                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:opacity-90 text-white rounded-lg transition-all text-xs font-bold cursor-pointer active:scale-95 shadow-sm border border-indigo-600/20">
                                        <span className="material-symbols-outlined text-[16px]">upload</span>
                                        <span>Attach File</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleUploadFile}
                                        />
                                    </label>
                                )}
                            </div>

                            {uploading && (
                                <div className="flex items-center gap-2 text-xs text-indigo-500 font-semibold animate-pulse pl-2 py-1">
                                    <span className="w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                    <span>Uploading attachment...</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {card.attachments && card.attachments.length > 0 ? (
                                    card.attachments.map((att) => {
                                        const isImage = att.mimeType?.startsWith('image/');
                                        const sizeInKB = att.size ? Math.round(att.size / 1024) : 0;

                                        const getAttachmentUrl = (path) => {
                                            if (!path) return '';
                                            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
                                                return path;
                                            }
                                            return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
                                        };
                                        const fileUrl = getAttachmentUrl(att.url);

                                        return (
                                            <div
                                                key={att._id}
                                                className="group relative flex flex-col p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden"
                                            >
                                                <div className="flex gap-3">
                                                    {/* Left Thumbnail/Icon */}
                                                    <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-800">
                                                        {isImage ? (
                                                            <img
                                                                src={fileUrl}
                                                                alt={att.filename}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://placehold.co/100?text=File';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-2xl">
                                                                {att.filename.endsWith('.pdf') ? 'picture_as_pdf' :
                                                                    (att.filename.endsWith('.zip') || att.filename.endsWith('.rar')) ? 'folder_zip' :
                                                                        'description'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={att.filename}>
                                                                    {att.filename}
                                                                </p>
                                                                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded uppercase">
                                                                    v{att.version || 1}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-450 dark:text-slate-500 font-medium flex items-center gap-2">
                                                                <span>{sizeInKB} KB</span>
                                                                {att.versions && att.versions.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setOpenHistoryId(openHistoryId === att._id ? null : att._id)}
                                                                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                                                                    >
                                                                        <span>History ({att.versions.length})</span>
                                                                        <span className="material-symbols-outlined text-[12px]">
                                                                            {openHistoryId === att._id ? 'expand_less' : 'expand_more'}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-3 mt-1 items-center">
                                                            <a
                                                                href={fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download={att.filename}
                                                                className="text-[10px] font-bold text-indigo-650 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-[12px]">download</span>
                                                                Download
                                                            </a>

                                                            {canEdit && (
                                                                <label
                                                                    title={`Upload revised version v${(att.version || 1) + 1}`}
                                                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-[12px]">upload</span>
                                                                    <span>v{(att.version || 1) + 1}</span>
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        onChange={(e) => handleUploadFile(e, att._id)}
                                                                    />
                                                                </label>
                                                            )}

                                                            {canEdit && (
                                                                <button
                                                                    onClick={() => handleDeleteFile(att._id)}
                                                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-750 transition-colors flex items-center gap-0.5 cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-[12px]">delete</span>
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Version History Timeline/List */}
                                                {openHistoryId === att._id && att.versions && att.versions.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">history</span>
                                                            <span>Version History</span>
                                                        </p>
                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                            {[...att.versions].reverse().map((ver) => {
                                                                const verUrl = getAttachmentUrl(ver.url);
                                                                const verSize = ver.size ? Math.round(ver.size / 1024) : 0;
                                                                const verDate = ver.uploadedAt ? new Date(ver.uploadedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '';
                                                                return (
                                                                    <div
                                                                        key={ver._id || ver.version}
                                                                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]"
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded shrink-0">
                                                                                v{ver.version}
                                                                            </span>
                                                                            <div className="min-w-0">
                                                                                <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={ver.filename}>
                                                                                    {ver.filename}
                                                                                </p>
                                                                                <p className="text-[9px] text-slate-400">
                                                                                    {verSize} KB • {verDate}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            <a
                                                                                href={verUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                download={ver.filename}
                                                                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                                                                title="Download this version"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[14px]">download</span>
                                                                            </a>
                                                                            {canEdit && att.versions.length > 1 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleDeleteFile(att._id, ver.version)}
                                                                                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                                                                    title={`Delete v${ver.version}`}
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs font-medium bg-slate-50/20 dark:bg-slate-900/10">
                                        No attachments yet.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Aside Meta & Actions */}
                    <aside className="w-full md:w-80 p-6 bg-slate-50/50 dark:bg-slate-900/40 border-l border-slate-200 dark:border-slate-700/60 space-y-8 overflow-y-auto custom-scrollbar">

                        {/* Task Priority & Status */}
                        <section className="space-y-4 bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                                <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400 font-bold">task_alt</span>
                                <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase font-bold text-xs">Work Details</span>
                            </div>

                            {/* Priority */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Priority</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                    disabled={!canEdit}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer disabled:opacity-50 transition-all"
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
                                    disabled={!canEdit}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-none disabled:opacity-50 transition-all"
                                    placeholder="e.g. 8"
                                />
                            </div>

                            {/* Blocked Status */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="blocked-checkbox"
                                        checked={blocked}
                                        onChange={e => {
                                            setBlocked(e.target.checked);
                                            if (!e.target.checked) setBlockedReason('');
                                        }}
                                        disabled={!canEdit}
                                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-350 dark:border-slate-700 cursor-pointer"
                                    />
                                    <label htmlFor="blocked-checkbox" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer select-none">
                                        Blocked / Waiting
                                    </label>
                                </div>
                                {blocked && (
                                    <textarea
                                        value={blockedReason}
                                        onChange={e => setBlockedReason(e.target.value)}
                                        disabled={!canEdit}
                                        placeholder="Reason for blockage..."
                                        rows="2"
                                        className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 rounded-lg p-2 text-xs text-slate-850 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none shadow-sm"
                                    />
                                )}
                            </div>

                            {/* Review Requested */}
                            <div className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    id="review-requested-checkbox"
                                    checked={reviewRequested}
                                    onChange={e => setReviewRequested(e.target.checked)}
                                    disabled={!canEdit}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-355 dark:border-slate-700 cursor-pointer"
                                />
                                <label htmlFor="review-requested-checkbox" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer select-none">
                                    Review Requested
                                </label>
                            </div>
                        </section>

                        {/* Due Date */}
                        <section className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400">calendar_today</span>
                                <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Due Date</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    disabled={!canEdit}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-on-surface dark:text-white outline-none cursor-pointer disabled:opacity-50"
                                />
                            </div>
                        </section>

                        {/* Comments */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400">chat_bubble</span>
                                <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Comments</span>
                            </div>

                            {/* Comment Feed */}
                            <div className="max-h-60 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                {card.comments && card.comments.length > 0 ? (
                                    card.comments.map((c, idx) => (
                                        <div key={idx} className="flex gap-2.5 pb-2 border-b border-slate-105 dark:border-slate-800 last:border-b-0">
                                            <div className="shrink-0">
                                                <Avatar name={c.user?.username || '?'} avatar={c.user?.avatar} size={26} />
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                                                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{c.user?.username || 'User'}</span>
                                                    <span className="text-[9px] text-slate-450 dark:text-slate-500 whitespace-nowrap">
                                                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-150 dark:border-slate-700/60 text-xs text-on-surface dark:text-slate-200 break-words leading-relaxed">
                                                    <ReactMarkdown>{c.text}</ReactMarkdown>
                                                </div>

                                                {/* Reactions */}
                                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                                    {c.reactions && c.reactions.map((react, rIdx) => {
                                                        const hasReacted = react.users?.some(u => (typeof u === 'object' ? u._id : u) === currentUser?._id);
                                                        const tooltipText = react.users?.map(u => u.username || 'User').join(', ') || '';
                                                        return (
                                                            <button
                                                                key={rIdx}
                                                                onClick={() => handleToggleReaction(c._id, react.emoji)}
                                                                title={tooltipText}
                                                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold transition-all border cursor-pointer ${hasReacted
                                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400'
                                                                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-600'
                                                                    }`}
                                                            >
                                                                <span>{react.emoji}</span>
                                                                <span>{react.users?.length || 0}</span>
                                                            </button>
                                                        );
                                                    })}
                                                    <EmojiPickerPopover onSelect={(emoji) => handleToggleReaction(c._id, emoji)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 dark:text-slate-500">No comments yet.</p>
                                )}
                            </div>

                            {/* Comment Input — hidden for Clients */}
                            {canComment(boardRole) ? (
                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                                    <textarea
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder="Add a comment... (Markdown supported)"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all resize-none min-h-[60px] dark:text-white"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-[9px] text-slate-450 dark:text-slate-500 font-semibold">
                                            <span className="material-symbols-outlined text-[12px]">info</span>
                                            <span>Markdown supported</span>
                                        </div>
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim()}
                                            className="bg-indigo-600 hover:bg-indigo-750 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pt-2 border-t border-slate-100 dark:border-slate-850">
                                    Clients cannot post comments.
                                </p>
                            )}
                        </section>

                        {/* Assign Developer Dropdown */}
                        <section className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400">group</span>
                                <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Assign Developer</span>
                            </div>

                            <select
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val) {
                                        toggleAssignee(val);
                                        e.target.value = ""; // Reset select dropdown
                                    }
                                }}
                                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary cursor-pointer transition-all shadow-sm disabled:opacity-50"
                                defaultValue=""
                                disabled={!canAssignMembers(boardRole) || workspaceMembers.filter(m => m.role === 'developer' && m.user).length === 0}
                            >
                                {!canAssignMembers(boardRole) ? (
                                    <option value="" disabled>Task assignment is restricted to Admins only</option>
                                ) : workspaceMembers.filter(m => m.role === 'developer' && m.user).length === 0 ? (
                                    <option value="" disabled>No invited developers in workspace</option>
                                ) : (
                                    <>
                                        <option value="" disabled>-- Select Developer to Assign --</option>
                                        {workspaceMembers
                                            .filter(m => m.role === 'developer' && m.user)
                                            .map(m => {
                                                const isAssigned = assignees.includes(m.user._id);
                                                return (
                                                    <option key={m.user._id} value={m.user._id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                                                        {m.user.username} {isAssigned ? '(Assigned) ✓' : ''}
                                                    </option>
                                                );
                                            })
                                        }
                                    </>
                                )}
                            </select>
                        </section>

                        {/* Current Assignees */}
                        {assignees.length > 0 && (
                            <section className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-secondary dark:text-indigo-400">assignment_ind</span>
                                    <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Current Assignees</span>
                                </div>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {workspaceMembers
                                        .filter(m => m.user && assignees.includes(m.user._id))
                                        .map(m => {
                                            const member = m.user;
                                            return (
                                                <div
                                                    key={member._id}
                                                    className="flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-850 dark:text-white border border-slate-200 dark:border-slate-700"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Avatar name={member.username || '?'} avatar={member.avatar} size={22} />
                                                        <span className="truncate">{member.username}</span>
                                                    </div>
                                                    {canAssignMembers(boardRole) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleAssignee(member._id)}
                                                            className="text-rose-500 hover:text-rose-700 font-bold px-1 transition-colors text-xs cursor-pointer"
                                                            title="Remove assignee"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    }
                                    {assignees
                                        .filter(id => !workspaceMembers.some(m => m.user?._id === id))
                                        .map(id => {
                                            const bm = boardMembers.find(m => m.user?._id === id);
                                            const username = bm?.user?.username || card.assignees?.find(a => (a._id || a) === id)?.username || "Assigned User";
                                            return (
                                                <div
                                                    key={id}
                                                    className="flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-850 dark:text-white border border-slate-200 dark:border-slate-700"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Avatar name={username} size={22} />
                                                        <span className="truncate">{username}</span>
                                                    </div>
                                                    {canAssignMembers(boardRole) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleAssignee(id)}
                                                            className="text-rose-500 hover:text-rose-700 font-bold px-1 transition-colors text-xs cursor-pointer"
                                                            title="Remove assignee"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </section>
                        )}

                        {/* Action Buttons */}
                        <section className="pt-6 space-y-2.5 border-t border-slate-200 dark:border-slate-700/60">
                            <button
                                onClick={handleSave}
                                disabled={saving || !canEdit}
                                className="w-full bg-secondary dark:bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Save changes'}
                            </button>

                            {canSaveTemplate(boardRole) && (
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={savingTemplate}
                                    className="w-full bg-slate-100 dark:bg-slate-750 text-slate-800 dark:text-slate-200 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all border border-slate-200 dark:border-slate-700/60"
                                >
                                    <span className="material-symbols-outlined text-[16px]">bookmark</span>
                                    <span>Save as template</span>
                                </button>
                            )}

                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all border border-rose-200 dark:border-rose-900/50"
                                >
                                    Delete card
                                </button>
                            )}
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CardDetail;
