import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDeveloperDashboardData } from '../../api/dashboard.api';

import { PRIORITY_CHIP_STYLES } from '../../utils/constants';
import MetricCard from '../common/MetricCard';

const TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'due_soon', label: 'Due Soon' },
];

function isOverdue(d) { return d && new Date(d) < new Date(); }
function isDueSoon(d) {
  if (!d) return false;
  const diff = (new Date(d) - new Date()) / 86400000;
  return diff >= 0 && diff <= 7;
}

export default function DeveloperDashboardPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    getDeveloperDashboardData()
      .then(res => res.success && setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = (data?.myTasks || []).filter(t => {
    if (activeTab === 'blocked') return t.blocked;
    if (activeTab === 'due_soon') return isDueSoon(t.dueDate);
    return true;
  });

  return (
    <section className="space-y-xl">
      {/* Header */}
      <div>
        <h2 className="font-display-xl text-display-xl text-primary dark:text-white">My Work Queue</h2>
        <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 mt-xs">
          Your assigned tasks, blockers, and upcoming deadlines.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-container dark:bg-slate-800 animate-pulse border border-outline-variant dark:border-slate-700" />
        )) : <>
          <MetricCard label="My Tasks" icon="task_alt" value={data?.stats.myTaskCount} sub="In progress" />
          <MetricCard label="Blocked" icon="block" value={data?.stats.blockedCount} sub="Needs attention" danger={data?.stats.blockedCount > 0} />
          <MetricCard label="Due Soon (7d)" icon="schedule" value={data?.stats.dueSoonCount} sub="This week" />
          <MetricCard label="Overdue" icon="alarm" value={data?.stats.overdueCount} sub="Past deadline" danger={data?.stats.overdueCount > 0} />
        </>}
      </div>

      {/* Task List + Blocked Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Main Task List with Tabs */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl p-lg shadow-sm flex flex-col gap-md">
          <div className="flex items-center justify-between flex-wrap gap-sm">
            <h3 className="font-title-md text-title-md text-primary dark:text-white">Tasks</h3>
            <div className="flex gap-xs p-xs bg-surface-container dark:bg-slate-700 rounded-lg">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-sm py-xs font-body-sm font-medium rounded-md transition-all text-[13px]
                    ${activeTab === t.key
                      ? 'bg-surface-container-lowest dark:bg-slate-600 text-on-surface dark:text-white shadow-sm'
                      : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-container dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-xl gap-sm text-on-surface-variant dark:text-slate-400">
              <span className="material-symbols-outlined text-[48px]">check_circle</span>
              <p className="font-body-md">
                {activeTab === 'all' ? 'No tasks assigned yet' : `No ${activeTab.replace('_', ' ')} tasks`}
              </p>
            </div>
          ) : (
            <div className="space-y-xs max-h-72 overflow-y-auto pr-xs">
              {filteredTasks.map(task => {
                const cfg = PRIORITY_CHIP_STYLES[task.priority] || PRIORITY_CHIP_STYLES.medium;
                const overdue = isOverdue(task.dueDate);
                const soon = isDueSoon(task.dueDate);
                return (
                  <div key={task._id} className="flex items-start gap-sm px-md py-sm rounded-lg bg-surface-container-low dark:bg-slate-700/50 hover:bg-surface-container dark:hover:bg-slate-700 transition-colors">
                    {task.blocked && (
                      <span className="material-symbols-outlined text-error text-[16px] mt-0.5 shrink-0">block</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm font-semibold text-on-surface dark:text-white truncate">{task.title}</p>
                      <div className="flex items-center gap-sm">
                        <span className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400 truncate">{task.board?.name}</span>
                        {task.dueDate && (
                          <span className={`font-label-caps text-[10px] shrink-0 font-bold
                            ${overdue ? 'text-error' : soon ? 'text-[#e65100] dark:text-amber-400' : 'text-on-surface-variant dark:text-slate-500'}`}>
                            {overdue ? '⚠ Overdue' : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 font-label-caps text-[10px] uppercase px-xs py-xs rounded ${cfg}`}>
                      {task.priority?.slice(0, 3) || 'med'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blocked Items */}
        <div className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl p-lg shadow-sm flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[18px] text-error">block</span>
            <h3 className="font-title-md text-title-md text-primary dark:text-white">Blocked Items</h3>
          </div>
          {loading ? (
            <div className="space-y-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-container dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          ) : data?.blockedItems?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-lg gap-sm text-on-tertiary-container">
              <span className="material-symbols-outlined text-[40px]">check_circle</span>
              <p className="font-body-sm text-center">No blocked items!<br />You&apos;re all clear 🎉</p>
            </div>
          ) : (
            <div className="space-y-xs flex-1">
              {data.blockedItems.map(item => (
                <div key={item._id} className="px-md py-sm rounded-lg border border-error/20 bg-error-container/10 dark:bg-red-950/20">
                  <p className="font-body-sm font-semibold text-on-surface dark:text-white truncate">{item.title}</p>
                  <p className="font-body-sm text-[12px] text-error truncate mt-xs">
                    {item.blockedReason || 'No reason given'}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-auto pt-sm border-t border-outline-variant dark:border-slate-700">
            <Link to="/my-tasks" className="flex items-center justify-center gap-xs w-full px-md py-sm rounded-lg bg-secondary text-on-secondary font-body-sm font-medium hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[16px]">checklist</span>
              View All My Tasks
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
