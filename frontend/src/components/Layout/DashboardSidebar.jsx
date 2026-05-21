import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authstore';

const NavItem = ({ to, label, icon, fillIcon = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));

  return (
    <Link
      to={to}
      className={
        'flex items-center gap-3 py-3 px-6 transition-all ' +
        (isActive
          ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-r-lg font-bold'
          : 'text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-lg')
      }
    >
      <span
        className="material-symbols-outlined"
        style={isActive && fillIcon ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <span className="text-label-md font-label-md">{label}</span>
    </Link>
  );
};

const DashboardSidebar = () => {
  const user = useAuthStore((s) => s.user);

  const showAdminOnly = (role) => role === 'admin' || role === 'project_manager' || role === 'developer';
  const canViewReports = showAdminOnly(user?.role);

  return (
    <aside
      className="hidden md:flex flex-col bg-surface-container-low/60 backdrop-blur-md border-r border-white/10 shadow-md fixed left-0 top-16 h-[calc(100vh-64px)] w-sidebar-width pt-6 pb-6 z-40 overflow-y-auto"
      aria-label="Dashboard sidebar"
    >
      <div className="px-6 mb-8">
        <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">WORKSPACE</p>
        <h2 className="text-headline-md font-headline-md font-bold text-on-surface dark:text-white">Navigation</h2>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-4">
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
            icon="bar_chart"
          />
        )}

        <NavItem
          to="/profile"
          label="Profile"
          icon="person"
        />
      </nav>

      <div className="mt-auto px-4 border-t border-outline-variant/30 pt-4 flex flex-col gap-1">
        <Link
          to="/profile"
          className="flex items-center gap-3 text-on-surface-variant py-3 px-6 hover:bg-surface-variant/50 transition-colors rounded-lg"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-label-md font-label-md">Settings</span>
        </Link>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-3 text-on-surface-variant py-3 px-6 hover:bg-surface-variant/50 transition-colors rounded-lg"
        >
          <span className="material-symbols-outlined">help</span>
          <span className="text-label-md font-label-md">Help</span>
        </a>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
