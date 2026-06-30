import { useState, useRef, useEffect } from "react";

const CustomSelect = ({ value, onChange, options, icon, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 text-body-sm font-medium text-on-surface dark:text-white rounded-lg px-4 py-2 hover:border-secondary hover:ring-1 hover:ring-secondary/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 shadow-sm transition-all min-w-[200px]"
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-slate-400">{icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </div>
        <span className={`material-symbols-outlined text-[20px] text-on-surface-variant dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[100] top-full right-0 mt-1.5 w-full min-w-[200px] bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left ${value === opt.value ? 'bg-secondary/10 dark:bg-indigo-500/20 text-secondary dark:text-indigo-300 font-bold' : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-700'}`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-on-surface-variant dark:text-slate-500">
                No items found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
