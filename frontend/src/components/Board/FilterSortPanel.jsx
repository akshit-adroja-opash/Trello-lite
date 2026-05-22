import React from 'react';
import Avatar from '../../UI/Avatar';

const FilterSortPanel = ({
    uniqueLabels,
    uniqueAssignees,
    selectedLabels,
    setSelectedLabels,
    selectedAssignees,
    setSelectedAssignees,
    dueDateFilter,
    setDueDateFilter,
    sortBy,
    setSortBy,
    onClearAll
}) => {
    
    const handleLabelToggle = (labelName) => {
        if (selectedLabels.includes(labelName)) {
            setSelectedLabels(selectedLabels.filter(name => name !== labelName));
        } else {
            setSelectedLabels([...selectedLabels, labelName]);
        }
    };

    const handleAssigneeToggle = (userId) => {
        if (selectedAssignees.includes(userId)) {
            setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
        } else {
            setSelectedAssignees([...selectedAssignees, userId]);
        }
    };

    const hasActiveFilters = 
        selectedLabels.length > 0 || 
        selectedAssignees.length > 0 || 
        dueDateFilter !== 'all' || 
        sortBy !== 'default';

    return (
        <div className="px-6 py-5 md:px-8 bg-white dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/50 flex flex-col gap-4 text-sm transition-all duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Labels Filter */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Labels
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-2 scrollbar-thin">
                        {uniqueLabels.length === 0 ? (
                            <span className="text-xs text-slate-450 dark:text-slate-500 italic">No labels on this board</span>
                        ) : (
                            uniqueLabels.map(label => (
                                <label 
                                    key={label.name} 
                                    className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 select-none transition-colors"
                                >
                                    <input 
                                        type="checkbox"
                                        checked={selectedLabels.includes(label.name)}
                                        onChange={() => handleLabelToggle(label.name)}
                                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                                    />
                                    <span 
                                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                                        style={{ backgroundColor: label.color || '#cbd5e1' }}
                                    />
                                    <span className="font-semibold text-xs">{label.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Assignees Filter */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Assignees
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-2 scrollbar-thin">
                        {uniqueAssignees.length === 0 ? (
                            <span className="text-xs text-slate-450 dark:text-slate-500 italic">No members assigned to cards</span>
                        ) : (
                            uniqueAssignees.map(user => (
                                <label 
                                    key={user._id} 
                                    className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 select-none transition-colors"
                                >
                                    <input 
                                        type="checkbox"
                                        checked={selectedAssignees.includes(user._id)}
                                        onChange={() => handleAssigneeToggle(user._id)}
                                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                                    />
                                    <Avatar name={user.username} avatar={user.avatar} size={18} />
                                    <span className="font-semibold text-xs">{user.username}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Due Date Filter */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Due Date
                    </span>
                    <div className="flex flex-col gap-1.5">
                        {[
                            { value: 'all', label: 'All Dates' },
                            { value: 'overdue', label: 'Overdue' },
                            { value: 'today', label: 'Due Today' },
                            { value: 'week', label: 'Due This Week' },
                            { value: 'noDate', label: 'No Due Date' }
                        ].map(option => (
                            <label 
                                key={option.value} 
                                className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 select-none transition-colors font-semibold text-xs"
                            >
                                <input 
                                    type="radio"
                                    name="dueDateFilter"
                                    value={option.value}
                                    checked={dueDateFilter === option.value}
                                    onChange={() => setDueDateFilter(option.value)}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 4. Sorting */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Sort Cards By
                    </span>
                    <div className="relative">
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold appearance-none focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                        >
                            <option value="default">Default (Column Order)</option>
                            <option value="dueDate">Due Date: Soonest First</option>
                            <option value="titleAsc">Title: A-Z</option>
                            <option value="titleDesc">Title: Z-A</option>
                            <option value="newest">Created Date: Newest First</option>
                        </select>
                        <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

            </div>

            {/* Clear All Option */}
            {hasActiveFilters && (
                <div className="flex justify-end border-t border-slate-100 dark:border-slate-800/40 pt-3 mt-1 shrink-0">
                    <button 
                        onClick={onClearAll}
                        className="px-3.5 py-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/20 border border-rose-200/50 dark:border-rose-900/40 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-[16px]">clear_all</span>
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default FilterSortPanel;
