import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authstore';
import useSidebarStore from '../../store/sidebarStore';
import {
  FiSettings,
  FiUsers,
  FiBarChart2,
  FiUser,
  FiHelpCircle,
  FiLayout
} from 'react-icons/fi';

const NavItem = ({
  to,
  label,
  icon,
  fillIcon = false
}) => {
  const location = useLocation();
  const closeSidebar = useSidebarStore((s) => s.close);

  const isActive =
    location.pathname === to ||
    (
      to !== '/' &&
      location.pathname.startsWith(to + '/')
    );

  return (
    <Link
      to={to}
      onClick={closeSidebar}
      className={
        'flex items-center gap-3 py-3 px-6 transition-all duration-200 ' +
        (
          isActive
            ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-r-2xl font-bold shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-variant/50 rounded-2xl'
        )
      }
    >
      {
        typeof icon === 'string'
          ? (
            <span
              className="material-symbols-outlined"
              style={
                isActive && fillIcon
                  ? {
                    fontVariationSettings:
                      "'FILL' 1"
                  }
                  : {}
              }
            >
              {icon}
            </span>
          )
          : icon
      }
      <span className="text-label-md font-label-md">
        {label}
      </span>
    </Link>
  );
};

const DashboardSidebar = ({
  currentWorkspace,
  openWorkspaceSettings
}) => {
  const user = useAuthStore((s) => s.user);
  const isOpen = useSidebarStore((s) => s.isOpen);
  const closeSidebar = useSidebarStore((s) => s.close);
  const location = useLocation();

  // Close sidebar on navigation change
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  const showAdminOnly = (role) =>
    role === 'admin' ||
    role === 'project_manager' ||
    role === 'developer';

  const canViewReports =
    showAdminOnly(user?.role);

  const canManageWorkspace =
    currentWorkspace?.role === 'owner' ||
    currentWorkspace?.role === 'admin';

  return (
    <>
      {/* Mobile drawer backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-sidebar-width pt-6 pb-6 z-40 overflow-y-auto bg-surface-container-low/95 md:bg-surface-container-low/70 backdrop-blur-xl border-r border-slate-200/10 dark:border-white/10 shadow-xl flex flex-col transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        aria-label="Dashboard sidebar"
      >
        <div className="px-6 mb-8">
          <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
            WORKSPACE
          </p>
          <h2 className="text-headline-md font-headline-md font-bold text-on-surface dark:text-white flex items-center gap-2">
            <FiLayout />
            Navigation
          </h2>
        </div>

        <nav className="flex-1 flex flex-col gap-2 px-4">
          <NavItem
            to="/dashboard"
            label="Dashboard"
            icon="dashboard"
            fillIcon={true}
          />

          <NavItem
            to="/my-tasks"
            label="My Tasks"
            icon="task_alt"
          />

          {canViewReports && (
            <NavItem
              to="/reports"
              label="Reports"
              icon={<FiBarChart2 size={18} />}
            />
          )}

          <NavItem
            to="/profile"
            label="Profile"
            icon={<FiUser size={18} />}
          />

          <NavItem
            to="/analytics"
            label="Analytics"
            icon={<FiBarChart2 size={18} />}
          />

          {canManageWorkspace && (
            <button
              onClick={() => {
                closeSidebar();
                openWorkspaceSettings(currentWorkspace);
              }}
              className="flex items-center gap-3 py-3 px-6 text-on-surface-variant hover:bg-surface-variant/50 rounded-2xl transition-all duration-200 text-left w-full"
            >
              <FiSettings size={18} />
              <span className="text-label-md font-label-md">
                Workspace Settings
              </span>
            </button>
          )}
        </nav>

        <div className="mt-auto px-4 border-t border-outline-variant/30 pt-4 flex flex-col gap-2">
          <Link
            to="/profile"
            onClick={closeSidebar}
            className="flex items-center gap-3 text-on-surface-variant py-3 px-6 hover:bg-surface-variant/50 transition-colors rounded-2xl"
          >
            <FiSettings size={18} />
            <span className="text-label-md font-label-md">
              Account Settings
            </span>
          </Link>


          <button
            onClick={(e) => {
              e.preventDefault();
              closeSidebar();
            }}
            className="flex items-center gap-3 text-on-surface-variant py-3 px-6 hover:bg-surface-variant/50 transition-colors rounded-2xl text-left w-full"
          >
            <FiHelpCircle size={18} />
            <span className="text-label-md font-label-md">
              Help & Support
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;