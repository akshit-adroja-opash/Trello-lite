const shortcuts = [
    { key: '/',   desc: 'Focus search bar' },
    { key: '?',   desc: 'Toggle this help modal' },
    { key: 'Esc', desc: 'Close modal / cancel action' },
    { key: 'Enter', desc: 'Confirm add card or column' },
];

const KeyboardShortcutsModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 transition-all" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header Area */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">System Hotkeys</h2>
                </div>
                <button onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 1l12 12M13 1L1 13"/>
                    </svg>
                </button>
            </div>
            
            {/* Shortcuts Content Loop */}
            <div className="space-y-3.5">
                {shortcuts.map(s => (
                    <div key={s.key} className="flex items-center justify-between gap-4 bg-slate-50/50 p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-medium text-slate-600">{s.desc}</span>
                        <kbd className="shrink-0 bg-white border border-slate-200 border-b-[3px] border-b-slate-300 rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold text-slate-700 min-w-[2.75rem] text-center shadow-sm">
                            {s.key}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default KeyboardShortcutsModal;