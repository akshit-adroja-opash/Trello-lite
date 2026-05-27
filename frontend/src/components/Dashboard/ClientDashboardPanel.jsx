import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClientDashboardData } from '../../api/dashboard.api';

const PRIORITY_CHIP = {
  urgent: 'bg-error/10 text-error border border-error/20',
  high: 'bg-[#ff6d00]/10 text-[#bf360c] dark:text-orange-400 border border-orange-200/50',
  medium: 'bg-[#f9a825]/10 text-[#e65100] dark:text-amber-400 border border-amber-200/50',
  low: 'bg-surface-container text-on-surface-variant dark:bg-slate-700 dark:text-slate-300 border border-outline-variant',
};

const BOARD_COLORS = [
  'linear-gradient(135deg, #005f73 0%, #0a9396 100%)',
  'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
  'linear-gradient(135deg, #3f37c9 0%, #480ca8 100%)',
  'linear-gradient(180deg, #D44D4D 0%, #8C2222 100%)',
  'linear-gradient(180deg, #D69E2E 0%, #975A16 100%)',
];

function MetricCard({ label, icon, value, sub }) {
  return (
    <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl p-lg shadow-sm border border-outline-variant dark:border-slate-700 flex flex-col justify-between gap-md">
      <div className="flex justify-between items-start">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant dark:text-slate-400">{label}</span>
        <span className="material-symbols-outlined p-xs rounded-md text-[20px] text-secondary dark:text-indigo-400 bg-secondary/10 dark:bg-indigo-900/30">{icon}</span>
      </div>
      <div className="flex items-end gap-sm">
        <span className="font-headline-lg text-headline-lg leading-none text-primary dark:text-white">{value ?? '—'}</span>
        {sub && <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mb-xs">{sub}</span>}
      </div>
    </div>
  );
}

export default function ClientDashboardPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClientDashboardData()
      .then(res => res.success && setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-xl">
      {/* Header */}
      <div>
        <h2 className="font-display-xl text-display-xl text-primary dark:text-white">My Review Hub</h2>
        <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 mt-xs">
          Your shared boards, pending approvals, and project status.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-container dark:bg-slate-800 animate-pulse border border-outline-variant dark:border-slate-700" />
        )) : <>
          <MetricCard label="My Workspaces" icon="workspaces" value={data?.stats.workspaceCount} sub="Connected" />
          <MetricCard label="Shared Boards" icon="dashboard" value={data?.stats.sharedBoardCount} sub="Accessible" />
          <MetricCard label="Pending Approvals" icon="pending_actions" value={data?.stats.reviewCount} sub="Awaiting review" />
        </>}
      </div>

      {/* Boards + Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Shared Boards Grid */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl p-lg shadow-sm flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px] text-secondary dark:text-indigo-400">dashboard</span>
              <h3 className="font-title-md text-title-md text-primary dark:text-white">Shared Boards</h3>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-surface-container dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          ) : data?.sharedBoards?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-xl text-on-surface-variant dark:text-slate-400">
              <span className="material-symbols-outlined text-[48px]">dashboard</span>
              <p className="font-body-md mt-sm">No boards shared with you yet</p>
            </div>
          ) : (
            <div className="space-y-xs max-h-72 overflow-y-auto pr-xs">
              {data.sharedBoards.map((board, idx) => (
                <Link key={board._id} to={`/board/${board._id}`}
                  className="flex items-center gap-md px-md py-sm rounded-lg bg-surface-container-low dark:bg-slate-700/50 hover:bg-surface-container dark:hover:bg-slate-700 transition-colors group">
                  <div className="w-8 h-8 rounded-lg shrink-0"
                    style={{ background: board.background || BOARD_COLORS[idx % BOARD_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body-sm font-semibold text-on-surface dark:text-white truncate group-hover:text-secondary dark:group-hover:text-indigo-400 transition-colors">
                      {board.name}
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400">
                      Updated {new Date(board.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-secondary dark:group-hover:text-indigo-400 transition-colors">
                    arrow_forward
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approvals */}
        <div className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl p-lg shadow-sm flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[18px] text-[#f9a825]">pending_actions</span>
            <h3 className="font-title-md text-title-md text-primary dark:text-white">Pending Approvals</h3>
          </div>

          {loading ? (
            <div className="space-y-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-container dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          ) : data?.pendingApprovals?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-lg text-on-surface-variant dark:text-slate-400 gap-sm">
              <span className="material-symbols-outlined text-[40px]">task_alt</span>
              <p className="font-body-sm text-center">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-xs flex-1">
              {data.pendingApprovals.map(card => {
                const cfg = PRIORITY_CHIP[card.priority] || PRIORITY_CHIP.medium;
                return (
                  <div key={card._id} className="flex items-start gap-sm px-md py-sm rounded-lg bg-surface-container-low dark:bg-slate-700/50 border border-outline-variant/50 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[16px] text-[#f9a825] mt-0.5 shrink-0">pending_actions</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm font-semibold text-on-surface dark:text-white truncate">{card.title}</p>
                      <p className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400 truncate">{card.board?.name}</p>
                    </div>
                    <span className={`shrink-0 font-label-caps text-[10px] uppercase px-xs py-xs rounded ${cfg}`}>
                      {card.priority?.slice(0, 3) || 'med'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto pt-sm border-t border-outline-variant dark:border-slate-700">
            <p className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400 flex items-start gap-xs">
              <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">info</span>
              These items are awaiting your review or sign-off from the team.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
