import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, KeyRound, AlertCircle, Loader2, Eye, EyeOff, X, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || t('invalidCredentials'));
      }
    } catch (err) {
      setErrorMessage(t('invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4 animate-fade-in">
      <div className="bg-stone-900 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-b from-stone-950 to-stone-900 p-8 text-center space-y-3 border-b border-stone-800/80">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mx-auto text-stone-950 shadow-lg amber-glow">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="font-serif-luxury font-bold text-2xl sm:text-3xl text-white tracking-tight">
            {t('loginTitle')}
          </h2>
          <p className="text-amber-500/90 text-xs font-semibold uppercase tracking-wider">
            Meraf Cafe Portal • Addis Ababa
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-medium rounded-2xl flex items-center gap-3 animate-shake shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-400/90 uppercase tracking-wider">
                {t('emailLabel')}
              </label>
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  className="text-[11px] text-stone-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/70" />
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder="name@example.com"
                className="w-full pl-12 pr-10 py-3.5 bg-stone-950/80 border border-stone-700/80 rounded-2xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-400/90 uppercase tracking-wider">
                {t('passwordLabel')}
              </label>
              {password && (
                <button
                  type="button"
                  onClick={() => setPassword('')}
                  className="text-[11px] text-stone-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/70" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-stone-950/80 border border-stone-700/80 rounded-2xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] disabled:opacity-50 text-stone-950 py-4 px-6 rounded-2xl font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                <span>{t('loginButton')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

