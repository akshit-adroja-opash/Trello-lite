import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import DashboardSidebar from '../components/Layout/DashboardSidebar';
import Navbar from '../components/Layout/Navbar';
import { getRoleDisplayName } from '../utils/roleDisplay';
import { SERVER_URL } from '../api/axios';
import { get2FAStatus, toggle2FA, getSessions, revokeSession } from '../api/auth.api';

const ProfilePage = () => {
  const { user, updateProfile, deleteAccountAction } = useAuthStore();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [faRes, sessionsRes] = await Promise.all([
          get2FAStatus(),
          getSessions()
        ]);
        setTwoFactorEnabled(faRes.data.twoFactorEnabled);
        setSessions(sessionsRes.data.sessions || []);
      } catch (err) {
        console.error('Failed to load profile settings data:', err);
      }
    };
    loadSettings();
  }, []);

  const handleToggle2FA = async () => {
    try {
      const targetStatus = !twoFactorEnabled;
      const confirmMsg = targetStatus 
        ? "Are you sure you want to enable Two-Factor Authentication for your account?"
        : "Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.";
      if (window.confirm(confirmMsg)) {
        const res = await toggle2FA(targetStatus);
        setTwoFactorEnabled(res.data.twoFactorEnabled);
        toast.success(res.message || `Two-Factor Auth ${targetStatus ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update Two-Factor Authentication settings');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (window.confirm("Are you sure you want to log this device out?")) {
      try {
        await revokeSession(sessionId);
        toast.success("Device logged out successfully");
        setSessions(prev => prev.filter(s => s._id !== sessionId));
      } catch {
        toast.error("Failed to revoke session");
      }
    }
  };

  const getDeviceIcon = (userAgent = '') => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) return 'smartphone';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    return 'desktop_windows';
  };

  const getDeviceName = (userAgent = '') => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Google Chrome';
    if (ua.includes('firefox')) return 'Mozilla Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Apple Safari';
    if (ua.includes('edge')) return 'Microsoft Edge';
    return userAgent || 'Unknown Device';
  };

  const getOSName = (userAgent = '') => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    if (ua.includes('android')) return 'Android';
    return 'Unknown OS';
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type (must be image)
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed for avatars.');
      e.target.value = ''; // Reset input
      return;
    }

    // Validate size (must be <= 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Avatar image size cannot exceed 10MB.');
      e.target.value = ''; // Reset input
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setImgError(false);
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (!user?.avatar) return null;
    if (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) return user.avatar;
    const backendBase = SERVER_URL;
    return `${backendBase}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
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

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.")) {
      try {
        await deleteAccountAction();
        toast.success("Account deleted successfully");
        // user will be redirected because token/user state is cleared
      } catch {
        toast.error("Failed to delete account");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Container wrapper */}
      <div className="flex flex-1 pt-16 h-full">
        
        {/* Left Fixed Sidebar */}
        <DashboardSidebar />

        {/* Content Canvas */}
        <main className="flex-1 ml-0 lg:ml-[280px] p-6 lg:p-10 overflow-y-auto w-full max-w-[1440px] mx-auto">
          
          {/* Breadcrumbs & Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-primary dark:text-white mb-1">My Profile</h1>
              <p className="font-body-md text-on-surface-variant dark:text-slate-400">Manage your account settings and personal information</p>
            </div>
            <nav className="flex items-center gap-1 text-body-sm">
              <Link className="text-secondary hover:underline dark:text-indigo-400" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
              <span className="text-on-surface-variant dark:text-slate-350 font-bold">My Profile</span>
            </nav>
          </div>

          {/* Profile Central Section */}
          <div className="max-w-4xl mx-auto glass-card bg-white/95 dark:bg-slate-800/90 backdrop-blur border border-outline-variant/50 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xl shadow-indigo-900/5">
            
            {/* Decorative Header Banner */}
            <div className="h-48 bg-gradient-to-r from-primary-container to-secondary dark:from-slate-900 dark:to-indigo-950 relative overflow-hidden flex justify-center items-end pb-8">
              <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              
              {/* Profile Avatar Group */}
              <div className="relative group">
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="w-32 h-32 rounded-full border-[6px] border-white dark:border-slate-850 bg-secondary dark:bg-indigo-650 flex items-center justify-center text-on-secondary text-5xl font-black shadow-xl translate-y-16 overflow-hidden relative z-10 cursor-pointer transition-transform hover:scale-105"
                >
                  {getAvatarUrl() && !imgError ? (
                    <img
                      src={getAvatarUrl()}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span>{(user?.username || '?').charAt(0).toUpperCase()}</span>
                  )}
                  {/* Hover edit mask overlay */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                  </div>
                </div>

                <div className="absolute bottom-1 right-1 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-md text-primary dark:text-white ring-2 ring-transparent z-20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-indigo-600 dark:text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>

                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full text-center">
                  <button 
                    onClick={() => fileRef.current?.click()}
                    className="text-xs font-label-caps text-on-surface-variant dark:text-slate-400 uppercase tracking-widest hover:text-primary dark:hover:text-white transition-colors"
                  >
                    Click avatar to change photo
                  </button>
                </div>
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="pt-24 pb-10 px-8 lg:px-12">
              
              {/* Role Badge Display */}
              <div className="flex justify-center mb-10">
                <span className="bg-surface-container dark:bg-slate-700/60 px-6 py-2 rounded-full font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 border border-outline-variant/30 dark:border-slate-700">
                  {getRoleDisplayName(user?.role)}
                </span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                
                {/* Username Field */}
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 ml-1 uppercase">USERNAME</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">alternate_email</span>
                    <input 
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-xl font-body-md text-on-surface dark:text-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 ml-1 uppercase">EMAIL ADDRESS</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">mail</span>
                    <input 
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-xl font-body-md text-on-surface dark:text-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 ml-1 uppercase">
                    NEW PASSWORD <span className="text-[10px] lowercase text-outline dark:text-slate-500 font-normal">(leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">lock</span>
                    <input 
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-xl font-body-md text-on-surface dark:text-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" 
                      placeholder="••••••••" 
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 ml-1 uppercase">CONFIRM PASSWORD</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">history</span>
                    <input 
                      className={`w-full h-14 pl-12 pr-4 bg-surface-container-lowest dark:bg-slate-900 border rounded-xl font-body-md text-on-surface dark:text-white focus:ring-2 focus:ring-secondary/20 outline-none transition-all ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-rose-450 focus:border-rose-500 focus:ring-rose-500/10'
                          : 'border-outline-variant dark:border-slate-700 focus:border-secondary'
                      }`}
                      placeholder="••••••••" 
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              {/* Save Action */}
              <div className="flex flex-col items-center gap-6">
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-[400px] bg-secondary-container text-on-secondary-container h-14 rounded-xl font-bold font-title-md flex items-center justify-center gap-4 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
                >
                  {saving ? 'Saving changes...' : 'Save Changes'}
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </button>
                
                {user?.updatedAt && (
                  <div className="flex items-center gap-1.5 text-on-surface-variant/60 dark:text-slate-450 font-body-sm">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Last updated: {new Date(user.updatedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* Additional Settings Grid */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {/* Two-Factor Auth */}
            <div 
              onClick={handleToggle2FA}
              className="glass-card p-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-outline-variant/30 dark:border-slate-750 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-surface-container-lowest dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${twoFactorEnabled ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-primary-container dark:bg-slate-900 text-secondary dark:text-indigo-400'}`}>
                <span className="material-symbols-outlined">{twoFactorEnabled ? 'shield_with_heart' : 'security'}</span>
              </div>
              <div>
                <h4 className="font-title-md text-sm text-primary dark:text-white">Two-Factor Auth</h4>
                <p className={`text-xs font-semibold ${twoFactorEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-on-surface-variant dark:text-slate-400'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>

            {/* Connected Devices */}
            <div 
              onClick={() => setShowSessionsModal(true)}
              className="glass-card p-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-outline-variant/30 dark:border-slate-750 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-surface-container-lowest dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container dark:bg-slate-700 flex items-center justify-center text-on-surface-variant dark:text-slate-350 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">devices</span>
              </div>
              <div>
                <h4 className="font-title-md text-sm text-primary dark:text-white">Connected Devices</h4>
                <p className="text-xs text-on-surface-variant dark:text-slate-400">
                  {sessions.length} active session{sessions.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Delete Account */}
            <div onClick={handleDeleteAccount} className="glass-card p-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-outline-variant/30 dark:border-slate-750 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-error-container/20 dark:hover:bg-rose-900/30 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-error-container dark:bg-rose-950/40 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-rose-500">delete_forever</span>
              </div>
              <div>
                <h4 className="font-title-md text-sm text-primary dark:text-white">Delete Account</h4>
                <p className="text-xs text-error">Permanent action</p>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Connected Devices Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg border border-outline-variant/50 dark:border-slate-700 shadow-2xl overflow-hidden transform scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-primary dark:text-white">Active Sessions</h3>
                <p className="text-xs text-on-surface-variant dark:text-slate-400">Manage devices currently logged into your account</p>
              </div>
              <button 
                onClick={() => setShowSessionsModal(false)}
                className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white p-1 rounded-full hover:bg-surface-container dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
              {sessions.map((session) => {
                const isCurrent = session.token === localStorage.getItem('token');
                return (
                  <div 
                    key={session._id} 
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                      isCurrent 
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60' 
                        : 'bg-surface-container-lowest dark:bg-slate-900 border-outline-variant/35 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCurrent 
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-400'
                      }`}>
                        <span className="material-symbols-outlined">{getDeviceIcon(session.userAgent)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary dark:text-white">
                            {getDeviceName(session.userAgent)}
                          </span>
                          {isCurrent && (
                            <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-750 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5 space-y-0.5">
                          <p>{getOSName(session.userAgent)} • IP: {session.ipAddress}</p>
                          <p className="text-[11px] opacity-80">
                            Last active: {new Date(session.lastActive).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button 
                        onClick={() => handleRevokeSession(session._id)}
                        className="text-xs text-rose-500 hover:text-rose-600 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-surface-container/30 dark:bg-slate-850 border-t border-outline-variant/30 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => setShowSessionsModal(false)}
                className="bg-secondary text-white font-bold px-5 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all text-sm"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
