import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjectManagerDashboardData } from '../../api/dashboard.api';

import { PRIORITY_CHIP_STYLES } from '../../utils/constants';
import MetricCard from '../common/MetricCard';

function CardRow({ card, showReason }) {
  const cfg = PRIORITY_CHIP_STYLES[card.priority] || PRIORITY_CHIP_STYLES.medium;
  return (
    <div className="flex items-start gap-sm px-md py-sm rounded-lg bg-surface-container-low dark:bg-slate-700/50 hover:bg-surface-container dark:hover:bg-slate-700 transition-colors">
      <span className={`shrink-0 mt-0.5 font-label-caps text-label-caps uppercase text-[10px] px-xs py-xs rounded ${cfg}`}>
        {card.priority?.slice(0, 3) || 'med'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-body-sm font-semibold text-on-surface dark:text-white truncate">{card.title}</p>
        <p className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400 truncate">
          {card.board?.name}
          {showReason && card.blockedReason ? ` · ${card.blockedReason}` : ''}
          {card.dueDate ? ` · ${new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
        </p>
      </div>
    </div>
  );
}

function SectionCard({ icon, iconColor, title, children, emptyMsg }) {
  return (
    <div className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl p-lg shadow-sm flex flex-col gap-md">
      <div className="flex items-center gap-sm">
        <span className={`material-symbols-outlined text-[18px] ${iconColor}`}>{icon}</span>
        <h3 className="font-title-md text-title-md text-primary dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

const Skeleton = () => (
  <div className="space-y-sm">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-12 rounded-lg bg-surface-container dark:bg-slate-700 animate-pulse" />
    ))}
  </div>
);

export default function ProjectManagerDashboardPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectManagerDashboardData()
      .then(res => res.success && setData(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);


  return (
    <section className="space-y-xl">
      {/* Header */}
      <div>
        <h2 className="font-display-xl text-display-xl text-primary dark:text-white">Delivery Health</h2>
        <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 mt-xs">
          Project pipeline, blockers, and client review status.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-container dark:bg-slate-800 animate-pulse border border-outline-variant dark:border-slate-700" />
        )) : <>
          <MetricCard label="Active Boards" icon="dashboard" value={data?.stats.activeBoardCount} sub="In progress" />
          <MetricCard label="Overdue Cards" icon="alarm" value={data?.stats.overdueCount} sub="Past due date" danger />
          <MetricCard label="Blocked Tasks" icon="block" value={data?.stats.blockedCount} sub="Need unblocking" danger />
          <MetricCard label="Pending Reviews" icon="rate_review" value={data?.stats.reviewCount} sub="Clients waiting" />
        </>}
      </div>

      {/* Three content columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Upcoming Milestones */}
        <SectionCard icon="flag" iconColor="text-[#7c3aed]" title="Upcoming Milestones">
          {loading ? <Skeleton /> : data?.upcomingMilestones?.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant dark:text-slate-400 text-center py-md">No upcoming milestones 🎉</p>
          ) : (
            <div className="space-y-xs">
              {data.upcomingMilestones.map(c => <CardRow key={c._id} card={c} />)}
            </div>
          )}
        </SectionCard>

        {/* Blocked Tasks */}
        <SectionCard icon="block" iconColor="text-error" title="Blocked Tasks">
          {loading ? <Skeleton /> : data?.blockedTasks?.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant dark:text-slate-400 text-center py-md">No blocked tasks 🎉</p>
          ) : (
            <div className="space-y-xs">
              {data.blockedTasks.map(c => <CardRow key={c._id} card={c} showReason />)}
            </div>
          )}
        </SectionCard>

        {/* Pending Reviews */}
        <SectionCard icon="rate_review" iconColor="text-[#f9a825]" title="Client Reviews">
          {loading ? <Skeleton /> : data?.pendingReviews?.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant dark:text-slate-400 text-center py-md">No pending reviews</p>
          ) : (
            <div className="space-y-xs">
              {data.pendingReviews.map(c => <CardRow key={c._id} card={c} />)}
            </div>
          )}
          <div className="flex gap-sm mt-auto pt-sm border-t border-outline-variant dark:border-slate-700">
            <Link to="/analytics" className="flex-1 flex items-center justify-center gap-xs px-sm py-xs rounded-lg bg-surface-container dark:bg-slate-700 font-body-sm font-medium text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[16px]">bar_chart</span>Analytics
            </Link>
            <Link to="/reports" className="flex-1 flex items-center justify-center gap-xs px-sm py-xs rounded-lg bg-surface-container dark:bg-slate-700 font-body-sm font-medium text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[16px]">description</span>Reports
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {[
          { to: '/analytics', icon: 'bar_chart', title: 'Analytics', sub: 'KPIs & charts' },
          { to: '/reports', icon: 'description', title: 'Reports', sub: 'Generate PDF' },
          { to: '/my-tasks', icon: 'checklist', title: 'My Tasks', sub: 'All assigned work' },
        ].map(link => (
          <Link key={link.to} to={link.to} className="flex items-center gap-md p-md rounded-xl border border-outline-variant dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800 hover:border-secondary dark:hover:border-indigo-500 hover:bg-secondary/5 dark:hover:bg-indigo-900/20 transition-all group shadow-sm">
            <span className="material-symbols-outlined text-secondary dark:text-indigo-400 text-[28px]">{link.icon}</span>
            <div>
              <p className="font-body-md font-semibold text-primary dark:text-white group-hover:text-secondary dark:group-hover:text-indigo-400 transition-colors">{link.title}</p>
              <p className="font-body-sm text-on-surface-variant dark:text-slate-400">{link.sub}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant ml-auto text-[18px]">arrow_forward</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
