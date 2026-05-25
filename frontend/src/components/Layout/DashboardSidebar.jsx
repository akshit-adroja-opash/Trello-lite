import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authstore';
import useSidebarStore from '../../store/sidebarStore';
import { getWorkspaces } from '../../api/workspace.api';
import { getBoardsByWorkspace } from '../../api/board.api';

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
        'flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 ' +
        (isActive
          ? 'bg-secondary-fixed text-on-secondary-fixed dark:bg-indigo-950 dark:text-indigo-200 font-bold scale-[0.98] shadow-sm'
          : 'text-on-surface-variant dark:text-slate-350 hover:bg-surface-container-high dark:hover:bg-slate-700')
      }
    >
      <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
        {icon}
      </span>
      <span className="font-body-md text-body-md">{label}</span>
    </Link>
  );
};

const DashboardSidebar = ({ currentWorkspace, openWorkspaceSettings, boards: propBoards }) => {
  const user = useAuthStore((s) => s.user);
  const isOpen = useSidebarStore((s) => s.isOpen);
  const closeSidebar = useSidebarStore((s) => s.close);
  const location = useLocation();
  const [localBoards, setLocalBoards] = useState([]);

  useEffect(() => {
    if (propBoards) return;
    const fetchBoards = async () => {
      try {
        const wsRes = await getWorkspaces();
        const wsList = wsRes.data?.workspaces || [];
        const allBoards = [];
        await Promise.all(
          wsList.map(async (ws) => {
            const bRes = await getBoardsByWorkspace(ws._id);
            allBoards.push(...(bRes.data?.boards || []));
          })
        );
        setLocalBoards(allBoards);
      } catch (err) {
        console.error('Failed to load boards for sidebar', err);
      }
    };
    fetchBoards();
  }, [propBoards]);

  const boards = propBoards || localBoards;
  const starredBoards = boards.filter((board) => board.isStarred);

  // Close sidebar on path changes
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  const showAdminOnly = (role) =>
    role === 'admin' ||
    role === 'project_manager' ||
    role === 'developer';

  const canViewReports = showAdminOnly(user?.role);
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
        className={`fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest dark:bg-slate-800 border-r border-outline-variant dark:border-slate-700 flex flex-col p-6 gap-6 h-screen overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        aria-label="Trellolite Sidebar"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              dashboard_customize
            </span>
          </div>
          <span className="text-xl font-headline-lg font-bold text-primary dark:text-white">Trellolite</span>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-col gap-1">
          <span className="font-label-caps text-xs text-on-primary-container dark:text-slate-400 px-4 mb-1">
            WORKSPACE
          </span>
          <h2 className="font-headline-lg text-2xl font-bold px-4 mb-4 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined">grid_view</span>
            Navigation
          </h2>

          <nav className="flex flex-col gap-1">
            <NavItem to="/dashboard" label="Dashboard" icon="dashboard" />
            <NavItem to="/my-tasks" label="My Tasks" icon="task_alt" />

            {canViewReports && (
              <NavItem to="/reports" label="Reports" icon="bar_chart" />
            )}

            {canViewAnalytics && (
              <NavItem to="/analytics" label="Analytics" icon="analytics" />
            )}

            {canManageWorkspace && (
              <button
                onClick={() => {
                  closeSidebar();
                  openWorkspaceSettings(currentWorkspace);
                }}
                className="flex items-center gap-4 px-4 py-2.5 text-on-surface-variant dark:text-slate-350 hover:bg-surface-container-high dark:hover:bg-slate-700 rounded-xl transition-all duration-200 text-left w-full"
              >
                <span className="material-symbols-outlined">settings</span>
                <span className="font-body-md text-body-md">Workspace Settings</span>
              </button>
            )}
          </nav>
        </div>

        {starredBoards.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 px-3 mb-3">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.287 3.958c.3.922-.755 1.688-1.54 1.118l-3.366-2.447a1 1 0 00-1.176 0l-3.366 2.447c-.785.57-1.84-.196-1.54-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.98 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
              </svg>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Starred
              </h3>
            </div>

            <div className="space-y-1">
              {starredBoards.map((board) => (
                <Link
                  key={board._id}
                  to={`/board/${board._id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-350 truncate">
                    {board.name}
                  </span>

                  <svg
                    className="w-4 h-4 text-yellow-400 opacity-70 group-hover:opacity-100"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.287 3.958c.3.922-.755 1.688-1.54 1.118l-3.366-2.447a1 1 0 00-1.176 0l-3.366 2.447c-.785.57-1.84-.196-1.54-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.98 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}


      </aside>
    </>
  );
};

export default DashboardSidebar;