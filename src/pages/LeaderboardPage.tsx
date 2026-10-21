import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../services/user.api';
import { useAuthStore } from '../stores/authStore';
import type { UserProfile, PaginatedResult } from '../types';
import { Spinner } from '../components/ui/Spinner';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<PaginatedResult<UserProfile> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    userApi.getLeaderboard({ page, pageSize: 50 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const offset = (page - 1) * 50;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🏆 Global Leaderboard</h1>
        <p className="text-gray-400 text-sm mt-1">Ranked by Elo rating</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-dark-700 border-b border-dark-600 text-xs text-gray-500 font-semibold uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-right">Rating</div>
            <div className="col-span-1 text-right">W</div>
            <div className="col-span-1 text-right">L</div>
            <div className="col-span-1 text-right">D</div>
            <div className="col-span-2 text-right">Win %</div>
          </div>

          {data?.items.map((player, i) => {
            const rank = offset + i + 1;
            const winRate = player.totalBattles > 0
              ? Math.round((player.wins / player.totalBattles) * 100)
              : 0;
            const isMe = player.id === user?.id;

            return (
              <Link
                key={player.id}
                to={`/profile/${player.username}`}
                className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-dark-700 hover:bg-dark-700 transition-colors items-center ${
                  isMe ? 'bg-brand-900/20 border-l-2 border-l-brand-500' : ''
                }`}
              >
                <div className={`col-span-1 font-bold text-sm ${
                  rank === 1 ? 'text-yellow-400' :
                  rank === 2 ? 'text-gray-300' :
                  rank === 3 ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                </div>
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
                    ) : player.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-100 truncate">
                      {player.username}
                      {isMe && <span className="text-brand-400 text-xs ml-1">(you)</span>}
                    </div>
                    {player.winStreak >= 3 && (
                      <div className="text-xs text-accent-orange">{player.winStreak}🔥</div>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-right font-bold text-brand-400 font-mono">{player.rating}</div>
                <div className="col-span-1 text-right text-sm text-accent-green">{player.wins}</div>
                <div className="col-span-1 text-right text-sm text-accent-red">{player.losses}</div>
                <div className="col-span-1 text-right text-sm text-gray-400">{player.draws}</div>
                <div className="col-span-2 text-right text-sm text-gray-300">{winRate}%</div>
              </Link>
            );
          })}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 p-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-1.5 text-sm"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-400">{page} / {data.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="btn-secondary px-4 py-1.5 text-sm"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
