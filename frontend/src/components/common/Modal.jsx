
const Modal = ({ isOpen, onClose, title, icon, children, maxWidth = 'max-w-2xl', bodyClassName = 'p-lg' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-6 transition-all overflow-y-auto animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className={`bg-surface-container-lowest dark:bg-slate-800 w-full ${maxWidth} rounded-2xl shadow-xl border border-outline-variant dark:border-slate-700 flex flex-col max-h-full animate-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header (optional, rendered if title or icon is provided) */}
        {(title || icon) && (
          <div className="flex items-center justify-between p-lg border-b border-outline-variant dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-sm">
              {icon && <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-[24px]">{icon}</span>}
              {title && <h2 className="text-title-lg font-title-lg text-on-surface dark:text-white">{title}</h2>}
            </div>
            <button 
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        
        {/* Body (scrollable) */}
        <div className={`${bodyClassName} overflow-y-auto custom-scrollbar flex-1`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
