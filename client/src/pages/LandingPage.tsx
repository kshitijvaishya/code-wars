import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const FEATURES = [
  { icon: '⚔️', title: '1v1 Battle Rooms', desc: 'Create private rooms or use quick matchmaking to face an opponent.' },
  { icon: '⚡', title: 'Real-time Arena', desc: 'Watch your opponent\'s status live while you code. Every second counts.' },
  { icon: '🤖', title: 'Secure Judging', desc: 'Server-side sandboxed code execution via Piston API — no client cheating.' },
  { icon: '📊', title: 'Elo Ratings', desc: 'Climb the global leaderboard with a documented Elo-based rating system.' },
  { icon: '🎯', title: 'Configurable Scoring', desc: 'First Accepted, Score-Based, Time-Based, or Best-of-Three modes.' },
  { icon: '🔒', title: 'Hidden Tests', desc: 'Hidden test cases are never exposed — only verdicts reach the client.' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-28 overflow-hidden">
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-700/50 text-brand-300 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            1v1 Coding Battle Platform
          </span>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Code.{' '}
            <span className="bg-gradient-to-r from-brand-400 via-accent-purple to-accent-cyan bg-clip-text text-transparent">
              Battle.
            </span>{' '}
            Win.
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
            Face off against real opponents in real-time coding battles.
            Write code, run tests, submit solutions — and may the best algorithm win.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/matchmaking" className="btn-primary px-8 py-3 text-base">
                  ⚔️ Quick Match
                </Link>
                <Link to="/dashboard" className="btn-secondary px-8 py-3 text-base">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth/register" className="btn-primary px-8 py-3 text-base">
                  Start Battling Free
                </Link>
                <Link to="/auth/login" className="btn-secondary px-8 py-3 text-base">
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Preview card */}
        <div className="relative z-10 mt-16 w-full max-w-4xl mx-auto">
          <div className="card border-dark-500 overflow-hidden shadow-2xl">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-gray-500 font-mono">code-wars — battle arena</span>
              <div className="text-xs text-accent-green font-mono">● LIVE</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-dark-600" style={{ minHeight: 180 }}>
              <div className="p-4 font-mono text-sm text-gray-300 bg-dark-900">
                <div className="text-brand-400 text-xs mb-2">YOU — Python 3</div>
                <div className="text-gray-500">def two_sum(nums, target):</div>
                <div className="text-gray-300 ml-4">seen = {'{}'}</div>
                <div className="text-gray-300 ml-4">for i, n in enumerate(nums):</div>
                <div className="text-gray-300 ml-8">if target - n in seen:</div>
                <div className="text-accent-green ml-12">return [seen[target-n], i]</div>
                <div className="text-gray-300 ml-8">seen[n] = i</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge bg-green-900/40 text-green-400 border border-green-800/50">✓ Accepted</span>
                  <span className="text-xs text-gray-500">42ms · 14MB</span>
                </div>
              </div>
              <div className="p-4 font-mono text-sm bg-dark-900">
                <div className="text-accent-red text-xs mb-2">OPPONENT — JavaScript</div>
                <div className="text-gray-500">function twoSum(nums, target) {'{'}</div>
                <div className="text-gray-300 ml-4">const map = new Map();</div>
                <div className="text-gray-300 ml-4">for (let i = 0; i &lt; nums.length; i++) {'{'}</div>
                <div className="text-gray-300 ml-8">...</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge bg-dark-600 text-gray-400 border border-dark-500">⟳ Processing...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Built for{' '}
          <span className="bg-gradient-to-r from-brand-400 to-accent-purple bg-clip-text text-transparent">
            serious competitors
          </span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5 hover:border-dark-400 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-100 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 px-4">
        <h2 className="text-3xl font-bold mb-4">Ready to battle?</h2>
        <p className="text-gray-400 mb-8">Join thousands of developers competing in real-time.</p>
        <Link to="/auth/register" className="btn-primary px-10 py-3 text-base">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-6 text-center text-xs text-gray-600">
        © 2026 Code Wars. All rights reserved.
      </footer>
    </div>
  );
}
