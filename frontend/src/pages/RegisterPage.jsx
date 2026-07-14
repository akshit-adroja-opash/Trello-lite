import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useAuthStore(s => s.register);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ username, email, password, role });
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background dark:bg-slate-900 grid-background selection:bg-secondary-fixed antialiased font-sans transition-colors duration-200">
      
      {/* Signup Container */}
      <main className="flex-1 flex flex-col sm:items-center justify-center sm:px-4 sm:py-12">
        <div className="w-full max-w-[480px] flex-1 sm:flex-none flex flex-col justify-center bg-surface-container-lowest dark:bg-slate-800 border-0 sm:border border-outline-variant dark:border-slate-700 sm:rounded-xl p-4 sm:p-10 auth-card">
          
          {/* Brand Logo & Header */}
          <div className="flex items-center gap-2 mb-4 sm:mb-8">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard_customize</span>
            </div>
            <span className="font-headline-lg text-title-md text-primary dark:text-white tracking-tight">Trellolite</span>
          </div>

          {/* Header Labels */}
          <div className="mb-4 sm:mb-8">
            <p className="font-label-caps text-label-caps text-secondary mb-1 capitalize tracking-wider">GET STARTED</p>
            <h1 className="font-headline-lg text-2xl sm:text-headline-lg whitespace-nowrap tracking-tight text-primary dark:text-white">Create your account</h1>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-350 font-medium" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="johndoe"
                required
                className="w-full px-4 py-2 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-705 rounded-lg font-body-md text-on-surface dark:text-white placeholder:text-on-primary-container dark:placeholder:text-slate-500 transition-all focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-350 font-medium" htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-4 py-2 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-705 rounded-lg font-body-md text-on-surface dark:text-white placeholder:text-on-primary-container dark:placeholder:text-slate-500 transition-all focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-350 font-medium" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full px-4 py-2 pr-12 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-705 rounded-lg font-body-md text-on-surface dark:text-white placeholder:text-on-primary-container dark:placeholder:text-slate-500 transition-all focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-350 font-medium" htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={e => setRole(e.target.value)}
                required
                className="w-full px-4 py-2 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-705 rounded-lg font-body-md text-on-surface dark:text-white cursor-pointer transition-all focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
              >
                <option value="developer">Developer</option>
                <option value="client">Client</option>
              </select>
            </div>

            {/* Submit Action */}
            <div className="pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </div>
          </form>

          {/* Secondary Action */}
          <div className="mt-4 sm:mt-8 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-semibold hover:underline decoration-2 underline-offset-4 transition-all">Sign in</Link>
            </p>
          </div>
        </div>
      </main>

    </div>
  );
};

export default RegisterPage;
