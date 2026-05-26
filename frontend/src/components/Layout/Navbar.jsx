import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authstore';
import useSidebarStore from '../../store/sidebarStore';
import ThemeToggle from '../ThemeToggle';
import NotificationBell from '../Notifications/NotificationBell';
import Avatar from '../../UI/Avatar';

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
            {isDashboard && <ThemeToggle />}
            <NotificationBell />
          </div>
          <div className="h-8 w-px bg-outline-variant dark:bg-slate-700 mx-1"></div>
          
          {/* User profile dropdown container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <Avatar name={user?.username} avatar={user?.avatar} size={32} />
              <span className="font-body-md font-semibold text-on-surface dark:text-white hidden sm:inline">{user?.username}</span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-slate-400 select-none">
                expand_more
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-outline-variant dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Header */}
                <div className="px-4 py-2.5 border-b border-outline-variant/50 dark:border-slate-700/50">
                  <p className="font-semibold text-sm text-slate-850 dark:text-white truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Dropdown Options */}
                <div className="p-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 w-full px-3.5 py-2 rounded-xl text-left font-body-md text-sm text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant dark:text-slate-400">person</span>
                    <span>My Profile</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full px-3.5 py-2 rounded-xl text-left font-body-md text-sm text-error hover:bg-error-container hover:text-on-error-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
