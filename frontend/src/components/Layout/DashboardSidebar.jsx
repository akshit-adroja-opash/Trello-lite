import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authstore';
import useSidebarStore from '../../store/sidebarStore';
import useWorkspaceStore from '../../store/workspaceStore';

const NavItem = ({ to, label, icon }) => {
  const location = useLocation();
  const closeSidebar = useSidebarStore((s) => s.close);

  const isActive =
    location.pathname === to ||
    (to !== '/' && location.pathname.startsWith(to + '/'));

  return (
    <Link
      to={to}
      onClick={closeSidebar}
      className={
        'flex items-center gap-4 px-3 py-2.5 rounded text-body-md transition-colors duration-200 ease-in-out ' +
        (isActive
          ? 'text-secondary dark:text-blue-400 font-bold border-r-4 border-secondary bg-surface-container dark:bg-slate-700/80 shadow-sm'
          : 'text-on-surface-variant dark:text-slate-300 font-medium hover:bg-surface-container dark:hover:bg-slate-700/50')
      }
    >
      <span className={`material-symbols-outlined ${isActive ? 'fill text-secondary dark:text-blue-400' : ''}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

const DashboardSidebar = ({ currentWorkspace, openWorkspaceSettings, boards: propBoards }) => {
  const user = useAuthStore((s) => s.user);
  const isOpen = useSidebarStore((s) => s.isOpen);
  const closeSidebar = useSidebarStore((s) => s.close);
  const location = useLocation();
  const { fetchWorkspacesAndBoards, boardsByWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (propBoards) return;
    fetchWorkspacesAndBoards();
  }, [propBoards, fetchWorkspacesAndBoards, user?._id]);

  const boards = propBoards || Object.values(boardsByWorkspace).flat();
  const starredBoards = boards.filter((board) => board.isStarred);

  // Close sidebar on path changes
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  const canViewReports = user?.role === 'admin' || user?.role === 'project_manager' || user?.role === 'client';
  const canViewAnalytics = user?.role === 'admin' || user?.role === 'project_manager';

  const canManageWorkspace =
    currentWorkspace &&
    openWorkspaceSettings &&
    (currentWorkspace.role === 'Admin' || currentWorkspace.role === 'admin');

  return (
    <>
      {/* Mobile backdrop drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest dark:bg-slate-800 border-r border-outline-variant dark:border-slate-700 flex flex-col py-6 px-4 h-screen overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        aria-label="Trellolite Sidebar"
      >
        {/* Brand Header (Preserving existing Trello-lite logo as requested) */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              dashboard_customize
            </span>
          </div>
          <div>
            <h2 className="font-headline-lg text-[24px] leading-[32px] font-bold text-primary dark:text-white">Trello-lite</h2>
            <p className="font-body-sm text-[13px] text-on-surface-variant dark:text-slate-400 capitalize">{user?.role ? user.role.replace('_', ' ') : 'Workspace Admin'}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col gap-1 flex-1">
          <NavItem to="/dashboard" label="Dashboard" icon="dashboard" />
          {user?.role !== 'admin' && (
            <NavItem to="/my-tasks" label="My Tasks" icon="task_alt" />
          )}

          {(user?.role === 'admin' || user?.role === 'project_manager') && (
            <NavItem to="/assign-task" label="Assign Task" icon="assignment_turned_in" />
          )}

          {canViewReports && (
            <NavItem to="/reports" label="Reports" icon="bar_chart" />
          )}

          {canViewAnalytics && (
            <NavItem to="/analytics" label="Analytics" icon="analytics" />
          )}

          {user?.role === 'admin' && (
            <NavItem to="/user-management" label="User Management" icon="group" />
          )}

          {canManageWorkspace && (
            <button
              onClick={() => {
                closeSidebar();
                openWorkspaceSettings(currentWorkspace);
              }}
              className="flex items-center gap-4 px-3 py-2.5 text-on-surface-variant dark:text-slate-300 font-medium hover:bg-surface-container dark:hover:bg-slate-700/50 rounded transition-colors duration-200 text-left w-full"
            >
              <span className="material-symbols-outlined">settings</span>
              <span>Workspace Settings</span>
            </button>
          )}

          {starredBoards.length > 0 && (
            <div className="mt-4 pt-4 border-t border-outline-variant dark:border-slate-700/50">
              <div className="flex items-center gap-2 px-3 mb-2">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.287 3.958c.3.922-.755 1.688-1.54 1.118l-3.366-2.447a1 1 0 00-1.176 0l-3.366 2.447c-.785.57-1.84-.196-1.54-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.98 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                </svg>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Starred</span>
              </div>
              <div className="space-y-1">
                {starredBoards.map((board) => (
                  <Link
                    key={board._id}
                    to={`/board/${board._id}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                  >
                    <span className="text-xs text-slate-700 dark:text-slate-350 truncate">{board.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support & Documentation Footer */}
        <div className="mt-auto pt-6 border-t border-outline-variant dark:border-slate-700 flex flex-col gap-1">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("Support portal coming soon!"); }}
            className="flex items-center gap-4 px-3 py-2 rounded text-on-surface-variant dark:text-slate-300 font-medium hover:bg-surface-container dark:hover:bg-slate-700/50 transition-colors duration-200 ease-in-out"
          >
            <span className="material-symbols-outlined">help</span>
            <span>Support</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("Documentation coming soon!"); }}
            className="flex items-center gap-4 px-3 py-2 rounded text-on-surface-variant dark:text-slate-300 font-medium hover:bg-surface-container dark:hover:bg-slate-700/50 transition-colors duration-200 ease-in-out"
          >
            <span className="material-symbols-outlined">description</span>
            <span>Documentation</span>
          </a>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;