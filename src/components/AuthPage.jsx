import { motion } from 'framer-motion';
import {
  AlertCircle,
  Armchair,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChefHat,
  Copy,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  UtensilsCrossed
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';

export default function AuthPage({
  hotels,
  onLogin,
  initialMode = 'login',
  isAuthenticated = false,
  userName = '',
  role = '',
  defaultDashboardPath = '/dashboard/overview'
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isForgotRoute =
    location.pathname.includes('forgot') ||
    initialMode === 'forgot';

  const isSignupRoute =
    location.pathname.includes('register') ||
    location.pathname.includes('rigiter') ||
    location.pathname.includes('signup') ||
    initialMode === 'signup';

  const [mode, setMode] = useState(
    isForgotRoute ? 'forgot' : isSignupRoute ? 'signup' : 'login'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'owner',
    staffCategory: 'waiter',
    tableNumber: ''
  });

  // Forgot password specific state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [forgotMessage, setForgotMessage] = useState('');
  const [devResetToken, setDevResetToken] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [copiedDevLink, setCopiedDevLink] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('forgot')) {
      setMode('forgot');
    } else if (
      location.pathname.includes('register') ||
      location.pathname.includes('rigiter') ||
      location.pathname.includes('signup')
    ) {
      setMode('signup');
    } else if (location.pathname.includes('login')) {
      setMode('login');
    }
  }, [location.pathname]);

  const handleSwitchToLogin = () => {
    setMode('login');
    setForgotStatus('idle');
    setForgotMessage('');
    if (location.pathname.includes('register') || location.pathname.includes('signup') || location.pathname.includes('forgot')) {
      navigate('/login');
    }
  };

  const handleSwitchToSignup = () => {
    setMode('signup');
    setForgotStatus('idle');
    setForgotMessage('');
    if (location.pathname.includes('login') || location.pathname.includes('forgot')) {
      navigate('/register');
    }
  };

  const handleSwitchToForgot = () => {
    setMode('forgot');
    setForgotEmail(form.email || '');
    setForgotStatus('idle');
    setForgotMessage('');
    setDevResetToken('');
    setDevResetUrl('');
    if (!location.pathname.includes('forgot')) {
      navigate('/forgot-password');
    }
  };

  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot';
  const hotelName = 'Royal Plaza Hotel Surat';

  const handleForgotSubmit = async (event) => {
    event.preventDefault();
    const emailToReset = (forgotEmail || form.email || '').trim().toLowerCase();
    if (!emailToReset) return;

    setForgotStatus('sending');
    setForgotMessage('');
    setDevResetToken('');
    setDevResetUrl('');

    try {
      const res = await forgotPassword(emailToReset);
      setForgotStatus('success');
      setForgotMessage(
        res.data?.message ||
          'If an account exists for that email, password reset instructions have been sent.'
      );
      if (res.data?.resetToken) {
        setDevResetToken(res.data.resetToken);
        setDevResetUrl(`/reset-password?token=${encodeURIComponent(res.data.resetToken)}`);
      }
    } catch (err) {
      setForgotStatus('error');
      setForgotMessage(
        err?.response?.data?.message ||
          'Failed to process password reset. Please try again later.'
      );
    }
  };

  const handleCopyDevLink = () => {
    const fullUrl = devResetUrl.startsWith('http')
      ? devResetUrl
      : `${window.location.origin}${devResetUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedDevLink(true);
    setTimeout(() => setCopiedDevLink(false), 2500);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedEmail = form.email.trim();
    const displayName = isLogin ? (trimmedEmail.split('@')[0] || 'Guest') : (form.fullName || trimmedEmail.split('@')[0] || 'Guest');
    const profile = {
      createAccount: !isLogin,
      hotelId: hotels[0]?.id || 1,
      hotelName,
      email: trimmedEmail,
      password: form.password,
      role: form.role,
      staffCategory: form.staffCategory,
      tableNumber: form.role === 'customer' ? form.tableNumber : undefined
    };
    onLogin(form.role, displayName, profile);
  };

  const featurePillars = [
    { title: 'Executive Operations', desc: 'Real-time revenue, occupancy & staff intelligence', icon: Crown, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Interactive Floor Plan', desc: '50-table dynamic matrix with instant clean status', icon: Armchair, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Live Kitchen Display', desc: 'Real-time order coordination & dish stock management', icon: ChefHat, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Guest Digital Dining', desc: 'Instant table QR orders, feedback & UPI test payments', icon: UtensilsCrossed, color: 'text-rose-500 bg-rose-500/10' }
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Showcase Panel */}
          <div className="relative bg-slate-900 p-8 text-white sm:p-10 lg:p-12 flex flex-col justify-between">

            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
                <Crown size={15} className="text-amber-400" />
                <span>Royal Plaza Hotel Surat • 5★ Suite</span>
              </div>

              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-white leading-tight">
                The Luxury AI Command Center for Modern Hospitality.
              </h1>
              <p className="mt-3 text-sm text-slate-300 sm:text-base leading-relaxed">
                Elevating dining service, kitchen dispatch, table floor turnover, and owner intelligence into one effortless experience.
              </p>

              {/* Pillars list */}
              <div className="mt-8 space-y-3">
                {featurePillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.title}
                      className="group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all hover:bg-white/[0.08] hover:border-amber-500/30"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${pillar.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white tracking-wide">{pillar.title}</p>
                        <p className="text-[11px] text-slate-400">{pillar.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom status indicator */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Role-Aware Data Isolation</span>
              </div>
              <span className="text-amber-400/80 font-medium">v2.5 Live</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            {isAuthenticated && userName && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 text-xs text-amber-950">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Active session:</span>
                  <span className="font-bold text-amber-900 capitalize">{userName} ({role || 'User'})</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(defaultDashboardPath)}
                  className="font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  Go to Dashboard →
                </button>
              </div>
            )}

            {/* Mode Switcher Tabs (hidden during forgot password mode) */}
            {!isForgot && (
              <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                    isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToSignup}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                    !isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {isForgot ? (
              <div>
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </button>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <KeyRound size={18} />
                    </span>
                    <span className="text-xs font-bold text-amber-700 tracking-wide uppercase">Password Recovery</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    Reset Account Password
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter your work or registered email address. We'll send you instructions to safely choose a new password.
                  </p>
                </div>

                {forgotStatus === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 space-y-4"
                  >
                    <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-50/80 p-4 text-xs text-emerald-900">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-emerald-950 text-sm">Instructions Ready</p>
                        <p className="text-emerald-800">{forgotMessage}</p>
                      </div>
                    </div>

                    {devResetToken ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-50/90 p-5 text-xs text-amber-950 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                          <KeyRound size={18} className="text-amber-600" />
                          <span>Set Your New Password</span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Click the button or link below to immediately open the <strong>New Password Set Form</strong>:
                        </p>

                        <Link
                          to={devResetUrl || `/reset-password?token=${encodeURIComponent(devResetToken)}`}
                          id="open-reset-form-link"
                          className="block w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer"
                        >
                          Click Here to Set New Password →
                        </Link>

                        <div className="text-center pt-1">
                          <Link
                            to={devResetUrl || `/reset-password?token=${encodeURIComponent(devResetToken)}`}
                            className="text-xs font-semibold text-amber-700 underline hover:text-amber-900 cursor-pointer"
                          >
                            Open New Password Form (Clickable Link)
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                        <p>An email has been dispatched. Please check your inbox and click the link to choose a new password.</p>
                      </div>
                    )}

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStatus('idle');
                          setDevResetToken('');
                          setDevResetUrl('');
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        ← Send to another email address
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {forgotStatus === 'error' && (
                      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-500/25 bg-rose-50/80 p-3 text-xs text-rose-900">
                        <AlertCircle size={15} className="text-rose-600 shrink-0" />
                        <span>{forgotMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Registered Email Address</label>
                        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20">
                          <Mail size={16} className="text-slate-400 shrink-0" />
                          <input
                            type="email"
                            required
                            id="forgot-email-input"
                            value={forgotEmail}
                            onChange={(e) => {
                              setForgotEmail(e.target.value);
                              setForm((prev) => ({ ...prev, email: e.target.value }));
                              if (forgotStatus === 'error') {
                                setForgotStatus('idle');
                                setForgotMessage('');
                              }
                            }}
                            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            placeholder="name@royalplaza.com"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        id="send-reset-instructions-btn"
                        disabled={forgotStatus === 'sending'}
                        className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {forgotStatus === 'sending' ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Sending Instructions...</span>
                          </>
                        ) : (
                          <span>Send Reset Instructions</span>
                        )}
                      </button>
                    </form>
                  </>
                )}

                <div className="mt-6 flex flex-col gap-2 text-center text-xs">
                  <button
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    Remember your credentials? Return to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToSignup}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Don't have an account yet? Register here
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    {isLogin ? 'Welcome back' : 'Register your account'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {isLogin
                      ? 'Enter your credentials to access your assigned role workspace.'
                      : 'Set up your profile and join the Royal Plaza team or guest suite.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Account Role</label>
                        <select
                          value={form.role}
                          onChange={(event) => setForm({ ...form, role: event.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                        >
                          <option value="owner">Owner (Full Executive Access)</option>
                          <option value="manager">Manager (Floor & Team Lead)</option>
                          <option value="staff">Staff (Kitchen, Floor or Waiter)</option>
                          <option value="customer">Customer (Table Dining & Orders)</option>
                        </select>
                      </div>

                      {form.role === 'staff' && (
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Staff Category</label>
                          <select
                            value={form.staffCategory}
                            onChange={(event) => setForm({ ...form, staffCategory: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                          >
                            <option value="chef">Chef (Kitchen Orders & KDS)</option>
                            <option value="cleaning">Cleaning Staff (Floor & Bartan)</option>
                            <option value="waiter">Waiter (Order Service & Desk)</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full Name</label>
                        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20">
                          <User size={16} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            required
                            value={form.fullName}
                            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            placeholder="e.g. Ramesh Patel"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Work Email</label>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20">
                      <Mail size={16} className="text-slate-400 shrink-0" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        placeholder="name@royalplaza.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">Password</label>
                      {isLogin && (
                        <button
                          type="button"
                          id="auth-forgot-password-link"
                          onClick={handleSwitchToForgot}
                          className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20">
                      <Lock size={16} className="text-slate-400 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {!isLogin && form.role === 'customer' && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Table Number</label>
                      <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20">
                        <Armchair size={16} className="text-slate-400 shrink-0" />
                        <input
                          type="number"
                          value={form.tableNumber}
                          onChange={(event) => setForm({ ...form, tableNumber: event.target.value })}
                          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                          placeholder="e.g. 5"
                        />
                      </div>
                    </div>
                  )}

                  {isLogin && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/70 p-3 text-[11px] text-emerald-800 flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-600 shrink-0" />
                      <span>Only your registered email and password are required to sign in.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer"
                  >
                    {isLogin ? 'Continue to Workspace' : 'Create Live Profile'}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={isLogin ? handleSwitchToSignup : handleSwitchToLogin}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    {isLogin ? "Don't have an account? Register new user" : 'Already have credentials? Sign in'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
