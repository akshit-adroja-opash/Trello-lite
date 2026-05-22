import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authstore';
import useSidebarStore from '../../store/sidebarStore';

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

const DashboardSidebar = ({ currentWorkspace, openWorkspaceSettings }) => {
  const user = useAuthStore((s) => s.user);
  const isOpen = useSidebarStore((s) => s.isOpen);
  const closeSidebar = useSidebarStore((s) => s.close);
  const location = useLocation();

  // Close sidebar on path changes
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  const showAdminOnly = (role) =>
    role === 'admin' ||
    role === 'project_manager' ||
    role === 'developer';

  const canViewReports = showAdminOnly(user?.role);

  const canManageWorkspace =
    currentWorkspace &&
    openWorkspaceSettings &&
    (currentWorkspace.role === 'owner' || currentWorkspace.role === 'admin');

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
        className={`fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest dark:bg-slate-800 border-r border-outline-variant dark:border-slate-700 flex flex-col p-6 gap-6 h-screen overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
            
            <NavItem to="/profile" label="Profile" icon="person" />
            <NavItem to="/analytics" label="Analytics" icon="analytics" />

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

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant dark:border-slate-700 pt-6">
          <Link
            to="/profile"
            onClick={closeSidebar}
            className="flex items-center gap-4 px-4 py-2 text-on-surface-variant dark:text-slate-350 hover:bg-surface-container-high dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md text-body-md">Account Settings</span>
          </Link>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              closeSidebar();
            }}
            className="flex items-center gap-4 px-4 py-2 text-on-surface-variant dark:text-slate-350 hover:bg-surface-container-high dark:hover:bg-slate-700 rounded-xl transition-colors text-left w-full"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="font-body-md text-body-md">Help & Support</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;