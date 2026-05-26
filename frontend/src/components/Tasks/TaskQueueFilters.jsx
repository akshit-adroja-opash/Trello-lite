import React from 'react';

const TaskQueueFilters = ({ filters, onChange }) => {
    const handleToggle = (key) => {
        onChange({
            ...filters,
            [key]: !filters[key]
        });
    };

    const handlePriorityChange = (e) => {
        onChange({
            ...filters,
            priority: e.target.value || null
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                    Filter By
                </span>

                {/* Priority Selector */}
                <div className="flex items-center gap-2">
                    <select
                        value={filters.priority || ''}
                        onChange={handlePriorityChange}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all cursor-pointer"
                    >
                        <option value="">⚡ All Priorities</option>
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="urgent">🔴 Urgent</option>
                    </select>
                </div>

                {/* Quick Toggle Filters */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleToggle('blocked')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                            filters.blocked
                                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-450 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-650 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-850'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xs">block</span>
                        Blocked
                    </button>

                    <button
                        onClick={() => handleToggle('overdue')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                            filters.overdue
                                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-450 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-650 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-850'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xs">alarm_on</span>
                        Overdue
                    </button>

                    <button
                        onClick={() => handleToggle('dueSoon')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                            filters.dueSoon
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-650 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-850'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        Due Soon
                    </button>

                    <button
                        onClick={() => handleToggle('reviewRequested')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                            filters.reviewRequested
                                ? 'bg-blue-50 border-blue-200 text-blue-650 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-450 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-650 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-850'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xs">rate_review</span>
                        Review Requested
                    </button>
                </div>
            </div>

            {/* Clear Filters Button */}
            {Object.values(filters).some(v => v !== null && v !== false) && (
                <button
                    onClick={() => onChange({ priority: null, blocked: false, overdue: false, dueSoon: false, reviewRequested: false })}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors border border-dashed border-rose-200 dark:border-rose-900 hover:border-solid rounded-xl hover:bg-rose-50/20 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-sm">clear_all</span>
                    Clear Filters
                </button>
            )}
        </div>
    );
};

export default TaskQueueFilters;
