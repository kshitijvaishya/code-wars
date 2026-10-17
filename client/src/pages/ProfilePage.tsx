import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/user.api';
import { battleApi } from '../api/battle.api';
import type { UserProfile, RatingHistoryEntry, Battle, PaginatedResult } from '../types';
import { DifficultyBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryEntry[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      userApi.get(username),
    ]).then(([p]) => {
      setProfile(p);
      return Promise.all([
        userApi.getRatingHistory(p.id),
        battleApi.getHistory({ pageSize: 10 }),
      ]);
    }).then(([rh, bh]) => {
      setRatingHistory(rh);
      setBattles(bh.items);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (!profile) return <div className="text-center py-20 text-gray-500">User not found</div>;

  const isMe = me?.id === profile.id;
  const winRate = profile.totalBattles > 0
    ? Math.round((profile.wins / profile.totalBattles) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-brand-700 flex items-center justify-center text-3xl font-bold flex-shrink-0 overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
            ) : profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-100">{profile.username}</h1>
              <span className={`badge ${
                profile.role === 'super_admin' ? 'bg-red-900/40 text-red-400 border border-red-800/50' :
                profile.role === 'contest_admin' ? 'bg-purple-900/40 text-purple-400 border border-purple-800/50' :
                'bg-dark-600 text-gray-400 border border-dark-500'
              }`}>
                {profile.role.replace(/_/g, ' ')}
              </span>
            </div>
            {profile.bio && <p className="text-gray-400 text-sm mt-2">{profile.bio}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Member since {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
            </p>
          </div>
          {isMe && (
            <Link to="/settings" className="btn-secondary text-sm">Edit Profile</Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Statistics</h2>
          <div className="space-y-3">
            {[
              ['Rating', profile.rating, 'text-brand-400'],
              ['Win Streak', `${profile.winStreak} 🔥`, 'text-accent-orange'],
              ['Wins', profile.wins, 'text-accent-green'],
              ['Losses', profile.losses, 'text-accent-red'],
              ['Draws', profile.draws, 'text-gray-300'],
              ['Total Battles', profile.totalBattles, 'text-gray-300'],
              ['Win Rate', `${winRate}%`, 'text-accent-cyan'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent battles */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Recent Battles</h2>
          {battles.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No battles yet</div>
          ) : (
            <div className="space-y-2">
              {battles.map((battle) => {
                const participant = battle.participants.find((p) => p.userId === profile.id);
                const opp = battle.participants.find((p) => p.userId !== profile.id);
                const isWin = battle.winnerId === profile.id;
                const isDraw = battle.isDraw;
                return (
                  <Link
                    key={battle.id}
                    to={`/battle/${battle.id}/result`}
                    className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    <div className={`text-xl ${isWin ? 'text-accent-green' : isDraw ? 'text-accent-yellow' : 'text-accent-red'}`}>
                      {isWin ? '🏆' : isDraw ? '🤝' : '💀'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200">
                        vs <span className="font-medium">{opp?.username ?? 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(battle.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <DifficultyBadge difficulty={battle.difficulty} />
                    {participant?.ratingDelta !== undefined && participant.ratingDelta !== 0 && (
                      <span className={`text-xs font-bold ${participant.ratingDelta > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {participant.ratingDelta > 0 ? '+' : ''}{participant.ratingDelta}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
