import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { battleApi } from '../api/battle.api';
import { userApi } from '../api/user.api';
import type { Battle, UserProfile } from '../types';
import { DifficultyBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [recentBattles, setRecentBattles] = useState<Battle[]>([]);
  const [topPlayers, setTopPlayers] = useState<UserProfile[]>([]);
  const [loadingBattles, setLoadingBattles] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    battleApi.getHistory({ pageSize: 5 })
      .then((r) => setRecentBattles(r.items))
      .catch(console.error)
      .finally(() => setLoadingBattles(false));

    userApi.getLeaderboard({ pageSize: 10 })
      .then((r) => setTopPlayers(r.items))
      .catch(console.error)
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  if (!user) return null;

  const winRate = user.totalBattles > 0
    ? Math.round((user.wins / user.totalBattles) * 100)
    : 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">
          Welcome back, <span className="text-brand-400">{user.username}</span> ⚔️
        </h1>
        <p className="text-gray-400 mt-1">Ready to battle? Your rating: <strong className="text-brand-300">{user.rating}</strong></p>
      </div>

      {/* Action cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link to="/matchmaking" className="card p-6 hover:border-brand-600 transition-all group text-center">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
          <h3 className="font-semibold text-gray-100 mb-1">Quick Match</h3>
          <p className="text-sm text-gray-400">Auto-match with an opponent at your rating</p>
        </Link>

        <Link to="/battle/create" className="card p-6 hover:border-brand-600 transition-all group text-center">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🔒</div>
          <h3 className="font-semibold text-gray-100 mb-1">Private Battle</h3>
          <p className="text-sm text-gray-400">Create a room and invite a friend</p>
        </Link>

        <Link to="/problems" className="card p-6 hover:border-brand-600 transition-all group text-center">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📚</div>
          <h3 className="font-semibold text-gray-100 mb-1">Practice</h3>
          <p className="text-sm text-gray-400">Browse and solve problems solo</p>
        </Link>
      </div>

      {/* Stats + recent battles + leaderboard */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Rating', value: user.rating, color: 'text-brand-400' },
                { label: 'Win Streak', value: user.winStreak + '🔥', color: 'text-accent-orange' },
                { label: 'Wins', value: user.wins, color: 'text-accent-green' },
                { label: 'Losses', value: user.losses, color: 'text-accent-red' },
                { label: 'Draws', value: user.draws, color: 'text-gray-300' },
                { label: 'Win Rate', value: winRate + '%', color: 'text-accent-cyan' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-dark-700 rounded-lg p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Win rate</span>
                <span>{winRate}%</span>
              </div>
              <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-accent-green rounded-full transition-all"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Join by code */}
          <JoinByCode />
        </div>

        {/* Recent battles */}
        <div className="lg:col-span-1 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Recent Battles</h2>
            <Link to="/battles/history" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {loadingBattles ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : recentBattles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🥊</div>
              <p className="text-sm">No battles yet. Start competing!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBattles.map((battle) => {
                const opponent = battle.participants.find((p) => p.userId !== user.id);
                const isWin = battle.winnerId === user.id;
                return (
                  <Link
                    key={battle.id}
                    to={`/battle/${battle.id}/result`}
                    className="flex items-center justify-between p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-lg ${isWin ? 'text-accent-green' : battle.isDraw ? 'text-accent-yellow' : 'text-accent-red'}`}>
                        {isWin ? '🏆' : battle.isDraw ? '🤝' : '💀'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">
                          vs {opponent?.username ?? '???'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(battle.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <DifficultyBadge difficulty={battle.difficulty} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Leaderboard preview */}
        <div className="lg:col-span-1 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Top Players</h2>
            <Link to="/leaderboard" className="text-xs text-brand-400 hover:text-brand-300">Full board →</Link>
          </div>
          {loadingLeaderboard ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-2">
              {topPlayers.map((player, idx) => (
                <Link
                  key={player.id}
                  to={`/profile/${player.username}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <div className={`w-6 text-center text-sm font-bold ${idx < 3 ? ['text-yellow-400', 'text-gray-300', 'text-amber-600'][idx] : 'text-gray-500'}`}>
                    {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate">
                      {player.username}
                      {player.id === user.id && <span className="text-brand-400 ml-1">(you)</span>}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-brand-400 font-mono">{player.rating}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JoinByCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) navigate(`/battle/join/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Join by Invite Code</h2>
      <form onSubmit={handleJoin} className="flex gap-2">
        <input
          className="input flex-1 font-mono uppercase tracking-widest text-sm"
          placeholder="A3F2B1"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
        />
        <button type="submit" className="btn-primary px-3" disabled={code.length < 6}>
          Join
        </button>
      </form>
    </div>
  );
}
