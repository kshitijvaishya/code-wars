import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-dark-600">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">⚔️</span>
          <span className="bg-gradient-to-r from-brand-400 to-accent-purple bg-clip-text text-transparent">
            Code Wars
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/problems" className="nav-link">Problems</Link>
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
              {(user?.role === 'contest_admin' || user?.role === 'super_admin') && (
                <Link to="/admin" className="nav-link text-brand-400">Admin</Link>
              )}
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Quick match */}
              <Link to="/matchmaking" className="hidden sm:block btn-primary text-xs px-3 py-1.5">
                Quick Match
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      user.username[0].toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-200">{user.username}</span>
                  <span className="hidden sm:block text-xs text-brand-400 font-mono">{user.rating}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 card shadow-xl border border-dark-500 py-1 z-50 animate-slide-up">
                    <Link
                      to={`/profile/${user.username}`}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/battles/history"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Battle History
                    </Link>
                    <hr className="border-dark-500 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-700 hover:text-red-300 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="btn-ghost text-sm">Log in</Link>
              <Link to="/auth/register" className="btn-primary text-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>

      {/* Overlay for menu close */}
      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  );
}
