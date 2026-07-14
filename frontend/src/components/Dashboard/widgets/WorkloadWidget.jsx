import { useEffect, useState } from 'react';
import { getWorkspaceAnalytics } from '../../../api/analytics.api';
import useWorkspaceStore from '../../../store/workspaceStore';
import Avatar from '../../../UI/Avatar';

export default function WorkloadWidget({ workspaceId, data: propData }) {
  const [workloadList, setWorkloadList] = useState(propData || []);
  const [loading, setLoading] = useState(!propData);
  const workspaces = useWorkspaceStore(s => s.workspaces);

  useEffect(() => {
    if (propData) {
      setWorkloadList(propData);
      setLoading(false);
      return;
    }

    const wsId = workspaceId || (workspaces.length > 0 ? workspaces[0]._id : null);
    if (!wsId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getWorkspaceAnalytics(wsId, 'all')
      .then(res => {
        if (res && res.success && res.analytics?.workloadStats) {
          setWorkloadList(res.analytics.workloadStats);
        } else {
          setWorkloadList([]);
        }
      })
      .catch(() => setWorkloadList([]))
      .finally(() => setLoading(false));
  }, [workspaceId, workspaces, propData]);

  return (
    <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-xl border border-outline-variant dark:border-slate-700 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">group_work</span>
            <h3 className="font-title-md text-[18px] font-bold text-on-surface dark:text-white">
              Team Workload Distribution
            </h3>
          </div>
          <span className="text-[11px] font-semibold capitalize tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            Active Load
          </span>
        </div>

        {loading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-surface-container dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        ) : workloadList.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant dark:text-slate-400">
            <span className="material-symbols-outlined text-3xl mb-2">inbox</span>
            <p className="text-sm font-medium">No workload data available for this view.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 max-h-[300px] overflow-y-auto pr-1">
            {workloadList.map((dev, idx) => {
              const total = dev.totalCount || 1;
              const completedPct = ((dev.completedCount || 0) / total) * 100;
              const progressPct = ((dev.progressCount || 0) / total) * 100;
              const reviewPct = ((dev.reviewCount || 0) / total) * 100;
              const blockedPct = ((dev.blockedCount || 0) / total) * 100;

              return (
                <div key={idx} className="flex items-center gap-3 sm:gap-4">
                  <Avatar name={dev.username} avatar={dev.avatar} size={32} />
                  <div className="w-24 sm:w-32 font-body-sm font-medium truncate dark:text-slate-200 text-sm">
                    {dev.username}
                  </div>
                  <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-750 rounded-full overflow-hidden flex shadow-inner">
                    {completedPct > 0 && <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completedPct}%` }} title={`Completed: ${Math.round(completedPct)}%`} />}
                    {progressPct > 0 && <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progressPct}%` }} title={`In Progress: ${Math.round(progressPct)}%`} />}
                    {reviewPct > 0 && <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${reviewPct}%` }} title={`Review: ${Math.round(reviewPct)}%`} />}
                    {blockedPct > 0 && <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${blockedPct}%` }} title={`Blocked: ${Math.round(blockedPct)}%`} />}
                  </div>
                  <div className="w-10 text-right font-body-sm text-on-surface-variant dark:text-slate-400 font-bold text-sm">
                    {Math.round(total)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-outline-variant/60 dark:border-slate-700/60 flex flex-wrap gap-4 sm:gap-6 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-on-surface-variant dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-on-surface-variant dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In Progress
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-on-surface-variant dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Review
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-on-surface-variant dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Blocked
        </div>
      </div>
    </div>
  );
}
