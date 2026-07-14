import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboardData } from '../../api/dashboard.api';
import useWorkspaceStore from '../../store/workspaceStore';

/* ─── Role config ──────────────────────────────────── */
const ROLE_CONFIG = {
  admin:           { color: '#0058be', label: 'Admin',     chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  project_manager: { color: '#7c3aed', label: 'PM',        chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  developer:       { color: '#94a3b8', label: 'Developer', chip: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  client:          { color: '#ba1a1a', label: 'Client',    chip: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

import MetricCard from '../common/MetricCard';

/* ─── Donut Chart (real API data via conic-gradient) ─ */
function DonutChart({ segments }) {
  let cumulative = 0;
  const nonZero = segments.filter(s => s.pct > 0);

  if (nonZero.length === 0) {
    return (
      <div className="w-44 h-44 rounded-full bg-surface-container dark:bg-slate-700 flex items-center justify-center">
        <span className="font-body-sm text-on-surface-variant dark:text-slate-400">No data</span>
      </div>
    );
  }

  const { gradient } = nonZero.reduce((acc, { pct, color }) => {
    const next = acc.cumulative + pct;
    acc.gradient.push(`${color} ${acc.cumulative}% ${next}%`);
    acc.cumulative = next;
    return acc;
  }, { cumulative: 0, gradient: [] });

  return (
    <div className="relative flex items-center justify-center" style={{ width: 176, height: 176 }}>
      <div className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${gradient.join(', ')})` }} />
      {/* inner hole */}
      <div className="absolute inset-0 rounded-full m-8 bg-surface-container-lowest dark:bg-slate-800 flex items-center justify-center flex-col gap-xs">
        <span className="font-headline-lg text-headline-lg text-primary dark:text-white text-[20px] font-bold leading-none">
          {segments.reduce((a, s) => a + (s.count || 0), 0)}
        </span>
        <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 text-[10px]">TOTAL</span>
      </div>
    </div>
  );
}

/* ─── Bar Chart (real productivityTimeline from API) ─ */
function BarChart({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex-1 min-h-[200px] flex items-center justify-center text-on-surface-variant dark:text-slate-400">
        <div className="text-center">
          <span className="material-symbols-outlined text-[40px]">bar_chart</span>
          <p className="font-body-sm mt-sm">No completed tasks in this period</p>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...timeline.map(t => t.completed), 1);

  // format date to short label e.g. "May 1"
  const fmtDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-[220px]">
      <div className="flex-1 flex items-end justify-between gap-xs px-xs pb-xs border-b border-l border-outline-variant dark:border-slate-700 pt-sm">
        {timeline.map((t, i) => {
          const pct = Math.round((t.completed / maxVal) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-xs group relative">
              {/* tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-primary dark:bg-slate-600 text-on-primary dark:text-white text-[10px] px-xs py-xs rounded shadow-md whitespace-nowrap z-10">
                {t.completed} completed · {fmtDate(t.date)}
              </div>
              <div
                className="w-3/4 bg-secondary/25 dark:bg-indigo-900/40 rounded-t-sm relative transition-all duration-700 cursor-pointer hover:bg-secondary/50 dark:hover:bg-indigo-700/50"
                style={{ height: `${Math.max(pct * 1.8, 4)}px` }}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary dark:bg-indigo-400" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-xs mt-xs overflow-hidden">
        {timeline.map((t, i) => (
          <span key={i} className="flex-1 text-center font-label-caps text-on-surface-variant dark:text-slate-500"
            style={{ fontSize: '9px', minWidth: 0 }}>
            {/* show only first & last label to avoid clutter */}
            {i === 0 || i === timeline.length - 1 ? fmtDate(t.date) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Member chip ──────────────────────────────────── */
function MemberChip({ member }) {
  const role = member.user?.role || member.role || 'developer';
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.developer;
  const name = member.user?.username || member.user?.email || 'Unknown';
  return (
    <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full text-[11px] font-medium border ${cfg.chip} border-current/20`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {name}
      <span className="font-label-caps text-[9px] capitalize ml-xs opacity-70">[{cfg.label}]</span>
    </span>
  );
}

/* ─── Workspace Row (real data with members + boards) ─ */
function WorkspaceRow({ ws }) {
  const initials = ws.name?.slice(0, 2).toUpperCase() || 'WS';
  const memberCount = ws.members?.length || 0;

  return (
    <div className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl p-md shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-secondary dark:text-indigo-400 text-sm shrink-0">
            {initials}
          </div>
          <div>
            <h4 className="font-title-md text-title-md text-primary dark:text-white">{ws.name}</h4>
            {ws.description
              ? <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 truncate max-w-xs">{ws.description}</p>
              : <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-500 italic">No description</p>
            }
          </div>
        </div>

        <div className="flex items-center gap-sm shrink-0">
          <span className="font-body-sm text-body-sm text-secondary dark:text-indigo-400 mr-sm">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <Link to="/analytics" title="Analytics"
            className="p-xs rounded hover:bg-surface-container dark:hover:bg-slate-700 text-on-surface-variant dark:text-slate-400 hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
          </Link>
          <Link to="/reports" title="Reports"
            className="p-xs rounded hover:bg-surface-container dark:hover:bg-slate-700 text-on-surface-variant dark:text-slate-400 hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-[20px]">description</span>
          </Link>
        </div>
      </div>

      {/* Members strip */}
      {ws.members?.length > 0 && (
        <div className="flex flex-wrap gap-xs border-t border-outline-variant dark:border-slate-700 pt-md">
          {ws.members.slice(0, 5).map(m => (
            <MemberChip key={m._id || m.user?._id} member={m} />
          ))}
          {ws.members.length > 5 && (
            <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 self-center">
              +{ws.members.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ Main Admin Dashboard Panel ═══════════════════════════ */
export default function AdminDashboardPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const workspaces = useWorkspaceStore(s => s.workspaces);
  const boardsByWorkspace = useWorkspaceStore(s => s.boardsByWorkspace);

  useEffect(() => {
    getAdminDashboardData()
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.message || 'Failed to load');
      })
      .catch(err => setError(err?.response?.data?.message || 'Failed to load admin dashboard'))
      .finally(() => setLoading(false));
  }, [workspaces, boardsByWorkspace]);

  /* Build donut segments from real roleDistribution API data */
  const totalUsers = data?.stats?.totalUsers || 1;
  const donutSegments = Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
    const found = data?.roleDistribution?.find(r => r.role === role);
    const count = found?.count || 0;
    return { pct: Math.round((count / totalUsers) * 100), color: cfg.color, label: cfg.label, count };
  });

  /* Real productivityTimeline from API */
  const timeline = data?.productivityTimeline || [];

  const overdueAndBlocked = (data?.stats?.overdueCount || 0) + (data?.stats?.blockedCount || 0);

  return (
    <section className="space-y-xl">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
        <div>
          <h2 className="font-display-xl text-display-xl text-primary dark:text-white">Admin Overview</h2>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 mt-xs">
            System performance and workspace metrics at a glance.
          </p>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-sm p-md rounded-xl border border-error/30 bg-error-container/20 text-error font-body-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* ── Metric Cards (4) ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-container dark:bg-slate-800/60 animate-pulse border border-outline-variant dark:border-slate-700" />
          ))
          : <>
            <MetricCard
              label="Total Users" icon="group"
              value={data?.stats.totalUsers}
              sub={`${donutSegments.reduce((a, s) => a + s.count, 0)} registered`}
            />
            <MetricCard
              label="Workspaces" icon="workspaces"
              value={data?.stats.totalWorkspaces}
              sub="Active"
            />
            <MetricCard
              label="Overdue & Blocked" icon="warning"
              value={overdueAndBlocked}
              sub="Needs Action"
              subCls="text-on-error-container bg-error-container px-xs py-xs rounded"
              danger
            />
            <MetricCard
              label="Pending Reviews" icon="rate_review"
              value={data?.stats.reviewCount}
              sub="Clients waiting"
            />
          </>
        }
      </div>

      {/* ── Charts Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">

        {/* Donut – Role Distribution (real data) */}
        <div className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl p-lg shadow-sm flex flex-col">
          <h3 className="font-title-md text-title-md text-primary dark:text-white mb-md">Role Distribution</h3>
          <div className="flex-1 flex items-center justify-center py-md">
            {loading
              ? <div className="w-44 h-44 rounded-full bg-surface-container dark:bg-slate-700 animate-pulse" />
              : <DonutChart segments={donutSegments} />
            }
          </div>
          {/* Legend with real counts */}
          <div className="flex flex-wrap justify-center gap-md mt-md">
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
              const count = data?.roleDistribution?.find(r => r.role === role)?.count || 0;
              return (
                <div key={role} className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cfg.color }} />
                  <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
                    {cfg.label} ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar – Productivity Timeline (real API: productivityTimeline) */}
        <div className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl p-lg shadow-sm col-span-1 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-md">
            <div>
              <h3 className="font-title-md text-title-md text-primary dark:text-white">Productivity Timeline</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-xs">
                Cards completed per day — last 30 days
              </p>
            </div>
            <div className="flex items-center gap-xs bg-surface-container dark:bg-slate-700 px-sm py-xs rounded-lg">
              <span className="w-2 h-2 rounded-full bg-secondary dark:bg-indigo-400" />
              <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400">
                {timeline.reduce((a, t) => a + t.completed, 0)} total
              </span>
            </div>
          </div>
          {loading
            ? <div className="flex-1 min-h-[200px] bg-surface-container dark:bg-slate-700 rounded-lg animate-pulse" />
            : <BarChart timeline={timeline} />
          }
        </div>
      </div>

      {/* ── Additional Stats Row ─────────────────────────── */}
      {!loading && data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
          {[
            { label: 'Total Boards', icon: 'dashboard', value: data.stats.totalBoards },
            { label: 'Total Cards', icon: 'task_alt', value: data.stats.totalCards },
            { label: 'Overdue Tasks', icon: 'alarm', value: data.stats.overdueCount, danger: data.stats.overdueCount > 0 },
            { label: 'Blocked Tasks', icon: 'block', value: data.stats.blockedCount, danger: data.stats.blockedCount > 0 },
          ].map(c => (
            <MetricCard key={c.label} label={c.label} icon={c.icon} value={c.value} danger={c.danger} />
          ))}
        </div>
      )}


      {/* ── Quick Action Links ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {[
          { to: '/analytics',       icon: 'bar_chart',       title: 'Analytics',        sub: 'Workspace KPIs & charts' },
          { to: '/reports',         icon: 'description',     title: 'Reports',          sub: 'Generate PDF reports' },
          { to: '/user-management', icon: 'manage_accounts', title: 'User Management',  sub: 'Roles & system users' },
        ].map(link => (
          <Link key={link.title} to={link.to}
            className="flex items-center gap-md p-md rounded-xl border border-outline-variant dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800 hover:border-secondary dark:hover:border-indigo-500 hover:bg-secondary/5 dark:hover:bg-indigo-900/20 transition-all group shadow-sm">
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
