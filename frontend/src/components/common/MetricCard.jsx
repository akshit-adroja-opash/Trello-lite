export default function MetricCard({ label, icon, value, sub, danger, subCls }) {
  return (
    <div className={`bg-surface-container-lowest dark:bg-slate-800 rounded-xl p-lg shadow-sm border flex flex-col justify-between gap-md
      ${danger ? 'border-error/30' : 'border-outline-variant dark:border-slate-700'}`}>
      <div className="flex justify-between items-start">
        <span className={`font-label-caps text-label-caps uppercase tracking-wider ${danger ? 'text-error' : 'text-on-surface-variant dark:text-slate-400'}`}>{label}</span>
        <span className={`material-symbols-outlined p-xs rounded-md text-[20px] ${danger ? 'text-error bg-error/10' : 'text-secondary dark:text-indigo-400 bg-secondary/10 dark:bg-indigo-900/30'}`}>{icon}</span>
      </div>
      <div className="flex items-end gap-sm">
        <span className={`font-headline-lg text-headline-lg leading-none ${danger ? 'text-error' : 'text-primary dark:text-white'}`}>{value ?? '—'}</span>
        {sub && <span className={`font-body-sm text-body-sm mb-xs ${subCls || 'text-on-surface-variant dark:text-slate-400'}`}>{sub}</span>}
      </div>
    </div>
  );
}
