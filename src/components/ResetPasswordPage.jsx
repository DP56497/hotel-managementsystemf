import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword, verifyResetToken } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = searchParams.get('token') || '';
  const [token, setToken] = useState(urlToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(Boolean(urlToken));
  const [tokenStatus, setTokenStatus] = useState(urlToken ? 'verifying' : 'idle'); // 'idle' | 'verifying' | 'valid' | 'invalid'
  const [tokenError, setTokenError] = useState('');
  const [targetAccount, setTargetAccount] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
    }
  }, [urlToken]);

  // Auto-verify token on mount if provided in URL
  useEffect(() => {
    if (!urlToken) return;
    let isMounted = true;

    const checkToken = async () => {
      setIsVerifying(true);
      setTokenStatus('verifying');
      setTokenError('');
      try {
        const res = await verifyResetToken(urlToken);
        if (isMounted) {
          if (res.data?.valid) {
            setTokenStatus('valid');
            setTargetAccount(res.data.email || res.data.name || 'your account');
          } else {
            setTokenStatus('invalid');
            setTokenError(res.data?.message || 'Invalid or expired password reset link');
          }
        }
      } catch (err) {
        if (isMounted) {
          setTokenStatus('invalid');
          setTokenError(err?.response?.data?.message || 'Invalid or expired password reset link. Please request a new one.');
        }
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [urlToken]);

  // Countdown timer on success before redirect
  useEffect(() => {
    if (!submitSuccess) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitSuccess, navigate]);

  // Password complexity checks
  const hasMinLength = password.length >= 8 && password.length <= 128;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const validCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol].filter(Boolean).length;
  const isFormValid = validCount === 5 && passwordsMatch && Boolean(token.trim());

  const getStrengthLabel = () => {
    if (validCount <= 1) return { text: 'Weak', color: 'bg-rose-500', width: '20%' };
    if (validCount <= 3) return { text: 'Fair', color: 'bg-amber-500', width: '55%' };
    if (validCount === 4) return { text: 'Good', color: 'bg-blue-500', width: '80%' };
    return { text: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getStrengthLabel();

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setSubmitError('A reset token is required. Please provide the token or click the reset link in your email.');
      return;
    }
    if (!isFormValid) {
      setSubmitError('Please ensure all password criteria are satisfied and passwords match.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await resetPassword(token.trim(), password);
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Failed to reset password. The link or token may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="grid lg:grid-cols-[1fr_1.1fr]">
          {/* Left Decorative Suite Panel */}
          <div className="relative bg-slate-900 p-8 text-white sm:p-10 flex flex-col justify-between">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
                <Crown size={15} className="text-amber-400" />
                <span>Royal Plaza Hotel Surat • Security Gateway</span>
              </div>

              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl text-white leading-snug">
                Secure Account Password Reset
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Choose a robust new password to restore full access to your personalized hotel workspace.
              </p>

              <div className="mt-8 space-y-3.5">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Military-Grade Encryption</h2>
                    <p className="text-[11px] text-slate-400">BCrypt-12 salted hash with zero plaintext storage.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Instant Session Invalidation</h2>
                    <p className="text-[11px] text-slate-400">Old sessions are retired immediately upon password change.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </button>
              <span className="text-slate-500">v2.5 Live</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
            {submitSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Password Reset Successful!</h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                    Your password has been securely updated. You can now sign in with your new credentials.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/70 p-3 text-xs font-medium text-emerald-900">
                  Redirecting to Sign In in <span className="font-bold text-emerald-700">{countdown}s</span>...
                </div>

                <button
                  type="button"
                  id="sign-in-now-btn"
                  onClick={() => navigate('/login')}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer"
                >
                  Sign In Now →
                </button>
              </motion.div>
            ) : (
              <div>
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <KeyRound size={18} />
                    </span>
                    <span className="text-xs font-bold text-amber-700 tracking-wide uppercase">Password Recovery</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    Create New Password
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Please provide a strong, memorable password to protect your account.
                  </p>
                </div>

                {/* Token status banner */}
                {isVerifying && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-50 p-3 text-xs text-amber-800">
                    <RefreshCw size={14} className="animate-spin text-amber-600 shrink-0" />
                    <span>Verifying reset token validity...</span>
                  </div>
                )}

                {tokenStatus === 'valid' && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-50/80 p-3 text-xs text-emerald-800">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>
                      Resetting credentials for <strong className="font-semibold">{targetAccount}</strong>
                    </span>
                  </div>
                )}

                {tokenStatus === 'invalid' && (
                  <div className="mb-4 rounded-2xl border border-rose-500/25 bg-rose-50/80 p-3 text-xs text-rose-900 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={15} className="text-rose-600 shrink-0" />
                      <span className="font-medium">{tokenError || 'This reset token has expired or is invalid.'}</span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                      >
                        Request a fresh reset link →
                      </button>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-500/25 bg-rose-50/80 p-3 text-xs text-rose-900">
                    <AlertCircle size={15} className="text-rose-600 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-4">
                  {/* Manual token input if token was not in URL */}
                  {!urlToken && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Reset Token / Code
                      </label>
                      <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20">
                        <KeyRound size={16} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          required
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 font-mono text-xs"
                          placeholder="Paste your reset token here"
                        />
                      </div>
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      New Password
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20">
                      <Lock size={16} className="text-slate-400 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        id="new-password-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Confirm New Password
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20">
                      <Lock size={16} className="text-slate-400 shrink-0" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        id="confirm-password-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Password Strength:</span>
                        <span className="font-bold text-slate-800">{strength.text}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>

                      {/* Criteria checklist */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {hasMinLength ? <Check size={12} className="stroke-[3]" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                          <span>8+ Characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {hasUppercase ? <Check size={12} className="stroke-[3]" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                          <span>Uppercase (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {hasLowercase ? <Check size={12} className="stroke-[3]" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                          <span>Lowercase (a-z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {hasNumber ? <Check size={12} className="stroke-[3]" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                          <span>Number (0-9)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {hasSymbol ? <Check size={12} className="stroke-[3]" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                          <span>Symbol (!@#$)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {passwordsMatch ? <Check size={12} className="stroke-[3]" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                          <span>Passwords Match</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="reset-password-submit-btn"
                    disabled={isSubmitting || (password.length > 0 && !isFormValid)}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Reset & Save Password</span>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    Remember your password? Sign in instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
