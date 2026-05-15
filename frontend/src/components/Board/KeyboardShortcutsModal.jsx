const shortcuts = [
    { key: '/',   desc: 'Focus search bar' },
    { key: '?',   desc: 'Toggle this help modal' },
    { key: 'Esc', desc: 'Close modal / cancel action' },
    { key: 'Enter', desc: 'Confirm add card or column' },
];

const KeyboardShortcutsModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-4" onClick={onClose}>
        <div className="bg-surface rounded-2xl shadow-lg border border-outline-variant p-6 w-80" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-on-surface">Keyboard Shortcuts</h2>
                <button onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-raised transition text-lg leading-none">✕</button>
            </div>
            <div className="space-y-3">
                {shortcuts.map(s => (
                    <div key={s.key} className="flex items-center gap-3">
                        <kbd className="shrink-0 bg-surface-raised border border-outline-variant rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-on-surface min-w-[2.5rem] text-center">
                            {s.key}
                        </kbd>
                        <span className="text-sm text-on-surface-variant">{s.desc}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default KeyboardShortcutsModal;
