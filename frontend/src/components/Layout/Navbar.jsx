import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authstore';
import useSidebarStore from '../../store/sidebarStore';
import ThemeToggle from '../ThemeToggle';
import NotificationBell from '../Notifications/NotificationBell';

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-280px)] h-16 z-40 bg-surface-container-lowest dark:bg-slate-800 border-b border-outline-variant dark:border-slate-700 transition-colors">
      <div className="flex justify-between items-center px-6 lg:px-10 h-full">
        
        {/* Search Bar / Mobile Menu trigger */}
        <div className="flex items-center flex-1 max-w-md relative">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-slate-700 rounded-lg mr-2 transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          {setSearchQuery && (
            <>
              <span className="material-symbols-outlined absolute left-12 lg:left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-400">search</span>
              <input 
                value={searchQuery || ''}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-20 lg:pl-10 pr-4 py-2 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-750 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none font-body-md text-on-surface dark:text-white" 
                placeholder="Search workspaces, boards..." 
                type="text"
              />
            </>
          )}
        </div>

        {/* Global Toolbar items */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />
          </div>
          <div className="h-8 w-px bg-outline-variant dark:bg-slate-700 mx-1"></div>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed dark:text-slate-800 font-bold text-xs border border-outline-variant dark:border-slate-700 flex items-center justify-center">
                {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="font-body-md font-semibold text-on-surface dark:text-white hidden sm:inline">{user?.username}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 border border-outline-variant dark:border-slate-700 rounded-lg font-body-md text-on-surface-variant dark:text-slate-300 hover:bg-error-container hover:text-on-error-container hover:border-error-container transition-all"
            >
              Logout
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
