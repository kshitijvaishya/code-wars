import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'register') {
      if (!form.username.match(/^[a-zA-Z0-9_-]{3,30}$/))
        e.username = 'Username must be 3–30 chars, alphanumeric, _ or -';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (mode === 'register' && form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : err.response?.data?.message ?? 'Something went wrong'
        : err instanceof Error
          ? err.message
          : 'Something went wrong';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 bg-dark-900 border-r border-dark-700 px-12">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl mb-12">
          <span className="text-3xl">⚔️</span>
          <span className="bg-gradient-to-r from-brand-400 to-accent-purple bg-clip-text text-transparent">
            Code Wars
          </span>
        </Link>
        <div className="max-w-sm text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-3">Compete. Improve. Win.</h2>
          <p className="text-gray-400">
            Join real-time 1v1 coding battles, climb the leaderboard, and prove your algorithmic mastery.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          {[['500+', 'Problems'], ['10k+', 'Battles'], ['5k+', 'Players']].map(([n, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold text-brand-400">{n}</div>
              <div className="text-xs text-gray-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2 font-bold text-xl mb-8">
            <span>⚔️</span>
            <span className="bg-gradient-to-r from-brand-400 to-accent-purple bg-clip-text text-transparent">
              Code Wars
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Link
              to={mode === 'login' ? '/auth/register' : '/auth/login'}
              className="text-brand-400 hover:text-brand-300"
            >
              {mode === 'login' ? 'Sign up free' : 'Log in'}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-300 mb-1.5" htmlFor="username">Username</label>
                <input
                  id="username"
                  className="input"
                  placeholder="coolcoder42"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                  autoComplete="username"
                />
                {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-300 mb-1.5" htmlFor="confirm">Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm}</p>}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
