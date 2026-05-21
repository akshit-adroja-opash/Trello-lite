import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import Avatar from '../UI/Avatar';
import ThemeToggle from '../components/ThemeToggle';

const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();

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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 antialiased font-sans transition-colors duration-200">
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700/50 sticky top-0 z-40 flex items-center justify-between px-6 sm:px-8 shadow-sm transition-all duration-200">
        <div className="flex items-center gap-4">
          <Link to="/dashboard"
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-semibold transition-all group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-sm">
            <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-600 text-lg font-light">/</span>
          <h1 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">My Profile</h1>
        </div>
        <div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-sm p-8">

          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              {avatarPreview || user?.avatar ? (
                <img
                  src={avatarPreview || user.avatar}
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-slate-700 shadow"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-indigo-100 dark:ring-slate-700 shadow">
                  {(user?.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-2">Click avatar to change photo</p>
            <span className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60">
              {user?.role === 'admin' ? 'Admin' : user?.role === 'project_manager' ? 'Project Manager' : 'Developer'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">New Password <span className="text-slate-300 dark:text-slate-650 lowercase font-normal">(leave blank to keep current)</span></label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            {password && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-11 px-3.5 rounded-xl border text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-400 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 focus:ring-rose-500/10'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10'
                  }`}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
