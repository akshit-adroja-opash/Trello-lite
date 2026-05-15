import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { updateCard, deleteCard, getCardActivities } from '../../api/card.api';
import useBoardStore from '../../store/boardStore';
import useSocketStore from '../../store/socketStore';
import Avatar from '../../UI/Avatar';

const LABEL_COLORS = ['#4F46E5','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];

const SectionTitle = ({ children }) => (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{children}</h4>
);

const CardDetail = ({ card: initialCard, columnId, onClose }) => {
    const [card, setCard] = useState(initialCard);
    const [title, setTitle] = useState(initialCard.title);
    const [description, setDescription] = useState(initialCard.description || '');
    const [previewMd, setPreviewMd] = useState(false);
    const [dueDate, setDueDate] = useState(initialCard.dueDate ? initialCard.dueDate.slice(0, 10) : '');
    const [labels, setLabels] = useState(initialCard.labels || []);
    const [newLabel, setNewLabel] = useState({ name: '', color: LABEL_COLORS[0] });
    const [checklist, setChecklist] = useState(initialCard.checklist || []);
    const [newCheckItem, setNewCheckItem] = useState('');
    const [activities, setActivities] = useState([]);
    const [saving, setSaving] = useState(false);

    const { updateCard: storeUpdate, removeCard } = useBoardStore();
    const socket = useSocketStore(s => s.socket);
    const boardId = useBoardStore(s => s.board?._id);

    useEffect(() => {
        getCardActivities(card._id).then(res => setActivities(res.data?.activities || [])).catch(() => {});
    }, [card._id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updateCard(card._id, { title, description, dueDate: dueDate || null, labels, checklist, version: card.version });
            const updated = res.data?.card;
            setCard(updated);
            storeUpdate(updated);
            socket?.emit('card:update', { boardId, card: updated });
            toast.success('Card saved');
        } catch (err) {
            if (err.response?.status === 409) toast.error('Conflict: card was modified by someone else');
            else toast.error('Failed to save card');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this card?')) return;
        try {
            await deleteCard(card._id);
            removeCard(card._id, columnId);
            socket?.emit('card:delete', { boardId, cardId: card._id, columnId });
            onClose();
        } catch { toast.error('Failed to delete card'); }
    };

    const toggleCheck = (idx) => setChecklist(p => p.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
    const removeCheck = (idx) => setChecklist(p => p.filter((_, i) => i !== idx));
    const addCheck = () => { if (!newCheckItem.trim()) return; setChecklist(p => [...p, { text: newCheckItem.trim(), done: false }]); setNewCheckItem(''); };
    const addLabel = () => { if (!newLabel.name.trim()) return; setLabels(p => [...p, { name: newLabel.name.trim(), color: newLabel.color }]); setNewLabel({ name: '', color: LABEL_COLORS[0] }); };

    const doneCount = checklist.filter(i => i.done).length;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-on-surface/40 overflow-y-auto py-8 px-4"
            onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-lg border border-outline-variant w-full max-w-2xl"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-start gap-3 p-5 border-b border-outline-variant">
                    <div className="w-5 h-5 mt-0.5 shrink-0 text-on-surface-variant">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                        </svg>
                    </div>
                    <input value={title} onChange={e => setTitle(e.target.value)}
                        className="flex-1 text-lg font-semibold text-on-surface bg-transparent border-b-2 border-transparent focus:border-primary focus:outline-none transition" />
                    <button onClick={onClose}
                        className="text-on-surface-variant hover:text-on-surface w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-raised transition text-lg leading-none">✕</button>
                </div>

                <div className="p-5 grid grid-cols-3 gap-6">
                    {/* ── Main ── */}
                    <div className="col-span-2 space-y-6">

                        {/* Labels */}
                        <div>
                            <SectionTitle>Labels</SectionTitle>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {labels.map((l, i) => (
                                    <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white font-semibold"
                                        style={{ backgroundColor: l.color }}>
                                        {l.name}
                                        <button onClick={() => setLabels(p => p.filter((_, j) => j !== i))}
                                            className="hover:opacity-70 leading-none">✕</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <input value={newLabel.name} onChange={e => setNewLabel(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Label name"
                                    className="flex-1 h-8 px-3 rounded-lg border border-outline-variant bg-surface-raised text-sm text-on-surface focus:outline-none focus:border-primary" />
                                <div className="flex gap-1">
                                    {LABEL_COLORS.map(c => (
                                        <button key={c} onClick={() => setNewLabel(p => ({ ...p, color: c }))}
                                            className={`w-5 h-5 rounded-full border-2 transition-transform ${newLabel.color === c ? 'border-on-surface scale-110' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <button onClick={addLabel}
                                    className="h-8 px-3 bg-primary hover:bg-primary-dark text-on-primary text-xs font-semibold rounded-lg transition">Add</button>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <SectionTitle>Description</SectionTitle>
                                <button onClick={() => setPreviewMd(v => !v)}
                                    className="text-xs font-medium text-primary hover:text-primary-dark">
                                    {previewMd ? 'Edit' : 'Preview'}
                                </button>
                            </div>
                            {previewMd ? (
                                <div className="prose prose-sm max-w-none text-on-surface bg-surface-raised rounded-xl p-4 min-h-[80px] border border-outline-variant">
                                    <ReactMarkdown>{description || '*No description*'}</ReactMarkdown>
                                </div>
                            ) : (
                                <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder="Add a description (markdown supported)…"
                                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-raised text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition" />
                            )}
                        </div>

                        {/* Checklist */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <SectionTitle>Checklist</SectionTitle>
                                {checklist.length > 0 && (
                                    <span className="text-xs text-on-surface-variant font-medium">{doneCount}/{checklist.length}</span>
                                )}
                            </div>
                            {checklist.length > 0 && (
                                <div className="w-full bg-surface-overlay rounded-full h-1.5 mb-3">
                                    <div className="bg-primary h-1.5 rounded-full transition-all"
                                        style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                                </div>
                            )}
                            <div className="space-y-2 mb-2">
                                {checklist.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2.5 group">
                                        <input type="checkbox" checked={item.done} onChange={() => toggleCheck(i)}
                                            className="w-4 h-4 accent-primary rounded cursor-pointer shrink-0" />
                                        <span className={`flex-1 text-sm ${item.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                                            {item.text}
                                        </span>
                                        <button onClick={() => removeCheck(i)}
                                            className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error text-xs transition">✕</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCheck()}
                                    placeholder="Add item…"
                                    className="flex-1 h-8 px-3 rounded-lg border border-outline-variant bg-surface-raised text-sm text-on-surface focus:outline-none focus:border-primary" />
                                <button onClick={addCheck}
                                    className="h-8 px-3 bg-surface-overlay hover:bg-surface-variant text-on-surface-variant text-xs font-medium rounded-lg transition">Add</button>
                            </div>
                        </div>

                        {/* Activity */}
                        {activities.length > 0 && (
                            <div>
                                <SectionTitle>Activity</SectionTitle>
                                <div className="space-y-2.5 max-h-40 overflow-y-auto">
                                    {activities.map(a => (
                                        <div key={a._id} className="flex items-start gap-2">
                                            <Avatar name={a.user?.username || '?'} size={22} />
                                            <div className="text-xs text-on-surface-variant leading-relaxed">
                                                <span className="font-semibold text-on-surface">{a.user?.username}</span>
                                                {' '}{a.details}
                                                <span className="ml-1 text-text-muted">
                                                    · {new Date(a.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-5">
                        <div>
                            <SectionTitle>Due Date</SectionTitle>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                className="w-full h-9 px-3 rounded-xl border border-outline-variant bg-surface-raised text-sm text-on-surface focus:outline-none focus:border-primary transition" />
                        </div>

                        <div className="space-y-2 pt-2">
                            <button onClick={handleSave} disabled={saving}
                                className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary text-sm font-semibold rounded-xl transition disabled:opacity-60">
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                            <button onClick={handleDelete}
                                className="w-full h-10 bg-error-container hover:bg-error/20 text-on-error-container text-sm font-medium rounded-xl transition">
                                Delete card
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardDetail;
