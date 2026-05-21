import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import Avatar from '../UI/Avatar';
import DashboardSidebar from '../components/Layout/DashboardSidebar';
import Navbar from '../components/Layout/Navbar';
import { getRoleDisplayName } from '../utils/roleDisplay';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (!user?.avatar) return null;
    if (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) return user.avatar;
    const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${backendBase}${user.avatar}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      if (username !== user?.username) formData.append('username', username);
      if (email !== user?.email) formData.append('email', email);
      if (password) formData.append('password', password);
      if (avatarFile) formData.append('avatar', avatarFile);

      await updateProfile(formData);
      toast.success('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
      
      {/* TopAppBar */}
      <Navbar />

      {/* Main Container wrapper */}
      <div className="flex flex-1 pt-16 h-full">
        
        {/* Left Fixed Sidebar */}
        <DashboardSidebar />

        {/* Content Canvas */}
        <main className="flex-1 ml-0 md:ml-sidebar-width p-6 md:p-10 overflow-y-auto w-full max-w-[1440px] mx-auto">
          
          {/* Breadcrumb / Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <h1 className="text-headline-xl font-headline-xl text-on-surface dark:text-white mb-2">My Profile</h1>
              <p className="text-body-lg font-body-lg text-on-surface-variant dark:text-slate-350">Manage your account settings and personal information</p>
            </div>
            
            <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Link className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-slate-900 dark:text-white font-bold">My Profile</span>
            </nav>
          </div>

          {/* Profile Form Bento Grid */}
          <div className="flex flex-col items-center py-4">
            <div className="w-full max-w-2xl bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-xl shadow-indigo-900/5 overflow-hidden transition-all duration-300">
              
              {/* Decorative Top Header */}
              <div className="h-28 bg-gradient-to-r from-primary via-secondary to-primary-container relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              </div>

              {/* Profile Card Body */}
              <div className="px-6 sm:px-10 pb-10 -mt-14 flex flex-col items-center">
                
                {/* Avatar Section */}
                <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <div className="w-28 h-28 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white dark:border-slate-800 shadow-xl relative z-10 overflow-hidden transition-transform group-hover:scale-105 duration-300">
                    {getAvatarUrl() ? (
                      <img
                        src={getAvatarUrl()}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(user?.username || '?').charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                      <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                    </div>
                  </div>
                  
                  {/* Verified Badge */}
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg z-30 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

                {/* Role Badge and Text */}
                <div className="text-center mt-4 mb-8">
                  <p className="text-xs text-slate-400 dark:text-slate-450 mb-2.5">Click avatar to change photo</p>
                  <span className="inline-block px-3.5 py-1 bg-primary/10 text-primary dark:text-indigo-300 dark:bg-indigo-950/40 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/60 shadow-sm">
                    {getRoleDisplayName(user?.role)}
                  </span>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="w-full space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">Username</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">alternate_email</span>
                        <input
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 dark:text-white text-sm font-medium transition-all"
                          placeholder="Username"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">Email Address</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">mail</span>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 dark:text-white text-sm font-medium transition-all"
                          placeholder="Email Address"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Divider & Fields */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Password */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">
                          New Password <span className="text-[10px] normal-case font-normal text-slate-400 dark:text-slate-500">(leave blank to keep current)</span>
                        </label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">lock</span>
                          <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 dark:text-white text-sm font-medium transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      {/* Confirm Password */}
                      {password && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">Confirm Password</label>
                          <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">lock_reset</span>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all text-slate-800 dark:text-white text-sm font-medium ${
                                confirmPassword && password !== confirmPassword
                                  ? 'border-rose-400 dark:border-rose-800 focus:border-rose-500 focus:ring-rose-500/10'
                                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/10'
                              }`}
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-200 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving changes...
                        </>
                      ) : (
                        <>
                          Save Changes
                          <span className="material-symbols-outlined text-xl">check_circle</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Timestamp Footer */}
                  {user?.updatedAt && (
                    <div className="pt-4 border-t border-slate-150 dark:border-slate-700/60 text-center">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Last updated: {new Date(user.updatedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </form>
              </div>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
