import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { battleApi } from '../api/battle.api';
import type { Battle, PaginatedResult } from '../types';
import { DifficultyBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function BattleHistoryPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<PaginatedResult<Battle> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    battleApi.getHistory({ page, pageSize: 20 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">⚔️ Battle History</h1>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : data?.items.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🥊</div>
          <p className="text-gray-400">No battles yet. Start competing!</p>
          <Link to="/matchmaking" className="btn-primary mt-6">Find a Battle</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((battle) => {
            const me = battle.participants.find((p) => p.userId === user?.id);
            const opponent = battle.participants.find((p) => p.userId !== user?.id);
            const isWin = battle.winnerId === user?.id;
            const isDraw = battle.isDraw;
            const scoringModeLabel = battle.scoringMode.replace(/_/g, ' ');

            return (
              <Link
                key={battle.id}
                to={`/battle/${battle.id}/result`}
                className="card p-4 flex items-center gap-4 hover:border-dark-400 transition-all"
              >
                {/* Result icon */}
                <div className={`text-3xl flex-shrink-0 ${isWin ? 'text-accent-green' : isDraw ? 'text-accent-yellow' : 'text-accent-red'}`}>
                  {isWin ? '🏆' : isDraw ? '🤝' : '💀'}
                </div>

                {/* Match info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-100">
                      vs {opponent?.username ?? 'Unknown'}
                    </span>
                    <DifficultyBadge difficulty={battle.difficulty} />
                    <span className="text-xs text-gray-500 capitalize hidden sm:block">{scoringModeLabel}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(battle.createdAt), { addSuffix: true })}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-200">
                    {me?.score ?? 0} pts
                  </div>
                  {me?.ratingDelta !== undefined && me.ratingDelta !== 0 && (
                    <div className={`text-xs font-bold ${me.ratingDelta > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {me.ratingDelta > 0 ? '+' : ''}{me.ratingDelta}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-1.5 text-sm">← Prev</button>
              <span className="text-sm text-gray-400">{page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary px-4 py-1.5 text-sm">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
