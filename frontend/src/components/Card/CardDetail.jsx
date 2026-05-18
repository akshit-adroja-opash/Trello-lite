import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { updateCard, deleteCard, getCardActivities } from '../../api/card.api';
import useBoardStore from '../../store/boardStore';
import useSocketStore from '../../store/socketStore';
import Avatar from '../../UI/Avatar';

const LABEL_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const SectionTitle = ({ children, icon }) => (
    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
        <span className="text-indigo-400">{icon}</span>
        {children}
    </h4>
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
    const [assignees, setAssignees] = useState(
        (initialCard.assignees || []).map(a => (typeof a === 'object' ? a._id : a))
    );
    const [activities, setActivities] = useState([]);
    const [saving, setSaving] = useState(false);

    const { updateCard: storeUpdate, removeCard, board } = useBoardStore();
    const socket = useSocketStore(s => s.socket);
    const boardId = useBoardStore(s => s.board?._id);

    const boardMembers = board?.members || [];

    useEffect(() => {
        getCardActivities(card._id).then(res => setActivities(res.data?.activities || [])).catch(() => {});
    }, [card._id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updateCard(card._id, {
                title, description, dueDate: dueDate || null,
                labels, checklist, assignees, version: card.version
            });
            const updated = res.data?.card;
            setCard(updated);
            storeUpdate(updated);
            socket?.emit('card:update', { boardId, card: updated });
            toast.success('Card details saved');
        } catch (err) {
            if (err.response?.status === 409) toast.error('Conflict: Modified by another user');
            else toast.error('Failed to save changes');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this card?')) return;
        try {
            await deleteCard(card._id);
            removeCard(card._id, columnId);
            socket?.emit('card:delete', { boardId, cardId: card._id, columnId });
            onClose();
        } catch { toast.error('Failed to delete card'); }
    };

    const toggleAssignee = (userId) =>
        setAssignees(p => p.includes(userId) ? p.filter(id => id !== userId) : [...p, userId]);

    const toggleCheck = (idx) => setChecklist(p => p.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
    const removeCheck = (idx) => setChecklist(p => p.filter((_, i) => i !== idx));
    const addCheck = () => { if (!newCheckItem.trim()) return; setChecklist(p => [...p, { text: newCheckItem.trim(), done: false }]); setNewCheckItem(''); };
    const addLabel = () => { if (!newLabel.name.trim()) return; setLabels(p => [...p, { name: newLabel.name.trim(), color: newLabel.color }]); setNewLabel({ name: '', color: LABEL_COLORS[0] }); };

    const doneCount = checklist.filter(i => i.done).length;
    const progressPercent = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md overflow-y-auto py-10 px-4 transition-all duration-300"
            onClick={onClose}>
            <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-3xl transform scale-100 transition-all duration-200 overflow-hidden"
                onClick={e => e.stopPropagation()}>
                
                {/* Header Section */}
                <div className="flex items-center gap-4 p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="w-5 h-5 shrink-0 text-indigo-400">
                        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                        </svg>
                    </div>
                    <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        className="flex-1 text-xl font-bold text-white bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none transition-all px-1 py-0.5 rounded-sm" 
                        placeholder="Untitled Task"
                    />
                    <button onClick={onClose}
                        className="text-slate-400 hover:text-rose-400 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-500/10 transition-all duration-150 text-base">✕</button>
                </div>

                {/* Core Layout Columns */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Side: Content Controls */}
                    <div className="md:col-span-2 space-y-8">
                        
                        {/* Labels Control */}
                        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800">
                            <SectionTitle icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M7 7h.01M6 20l6.5-6.5A2.5 2.5 0 0016 10c0-1.38-.62-2.5-1.5-2.5S12 8.62 12 10a2.5 2.5 0 00.5 1.5L6 18H4v-2z"/></svg>
                            }>Labels</SectionTitle>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                {labels.map((l, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-md text-white font-semibold shadow-sm"
                                        style={{ backgroundColor: l.color }}>
                                        {l.name}
                                        <button onClick={() => setLabels(p => p.filter((_, j) => j !== i))}
                                            className="hover:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center transition-colors text-[10px]">✕</button>
                                    </span>
                                ))}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                <input value={newLabel.name} onChange={e => setNewLabel(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Create custom tag..."
                                    className="flex-1 h-9 px-3 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
                                <div className="flex gap-1.5 items-center justify-center py-1">
                                    {LABEL_COLORS.map(c => (
                                        <button key={c} onClick={() => setNewLabel(p => ({ ...p, color: c }))}
                                            className={`w-5 h-5 rounded-full transition-all ${newLabel.color === c ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-indigo-500 scale-110 shadow-md' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <button onClick={addLabel}
                                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all">Add</button>
                            </div>
                        </div>

                        {/* Description Editor / Previewer */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <SectionTitle icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
                                }>Description</SectionTitle>
                                <button onClick={() => setPreviewMd(v => !v)}
                                    className="text-xs font-semibold px-3 py-1 bg-slate-800 text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors border border-slate-700">
                                    {previewMd ? '✏️ Edit' : '👁️ Preview'}
                                </button>
                            </div>
                            {previewMd ? (
                                <div className="prose prose-invert prose-sm max-w-none text-slate-300 bg-slate-950 rounded-xl p-4 min-h-[140px] border border-slate-800 shadow-inner">
                                    <ReactMarkdown>{description || '*No description provided yet.*'}</ReactMarkdown>
                                </div>
                            ) : (
                                <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder="Add structural Markdown updates (headers, tables, links)..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all duration-150 shadow-inner" />
                            )}
                        </div>

                        {/* Checklist Control */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <SectionTitle icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                                }>Checklist</SectionTitle>
                                {checklist.length > 0 && (
                                    <span className="text-xs bg-indigo-950 font-bold px-2.5 py-0.5 rounded-full text-indigo-400 border border-indigo-900/60">{progressPercent}%</span>
                                )}
                            </div>
                            
                            {checklist.length > 0 && (
                                <div className="w-full bg-slate-950 rounded-full h-2 mb-4 overflow-hidden border border-slate-800 shadow-inner">
                                    <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }} />
                                </div>
                            )}

                            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                                {checklist.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 group bg-slate-800/20 hover:bg-slate-800/60 px-4 py-2.5 rounded-lg border border-slate-800/40 transition-all duration-100">
                                        <input type="checkbox" checked={item.done} onChange={() => toggleCheck(i)}
                                            className="w-4.5 h-4.5 accent-indigo-500 bg-slate-950 border-slate-700 rounded cursor-pointer shrink-0" />
                                        <span className={`flex-1 text-sm ${item.done ? 'line-through text-slate-500 font-medium' : 'text-slate-200'}`}>
                                            {item.text}
                                        </span>
                                        <button onClick={() => removeCheck(i)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition-all text-xs">✕</button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex gap-2">
                                <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCheck()}
                                    placeholder="Add task checkpoint..."
                                    className="flex-1 h-10 px-3 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                                <button onClick={addCheck}
                                    className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition shadow-sm">Add Item</button>
                            </div>
                        </div>

                        {/* Activities Logger Panel */}
                        {activities.length > 0 && (
                            <div className="pt-5 border-t border-slate-800">
                                <SectionTitle icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                }>Activity Log</SectionTitle>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                    {activities.map(a => (
                                        <div key={a._id} className="flex items-start gap-3 bg-slate-800/20 p-3 rounded-lg border border-slate-800/40">
                                            <Avatar name={a.user?.username || '?'} size={24} />
                                            <div className="text-xs text-slate-400 leading-normal flex-1">
                                                <span className="font-bold text-slate-200">{a.user?.username}</span>
                                                {' '}{a.details}
                                                <div className="text-[10px] text-slate-500 mt-1 font-medium">
                                                    {new Date(a.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Meta Sidebar Control Deck */}
                    <div className="space-y-6 bg-slate-800/30 p-5 rounded-xl border border-slate-800 h-fit">
                        <div>
                            <SectionTitle icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            }>Due Date</SectionTitle>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium scheme-dark" />
                        </div>

                        {boardMembers.length > 0 && (
                            <div>
                                <SectionTitle icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                }>Assignees</SectionTitle>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                    {boardMembers.map(m => {
                                        const member = m.user;
                                        if (!member) return null;
                                        const id = member._id;
                                        const checked = assignees.includes(id);
                                        return (
                                            <button key={id} onClick={() => toggleAssignee(id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${checked ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 bg-slate-950/40 text-slate-300 border border-slate-800/60'}`}>
                                                <Avatar name={member.username || '?'} avatar={member.avatar} size={22} />
                                                <span className="flex-1 text-left truncate">{member.username}</span>
                                                {checked && <span className="text-sm">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Actions Control Deck */}
                        <div className="space-y-2 pt-5 border-t border-slate-800">
                            <button onClick={handleSave} disabled={saving}
                                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Save changes'}
                            </button>
                            <button onClick={handleDelete}
                                className="w-full h-10 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-rose-500/20 hover:border-transparent">
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