import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { battleApi } from '../api/battle.api';
import type { Battle } from '../types';
import { DifficultyBadge, VerdictBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function BattleResultPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    battleApi.getResult(id)
      .then(setBattle)
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (!battle) return null;

  const me = battle.participants.find((p) => p.userId === user?.id);
  const opponent = battle.participants.find((p) => p.userId !== user?.id);
  const isWin = battle.winnerId === user?.id;
  const resultLabel = battle.isDraw ? '🤝 Draw!' : isWin ? '🏆 Victory!' : '💀 Defeat';
  const resultColor = battle.isDraw ? 'text-accent-yellow' : isWin ? 'text-accent-green' : 'text-accent-red';
  const ratingDelta = me?.ratingDelta ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Result header */}
      <div className="card p-8 text-center mb-6">
        <div className="text-6xl mb-4">{battle.isDraw ? '🤝' : isWin ? '🏆' : '💀'}</div>
        <h1 className={`text-4xl font-black mb-2 ${resultColor}`}>{resultLabel}</h1>
        <p className="text-gray-400 text-sm">
          {formatDistanceToNow(new Date(battle.createdAt), { addSuffix: true })}
        </p>

        {/* Rating change */}
        {ratingDelta !== 0 && (
          <div className={`inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-full text-lg font-bold ${
            ratingDelta > 0 ? 'bg-green-900/30 text-accent-green' : 'bg-red-900/30 text-accent-red'
          }`}>
            {ratingDelta > 0 ? '+' : ''}{ratingDelta} Rating
          </div>
        )}
      </div>

      {/* Players comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[me, opponent].map((p, i) => {
          if (!p) return <div key={i} className="card p-4" />;
          const isWinner = battle.winnerId === p.userId;
          return (
            <div key={p.userId} className={`card p-5 text-center transition-all ${
              isWinner ? 'border-accent-green/50 bg-accent-green/5' : ''
            }`}>
              {isWinner && <div className="text-xs text-accent-green font-semibold mb-2">🏆 WINNER</div>}
              <div className="w-14 h-14 rounded-full bg-brand-700 flex items-center justify-center text-xl font-bold mx-auto mb-3 overflow-hidden">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.username} className="w-full h-full object-cover" />
                ) : (
                  p.username[0].toUpperCase()
                )}
              </div>
              <div className="font-semibold text-gray-100 mb-1">{p.username}</div>
              <div className="text-2xl font-bold text-brand-400 font-mono mb-2">{p.score}</div>
              <div className="text-xs text-gray-500">points scored</div>
              {p.verdict && (
                <div className="mt-2">
                  <VerdictBadge verdict={p.verdict as never} />
                </div>
              )}
              {p.ratingDelta !== 0 && (
                <div className={`text-sm font-bold mt-2 ${p.ratingDelta > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {p.ratingDelta > 0 ? '+' : ''}{p.ratingDelta}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Battle info */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Battle Info</h2>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div className="text-gray-500">Difficulty</div>
          <div><DifficultyBadge difficulty={battle.difficulty} /></div>
          <div className="text-gray-500">Scoring Mode</div>
          <div className="text-gray-200 capitalize">{battle.scoringMode.replace(/_/g, ' ')}</div>
          <div className="text-gray-500">Duration</div>
          <div className="text-gray-200">{Math.floor(battle.durationSeconds / 60)} minutes</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link to="/matchmaking" className="btn-primary flex-1 py-3 text-center text-base">
          ⚔️ Play Again
        </Link>
        <Link to="/dashboard" className="btn-secondary flex-1 py-3 text-center text-base">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
