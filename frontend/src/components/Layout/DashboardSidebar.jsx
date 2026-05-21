import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authstore';

const NavItem = ({ to, label, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));

  return (
    <Link
      to={to}
      className={
        'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all border ' +
        (isActive
          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
          : 'bg-white/70 border-slate-200/70 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700')
      }
    >
      <span
        className={
          'w-9 h-9 rounded-xl flex items-center justify-center border transition-all ' +
          (isActive
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 group-hover:border-indigo-200 group-hover:text-indigo-600')
        }
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
};

const DashboardSidebar = () => {
  const user = useAuthStore((s) => s.user);

  // If you later add role-based navigation, do it here.
  const showAdminOnly = (role) => role === 'admin' || role === 'project_manager' || role === 'developer';
  const canViewReports = showAdminOnly(user?.role);

  return (
    <aside
      className="hidden lg:block w-72 shrink-0"
      aria-label="Dashboard sidebar"
    >
      <div className="sticky top-24 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur px-3.5 py-3.5 shadow-sm">
        <div className="px-2.5 pb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Workspace</div>
          <div className="mt-1 text-base font-extrabold text-slate-900">Navigation</div>
        </div>

        <nav className="space-y-2">
          <NavItem
            to="/dashboard"
            label="Dashboard"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h6l1-2h9l-2 8H5l-1-6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V4h10v7" />
              </svg>
            }
          />

          <NavItem
            to="/my-tasks"
            label="My Tasks"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
              </svg>
            }
          />

          {canViewReports && (
            <NavItem
              to="/reports"
              label="Reports"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 17V7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17v-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16" />
                </svg>
              }
            />
          )}

          <NavItem
            to="/profile"
            label="Profile"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
            }
          />
        </nav>

        <div className="mt-4 px-2.5">
          <div className="text-xs text-slate-500 leading-relaxed">
            Signed in as <span className="font-bold text-slate-700">{user?.username || 'User'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;

