import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authstore';
import ThemeToggle from '../ThemeToggle';
import NotificationBell from '../Notifications/NotificationBell';
import Avatar from '../../UI/Avatar';

const Navbar = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    return user.avatar.startsWith('http')
      ? user.avatar
      : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${user.avatar}`;
  };

  return (
    <header className="bg-surface-bright/80 dark:bg-slate-800 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex justify-between items-center w-full px-6 h-16 fixed top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="18" rx="2" fill="white" />
            <rect x="14" y="3" width="7" height="11" rx="2" fill="white" opacity="0.7" />
          </svg>
        </div>
        <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
          Trello<span className="text-indigo-600 font-medium">lite</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell />
        <div className="h-6 w-px bg-outline-variant dark:bg-slate-700 mx-2"></div>
        
        <Link to="/profile" className="flex items-center gap-2 bg-surface-container-low dark:bg-slate-700 px-3 py-1.5 rounded-full border border-surface-variant dark:border-slate-700 hover:bg-surface-variant/50 transition-all">
          <Avatar 
            name={user?.username || '?'} 
            avatar={getAvatarUrl()}
            size={24} 
            className="shadow-inner" 
          />
          <span className="text-label-md font-label-md text-on-surface dark:text-slate-200 hidden sm:inline">{user?.username}</span>
        </Link>

        <button onClick={handleLogout} className="text-label-md font-label-md text-on-surface-variant border border-outline-variant dark:border-slate-700 px-4 py-1.5 rounded-md hover:bg-surface-variant/50 transition-colors">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
